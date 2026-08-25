import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useMemo } from 'react';
import { diffProjects, type DiffChangeType, type WallDiffResult } from '@spatial/collaboration';
import { extrudeWallSegments } from '@spatial/geometry-engine';
import type { Project } from '@spatial/core';

interface VersionComparerProps { versionA: Project; versionB: Project; onClose?: () => void }

function getChangeColor(changeType: DiffChangeType): string {
  switch (changeType) {
    case 'added': return '#22c55e';
    case 'removed': return '#ef4444';
    case 'shifted': return '#eab308';
    default: return '#cbd5e1';
  }
}

function DiffWallMesh({ item }: { item: WallDiffResult }): JSX.Element {
  const wall = item.wall;
  const color = getChangeColor(item.changeType);
  const extrusion = useMemo(() => extrudeWallSegments([wall])[0], [wall]);
  const start = extrusion.bottomCorners[0];
  const end = extrusion.bottomCorners[1];
  const length = Math.hypot(end.x - start.x, end.y - start.y) || 0.001;
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const centerX = (start.x + end.x) / 2;
  const centerY = (start.y + end.y) / 2;
  return (
    <mesh position={[centerX, wall.height / 2, centerY]} rotation={[0, -angle, 0]} castShadow receiveShadow>
      <boxGeometry args={[length, wall.height, wall.thickness]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={item.changeType !== 'unchanged' ? 0.35 : 0} metalness={0.12} roughness={0.7} />
    </mesh>
  );
}

function DiffCanvas({ walls, label }: { walls: WallDiffResult[]; label: string }): JSX.Element {
  const camera = useMemo((): [number, number, number] => {
    if (!walls.length) return [8, 7, 10];
    const xs = walls.flatMap(({ wall }) => [wall.start.x, wall.end.x]);
    const ys = walls.flatMap(({ wall }) => [wall.start.y, wall.end.y]);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 4);
    const distance = Math.max(span * 2, 8);
    return [centerX + distance, distance * 0.8, centerY + distance];
  }, [walls]);

  const target: [number, number, number] = [camera[0] * 0.25, 0, camera[2] * 0.25];

  return (
    <div className="relative h-full w-full border-r border-slate-800 bg-slate-950">
      <div className="absolute left-3 top-3 z-10 rounded border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-200 backdrop-blur">{label}</div>
      {!walls.length ? <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"><div className="rounded-xl border border-slate-700 bg-slate-900/90 px-5 py-4 text-center text-xs text-slate-300">No wall geometry saved in this version.</div></div> : null}
      <Canvas camera={{ position: camera, fov: 50 }} shadows>
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 12, 8]} intensity={1.2} castShadow />
        <gridHelper args={[30, 30, '#38bdf8', '#334155']} />
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]} receiveShadow><planeGeometry args={[30, 30]} /><meshStandardMaterial color="#0f172a" /></mesh>
        {walls.map((item, index) => <DiffWallMesh key={`${item.wall.id}-${index}`} item={item} />)}
        <OrbitControls enablePan enableZoom enableRotate target={target} />
      </Canvas>
    </div>
  );
}

export function VersionComparer({ versionA, versionB, onClose }: VersionComparerProps): JSX.Element {
  const diff = useMemo(() => diffProjects(versionA, versionB), [versionA, versionB]);
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100">
      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900 px-4">
        <div className="flex items-center gap-4"><h2 className="text-base font-semibold text-white">Side-by-Side Version Comparison</h2><div className="flex items-center gap-3 text-xs"><span className="text-emerald-400">{diff.stats.addedCount} Added</span><span className="text-rose-400">{diff.stats.removedCount} Removed</span><span className="text-amber-400">{diff.stats.shiftedCount} Shifted</span><span className="text-slate-400">{diff.stats.unchangedCount} Unchanged</span></div></div>
        {onClose ? <button type="button" onClick={onClose} className="rounded bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700">Close Comparison</button> : null}
      </header>
      <div className="grid flex-1 grid-cols-2"><DiffCanvas walls={diff.wallsA} label={`Version A (${versionA.name})`} /><DiffCanvas walls={diff.wallsB} label={`Version B (${versionB.name})`} /></div>
    </div>
  );
}
