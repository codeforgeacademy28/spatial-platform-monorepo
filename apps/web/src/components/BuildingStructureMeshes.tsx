import { useMemo } from 'react';
import * as THREE from 'three';
import type { BuildingComponent, BuildingModel, FloorSlab, Staircase } from '@spatial/core';

export function levelElevation(building: BuildingModel | undefined, levelId?: string): number {
  const levels = building?.levels ?? [];
  if (levelId) return levels.find((level) => level.id === levelId)?.elevation ?? 0;
  return levels.find((level) => level.order === 0)?.elevation ?? 0;
}

function FloorSlabMesh({ slab, elevation }: { slab: FloorSlab; elevation: number }): JSX.Element | null {
  const geometry = useMemo(() => {
    if (slab.outline.length < 3) return null;
    const points = slab.outline.map((point) => new THREE.Vector2(point.x, point.y));
    const triangles = THREE.ShapeUtils.triangulateShape(points, []);
    const positions: number[] = [];
    const indices: number[] = [];
    triangles.forEach((triangle) => {
      triangle.forEach((index) => {
        const point = points[index];
        positions.push(point.x, elevation, point.y);
      });
      const start = indices.length;
      indices.push(start, start + 1, start + 2);
    });
    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    buffer.setIndex(indices);
    buffer.computeVertexNormals();
    return buffer;
  }, [slab, elevation]);
  if (!geometry) return null;
  return <mesh geometry={geometry} receiveShadow><meshStandardMaterial color={slab.materialHex} side={THREE.DoubleSide} roughness={0.82} /></mesh>;
}

function StaircaseMeshes({ stair, elevation }: { stair: Staircase; elevation: number }): JSX.Element {
  const stepRise = stair.rise / stair.stepCount;
  const stepRun = stair.run / stair.stepCount;
  return (
    <group position={[stair.position[0], stair.position[1] + elevation, stair.position[2]]} rotation-y={stair.rotationY}>
      {Array.from({ length: stair.stepCount }, (_, index) => (
        <mesh key={index} position={[0, stepRise * (index + 0.5), stair.run / 2 - stepRun * (index + 0.5)]} castShadow receiveShadow>
          <boxGeometry args={[stair.width, Math.max(0.04, stepRise), Math.max(0.04, stepRun)]} />
          <meshStandardMaterial color={stair.materialHex} roughness={0.78} />
        </mesh>
      ))}
    </group>
  );
}

function ComponentMesh({ component, elevation }: { component: BuildingComponent; elevation: number }): JSX.Element {
  const dimensions = component.dimensions;
  const width = dimensions?.width ?? (component.type === 'door' ? 0.9 : component.type === 'window' ? 1.2 : 0.8);
  const height = dimensions?.height ?? (component.type === 'door' ? 2.1 : component.type === 'window' ? 1 : 0.8);
  const depth = dimensions?.depth ?? (component.type === 'door' ? 0.08 : component.type === 'window' ? 0.1 : 0.8);
  const defaultColor = component.type === 'window' ? '#7dd3fc' : component.type === 'door' ? '#9a6b42' : '#b8c2cc';
  return (
    <mesh
      position={[component.position[0], component.position[1] + elevation, component.position[2]]}
      rotation={component.rotation}
      scale={component.scale}
      visible={component.isVisible}
      castShadow
      receiveShadow
      userData={{ componentId: component.id, componentType: component.type, doorState: component.doorState ?? 'closed', isLocked: component.isLocked }}
    >
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color={component.materialHex ?? defaultColor} transparent={component.type === 'window'} opacity={component.type === 'window' ? 0.48 : 1} roughness={0.72} />
    </mesh>
  );
}

export function BuildingStructureMeshes({ building }: { building?: BuildingModel }): JSX.Element | null {
  if (!building) return null;
  return (
    <group>
      {building.floorSlabs.map((slab) => <FloorSlabMesh key={slab.id} slab={slab} elevation={levelElevation(building, slab.levelId)} />)}
      {building.stairs.map((stair) => <StaircaseMeshes key={stair.id} stair={stair} elevation={levelElevation(building, stair.fromLevelId)} />)}
      {building.components.filter((component) => component.isVisible).map((component) => <ComponentMesh key={component.id} component={component} elevation={levelElevation(building, component.levelId)} />)}
    </group>
  );
}
