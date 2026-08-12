import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, createXRStore, DefaultXRController } from '@react-three/xr';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { extrudeWallSegments, generateRoomFloorMesh } from '@spatial/geometry-engine';
import type { Point, Room, WallSegment } from '@spatial/core';

interface ArViewportProps {
  walls: WallSegment[];
  rooms: Room[];
  points: Point[];
}

function FloorGrid(): JSX.Element {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[25, 25]} />
      <meshStandardMaterial color="#0f172a" />
    </mesh>
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
    <mesh position={[centerX, wall.height / 2, centerY]} rotation={[0, -angle, 0]} castShadow receiveShadow>
      <boxGeometry args={[length, wall.height, wall.thickness]} />
      <meshStandardMaterial color="#38bdf8" metalness={0.25} roughness={0.4} />
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
    <mesh geometry={geometry as any} position={[0, 0.01, 0]} receiveShadow>
      <meshStandardMaterial color="#2563eb" transparent opacity={0.35} />
    </mesh>
  );
}

const xrStore = createXRStore();

export function ArViewport({ walls, rooms }: ArViewportProps): JSX.Element {
  return (
    <div className="h-screen w-screen bg-black">
      <Canvas>
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 10, 2]} intensity={1.2} castShadow />
        <XR store={xrStore}>
          <DefaultXRController />
          <FloorGrid />
          {rooms.map((room) => (
            <RoomFloor key={room.id} room={room} />
          ))}
          {walls.map((wall) => (
            <WallMesh key={wall.id} wall={wall} />
          ))}
        </XR>
        <OrbitControls />
      </Canvas>
    </div>
  );
}
