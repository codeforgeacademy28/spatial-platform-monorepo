import { Canvas, useFrame } from '@react-three/fiber';
import { IfInSessionMode, XR, XROrigin, createXRStore, useXR, useXRControllerLocomotion, useXRInputSourceState } from '@react-three/xr';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import type { Group } from 'three';
import { extrudeWallSegments, generateRoomFloorMesh } from '@spatial/geometry-engine';
import type { Room, WallSegment } from '@spatial/core';

interface ArViewportProps { walls: WallSegment[]; rooms: Room[]; points: Array<{ x: number; y: number }> }
interface ControllerTracking { sessionActive: boolean; leftTracked: boolean; rightTracked: boolean }

const xrStore = createXRStore({
  offerSession: 'immersive-ar',
  hand: false,
  controller: { left: { teleportPointer: true }, right: { teleportPointer: true } },
  secondaryInputSources: true,
});

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

function XRTrackingReporter({ onChange }: { onChange: (status: ControllerTracking) => void }): JSX.Element {
  const session = useXR((state) => state.session);
  const left = useXRInputSourceState('controller', 'left');
  const right = useXRInputSourceState('controller', 'right');
  useEffect(() => {
    onChange({ sessionActive: Boolean(session), leftTracked: Boolean(left), rightTracked: Boolean(right) });
  }, [left, right, session, onChange]);
  return null;
}

function XRLocomotion({ originRef }: { originRef: MutableRefObject<Group | null> }): JSX.Element {
  useXRControllerLocomotion(originRef, { speed: 1.5 }, { type: 'snap', degrees: 30, deadZone: 0.18 }, 'left');
  return <XROrigin ref={originRef} position={[0, 0, 0]} />;
}

function KeyboardSpatialMovement({ originRef }: { originRef: MutableRefObject<Group | null> }): JSX.Element {
  const pressed = useRef(new Set<string>());
  useEffect(() => {
    const down = (event: KeyboardEvent) => pressed.current.add(event.key.toLowerCase());
    const up = (event: KeyboardEvent) => pressed.current.delete(event.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);
  useFrame((_, delta) => {
    if (!originRef.current) return;
    const forward = Number(pressed.current.has('w') || pressed.current.has('arrowup')) - Number(pressed.current.has('s') || pressed.current.has('arrowdown'));
    const strafe = Number(pressed.current.has('d') || pressed.current.has('arrowright')) - Number(pressed.current.has('a') || pressed.current.has('arrowleft'));
    if (!forward && !strafe) return;
    const speed = 2.5 * delta;
    originRef.current.position.x += strafe * speed;
    originRef.current.position.z -= forward * speed;
  });
  return null;
}

export function ArViewport({ walls, rooms }: ArViewportProps): JSX.Element {
  const [tracking, setTracking] = useState<ControllerTracking>({ sessionActive: false, leftTracked: false, rightTracked: false });
  const originRef = useRef<Group | null>(null);

  const modelTransform = useMemo<[number, number, number]>(() => {
    if (!walls.length) return [0, 0, -4];
    const xs = walls.flatMap((wall) => [wall.start.x, wall.end.x]); const ys = walls.flatMap((wall) => [wall.start.y, wall.end.y]);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2; const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
    return [-centerX, 0, -centerY - 4];
  }, [walls]);

  const fallbackCamera = useMemo<[number, number, number]>(() => {
    if (!walls.length) return [8, 7, 10];
    const xs = walls.flatMap((wall) => [wall.start.x, wall.end.x]); const ys = walls.flatMap((wall) => [wall.start.y, wall.end.y]);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2; const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 4); const distance = Math.max(span * 2, 8);
    return [centerX + distance, distance * 0.8, centerY + distance];
  }, [walls]);

  const startAr = async (): Promise<void> => {
    try {
      if (xrStore.getState().session) return;
      await xrStore.enterAR();
    } catch (error) {
      console.error('Unable to start immersive AR:', error);
    }
  };

  return (
    <div className="relative h-full w-full bg-black">
      <Canvas camera={{ position: fallbackCamera, fov: 50 }} shadows resize={{ scroll: false, debounce: 50 }}>
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 12, 8]} intensity={1.2} castShadow />
        <XR store={xrStore}>
          <XRTrackingReporter onChange={setTracking} />
          <XRLocomotion originRef={originRef} />
          <group position={modelTransform}>
            <FloorGrid />
            {rooms.map((room) => <RoomFloor key={room.id} room={room} />)}
            {walls.map((wall) => <WallMesh key={wall.id} wall={wall} />)}
          </group>
          <IfInSessionMode deny={['immersive-ar', 'immersive-vr']}>
            <KeyboardSpatialMovement originRef={originRef} />
            <OrbitControls target={[0, 0, -4]} enablePan enableZoom enableRotate />
          </IfInSessionMode>
        </XR>
      </Canvas>
      <div className="pointer-events-none absolute right-4 top-4 z-20 rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-xs text-slate-200 shadow-xl backdrop-blur">
        <div className="font-semibold uppercase tracking-[0.18em] text-teal-300">XR status</div>
        <div className="mt-1">Session: <span className={tracking.sessionActive ? 'text-emerald-300' : 'text-slate-400'}>{tracking.sessionActive ? 'active' : 'inactive'}</span></div>
        <div>Left controller: <span className={tracking.leftTracked ? 'text-emerald-300' : 'text-slate-400'}>{tracking.leftTracked ? 'tracked' : 'not detected'}</span></div>
        <div>Right controller: <span className={tracking.rightTracked ? 'text-emerald-300' : 'text-slate-400'}>{tracking.rightTracked ? 'tracked' : 'not detected'}</span></div>
      </div>
      <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-xl border border-slate-700 bg-slate-900/85 px-4 py-3 text-xs text-slate-200 shadow-xl backdrop-blur">
        <div className="font-semibold uppercase tracking-[0.18em] text-teal-300">Spatial View</div>
        <div className="mt-1 text-sm font-medium text-white">{walls.length} walls · {rooms.length} rooms</div>
        <div className="mt-1 text-slate-400">AR: left thumbstick moves · left/right stick turns · teleport pointer can move you. Desktop: WASD / arrows.</div>
      </div>
      <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 p-2 shadow-xl backdrop-blur">
        <button type="button" onClick={startAr} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500">Start Immersive AR</button>
        <span className="px-2 text-xs text-slate-400">Physical controller movement requires a WebXR-capable device.</span>
      </div>
    </div>
  );
}
