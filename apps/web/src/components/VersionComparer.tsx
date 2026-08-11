import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useMemo } from 'react';
import { diffProjects, type DiffChangeType, type WallDiffResult } from '@spatial/collaboration';
import { extrudeWallSegments } from '@spatial/geometry-engine';
import type { Project } from '@spatial/core';

interface VersionComparerProps {
  versionA: Project;
  versionB: Project;
  onClose?: () => void;
}

function getChangeColor(changeType: DiffChangeType): string {
  switch (changeType) {
    case 'added':
      return '#22c55e'; // Green
    case 'removed':
      return '#ef4444'; // Red
    case 'shifted':
      return '#eab308'; // Yellow
    case 'unchanged':
    default:
      return '#cbd5e1'; // Slate
  }
}

function DiffWallMesh({ item }: { item: WallDiffResult }): JSX.Element {
  const wall = item.wall;
  const color = getChangeColor(item.changeType);
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
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={item.changeType !== 'unchanged' ? 0.35 : 0}
        metalness={0.12}
        roughness={0.7}
      />
    </mesh>
  );
}

function DiffCanvas({ walls, label }: { walls: WallDiffResult[]; label: string }): JSX.Element {
  return (
    <div className="relative h-full w-full border-r border-slate-800 bg-slate-950">
      <div className="absolute left-3 top-3 z-10 rounded border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-200 backdrop-blur">
        {label}
      </div>
      <Canvas camera={{ position: [10, 8, 12], fov: 50 }} shadows>
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 12, 8]} intensity={1.2} castShadow />
        <gridHelper args={[30, 30, '#38bdf8', '#334155']} />
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>

        {walls.map((item, index) => (
          <DiffWallMesh key={`${item.wall.id}-${index}`} item={item} />
        ))}

        <OrbitControls enablePan enableZoom enableRotate />
      </Canvas>
    </div>
  );
}

export function VersionComparer({ versionA, versionB, onClose }: VersionComparerProps): JSX.Element {
  const diff = useMemo(() => diffProjects(versionA, versionB), [versionA, versionB]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100">
      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900 px-4">
        <div className="flex items-center gap-4">
          <h2 className="text-base font-semibold text-white">Side-by-Side Version Comparison</h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              {diff.stats.addedCount} Added
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              {diff.stats.removedCount} Removed
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              {diff.stats.shiftedCount} Shifted
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              {diff.stats.unchangedCount} Unchanged
            </span>
          </div>
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            Close Comparison
          </button>
        ) : null}
      </header>

      <div className="grid flex-1 grid-cols-2">
        <DiffCanvas walls={diff.wallsA} label={`Version A (${versionA.name})`} />
        <DiffCanvas walls={diff.wallsB} label={`Version B (${versionB.name})`} />
      </div>
    </div>
  );
}
