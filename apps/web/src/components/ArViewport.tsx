import { Canvas, useFrame } from '@react-three/fiber';
import { IfInSessionMode, XR, XROrigin, createXRStore, useXR, useXRControllerLocomotion, useXRInputSourceState } from '@react-three/xr';
import { OrbitControls } from '@react-three/drei';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject, ReactNode } from 'react';
import * as THREE from 'three';
import type { Group } from 'three';
import { generateRoomFloorMesh } from '@spatial/geometry-engine';
import type { Room, WallSegment } from '@spatial/core';

interface ArViewportProps { walls: WallSegment[]; rooms: Room[]; points: Array<{ x: number; y: number }> }
interface ControllerTracking { sessionActive: boolean; leftTracked: boolean; rightTracked: boolean }
type ArSupport = 'checking' | 'supported' | 'unsupported';

const xrStore = createXRStore({ offerSession: 'immersive-ar', hand: false, controller: { left: { teleportPointer: true }, right: { teleportPointer: true } }, secondaryInputSources: true });

// @react-three/xr v6 uses a floor-aligned XR origin/reference space for immersive sessions.
function FloorGrid(): JSX.Element { return <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]} receiveShadow><planeGeometry args={[30, 30]} /><meshStandardMaterial color="#0f172a" /></mesh>; }
function WallMesh({ wall }: { wall: WallSegment }): JSX.Element { const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y) || 0.001; const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x); return <mesh position={[(wall.start.x + wall.end.x) / 2, wall.height / 2, (wall.start.y + wall.end.y) / 2]} rotation={[0, -angle, 0]} castShadow receiveShadow><boxGeometry args={[length, wall.height, wall.thickness]} /><meshStandardMaterial color="#38bdf8" metalness={0.25} roughness={0.4} /></mesh>; }
function RoomFloor({ room }: { room: Room }): JSX.Element { const geometry = useMemo(() => { const floorMesh = generateRoomFloorMesh(room); const bufferGeometry = new THREE.BufferGeometry(); if (floorMesh.vertices.length) { bufferGeometry.setAttribute('position', new THREE.Float32BufferAttribute(floorMesh.vertices, 3)); bufferGeometry.setIndex(floorMesh.indices); bufferGeometry.computeVertexNormals(); } return bufferGeometry; }, [room]); return <mesh geometry={geometry} position={[0, 0.01, 0]} receiveShadow><meshStandardMaterial color="#2563eb" transparent opacity={0.35} /></mesh>; }
function XRTrackingReporter({ onChange }: { onChange: (status: ControllerTracking) => void }): ReactNode { const session = useXR((state) => state.session); const left = useXRInputSourceState('controller', 'left'); const right = useXRInputSourceState('controller', 'right'); useEffect(() => { onChange({ sessionActive: Boolean(session), leftTracked: Boolean(left), rightTracked: Boolean(right) }); }, [left, right, session, onChange]); return null; }
const MODEL_YAW_RADIANS = Math.PI / 2;
const WALKTHROUGH_EYE_HEIGHT = 1.65;
const XR_PLAYER_RADIUS = 0.28;

function cross2D(ax: number, az: number, bx: number, bz: number): number {
  return ax * bz - az * bx;
}

function distancePointToSegment2D(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
): number {
  const dx = bx - ax;
  const dz = bz - az;
  const lengthSq = dx * dx + dz * dz;
  if (lengthSq === 0) return Math.hypot(px - ax, pz - az);

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / lengthSq));
  const closestX = ax + t * dx;
  const closestZ = az + t * dz;
  return Math.hypot(px - closestX, pz - closestZ);
}

function segmentsIntersect2D(
  aX: number,
  aZ: number,
  bX: number,
  bZ: number,
  cX: number,
  cZ: number,
  dX: number,
  dZ: number,
): boolean {
  const rX = bX - aX;
  const rZ = bZ - aZ;
  const sX = dX - cX;
  const sZ = dZ - cZ;
  const denominator = cross2D(rX, rZ, sX, sZ);
  const cMinusAX = cX - aX;
  const cMinusAZ = cZ - aZ;

  if (Math.abs(denominator) < 1e-8) return false;

  const t = cross2D(cMinusAX, cMinusAZ, sX, sZ) / denominator;
  const u = cross2D(cMinusAX, cMinusAZ, rX, rZ) / denominator;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

function distanceSegmentToSegment2D(
  aX: number,
  aZ: number,
  bX: number,
  bZ: number,
  cX: number,
  cZ: number,
  dX: number,
  dZ: number,
): number {
  if (segmentsIntersect2D(aX, aZ, bX, bZ, cX, cZ, dX, dZ)) return 0;

  return Math.min(
    distancePointToSegment2D(aX, aZ, cX, cZ, dX, dZ),
    distancePointToSegment2D(bX, bZ, cX, cZ, dX, dZ),
    distancePointToSegment2D(cX, cZ, aX, aZ, bX, bZ),
    distancePointToSegment2D(dX, dZ, aX, aZ, bX, bZ),
  );
}

function sceneToLayoutPosition(
  sceneX: number,
  sceneZ: number,
  modelTransform: [number, number, number],
): { x: number; z: number } {
  const dx = sceneX - modelTransform[0];
  const dz = sceneZ - modelTransform[2];
  const cos = Math.cos(MODEL_YAW_RADIANS);
  const sin = Math.sin(MODEL_YAW_RADIANS);

  // The model is rendered with +90° yaw, so collision checks use the inverse yaw
  // to get back to the floor-plan's local X/Y coordinates.
  return {
    x: cos * dx + sin * dz,
    z: -sin * dx + cos * dz,
  };
}

function movementBlockedByWalls(
  previousSceneX: number,
  previousSceneZ: number,
  nextSceneX: number,
  nextSceneZ: number,
  walls: WallSegment[],
  modelTransform: [number, number, number],
): boolean {
  const previous = sceneToLayoutPosition(previousSceneX, previousSceneZ, modelTransform);
  const next = sceneToLayoutPosition(nextSceneX, nextSceneZ, modelTransform);

  for (const wall of walls) {
    const wallHalfThickness = Math.max(0.01, wall.thickness / 2);
    const clearance = XR_PLAYER_RADIUS + wallHalfThickness;

    const nextDistance = distancePointToSegment2D(
      next.x,
      next.z,
      wall.start.x,
      wall.start.y,
      wall.end.x,
      wall.end.y,
    );

    if (nextDistance < clearance) return true;

    const movementDistance = distanceSegmentToSegment2D(
      previous.x,
      previous.z,
      next.x,
      next.z,
      wall.start.x,
      wall.start.y,
      wall.end.x,
      wall.end.y,
    );

    if (movementDistance >= clearance) continue;

    const wallDX = wall.end.x - wall.start.x;
    const wallDZ = wall.end.y - wall.start.y;
    const previousDX = previous.x - wall.start.x;
    const previousDZ = previous.z - wall.start.y;
    const nextDX = next.x - wall.start.x;
    const nextDZ = next.z - wall.start.y;
    const previousSide = cross2D(wallDX, wallDZ, previousDX, previousDZ);
    const nextSide = cross2D(wallDX, wallDZ, nextDX, nextDZ);

    if (previousSide * nextSide <= 0) return true;
  }

  return false;
}

function XRLocomotion({
  originRef,
  walls,
  modelTransform,
  collisionEnabled,
}: {
  originRef: MutableRefObject<Group | null>;
  walls: WallSegment[];
  modelTransform: [number, number, number];
  collisionEnabled: boolean;
}): ReactNode {
  const previousPosition = useRef(new THREE.Vector3());
  const hasPreviousPosition = useRef(false);

  useXRControllerLocomotion(
    originRef,
    { speed: 1.5 },
    { type: 'snap', degrees: 30, deadZone: 0.18 },
    'left',
  );

  useFrame(() => {
    if (!originRef.current) return;

    const current = originRef.current.position;

    if (!hasPreviousPosition.current) {
      previousPosition.current.copy(current);
      hasPreviousPosition.current = true;
      return;
    }

    if (!previousPosition.current.equals(current)) {
      const blocked = collisionEnabled && movementBlockedByWalls(
        previousPosition.current.x,
        previousPosition.current.z,
        current.x,
        current.z,
        walls,
        modelTransform,
      );

      if (blocked) {
        originRef.current.position.copy(previousPosition.current);
      } else {
        previousPosition.current.copy(current);
      }
    }
  });

  return <XROrigin ref={originRef} position={[0, 0, 0]} />;
}
function KeyboardSpatialMovement({
  originRef,
  walls,
  modelTransform,
  collisionEnabled,
}: {
  originRef: MutableRefObject<Group | null>;
  walls: WallSegment[];
  modelTransform: [number, number, number];
  collisionEnabled: boolean;
}): ReactNode {
  const pressed = useRef(new Set<string>());

  useEffect(() => {
    const down = (event: KeyboardEvent) => pressed.current.add(event.key.toLowerCase());
    const up = (event: KeyboardEvent) => pressed.current.delete(event.key.toLowerCase());

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);

    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useFrame((_, delta) => {
    if (!originRef.current) return;

    const forward =
      Number(pressed.current.has('w') || pressed.current.has('arrowup')) -
      Number(pressed.current.has('s') || pressed.current.has('arrowdown'));
    const strafe =
      Number(pressed.current.has('d') || pressed.current.has('arrowright')) -
      Number(pressed.current.has('a') || pressed.current.has('arrowleft'));

    if (!forward && !strafe) return;

    const speed = 2.5 * delta;
    const previous = originRef.current.position.clone();
    const next = previous.clone();

    next.x += strafe * speed;
    next.z -= forward * speed;

    const blocked =
      collisionEnabled &&
      movementBlockedByWalls(
        previous.x,
        previous.z,
        next.x,
        next.z,
        walls,
        modelTransform,
      );

    if (!blocked) originRef.current.position.copy(next);
  });

  return null;
}
export function ArViewport({ walls, rooms }: ArViewportProps): JSX.Element {
  const [tracking, setTracking] = useState<ControllerTracking>({ sessionActive: false, leftTracked: false, rightTracked: false });
  const [collisionEnabled, setCollisionEnabled] = useState(true);
  const [arSupport, setArSupport] = useState<ArSupport>('checking'); const [arError, setArError] = useState(''); const originRef = useRef<Group | null>(null); const handleTrackingChange = useCallback((status: ControllerTracking) => setTracking(status), []);
  useEffect(() => {
    let cancelled = false;
    const checkSupport = async (): Promise<void> => {
      const xr = navigator.xr;
      if (!xr) { if (!cancelled) setArSupport('unsupported'); return; }
      try {
        const supported = await xr.isSessionSupported('immersive-ar');
        if (!cancelled) setArSupport(supported ? 'supported' : 'unsupported');
      } catch {
        if (!cancelled) setArSupport('unsupported');
      }
    };
    void checkSupport();
    return () => { cancelled = true; };
  }, []);
  const modelTransform = useMemo<[number, number, number]>(() => {
    if (!walls.length) return [0, 0, -4];

    const xs = walls.flatMap((wall) => [wall.start.x, wall.end.x]);
    const ys = walls.flatMap((wall) => [wall.start.y, wall.end.y]);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;

    // Floor-plan (x,y) becomes Three.js (x,z), then the whole layout gets a +90° yaw.
    return [-centerY, 0, centerX - 4];
  }, [walls]);
  const fallbackCamera = useMemo<[number, number, number]>(() => {
    const localDistance = walls.length
      ? Math.max(
          Math.max(
            ...walls.flatMap((wall) => [
              Math.abs(wall.end.x - wall.start.x),
              Math.abs(wall.end.y - wall.start.y),
            ]),
          ),
          6,
        )
      : 6;

    const cos = Math.cos(MODEL_YAW_RADIANS);
    const sin = Math.sin(MODEL_YAW_RADIANS);

    // Start at human eye height and look horizontally into the center of the layout.
    const localX = 0;
    const localZ = localDistance;
    return [
      modelTransform[0] + cos * localX + sin * localZ,
      WALKTHROUGH_EYE_HEIGHT,
      modelTransform[2] - sin * localX + cos * localZ,
    ];
  }, [modelTransform, walls]);

  const fallbackTarget = useMemo<[number, number, number]>(
    () => [modelTransform[0], WALKTHROUGH_EYE_HEIGHT, modelTransform[2]],
    [modelTransform],
  );
  const startAr = async (): Promise<void> => {
    if (arSupport !== 'supported') return;
    setArError('');
    try {
      if (!xrStore.getState().session) await xrStore.enterAR();
    } catch (error) {
      console.error('Unable to start immersive AR:', error);
      setArError(error instanceof Error ? error.message : 'Unable to start immersive AR on this device.');
    }
  };
  const arButtonLabel = arSupport === 'checking' ? 'Checking AR support…' : arSupport === 'supported' ? (tracking.sessionActive ? 'AR Session Active' : 'Start Immersive AR') : 'Immersive AR Unavailable';
  return <div className="relative h-full w-full bg-black"><Canvas camera={{ position: fallbackCamera, fov: 50 }} shadows resize={{ scroll: false, debounce: 50 }}><color attach="background" args={['#020617']} /><ambientLight intensity={0.8} /><directionalLight position={[10, 12, 8]} intensity={1.2} castShadow /><XR store={xrStore} referenceSpace="local-floor"><XRTrackingReporter onChange={handleTrackingChange} /><XRLocomotion originRef={originRef} walls={walls} modelTransform={modelTransform} collisionEnabled={collisionEnabled} /><group position={modelTransform} rotation={[0, MODEL_YAW_RADIANS, 0]}><IfInSessionMode deny={['immersive-ar', 'immersive-vr']}><FloorGrid /></IfInSessionMode>{rooms.map((room) => <RoomFloor key={room.id} room={room} />)}{walls.map((wall) => <WallMesh key={wall.id} wall={wall} />)}</group><IfInSessionMode deny={['immersive-ar', 'immersive-vr']}><KeyboardSpatialMovement originRef={originRef} walls={walls} modelTransform={modelTransform} collisionEnabled={collisionEnabled} /><OrbitControls target={fallbackTarget} enablePan enableZoom enableRotate minPolarAngle={Math.PI / 2 - 0.7} maxPolarAngle={Math.PI / 2 + 0.7} /></IfInSessionMode></XR></Canvas><div className="pointer-events-none absolute right-4 top-4 z-20 rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-xs text-slate-200 shadow-xl backdrop-blur"><div className="font-semibold uppercase tracking-[0.18em] text-teal-300">XR status</div><div className="mt-1">Session: <span className={tracking.sessionActive ? 'text-emerald-300' : 'text-slate-400'}>{tracking.sessionActive ? 'active' : 'inactive'}</span></div><div>Immersive AR: <span className={arSupport === 'supported' ? 'text-emerald-300' : 'text-slate-400'}>{arSupport === 'checking' ? 'checking' : arSupport === 'supported' ? 'supported' : 'unsupported'}</span></div><div>Left controller: <span className={tracking.leftTracked ? 'text-emerald-300' : 'text-slate-400'}>{tracking.leftTracked ? 'tracked' : 'not detected'}</span></div><div>Right controller: <span className={tracking.rightTracked ? 'text-emerald-300' : 'text-slate-400'}>{tracking.rightTracked ? 'tracked' : 'not detected'}</span></div></div><div className="pointer-events-none absolute left-4 top-4 z-20 rounded-xl border border-slate-700 bg-slate-900/85 px-4 py-3 text-xs text-slate-200 shadow-xl backdrop-blur"><div className="font-semibold uppercase tracking-[0.18em] text-teal-300">Spatial View</div><div className="mt-1 text-sm font-medium text-white">{walls.length} walls · {rooms.length} rooms</div><div className="mt-1 text-slate-400">AR: left thumbstick moves · snap turn controls · teleport pointer can move you. Desktop: WASD / arrows.</div><div className="mt-1 text-slate-400">Wall collision: <span className={collisionEnabled ? 'text-emerald-300' : 'text-amber-300'}>{collisionEnabled ? 'ON' : 'OFF'}</span></div></div><div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 p-2 shadow-xl backdrop-blur"><button type="button" onClick={() => setCollisionEnabled((enabled) => !enabled)} aria-pressed={collisionEnabled} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${collisionEnabled ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-amber-500 text-slate-950 hover:bg-amber-400'}`}>Wall collision: {collisionEnabled ? 'ON' : 'OFF'}</button><button type="button" onClick={startAr} disabled={arSupport !== 'supported' || tracking.sessionActive} aria-disabled={arSupport !== 'supported' || tracking.sessionActive} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white enabled:hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50">{arButtonLabel}</button><span className="px-2 text-xs text-slate-400">{arError || (arSupport === 'unsupported' ? 'Use a WebXR-capable mobile headset/browser for immersive AR.' : 'Physical controller movement requires a WebXR-capable device.')}</span></div></div>; }
