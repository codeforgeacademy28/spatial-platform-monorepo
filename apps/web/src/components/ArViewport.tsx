import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  IfInSessionMode,
  XR,
  XROrigin,
  createXRStore,
  useXR,
  useXRControllerLocomotion,
  useXRInputSourceState,
} from '@react-three/xr';
import { OrbitControls } from '@react-three/drei';
import { EditableGltfAsset } from './EditableGltfAsset';
import { IDENTITY_MODEL_TRANSFORM, loadStoredModelAsset, removeStoredModelAsset, saveStoredModelAsset } from '../services/local-model-store';
import type { ModelTransform } from '../services/local-model-store';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject, ReactNode } from 'react';
import * as THREE from 'three';
import type { Group } from 'three';
import { floorPlanToWorld, generateRoomFloorMesh, isCircleMovementBlockedByWall, resolveCircleMovementWithWallSliding, wallsWithPassableOpenings, stairFloorElevationAtPoint, worldToFloorPlan } from '@spatial/geometry-engine';
import type { BuildingModel, Room, WallOpening, WallSegment } from '@spatial/core';
import { BuildingStructureMeshes, BuildingWallMesh, levelElevation } from './BuildingStructureMeshes';
import {
  ControllerLocomotionClient,
  type ControllerConnectionState,
  type SpatialControllerInput,
} from '../services/controller-locomotion';

interface ArViewportProps {
  walls: WallSegment[];
  rooms: Room[];
  points: Array<{ x: number; y: number }>;
  building?: BuildingModel;
  wallOpenings?: WallOpening[];
  onDoorToggle?: (openingId: string) => void;
}
interface ControllerTracking {
  sessionActive: boolean;
  leftTracked: boolean;
  rightTracked: boolean;
}
type ArSupport = 'checking' | 'supported' | 'unsupported';
type ViewCorrectionCommand =
  | { id: number; action: 'level' | 'reset' }
  | { id: number; action: 'pitch' | 'roll'; degrees: number };

const xrTestMode = new URLSearchParams(window.location.search).get('xrTest') === '1';

const xrStore = createXRStore({
  offerSession: false,
  enterGrantedSession: false,
  emulate: xrTestMode,
  hand: false,
  controller: { left: { teleportPointer: true }, right: { teleportPointer: true } },
  secondaryInputSources: true,
});

// @react-three/xr v6 uses a floor-aligned XR origin/reference space for immersive sessions.
function FloorGrid(): JSX.Element {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color="#0f172a" />
    </mesh>
  );
}
function RoomFloor({ room, elevation }: { room: Room; elevation: number }): JSX.Element {
  const geometry = useMemo(() => {
    const floorMesh = generateRoomFloorMesh(room);
    const bufferGeometry = new THREE.BufferGeometry();
    if (floorMesh.vertices.length) {
      bufferGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(floorMesh.vertices, 3),
      );
      bufferGeometry.setIndex(floorMesh.indices);
      bufferGeometry.computeVertexNormals();
    }
    return bufferGeometry;
  }, [room]);
  return (
    <mesh geometry={geometry} position={[0, elevation + 0.01, 0]} receiveShadow>
      <meshStandardMaterial color="#2563eb" transparent opacity={0.35} />
    </mesh>
  );
}
function XRTrackingReporter({
  onChange,
}: {
  onChange: (status: ControllerTracking) => void;
}): ReactNode {
  const session = useXR((state) => state.session);
  const left = useXRInputSourceState('controller', 'left');
  const right = useXRInputSourceState('controller', 'right');
  useEffect(() => {
    onChange({
      sessionActive: Boolean(session),
      leftTracked: Boolean(left),
      rightTracked: Boolean(right),
    });
  }, [left, right, session, onChange]);
  return null;
}
const MODEL_YAW_RADIANS = Math.PI / 2;
const WALKTHROUGH_EYE_HEIGHT = 1.65;
const XR_PLAYER_RADIUS = 0.28;

function sceneToLayoutPosition(
  sceneX: number,
  sceneZ: number,
  modelTransform: [number, number, number],
): { x: number; z: number } {
  const layoutPoint = worldToFloorPlan(sceneX, sceneZ, modelTransform, MODEL_YAW_RADIANS);
  return { x: layoutPoint.x, z: layoutPoint.y };
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
  return walls.some((wall) => isCircleMovementBlockedByWall(
    { x: previous.x, y: previous.z },
    { x: next.x, y: next.z },
    wall,
    XR_PLAYER_RADIUS,
  ));
}

function resolveMovementWithWallSliding(
  previousSceneX: number,
  previousSceneZ: number,
  requestedSceneX: number,
  requestedSceneZ: number,
  walls: WallSegment[],
  modelTransform: [number, number, number],
): { x: number; z: number } {
  const previous = sceneToLayoutPosition(previousSceneX, previousSceneZ, modelTransform);
  const requested = sceneToLayoutPosition(requestedSceneX, requestedSceneZ, modelTransform);
  const resolved = resolveCircleMovementWithWallSliding(
    { x: previous.x, y: previous.z },
    { x: requested.x, y: requested.z },
    walls,
    XR_PLAYER_RADIUS,
  );
  const world = floorPlanToWorld(resolved, modelTransform, MODEL_YAW_RADIANS);
  return { x: world.x, z: world.z };
}

function XRLocomotion({
  originRef,
  walls,
  modelTransform,
  collisionEnabled,
  viewCorrectionCommand,
  onViewCorrectionApplied,
  building,
  rooms,
}: {
  originRef: MutableRefObject<Group | null>;
  walls: WallSegment[];
  building?: BuildingModel;
  rooms: Room[];
  modelTransform: [number, number, number];
  collisionEnabled: boolean;
  viewCorrectionCommand: ViewCorrectionCommand;
  onViewCorrectionApplied: (correction: { pitch: number; roll: number }) => void;
}): ReactNode {
  const previousPosition = useRef(new THREE.Vector3());
  const hasPreviousPosition = useRef(false);
  const lastCorrectionCommandId = useRef(0);
  const currentQuaternion = useRef(new THREE.Quaternion());
  const currentEuler = useRef(new THREE.Euler());

  useXRControllerLocomotion(
    originRef,
    { speed: 1.5 },
    { type: 'snap', degrees: 30, deadZone: 0.18 },
    'left',
  );

  useFrame((state) => {
    if (!originRef.current) return;

    if (viewCorrectionCommand.id !== lastCorrectionCommandId.current) {
      if (viewCorrectionCommand.action === 'reset') {
        originRef.current.rotation.x = 0;
        originRef.current.rotation.z = 0;
      } else if (viewCorrectionCommand.action === 'level') {
        state.camera.getWorldQuaternion(currentQuaternion.current);
        currentEuler.current.setFromQuaternion(currentQuaternion.current, 'YXZ');
        originRef.current.rotation.x = -currentEuler.current.x;
        originRef.current.rotation.z = -currentEuler.current.z;
      } else if (viewCorrectionCommand.action === 'pitch') {
        originRef.current.rotation.x += THREE.MathUtils.degToRad(viewCorrectionCommand.degrees);
      } else if (viewCorrectionCommand.action === 'roll') {
        originRef.current.rotation.z += THREE.MathUtils.degToRad(viewCorrectionCommand.degrees);
      }

      lastCorrectionCommandId.current = viewCorrectionCommand.id;
      currentEuler.current.setFromQuaternion(originRef.current.quaternion, 'YXZ');
      onViewCorrectionApplied({
        pitch: THREE.MathUtils.radToDeg(currentEuler.current.x),
        roll: THREE.MathUtils.radToDeg(currentEuler.current.z),
      });
    }

    const current = originRef.current.position;

    if (!hasPreviousPosition.current) {
      previousPosition.current.copy(current);
      hasPreviousPosition.current = true;
      return;
    }

    if (!previousPosition.current.equals(current)) {
      const layout = sceneToLayoutPosition(current.x, current.z, modelTransform);
      const currentFloor = roomFloorElevation(layout.x, layout.z, rooms, building, current.y);
      const levelWalls = walls.filter((wall) => Math.abs(levelElevation(building, wall.levelId) - currentFloor) < 0.05);
      const blocked =
        collisionEnabled &&
        movementBlockedByWalls(
          previousPosition.current.x,
          previousPosition.current.z,
          current.x,
          current.z,
          levelWalls,
          modelTransform,
        );

      if (blocked) {
        originRef.current.position.copy(previousPosition.current);
      } else {
        previousPosition.current.copy(current);
      }
    }

    const layout = sceneToLayoutPosition(current.x, current.z, modelTransform);
    const stairElevation = building ? stairFloorElevationAtPoint(layout.x, layout.z, building) : null;
    current.y = stairElevation ?? roomFloorElevation(layout.x, layout.z, rooms, building, current.y);
  });

  return <XROrigin ref={originRef} position={[0, 0, 0]} />;
}

function ExternalControllerLocomotion({
  originRef,
  walls,
  modelTransform,
  collisionEnabled,
  onStateChange,
  building,
  rooms,
}: {
  originRef: MutableRefObject<Group | null>;
  walls: WallSegment[];
  building?: BuildingModel;
  rooms: Room[];
  modelTransform: [number, number, number];
  collisionEnabled: boolean;
  onStateChange: (state: ControllerConnectionState) => void;
}): ReactNode {
  const client = useMemo(() => new ControllerLocomotionClient(), []);
  const input = useRef<SpatialControllerInput | null>(null);

  useEffect(() => {
    const removeInputListener = client.onInput((nextInput) => {
      input.current = nextInput;
    });
    const removeStateListener = client.onState(onStateChange);
    client.start();
    return () => {
      removeInputListener();
      removeStateListener();
      client.stop();
    };
  }, [client, onStateChange]);

  useFrame((_, delta) => {
    if (!originRef.current || !input.current) return;

    const { move, look } = input.current;
    const origin = originRef.current;
    origin.rotation.y -= look.x * 1.8 * delta;

    // A positive phone-stick Y is forward, matching desktop W / Up movement.
    const forward = move.y;
    const strafe = move.x;
    if (!forward && !strafe) return;

    const speed = (input.current.buttons.sprint ? 3.5 : 2.5) * delta;
    const yaw = origin.rotation.y;
    const next = origin.position.clone();
    next.x += (strafe * Math.cos(yaw) + forward * Math.sin(yaw)) * speed;
    next.z += (strafe * Math.sin(yaw) - forward * Math.cos(yaw)) * speed;

    const currentLayout = sceneToLayoutPosition(origin.position.x, origin.position.z, modelTransform);
    const currentFloor = roomFloorElevation(currentLayout.x, currentLayout.z, rooms, building, origin.position.y);
    const levelWalls = walls.filter((wall) => Math.abs(levelElevation(building, wall.levelId) - currentFloor) < 0.05);
    const blocked =
      collisionEnabled &&
      movementBlockedByWalls(
        origin.position.x,
        origin.position.z,
        next.x,
        next.z,
        levelWalls,
        modelTransform,
      );
    if (!blocked) {
      origin.position.copy(next);
      const layout = sceneToLayoutPosition(next.x, next.z, modelTransform);
      const stairElevation = building ? stairFloorElevationAtPoint(layout.x, layout.z, building) : null;
      origin.position.y = stairElevation ?? roomFloorElevation(layout.x, layout.z, rooms, building, origin.position.y);
    }
  });

  return null;
}
function pointInPlanPolygon(x: number, y: number, polygon: Array<{ x: number; y: number }>): boolean {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const currentPoint = polygon[index];
    const previousPoint = polygon[previous];
    const intersects = (currentPoint.y > y) !== (previousPoint.y > y)
      && x < ((previousPoint.x - currentPoint.x) * (y - currentPoint.y)) / (previousPoint.y - currentPoint.y || Number.EPSILON) + currentPoint.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function roomFloorElevation(
  x: number,
  z: number,
  rooms: Room[],
  building: BuildingModel | undefined,
  currentElevation: number,
): number {
  const candidates = rooms
    .filter((room) => pointInPlanPolygon(x, z, room.polygon))
    .map((room) => levelElevation(building, room.levelId));
  if (!candidates.length) {
    const levels = building?.levels ?? [];
    if (!levels.length) return 0;
    return levels.reduce((closest, level) => Math.abs(level.elevation - currentElevation) < Math.abs(closest - currentElevation) ? level.elevation : closest, levels[0].elevation);
  }
  return candidates.reduce((closest, elevation) => Math.abs(elevation - currentElevation) < Math.abs(closest - currentElevation) ? elevation : closest, candidates[0]);
}

function DesktopFirstPersonController({
  active,
  walls,
  modelTransform,
  collisionEnabled,
  spawnPosition,
  targetPosition,
  building,
  rooms,
}: {
  active: boolean;
  walls: WallSegment[];
  building?: BuildingModel;
  rooms: Room[];
  modelTransform: [number, number, number];
  collisionEnabled: boolean;
  spawnPosition: [number, number, number];
  targetPosition: [number, number, number];
}): null {
  const { camera, gl } = useThree();
  const pressed = useRef(new Set<string>());
  const yaw = useRef(0);
  const pitch = useRef(0);
  const verticalVelocity = useRef(0);

  useEffect(() => {
    if (!active) {
      if (document.pointerLockElement === gl.domElement) document.exitPointerLock();
      pressed.current.clear();
      return;
    }

    camera.position.set(...spawnPosition);
    camera.rotation.order = 'YXZ';
    camera.lookAt(...targetPosition);
    yaw.current = camera.rotation.y;
    pitch.current = camera.rotation.x;
    verticalVelocity.current = 0;

    const onKeyDown = (event: KeyboardEvent): void => {
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift', 'control'].includes(key)) {
        event.preventDefault();
      }
      pressed.current.add(key);
    };
    const onKeyUp = (event: KeyboardEvent): void => { pressed.current.delete(event.key.toLowerCase()); };
    const onMouseMove = (event: MouseEvent): void => {
      if (document.pointerLockElement !== gl.domElement) return;
      yaw.current -= event.movementX * 0.002;
      pitch.current = THREE.MathUtils.clamp(pitch.current - event.movementY * 0.002, -1.45, 1.45);
    };
    const onBlur = (): void => pressed.current.clear();

    gl.domElement.addEventListener('click', requestPointerLock);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('mousemove', onMouseMove);

    function requestPointerLock(): void {
      if (document.pointerLockElement !== gl.domElement) {
        void gl.domElement.requestPointerLock();
      }
    }

    return () => {
      gl.domElement.removeEventListener('click', requestPointerLock);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('mousemove', onMouseMove);
      if (document.pointerLockElement === gl.domElement) document.exitPointerLock();
      pressed.current.clear();
    };
  }, [active, camera, gl, spawnPosition, targetPosition]);

  useFrame((_, rawDelta) => {
    if (!active) return;

    const delta = Math.min(rawDelta, 0.05);
    camera.rotation.order = 'YXZ';
    camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ');

    const keys = pressed.current;
    const forward = Number(keys.has('w') || keys.has('arrowup')) - Number(keys.has('s') || keys.has('arrowdown'));
    const strafe = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'));
    const length = Math.hypot(forward, strafe) || 1;
    const sprint = keys.has('shift');
    const speed = (sprint ? 5.5 : 3.0) * delta;
    const normalizedForward = forward / length;
    const normalizedStrafe = strafe / length;

    if (forward || strafe) {
      const moveX = -Math.sin(yaw.current) * normalizedForward + Math.cos(yaw.current) * normalizedStrafe;
      const moveZ = -Math.cos(yaw.current) * normalizedForward - Math.sin(yaw.current) * normalizedStrafe;
      let nextX = camera.position.x + moveX * speed;
      let nextZ = camera.position.z + moveZ * speed;

      if (collisionEnabled) {
        const currentLayout = sceneToLayoutPosition(camera.position.x, camera.position.z, modelTransform);
        const currentFloor = camera.position.y - WALKTHROUGH_EYE_HEIGHT;
        const collisionLevel = roomFloorElevation(currentLayout.x, currentLayout.z, rooms, building, currentFloor);
        const levelWalls = walls.filter((wall) => Math.abs(levelElevation(building, wall.levelId) - collisionLevel) < 0.05);
        const resolved = resolveMovementWithWallSliding(
          camera.position.x,
          camera.position.z,
          nextX,
          nextZ,
          levelWalls,
          modelTransform,
        );
        nextX = resolved.x;
        nextZ = resolved.z;
      }

      camera.position.x = nextX;
      camera.position.z = nextZ;
    }

    const layoutPosition = sceneToLayoutPosition(camera.position.x, camera.position.z, modelTransform);
    const currentElevation = camera.position.y - WALKTHROUGH_EYE_HEIGHT;
    const stairElevation = building ? stairFloorElevationAtPoint(layoutPosition.x, layoutPosition.z, building) : null;
    const floorElevation = stairElevation ?? roomFloorElevation(layoutPosition.x, layoutPosition.z, rooms, building, currentElevation);
    const grounded = camera.position.y <= floorElevation + WALKTHROUGH_EYE_HEIGHT + 0.05;
    if (stairElevation !== null) {
      camera.position.y = floorElevation + WALKTHROUGH_EYE_HEIGHT;
      verticalVelocity.current = 0;
      keys.delete(' ');
    } else {
      if (keys.has(' ') && grounded) {
        verticalVelocity.current = 4.5;
        keys.delete(' ');
      }
      verticalVelocity.current -= 9.81 * delta;
      camera.position.y += verticalVelocity.current * delta;
      if (camera.position.y <= floorElevation + WALKTHROUGH_EYE_HEIGHT) {
        camera.position.y = floorElevation + WALKTHROUGH_EYE_HEIGHT;
        verticalVelocity.current = 0;
      }
    }
  });

  return null;
}
export function ArViewport({ walls, rooms, building, wallOpenings = [], onDoorToggle }: ArViewportProps): JSX.Element {
  const [tracking, setTracking] = useState<ControllerTracking>({
    sessionActive: false,
    leftTracked: false,
    rightTracked: false,
  });
  const [collisionEnabled, setCollisionEnabled] = useState(true);
  const collisionWalls = useMemo(() => wallsWithPassableOpenings(walls, wallOpenings), [walls, wallOpenings]);
  const [walkthroughMode, setWalkthroughMode] = useState(false);
  const [importedModel, setImportedModel] = useState<{ url: string; name: string; file: Blob; transform: ModelTransform } | null>(null);
  const [assetTransformMode, setAssetTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [importError, setImportError] = useState('');
  const modelFileInputRef = useRef<HTMLInputElement | null>(null);
  const persistenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    let cancelled = false;
    void loadStoredModelAsset().then((record) => {
      if (cancelled || !record) return;
      setImportedModel({ url: URL.createObjectURL(record.file), name: record.name, file: record.file, transform: record.transform });
    }).catch((error: unknown) => {
      if (!cancelled) setImportError(error instanceof Error ? `Local model restore unavailable: ${error.message}` : 'Local model restore unavailable.');
    });
    return () => {
      cancelled = true;
      if (persistenceTimerRef.current) clearTimeout(persistenceTimerRef.current);
    };
  }, []);
  useEffect(() => {
    const url = importedModel?.url;
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [importedModel?.url]);
  const handleModelTransformChange = useCallback((transform: ModelTransform) => {
    setImportedModel((current) => {
      if (!current) return current;
      const updated = { ...current, transform };
      if (persistenceTimerRef.current) clearTimeout(persistenceTimerRef.current);
      persistenceTimerRef.current = setTimeout(() => {
        void saveStoredModelAsset({ name: updated.name, file: updated.file, mimeType: updated.file.type, transform })
          .catch((error: unknown) => setImportError(error instanceof Error ? `Transform changed but could not be saved locally: ${error.message}` : 'Transform changed but could not be saved locally.'));
      }, 350);
      return updated;
    });
  }, []);
  const [controllerState, setControllerState] = useState<ControllerConnectionState>('connecting');
  const [viewCorrectionCommand, setViewCorrectionCommand] = useState<ViewCorrectionCommand>({
    id: 0,
    action: 'reset',
  });
  const [viewCorrection, setViewCorrection] = useState({ pitch: 0, roll: 0 });
  const [arSupport, setArSupport] = useState<ArSupport>('checking');
  const [arError, setArError] = useState('');
  const originRef = useRef<Group | null>(null);
  const handleTrackingChange = useCallback((status: ControllerTracking) => setTracking(status), []);
  const correctionCommandId = useRef(0);
  useEffect(() => {
    let cancelled = false;
    const checkSupport = async (): Promise<void> => {
      const xr = navigator.xr;
      if (!xr) {
        if (!cancelled) setArSupport('unsupported');
        return;
      }
      try {
        const supported = await xr.isSessionSupported('immersive-ar');
        if (!cancelled) setArSupport(supported ? 'supported' : 'unsupported');
      } catch {
        if (!cancelled) setArSupport('unsupported');
      }
    };
    void checkSupport();
    return () => {
      cancelled = true;
    };
  }, []);
  const requestViewCorrection = useCallback(
    (action: ViewCorrectionCommand['action'], degrees = 1) => {
      correctionCommandId.current += 1;
      setViewCorrectionCommand(
        action === 'pitch' || action === 'roll'
          ? { id: correctionCommandId.current, action, degrees }
          : { id: correctionCommandId.current, action },
      );
    },
    [],
  );
  // Do not auto-level an immersive AR camera: its pose is device-tracked.
  // Manual correction remains available for explicit user calibration only.
  const modelTransform = useMemo<[number, number, number]>(() => {
    if (!walls.length) return [0, 0, -4];

    const xs = walls.flatMap((wall) => [wall.start.x, wall.end.x]);
    const ys = walls.flatMap((wall) => [wall.start.y, wall.end.y]);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;

    // A +90° yaw maps local (x, z) to world (z, -x). Translate by
    // (-centerY, centerX) so the layout bounds center lands at world z = -4.
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
      setArError(
        error instanceof Error ? error.message : 'Unable to start immersive AR on this device.',
      );
    }
  };
  const arButtonLabel =
    arSupport === 'checking'
      ? 'Checking AR support…'
      : arSupport === 'supported'
        ? tracking.sessionActive
          ? 'AR Session Active'
          : 'Start Immersive AR'
        : 'Immersive AR Unavailable';
  const controllerLabel =
    controllerState === 'connected'
      ? 'phone controller connected'
      : controllerState === 'connecting'
        ? 'waking controller server…'
        : controllerState === 'error'
          ? 'controller unavailable'
          : 'phone controller disconnected';
  return (
    <div className="relative h-full w-full bg-black">
      <Canvas
        camera={{ position: fallbackCamera, fov: 50 }}
        shadows
        resize={{ scroll: false, debounce: 50 }}
      >
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 12, 8]} intensity={1.2} castShadow />
        <XR store={xrStore}>
          <XRTrackingReporter onChange={handleTrackingChange} />
          <XRLocomotion
            originRef={originRef}
            walls={collisionWalls}
            modelTransform={modelTransform}
            collisionEnabled={collisionEnabled}
            viewCorrectionCommand={viewCorrectionCommand}
            onViewCorrectionApplied={setViewCorrection}
            building={building}
            rooms={rooms}
          />
          <ExternalControllerLocomotion
            originRef={originRef}
            walls={collisionWalls}
            modelTransform={modelTransform}
            collisionEnabled={collisionEnabled}
            onStateChange={setControllerState}
            building={building}
            rooms={rooms}
          />
          <group position={modelTransform} rotation={[0, MODEL_YAW_RADIANS, 0]}>
            <IfInSessionMode deny={['immersive-ar', 'immersive-vr']}>
              <FloorGrid />
            </IfInSessionMode>
            <BuildingStructureMeshes building={building} />
            {rooms.map((room) => (
              <RoomFloor key={room.id} room={room} elevation={levelElevation(building, room.levelId)} />
            ))}
            {walls.map((wall) => (
              <BuildingWallMesh key={wall.id} wall={wall} elevation={levelElevation(building, wall.levelId)} openings={wallOpenings} onDoorToggle={onDoorToggle} />
            ))}
            {importedModel && (
              <EditableGltfAsset
                key={importedModel.url}
                url={importedModel.url}
                mode={assetTransformMode}
                initialTransform={importedModel.transform}
                onTransformChange={handleModelTransformChange}
                onError={setImportError}
              />
            )}
          </group>
          <IfInSessionMode deny={['immersive-ar', 'immersive-vr']}>
            <DesktopFirstPersonController
              active={walkthroughMode}
              walls={collisionWalls}
              modelTransform={modelTransform}
              collisionEnabled={collisionEnabled}
              spawnPosition={fallbackCamera}
              targetPosition={fallbackTarget}
              building={building}
              rooms={rooms}
            />
            {!walkthroughMode && (
              <OrbitControls
                target={fallbackTarget}
                enablePan
                enableZoom
                enableRotate
                minPolarAngle={0.45}
                maxPolarAngle={1.5}
              />
            )}
          </IfInSessionMode>
        </XR>
      </Canvas>
      <div className="pointer-events-none absolute right-4 top-4 z-20 rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-xs text-slate-200 shadow-xl backdrop-blur">
        <div className="font-semibold uppercase tracking-[0.18em] text-teal-300">XR status</div>
        <div className="mt-1">
          Session:{' '}
          <span className={tracking.sessionActive ? 'text-emerald-300' : 'text-slate-400'}>
            {tracking.sessionActive ? 'active' : 'inactive'}
          </span>
        </div>
        <div>
          Immersive AR:{' '}
          <span className={arSupport === 'supported' ? 'text-emerald-300' : 'text-slate-400'}>
            {arSupport === 'checking'
              ? 'checking'
              : arSupport === 'supported'
                ? 'supported'
                : 'unsupported'}
          </span>
        </div>
        <div>
          Phone:{' '}
          <span className={controllerState === 'connected' ? 'text-emerald-300' : 'text-slate-400'}>
            {controllerLabel}
          </span>
        </div>
        <div>
          Left controller:{' '}
          <span className={tracking.leftTracked ? 'text-emerald-300' : 'text-slate-400'}>
            {tracking.leftTracked ? 'tracked' : 'not detected'}
          </span>
        </div>
        <div>
          Right controller:{' '}
          <span className={tracking.rightTracked ? 'text-emerald-300' : 'text-slate-400'}>
            {tracking.rightTracked ? 'tracked' : 'not detected'}
          </span>
        </div>
      </div>
      <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-xl border border-slate-700 bg-slate-900/85 px-4 py-3 text-xs text-slate-200 shadow-xl backdrop-blur">
        <div className="font-semibold uppercase tracking-[0.18em] text-teal-300">Spatial View</div>
        <div className="mt-1 text-sm font-medium text-white">
          {walls.length} walls · {rooms.length} rooms
        </div>
        <div className="mt-1 text-slate-400">
          AR: controller locomotion · Desktop: First-Person Walk for mouse look, WASD, Shift sprint, Space jump.
        </div>
        {importedModel && <div className="mt-1 text-emerald-300">3D asset: {importedModel.name}</div>}
        {importError && <div role="status" className="mt-1 max-w-72 text-rose-300">Import: {importError}</div>}
        <div className="mt-1 text-slate-400">
          Wall collision:{' '}
          <span className={collisionEnabled ? 'text-emerald-300' : 'text-amber-300'}>
            {collisionEnabled ? 'ON' : 'OFF'}
          </span>
        </div>
        <div className="mt-1 text-slate-400">
          View correction:{' '}
          <span className="text-white">
            P {viewCorrection.pitch.toFixed(1)}° · R {viewCorrection.roll.toFixed(1)}°
          </span>
        </div>
      </div>
      <input
        ref={modelFileInputRef}
        type="file"
        accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
        className="hidden"
        aria-label="Import a GLB or self-contained glTF model"
        onChange={async (event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (!file) return;
          setImportError('');
          if (file.size > 25 * 1024 * 1024) {
            setImportError('Model exceeds the 25 MB limit.');
            return;
          }
          const extension = file.name.split('.').pop()?.toLowerCase();
          if (extension !== 'glb' && extension !== 'gltf') {
            setImportError('Choose a .glb or .gltf model. CAD/BIM files need a conversion adapter first.');
            return;
          }
          if (extension === 'glb') {
            const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer());
            if (signature.length !== 4 || signature[0] !== 0x67 || signature[1] !== 0x6c || signature[2] !== 0x54 || signature[3] !== 0x46) {
              setImportError('The GLB header is invalid.');
              return;
            }
          } else {
            try {
              const document = JSON.parse(await file.text()) as { buffers?: Array<{ uri?: string }>; images?: Array<{ uri?: string }> };
              const resources = [...(document.buffers ?? []), ...(document.images ?? [])];
              if (resources.some((resource) => resource.uri && !resource.uri.startsWith('data:'))) {
                setImportError('This glTF references external files. Package its resources or use a single-file GLB.');
                return;
              }
            } catch {
              setImportError('The glTF file is not valid JSON.');
              return;
            }
          }
          const nextModel = { url: URL.createObjectURL(file), name: file.name, file, transform: IDENTITY_MODEL_TRANSFORM };
          try {
            await saveStoredModelAsset({ name: file.name, file, mimeType: file.type, transform: IDENTITY_MODEL_TRANSFORM });
            setImportError('');
          } catch (error) {
            setImportError(error instanceof Error ? `Model loaded for this session, but local persistence failed: ${error.message}` : 'Model loaded for this session, but local persistence failed.');
          }
          setImportedModel(nextModel);
        }}
      />
      <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 p-2 shadow-xl backdrop-blur">
        <button
          type="button"
          onClick={() => requestViewCorrection('level')}
          className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
        >
          Level view
        </button>
        <button
          type="button"
          onClick={() => requestViewCorrection('roll', -1)}
          className="rounded-lg bg-slate-700 px-2 py-2 text-sm font-semibold text-white hover:bg-slate-600"
          aria-label="Roll view left 1 degree"
        >
          ↶R
        </button>
        <button
          type="button"
          onClick={() => requestViewCorrection('roll', 1)}
          className="rounded-lg bg-slate-700 px-2 py-2 text-sm font-semibold text-white hover:bg-slate-600"
          aria-label="Roll view right 1 degree"
        >
          ↷R
        </button>
        <button
          type="button"
          onClick={() => requestViewCorrection('pitch', -1)}
          className="rounded-lg bg-slate-700 px-2 py-2 text-sm font-semibold text-white hover:bg-slate-600"
          aria-label="Pitch view up 1 degree"
        >
          ↑P
        </button>
        <button
          type="button"
          onClick={() => requestViewCorrection('pitch', 1)}
          className="rounded-lg bg-slate-700 px-2 py-2 text-sm font-semibold text-white hover:bg-slate-600"
          aria-label="Pitch view down 1 degree"
        >
          ↓P
        </button>
        <button
          type="button"
          onClick={() => requestViewCorrection('reset')}
          className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-600"
        >
          Reset view
        </button>
        <button
          type="button"
          onClick={() => modelFileInputRef.current?.click()}
          className="rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-600"
        >
          Import 3D model
        </button>
        {importedModel && (
          <button
            type="button"
            onClick={async () => {
              try {
                await removeStoredModelAsset();
                if (persistenceTimerRef.current) clearTimeout(persistenceTimerRef.current);
                setImportedModel(null);
                setImportError('');
              } catch (error) {
                setImportError(error instanceof Error ? `Could not remove saved model: ${error.message}` : 'Could not remove saved model.');
              }
            }}
            className="rounded-lg bg-rose-700 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-600"
          >
            Remove model
          </button>
        )}
        {importedModel && (['translate', 'rotate', 'scale'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setAssetTransformMode(mode)}
            aria-pressed={assetTransformMode === mode}
            className={`rounded-lg px-2 py-2 text-xs font-semibold capitalize ${assetTransformMode === mode ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}
          >
            {mode}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setWalkthroughMode((enabled) => !enabled)}
          aria-pressed={walkthroughMode}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${walkthroughMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
        >
          {walkthroughMode ? 'Exit Walkthrough' : 'First-Person Walk'}
        </button>
        <button
          type="button"
          onClick={() => setCollisionEnabled((enabled) => !enabled)}
          aria-pressed={collisionEnabled}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${collisionEnabled ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-amber-500 text-slate-950 hover:bg-amber-400'}`}
        >
          Wall collision: {collisionEnabled ? 'ON' : 'OFF'}
        </button>
        <button
          type="button"
          onClick={startAr}
          disabled={arSupport !== 'supported' || tracking.sessionActive}
          aria-disabled={arSupport !== 'supported' || tracking.sessionActive}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white enabled:hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {arButtonLabel}
        </button>
        <span className="px-2 text-xs text-slate-400">
          {arError ||
            (arSupport === 'unsupported'
              ? 'Use a WebXR-capable mobile headset/browser for immersive AR.'
              : 'Physical controller movement requires a WebXR-capable device.')}
        </span>
      </div>
    </div>
  );
}
