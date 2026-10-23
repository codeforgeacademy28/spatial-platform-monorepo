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

export function BuildingWallMesh({ wall, elevation, openings = [], onDoorToggle }: {
  wall: import('@spatial/core').WallSegment;
  elevation: number;
  openings?: import('@spatial/core').WallOpening[];
  onDoorToggle?: (openingId: string) => void;
}): JSX.Element {
  const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y) || 0.001;
  const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
  const wallOpenings = openings.filter((opening) => opening.wallId === wall.id && opening.offset < length && opening.offset + opening.width / 2 > 0);
  const boundaries = [...new Set([0, length, ...wallOpenings.flatMap((opening) => [
    Math.max(0, opening.offset - opening.width / 2),
    Math.min(length, opening.offset + opening.width / 2),
  ])])].sort((a, b) => a - b);
  const segments: Array<{ x: number; width: number; bottom: number; top: number }> = [];
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const start = boundaries[index];
    const end = boundaries[index + 1];
    const width = end - start;
    if (width <= 0.001) continue;
    const middle = (start + end) / 2;
    const opening = wallOpenings.find((item) => middle >= item.offset - item.width / 2 && middle <= item.offset + item.width / 2);
    const vertical = opening
      ? [[0, Math.min(opening.bottom, wall.height)], [Math.min(wall.height, opening.bottom + opening.height), wall.height]]
      : [[0, wall.height]];
    for (const [bottom, top] of vertical) {
      if (top - bottom > 0.001) segments.push({ x: (start + end) / 2 - length / 2, width, bottom, top });
    }
  }
  return (
    <group position={[(wall.start.x + wall.end.x) / 2, elevation, (wall.start.y + wall.end.y) / 2]} rotation={[0, -angle, 0]}>
      {segments.map((segment, index) => <mesh key={index} position={[segment.x, (segment.bottom + segment.top) / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[segment.width, segment.top - segment.bottom, wall.thickness]} />
        <meshStandardMaterial color={wall.materialHex ?? '#cbd5e1'} metalness={0.12} roughness={0.7} />
      </mesh>)}
      {wallOpenings.map((opening) => opening.type === 'window'
        ? <mesh key={opening.id} position={[opening.offset - length / 2, opening.bottom + opening.height / 2, 0]} receiveShadow>
            <boxGeometry args={[opening.width, opening.height, Math.max(0.025, wall.thickness * 0.25)]} />
            <meshStandardMaterial color="#7dd3fc" transparent opacity={0.48} roughness={0.2} />
          </mesh>
        : <group key={opening.id} position={[opening.offset - opening.width / 2 - length / 2, opening.bottom, 0]}>
            <mesh position={[opening.width / 2, opening.height / 2, wall.thickness * 0.1]} rotation-y={opening.doorState === 'open' ? -Math.PI / 2 : 0} onClick={(event) => { event.stopPropagation(); onDoorToggle?.(opening.id); }} castShadow>
              <boxGeometry args={[opening.width, opening.height, Math.max(0.04, wall.thickness * 0.18)]} />
              <meshStandardMaterial color="#9a6b42" roughness={0.76} />
            </mesh>
          </group>)}
    </group>
  );
}
