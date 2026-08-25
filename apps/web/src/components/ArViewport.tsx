import { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, Controllers, Hands } from '@react-three/xr';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { extrudeWallSegments, generateRoomFloorMesh } from '@spatial/geometry-engine';
import type { Point, Room, WallSegment } from '@spatial/core';

interface ArViewportProps { walls: WallSegment[]; rooms: Room[]; points: Point[] }

function FloorGrid(): JSX.Element {
  return <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]} receiveShadow><planeGeometry args={[30, 30]} /><meshStandardMaterial color="#0f172a" /></mesh>;
}

function WallMesh({ wall }: { wall: WallSegment }): JSX.Element {
  const extrusion = useMemo(() => extrudeWallSegments([wall])[0], [wall]);
  const start = extrusion.bottomCorners[0]; const end = extrusion.bottomCorners[1];
  const length = Math.hypot(end.x - start.x, end.y - start.y) || 0.001;
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  return <mesh position={[(start.x + end.x) / 2, wall.height / 2, (start.y + end.y) / 2]} rotation={[0, -angle, 0]} castShadow receiveShadow><boxGeometry args={[length, wall.height, wall.thickness]} /><meshStandardMaterial color="#38bdf8" metalness={0.25} roughness={0.4} /></mesh>;
}

function RoomFloor({ room }: { room: Room }): JSX.Element {
  const geometry = useMemo(() => {
    const floorMesh = generateRoomFloorMesh(room);
    const bufferGeometry = new THREE.BufferGeometry();
    if (floorMesh.vertices.length) { bufferGeometry.setAttribute('position', new THREE.Float32BufferAttribute(floorMesh.vertices, 3)); bufferGeometry.setIndex(floorMesh.indices); bufferGeometry.computeVertexNormals(); }
    return bufferGeometry;
  }, [room]);
  return <mesh geometry={geometry} position={[0, 0.01, 0]} receiveShadow><meshStandardMaterial color="#2563eb" transparent opacity={0.35} /></mesh>;
}

export function ArViewport({ walls, rooms }: ArViewportProps): JSX.Element {
  const [arSupported, setArSupported] = useState<boolean | null>(null);
  const camera = useMemo<[number, number, number]>(() => {
    if (!walls.length) return [8, 7, 10];
    const xs = walls.flatMap((wall) => [wall.start.x, wall.end.x]); const ys = walls.flatMap((wall) => [wall.start.y, wall.end.y]);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2; const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 4); const distance = Math.max(span * 2, 8);
    return [centerX + distance, distance * 0.8, centerY + distance];
  }, [walls]);

  const startAr = async (): Promise<void> => {
    const xr = (navigator as Navigator & { xr?: { isSessionSupported?: (mode: string) => Promise<boolean>; requestSession?: (mode: string, options?: Record<string, unknown>) => Promise<any> } }).xr;
    if (!xr?.requestSession) { setArSupported(false); return; }
    try {
      const supported = await xr.isSessionSupported?.('immersive-ar');
      setArSupported(Boolean(supported));
      if (!supported) return;
      const session = await xr.requestSession('immersive-ar', { requiredFeatures: ['local-floor'] });
      window.dispatchEvent(new CustomEvent('spatial:ar-session-requested', { detail: session }));
    } catch (error) {
      console.error('Unable to start immersive AR:', error);
      setArSupported(false);
    }
  };

  const target: [number, number, number] = [camera[0] * 0.25, 0, camera[2] * 0.25];

  return (
    <div className="relative h-full w-full bg-black">
      <Canvas camera={{ position: camera, fov: 50 }} shadows onCreated={({ gl }) => {
        gl.xr.enabled = true;
        const xr = (navigator as Navigator & { xr?: { isSessionSupported?: (mode: string) => Promise<boolean> } }).xr;
        xr?.isSessionSupported?.('immersive-ar').then(setArSupported).catch(() => setArSupported(false));
      }}>
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 12, 8]} intensity={1.2} castShadow />
        <XR><Controllers /><Hands /><FloorGrid />{rooms.map((room) => <RoomFloor key={room.id} room={room} />)}{walls.map((wall) => <WallMesh key={wall.id} wall={wall} />)}</XR>
        <OrbitControls target={target} enablePan enableZoom enableRotate />
      </Canvas>
      <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-xl border border-slate-700 bg-slate-900/85 px-4 py-3 text-xs text-slate-200 shadow-xl backdrop-blur">
        <div className="font-semibold uppercase tracking-[0.18em] text-teal-300">Spatial View</div>
        <div className="mt-1 text-sm font-medium text-white">{walls.length} walls · {rooms.length} rooms</div>
        <div className="mt-1 text-slate-400">Model is centered and ready for spatial review.</div>
      </div>
      <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 p-2 shadow-xl backdrop-blur">
        <button type="button" onClick={startAr} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500">{arSupported === false ? 'AR not supported — use 3D Spatial View' : 'Start Immersive AR'}</button>
        <span className="px-2 text-xs text-slate-400">Orbit / zoom works without AR.</span>
      </div>
    </div>
  );
}
