import { Canvas } from '@react-three/fiber';
import { OrbitControls, PointerLockControls } from '@react-three/drei';
import { useMemo } from 'react';
import { extrudeWallSegments } from '@spatial/geometry-engine';
import type { WallSegment } from '@spatial/core';

const sampleWalls: WallSegment[] = [
  {
    id: 'wall-1',
    roomId: 'room-1',
    start: { x: 0, y: 0 },
    end: { x: 8, y: 0 },
    thickness: 0.2,
    height: 3,
    length: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wall-2',
    roomId: 'room-1',
    start: { x: 8, y: 0 },
    end: { x: 8, y: 6 },
    thickness: 0.2,
    height: 3,
    length: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wall-3',
    roomId: 'room-1',
    start: { x: 8, y: 6 },
    end: { x: 0, y: 6 },
    thickness: 0.2,
    height: 3,
    length: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wall-4',
    roomId: 'room-1',
    start: { x: 0, y: 6 },
    end: { x: 0, y: 0 },
    thickness: 0.2,
    height: 3,
    length: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function FloorGrid(): JSX.Element {
  return (
    <>
      <gridHelper args={[30, 30, '#38bdf8', '#334155']} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
    </>
  );
}

function WallMesh({ wall }: { wall: WallSegment }): JSX.Element {
  const extrusion = useMemo(() => extrudeWallSegments([wall])[0], [wall]);

  const start = extrusion.bottomCorners[0];
  const end = extrusion.bottomCorners[1];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 0.001;
  const angle = Math.atan2(dy, dx);
  const centerX = (start.x + end.x) / 2;
  const centerY = (start.y + end.y) / 2;

  return (
    <mesh
      position={[centerX, wall.height / 2, centerY]}
      rotation={[0, -angle, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[length, wall.height, wall.thickness]} />
      <meshStandardMaterial color="#cbd5e1" metalness={0.12} roughness={0.7} />
    </mesh>
  );
}

export function SpatialCanvas(): JSX.Element {
  return (
    <div className="h-screen w-screen bg-slate-950">
      <Canvas camera={{ position: [10, 8, 12], fov: 50 }} shadows>
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 12, 8]} intensity={1.2} castShadow />
        <FloorGrid />

        {sampleWalls.map((wall) => (
          <WallMesh key={wall.id} wall={wall} />
        ))}

        <OrbitControls enablePan enableZoom enableRotate />
        <PointerLockControls />
      </Canvas>
    </div>
  );
}
