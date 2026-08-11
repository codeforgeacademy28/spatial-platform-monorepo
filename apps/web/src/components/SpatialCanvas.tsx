import { Canvas } from '@react-three/fiber';
import { OrbitControls, PointerLockControls } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import { extrudeWallSegments, generateRoomFloorMesh } from '@spatial/geometry-engine';
import type { Point, Room, WallSegment } from '@spatial/core';

interface SpatialCanvasProps {
  walls: WallSegment[];
  rooms: Room[];
  points: Point[];
  readOnly?: boolean;
}

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

function RoomFloor({ room }: { room: Room }): JSX.Element {
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
    <mesh geometry={geometry} position={[0, 0.01, 0]} receiveShadow>
      <meshStandardMaterial color="#1d4ed8" transparent opacity={0.35} />
    </mesh>
  );
}

export function SpatialCanvas({ walls, rooms, points, readOnly = false }: SpatialCanvasProps): JSX.Element {
  return (
    <div className="h-screen w-screen bg-slate-950">
      <Canvas camera={{ position: [10, 8, 12], fov: 50 }} shadows>
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 12, 8]} intensity={1.2} castShadow />
        <FloorGrid />

        {rooms.map((room) => (
          <RoomFloor key={room.id} room={room} />
        ))}

        {walls.map((wall) => (
          <WallMesh key={wall.id} wall={wall} />
        ))}

        {points.map((point, index) => (
          <mesh key={`${point.x}-${point.y}-${index}`} position={[point.x, 0.1, point.y]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.4} />
          </mesh>
        ))}

        <OrbitControls enablePan={readOnly ? false : true} enableZoom enableRotate />
        {!readOnly ? <PointerLockControls /> : null}
      </Canvas>
    </div>
  );
}
