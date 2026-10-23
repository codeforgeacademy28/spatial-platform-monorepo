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
      const topStart = positions.length / 3;
      triangle.forEach((index) => {
        const point = points[index];
        positions.push(point.x, elevation, point.y);
      });
      indices.push(topStart, topStart + 1, topStart + 2);

      const bottomStart = positions.length / 3;
      [...triangle].reverse().forEach((index) => {
        const point = points[index];
        positions.push(point.x, elevation - slab.thickness, point.y);
      });
      indices.push(bottomStart, bottomStart + 1, bottomStart + 2);
    });
    points.forEach((point, index) => {
      const next = points[(index + 1) % points.length];
      const sideStart = positions.length / 3;
      positions.push(
        point.x, elevation, point.y,
        next.x, elevation, next.y,
        next.x, elevation - slab.thickness, next.y,
        point.x, elevation - slab.thickness, point.y,
      );
      indices.push(sideStart, sideStart + 1, sideStart + 2, sideStart, sideStart + 2, sideStart + 3);
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
  const color = component.materialHex ?? (component.type === 'window' ? '#7dd3fc' : component.type === 'door' ? '#9a6b42' : '#b8c2cc');
  const leg = Math.max(0.04, Math.min(width, depth) * 0.08);
  const box = (key: string, position: [number, number, number], size: [number, number, number], material = color): JSX.Element => (
    <mesh key={key} position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={material} roughness={0.72} />
    </mesh>
  );
  const cylinder = (key: string, position: [number, number, number], radius: number, tall: number, material = color): JSX.Element => (
    <mesh key={key} position={position} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, tall, 16]} />
      <meshStandardMaterial color={material} roughness={0.76} />
    </mesh>
  );
  const sphere = (key: string, position: [number, number, number], radius: number, material = color): JSX.Element => (
    <mesh key={key} position={position} castShadow receiveShadow>
      <sphereGeometry args={[radius, 12, 10]} />
      <meshStandardMaterial color={material} roughness={0.68} />
    </mesh>
  );

  let parts: JSX.Element;
  switch (component.type) {
    case 'column':
      parts = <>{cylinder('column', [0, height / 2, 0], Math.min(width, depth) / 2, height)}{box('capital', [0, height * 0.96, 0], [width * 1.2, height * 0.08, depth * 1.2])}</>;
      break;
    case 'table':
      parts = <>{box('table-top', [0, height * 0.88, 0], [width, height * 0.12, depth])}{[-1, 1].flatMap((x) => [-1, 1].map((z) => box(`leg-${x}-${z}`, [x * (width / 2 - leg), height * 0.42, z * (depth / 2 - leg)], [leg, height * 0.84, leg])))}</>;
      break;
    case 'chair':
      parts = <>{box('seat', [0, height * 0.48, depth * 0.06], [width, height * 0.12, depth * 0.82])}{box('back', [0, height * 0.77, -depth * 0.36], [width * 0.92, height * 0.42, depth * 0.12])}{[-1, 1].flatMap((x) => [-1, 1].map((z) => box(`leg-${x}-${z}`, [x * width * 0.42, height * 0.23, z * depth * 0.34], [leg, height * 0.46, leg])))}</>;
      break;
    case 'sofa':
      parts = <>{box('sofa-base', [0, height * 0.24, 0], [width, height * 0.38, depth])}{box('sofa-back', [0, height * 0.67, -depth * 0.39], [width, height * 0.54, depth * 0.22])}{[-1, 1].map((side) => box(`arm-${side}`, [side * (width / 2 - leg), height * 0.48, 0], [leg * 2.2, height * 0.62, depth]))}</>;
      break;
    case 'bed':
      parts = <>{box('bed-frame', [0, height * 0.24, 0], [width * 1.04, height * 0.4, depth * 1.04], '#77563f')}{box('mattress', [0, height * 0.49, 0], [width, height * 0.22, depth], '#f1f5f9')}{box('headboard', [0, height * 0.7, -depth * 0.47], [width * 1.04, height * 0.6, depth * 0.08], '#8b6b4f')}{box('pillow', [0, height * 0.64, -depth * 0.3], [width * 0.48, height * 0.08, depth * 0.18], '#e2e8f0')}</>;
      break;
    case 'door':
      parts = <>{box('door-leaf', [0, height / 2, 0], [width, height, depth], color)}{sphere('handle', [width * 0.36, height * 0.48, depth * 0.58], Math.max(0.025, width * 0.025), '#e5c07b')}</>;
      break;
    case 'window':
      parts = <>{box('glass', [0, height / 2, 0], [width * 0.9, height * 0.9, depth * 0.3], '#7dd3fc')}{box('frame-left', [-width * 0.47, height / 2, 0], [width * 0.06, height, depth], '#f8fafc')}{box('frame-right', [width * 0.47, height / 2, 0], [width * 0.06, height, depth], '#f8fafc')}{box('frame-top', [0, height * 0.47, 0], [width, height * 0.06, depth], '#f8fafc')}{box('frame-bottom', [0, -height * 0.47 + height / 2, 0], [width, height * 0.06, depth], '#f8fafc')}{box('mullion', [0, height / 2, depth * 0.15], [width * 0.035, height * 0.9, depth * 0.25], '#f8fafc')}</>;
      break;
    case 'light':
      parts = <>{cylinder('stem', [0, height * 0.82, 0], Math.max(0.015, width * 0.035), height * 0.36, '#64748b')}{sphere('bulb', [0, height * 0.42, 0], Math.min(width, depth) * 0.42, '#fde68a')}</>;
      break;
    case 'plant':
      parts = <>{cylinder('pot', [0, height * 0.16, 0], Math.min(width, depth) * 0.38, height * 0.32, '#b45309')}{cylinder('stem', [0, height * 0.56, 0], Math.max(0.015, width * 0.025), height * 0.58, '#166534')}{sphere('leaf-a', [-width * 0.2, height * 0.7, 0], width * 0.22, '#22c55e')}{sphere('leaf-b', [width * 0.2, height * 0.78, depth * 0.08], width * 0.2, '#16a34a')}{sphere('leaf-c', [0, height * 0.9, -depth * 0.08], width * 0.2, '#4ade80')}</>;
      break;
    case 'rug':
      parts = box('rug', [0, Math.max(0.015, height / 2), 0], [width, Math.max(0.02, height), depth], color);
      break;
    case 'pool':
      parts = <>{box('pool-shell', [0, height * 0.38, 0], [width, height * 0.76, depth], '#94a3b8')}{box('water', [0, height * 0.78, 0], [width * 0.9, 0.025, depth * 0.9], '#38bdf8')}</>;
      break;
    case 'fence':
    case 'gate':
      parts = <>{[-1, 0, 1].map((x) => box(`post-${x}`, [x * width * 0.44, height / 2, 0], [leg * 1.4, height, depth]))}{box('upper-rail', [0, height * 0.78, 0], [width, leg * 1.5, depth])}{box('lower-rail', [0, height * 0.25, 0], [width, leg * 1.5, depth])}{Array.from({ length: 5 }, (_, index) => box(`picket-${index}`, [-width * 0.36 + index * width * 0.18, height * 0.5, 0], [leg, height * 0.65, depth * 0.8]))}</>;
      break;
    case 'artwork':
      parts = <>{box('frame', [0, height / 2, 0], [width, height, depth], '#8b6b4f')}{box('art', [0, height / 2, depth * 0.52], [width * 0.84, height * 0.82, Math.max(0.01, depth * 0.06)], color)}</>;
      break;
    case 'sink':
      parts = <>{box('vanity', [0, height * 0.38, 0], [width, height * 0.72, depth])}{box('basin', [0, height * 0.78, 0], [width * 0.86, height * 0.12, depth * 0.84], '#e2e8f0')}{cylinder('tap', [0, height * 0.92, -depth * 0.3], Math.max(0.02, width * 0.025), height * 0.16, '#94a3b8')}</>;
      break;
    case 'toilet':
      parts = <>{cylinder('bowl', [0, height * 0.25, depth * 0.04], Math.min(width, depth) * 0.42, height * 0.48, '#f8fafc')}{box('tank', [0, height * 0.66, -depth * 0.34], [width * 0.78, height * 0.48, depth * 0.28], '#f8fafc')}</>;
      break;
    case 'bathtub':
      parts = <>{box('tub-shell', [0, height * 0.34, 0], [width, height * 0.68, depth], '#e2e8f0')}{box('water', [0, height * 0.69, 0], [width * 0.78, 0.025, depth * 0.78], '#bae6fd')}</>;
      break;
    case 'shower':
      parts = <>{box('shower-tray', [0, height * 0.04, 0], [width, height * 0.08, depth], '#e2e8f0')}{box('glass-screen', [width * 0.42, height * 0.5, 0], [depth * 0.08, height, depth], '#bae6fd')}{cylinder('shower-post', [-width * 0.4, height * 0.6, -depth * 0.4], Math.max(0.015, width * 0.025), height * 0.8, '#94a3b8')}</>;
      break;
    case 'curtain':
    case 'blind':
      parts = <>{box('curtain-rod', [0, height * 0.95, 0], [width * 1.08, Math.max(0.02, height * 0.04), Math.max(0.02, depth * 0.08)], '#94a3b8')}{box('left-panel', [-width * 0.25, height * 0.48, 0], [width * 0.42, height * 0.86, Math.max(0.025, depth * 0.1)], color)}{box('right-panel', [width * 0.25, height * 0.48, 0], [width * 0.42, height * 0.86, Math.max(0.025, depth * 0.1)], color)}</>;
      break;
    case 'switch':
    case 'socket':
      parts = box('wall-plate', [0, height / 2, 0], [width, height, Math.max(0.025, depth * 0.12)], '#f8fafc');
      break;
    case 'driveway':
      parts = box('driveway', [0, Math.max(0.025, height / 2), 0], [width, Math.max(0.05, height), depth], '#64748b');
      break;
    default:
      parts = <>{box('body', [0, height / 2, 0], [width, height, depth])}{['wardrobe', 'cabinet', 'kitchen-unit', 'appliance'].includes(component.type) ? <>{box('left-door', [-width * 0.24, height * 0.52, depth * 0.52], [width * 0.44, height * 0.84, Math.max(0.02, depth * 0.035)], '#d6c4ad')}{box('right-door', [width * 0.24, height * 0.52, depth * 0.52], [width * 0.44, height * 0.84, Math.max(0.02, depth * 0.035)], '#d6c4ad')}</> : null}</>;
  }

  return (
    <group
      position={[component.position[0], component.position[1] + elevation, component.position[2]]}
      rotation={component.rotation}
      scale={component.scale}
      visible={component.isVisible}
      userData={{ componentId: component.id, componentType: component.type, doorState: component.doorState ?? 'closed', isLocked: component.isLocked }}
    >
      {parts}
    </group>
  );
}

export function BuildingStructureMeshes({ building, activeLevelId }: { building?: BuildingModel; activeLevelId?: string }): JSX.Element | null {
  if (!building) return null;
  const shouldShowLevel = (levelId: string): boolean => !building.isolateActiveLevel || !activeLevelId || levelId === activeLevelId;
  const visibleSlabs = building.floorSlabs.filter((slab) => shouldShowLevel(slab.levelId));
  const visibleStairs = building.stairs.filter((stair) => !building.isolateActiveLevel || !activeLevelId || stair.fromLevelId === activeLevelId || stair.toLevelId === activeLevelId);
  const visibleComponents = building.components.filter((component) => shouldShowLevel(component.levelId) && component.isVisible);
  return (
    <group>
      {visibleSlabs.map((slab) => <FloorSlabMesh key={slab.id} slab={slab} elevation={levelElevation(building, slab.levelId)} />)}
      {building.ceilingEnabled ? visibleSlabs.map((slab) => {
        const level = building.levels.find((item) => item.id === slab.levelId);
        return <FloorSlabMesh key={`ceiling-${slab.id}`} slab={{ ...slab, id: `ceiling-${slab.id}`, materialHex: building.ceilingMaterialHex }} elevation={levelElevation(building, slab.levelId) + (level?.wallHeight ?? 2.7)} />;
      }) : null}
      {visibleStairs.map((stair) => <StaircaseMeshes key={stair.id} stair={stair} elevation={levelElevation(building, stair.fromLevelId)} />)}
      {visibleComponents.map((component) => <ComponentMesh key={component.id} component={component} elevation={levelElevation(building, component.levelId)} />)}
    </group>
  );
}

export function BuildingWallMesh({ wall, elevation, openings = [], onDoorToggle, highlighted = false }: {
  wall: import('@spatial/core').WallSegment;
  elevation: number;
  openings?: import('@spatial/core').WallOpening[];
  onDoorToggle?: (openingId: string) => void;
  highlighted?: boolean;
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
        <meshStandardMaterial color={highlighted ? '#f59e0b' : (wall.materialHex ?? '#cbd5e1')} emissive={highlighted ? '#f59e0b' : '#000000'} emissiveIntensity={highlighted ? 0.55 : 0} metalness={0.12} roughness={0.7} />
      </mesh>)}
      {wallOpenings.map((opening) => opening.type === 'window'
        ? <mesh key={opening.id} position={[opening.offset - length / 2, opening.bottom + opening.height / 2, 0]} receiveShadow>
            <boxGeometry args={[opening.width, opening.height, Math.max(0.025, wall.thickness * 0.25)]} />
            <meshStandardMaterial color="#7dd3fc" transparent opacity={0.48} roughness={0.2} />
          </mesh>
        : <group key={opening.id} position={[opening.offset - opening.width / 2 - length / 2, opening.bottom, 0]}>
            <group rotation-y={opening.doorState === 'open' ? -Math.PI / 2 : 0}>
              <mesh position={[opening.width / 2, opening.height / 2, wall.thickness * 0.1]} onClick={(event) => { event.stopPropagation(); onDoorToggle?.(opening.id); }} castShadow>
                <boxGeometry args={[opening.width, opening.height, Math.max(0.04, wall.thickness * 0.18)]} />
                <meshStandardMaterial color="#9a6b42" roughness={0.76} />
              </mesh>
            </group>
          </group>)}
    </group>
  );
}
