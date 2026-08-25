import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { createSpatialComment, type SpatialComment } from '@spatial/collaboration';
import { extrudeWallSegments, generateRoomFloorMesh } from '@spatial/geometry-engine';
import type { Point, Room, WallSegment } from '@spatial/core';
import { SpatialCommentPin } from './SpatialCommentPin';

interface SpatialCanvasProps {
  projectId?: string;
  walls: WallSegment[];
  rooms: Room[];
  points: Point[];
  readOnly?: boolean;
  onCommentAdd?: (comment: SpatialComment) => void;
  selectedRoomId?: string | null;
}

function FloorGrid({ onSelectPoint }: { onSelectPoint?: (e: ThreeEvent<MouseEvent>) => void }): JSX.Element {
  return (
    <>
      <gridHelper args={[30, 30, '#38bdf8', '#334155']} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]} receiveShadow onClick={(e) => onSelectPoint?.(e)}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
    </>
  );
}

function WallMesh({ wall, highlighted, onSelectPoint }: { wall: WallSegment; highlighted: boolean; onSelectPoint?: (e: ThreeEvent<MouseEvent>) => void }): JSX.Element {
  const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y) || 0.001;
  const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
  return (
    <mesh position={[(wall.start.x + wall.end.x) / 2, wall.height / 2, (wall.start.y + wall.end.y) / 2]} rotation={[0, -angle, 0]} castShadow receiveShadow onClick={(e) => onSelectPoint?.(e)}>
      <boxGeometry args={[length, wall.height, wall.thickness]} />
      <meshStandardMaterial color={highlighted ? '#f59e0b' : '#cbd5e1'} emissive={highlighted ? '#f59e0b' : '#000000'} emissiveIntensity={highlighted ? 0.8 : 0} metalness={0.12} roughness={0.7} />
    </mesh>
  );
}

function RoomFloor({ room, highlighted, onSelectPoint }: { room: Room; highlighted: boolean; onSelectPoint?: (e: ThreeEvent<MouseEvent>) => void }): JSX.Element {
  const geometry = useMemo(() => {
    const floorMesh = generateRoomFloorMesh(room);
    const bufferGeometry = new THREE.BufferGeometry();
    if (floorMesh.vertices.length > 0) {
      bufferGeometry.setAttribute('position', new THREE.Float32BufferAttribute(floorMesh.vertices, 3));
      bufferGeometry.setIndex(floorMesh.indices);
      bufferGeometry.computeVertexNormals();
    }
    return bufferGeometry;
  }, [room]);

  return (
    <mesh geometry={geometry} position={[0, 0.01, 0]} receiveShadow onClick={(e) => onSelectPoint?.(e)}>
      <meshStandardMaterial color={highlighted ? '#f59e0b' : '#1d4ed8'} transparent opacity={highlighted ? 0.5 : 0.35} />
    </mesh>
  );
}

export function SpatialCanvas({ projectId = 'project-1', walls, rooms, points, readOnly = false, onCommentAdd, selectedRoomId = null }: SpatialCanvasProps): JSX.Element {
  const [comments, setComments] = useState<SpatialComment[]>([]);
  const cameraPosition = useMemo<[number, number, number]>(() => {
    if (walls.length === 0) return [8, 7, 10];
    const xs = walls.flatMap((wall) => [wall.start.x, wall.end.x]);
    const ys = walls.flatMap((wall) => [wall.start.y, wall.end.y]);
    const minX = Math.min(...xs); const maxX = Math.max(...xs); const minY = Math.min(...ys); const maxY = Math.max(...ys);
    const centerX = (minX + maxX) / 2; const centerY = (minY + maxY) / 2;
    const span = Math.max(maxX - minX, maxY - minY, 4); const distance = Math.max(span * 1.8, 8);
    return [centerX + distance * 0.9, distance * 0.75, centerY + distance * 0.9];
  }, [walls]);

  const handlePointClick = (e: ThreeEvent<MouseEvent>): void => {
    e.stopPropagation();
    const hitPoint = e.point;
    const hitNormal = e.face?.normal ?? new THREE.Vector3(0, 1, 0);
    const commentText = window.prompt('Add a 3D spatial comment at this position:');
    if (!commentText || !commentText.trim()) return;
    const comment = createSpatialComment({ projectId, author: 'Reviewer', text: commentText.trim(), position: { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z }, normal: { x: hitNormal.x, y: hitNormal.y, z: hitNormal.z } });
    setComments((prev) => [...prev, comment]);
    onCommentAdd?.(comment);
  };

  return (
    <div className="relative h-full w-full bg-slate-950">
      <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-xl border border-slate-700 bg-slate-900/85 px-4 py-3 shadow-xl backdrop-blur-md">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">3D model viewport</div>
        <div className="mt-1 text-sm font-medium text-white">{walls.length > 0 ? `${walls.length} wall segments · ${rooms.length} detected rooms` : 'No walls yet'}</div>
        <div className="mt-1 text-xs text-slate-400">Drag to orbit · wheel to zoom</div>
        {selectedRoomId ? <div className="mt-2 text-xs font-medium text-amber-300">Room highlighted: {rooms.find((room) => room.id === selectedRoomId)?.name ?? selectedRoomId}</div> : null}
      </div>

      {walls.length === 0 ? <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"><div className="rounded-xl border border-slate-700 bg-slate-900/90 px-6 py-4 text-center shadow-2xl backdrop-blur-md"><div className="text-sm font-semibold text-white">Your 3D model will appear here</div><div className="mt-1 text-xs text-slate-400">Draw walls in the 2D Floor Plan on the left.</div></div></div> : null}

      <Canvas camera={{ position: cameraPosition, fov: 50 }} shadows>
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 12, 8]} intensity={1.2} castShadow />
        <FloorGrid onSelectPoint={readOnly ? undefined : handlePointClick} />
        {rooms.map((room) => <RoomFloor key={room.id} room={room} highlighted={room.id === selectedRoomId} onSelectPoint={readOnly ? undefined : handlePointClick} />)}
        {walls.map((wall) => <WallMesh key={wall.id} wall={wall} highlighted={selectedRoomId ? Boolean(rooms.find((room) => room.id === selectedRoomId)?.wallSegments.some((roomWall) => roomWall.id === wall.id)) : false} onSelectPoint={readOnly ? undefined : handlePointClick} />)}
        {points.map((point, index) => <mesh key={`${point.x}-${point.y}-${index}`} position={[point.x, 0.1, point.y]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.4} /></mesh>)}
        {comments.map((comment) => <SpatialCommentPin key={comment.id} comment={comment} />)}
        <OrbitControls enablePan={!readOnly} enableZoom enableRotate={!readOnly} makeDefault target={[cameraPosition[0] * 0.2, 0, cameraPosition[2] * 0.2]} />
      </Canvas>
    </div>
  );
}
