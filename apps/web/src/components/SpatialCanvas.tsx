import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { createSpatialComment, type SpatialComment } from '@spatial/collaboration';
import { generateRoomFloorMesh } from '@spatial/geometry-engine';
import type { BuildingModel, Point, Room, WallOpening, WallSegment } from '@spatial/core';
import { BuildingStructureMeshes, BuildingWallMesh, levelElevation } from './BuildingStructureMeshes';
import { SpatialCommentPin } from './SpatialCommentPin';

interface SpatialCanvasProps { projectId?: string; walls: WallSegment[]; rooms: Room[]; points: Point[]; building?: BuildingModel; wallOpenings?: WallOpening[]; onDoorToggle?: (openingId: string) => void; readOnly?: boolean; onCommentAdd?: (comment: SpatialComment) => void; selectedRoomId?: string | null; }
type InteractionMode = 'navigate' | 'comment';

function FloorGrid({ onSelectPoint }: { onSelectPoint?: (e: ThreeEvent<MouseEvent>) => void }): JSX.Element { return <><gridHelper args={[30, 30, '#38bdf8', '#334155']} /><mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]} receiveShadow onClick={(e) => onSelectPoint?.(e)}><planeGeometry args={[30, 30]} /><meshStandardMaterial color="#0f172a" /></mesh></>; }
function RoomFloor({ room, highlighted, elevation, onSelectPoint }: { room: Room; highlighted: boolean; elevation: number; onSelectPoint?: (e: ThreeEvent<MouseEvent>) => void }): JSX.Element { const geometry = useMemo(() => { const floorMesh = generateRoomFloorMesh(room); const bufferGeometry = new THREE.BufferGeometry(); if (floorMesh.vertices.length > 0) { bufferGeometry.setAttribute('position', new THREE.Float32BufferAttribute(floorMesh.vertices, 3)); bufferGeometry.setIndex(floorMesh.indices); bufferGeometry.computeVertexNormals(); } return bufferGeometry; }, [room]); return <mesh geometry={geometry} position={[0, elevation + 0.01, 0]} receiveShadow onClick={(e) => onSelectPoint?.(e)}><meshStandardMaterial color={highlighted ? '#f59e0b' : '#1d4ed8'} transparent opacity={highlighted ? 0.5 : 0.35} /></mesh>; }

export function SpatialCanvas({ projectId = 'project-1', walls, rooms, points, building, wallOpenings = [], onDoorToggle, readOnly = false, onCommentAdd, selectedRoomId = null }: SpatialCanvasProps): JSX.Element {
  const [comments, setComments] = useState<SpatialComment[]>([]);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('navigate');
  const cameraPosition = useMemo<[number, number, number]>(() => { if (walls.length === 0) return [8, 7, 10]; const xs = walls.flatMap((wall) => [wall.start.x, wall.end.x]); const ys = walls.flatMap((wall) => [wall.start.y, wall.end.y]); const minX = Math.min(...xs); const maxX = Math.max(...xs); const minY = Math.min(...ys); const maxY = Math.max(...ys); const centerX = (minX + maxX) / 2; const centerY = (minY + maxY) / 2; const span = Math.max(maxX - minX, maxY - minY, 4); const distance = Math.max(span * 1.8, 8); return [centerX + distance * 0.9, distance * 0.75, centerY + distance * 0.9]; }, [walls]);
  const cameraTarget = useMemo<[number, number, number]>(() => { if (!walls.length) return [0, 0, 0]; const xs = walls.flatMap((wall) => [wall.start.x, wall.end.x]); const ys = walls.flatMap((wall) => [wall.start.y, wall.end.y]); return [(Math.min(...xs) + Math.max(...xs)) / 2, 0, (Math.min(...ys) + Math.max(...ys)) / 2]; }, [walls]);
  const commentEnabled = !readOnly && interactionMode === 'comment';

  const handlePointClick = (e: ThreeEvent<MouseEvent>): void => {
    if (!commentEnabled) return;
    e.stopPropagation();
    const hitPoint = e.point;
    const hitNormal = e.face?.normal ?? new THREE.Vector3(0, 1, 0);
    const commentText = window.prompt('Add a 3D spatial comment at this position:');
    if (!commentText || !commentText.trim()) return;
    const comment = createSpatialComment({ projectId, author: 'Reviewer', text: commentText.trim(), position: { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z }, normal: { x: hitNormal.x, y: hitNormal.y, z: hitNormal.z } });
    setComments((prev) => [...prev, comment]);
    onCommentAdd?.(comment);
    setInteractionMode('navigate');
  };

  return <div className="relative h-full w-full bg-slate-950">
    <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-xl border border-slate-700 bg-slate-900/85 px-4 py-3 shadow-xl backdrop-blur-md">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">3D model viewport</div>
      <div className="mt-1 text-sm font-medium text-white">{walls.length > 0 ? `${walls.length} wall segments · ${rooms.length} detected rooms` : 'No walls yet'}</div>
      <div className="mt-1 text-xs text-slate-400">Drag to orbit · wheel to zoom{commentEnabled ? ' · click a surface to place a comment' : ''}</div>
      {selectedRoomId ? <div className="mt-2 text-xs font-medium text-amber-300">Room highlighted: {rooms.find((room) => room.id === selectedRoomId)?.name ?? selectedRoomId}</div> : null}
    </div>

    {!readOnly ? <div className="absolute right-4 top-4 z-30 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 p-2 shadow-xl backdrop-blur">
      <button type="button" onClick={() => setInteractionMode((current) => current === 'comment' ? 'navigate' : 'comment')} aria-pressed={commentEnabled} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${commentEnabled ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-100 hover:bg-slate-600'}`}>{commentEnabled ? 'Comment mode on' : 'Add comment'}</button>
      {commentEnabled ? <button type="button" onClick={() => setInteractionMode('navigate')} className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-600">Cancel</button> : null}
    </div> : null}

    {walls.length === 0 ? <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"><div className="rounded-xl border border-slate-700 bg-slate-900/90 px-6 py-4 text-center shadow-2xl backdrop-blur-md"><div className="text-sm font-semibold text-white">Your 3D model will appear here</div><div className="mt-1 text-xs text-slate-400">Draw walls in the 2D Floor Plan on the left.</div></div></div> : null}
    <Canvas camera={{ position: cameraPosition, fov: 50 }} shadows><color attach="background" args={['#020617']} /><ambientLight intensity={0.8} /><directionalLight position={[10, 12, 8]} intensity={1.2} castShadow /><FloorGrid onSelectPoint={commentEnabled ? handlePointClick : undefined} /><BuildingStructureMeshes building={building} />{rooms.map((room) => <RoomFloor key={room.id} room={room} elevation={levelElevation(building, room.levelId)} highlighted={room.id === selectedRoomId} onSelectPoint={commentEnabled ? handlePointClick : undefined} />)}{walls.map((wall) => <BuildingWallMesh key={wall.id} wall={wall} elevation={levelElevation(building, wall.levelId)} openings={wallOpenings} onDoorToggle={onDoorToggle} highlighted={selectedRoomId ? Boolean(rooms.find((room) => room.id === selectedRoomId)?.wallSegments.some((roomWall) => roomWall.id === wall.id)) : false} />)}{points.map((point, index) => <mesh key={`${point.x}-${point.y}-${index}`} position={[point.x, 0.1, point.y]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.4} /></mesh>)}{comments.map((comment) => <SpatialCommentPin key={comment.id} comment={comment} />)}<OrbitControls enablePan={!readOnly} enableZoom enableRotate={!readOnly} makeDefault target={cameraTarget} /></Canvas>
  </div>;
}
