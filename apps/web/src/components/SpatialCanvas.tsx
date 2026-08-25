import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
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

function WallMesh({ wall, onSelectPoint }: { wall: WallSegment; onSelectPoint?: (e: ThreeEvent<MouseEvent>) => void }): JSX.Element {
  const extrusion = useMemo(() => extrudeWallSegments([wall])[0], [wall]);
  const start = extrusion.bottomCorners[0];
  const end = extrusion.bottomCorners[1];
  const length = Math.hypot(end.x - start.x, end.y - start.y) || 0.001;
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const centerX = (start.x + end.x) / 2;
  const centerY = (start.y + end.y) / 2;

  return (
    <mesh position={[centerX, wall.height / 2, centerY]} rotation={[0, -angle, 0]} castShadow receiveShadow onClick={(e) => onSelectPoint?.(e)}>
      <boxGeometry args={[length, wall.height, wall.thickness]} />
      <meshStandardMaterial color="#cbd5e1" metalness={0.12} roughness={0.7} />
    </mesh>
  );
}

function RoomFloor({ room, onSelectPoint }: { room: Room; onSelectPoint?: (e: ThreeEvent<MouseEvent>) => void }): JSX.Element {
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
      <meshStandardMaterial color="#1d4ed8" transparent opacity={0.35} />
    </mesh>
  );
}

export function SpatialCanvas({ projectId = 'project-1', walls, rooms, points, readOnly = false, onCommentAdd }: SpatialCanvasProps): JSX.Element {
  const [comments, setComments] = useState<SpatialComment[]>([]);

  const handlePointClick = (e: ThreeEvent<MouseEvent>): void => {
    e.stopPropagation();
    const hitPoint = e.point;
    const hitNormal = e.face?.normal ?? new THREE.Vector3(0, 1, 0);
    const commentText = window.prompt('Add a 3D spatial comment at this position:');
    if (!commentText || !commentText.trim()) return;

    const comment = createSpatialComment({
      projectId,
      author: 'Reviewer',
      text: commentText.trim(),
      position: { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z },
      normal: { x: hitNormal.x, y: hitNormal.y, z: hitNormal.z },
    });

    setComments((prev) => [...prev, comment]);
    onCommentAdd?.(comment);
  };

  return (
    <div className="h-full w-full bg-slate-950">
      <Canvas camera={{ position: [10, 8, 12], fov: 50 }} shadows>
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 12, 8]} intensity={1.2} castShadow />
        <FloorGrid onSelectPoint={readOnly ? undefined : handlePointClick} />
        {rooms.map((room) => <RoomFloor key={room.id} room={room} onSelectPoint={readOnly ? undefined : handlePointClick} />)}
        {walls.map((wall) => <WallMesh key={wall.id} wall={wall} onSelectPoint={readOnly ? undefined : handlePointClick} />)}
        {points.map((point, index) => (
          <mesh key={`${point.x}-${point.y}-${index}`} position={[point.x, 0.1, point.y]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.4} />
          </mesh>
        ))}
        {comments.map((comment) => <SpatialCommentPin key={comment.id} comment={comment} />)}
        <OrbitControls enablePan={!readOnly} enableZoom enableRotate={!readOnly} makeDefault />
      </Canvas>
    </div>
  );
}
