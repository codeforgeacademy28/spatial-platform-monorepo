import type { Project } from '@spatial/core';
import { SpatialCanvas } from './SpatialCanvas';

interface ShareViewerProps {
  project: Project;
}

export function ShareViewer({ project }: ShareViewerProps): JSX.Element {
  const walls = project.rooms.flatMap((room) => room.wallSegments);
  const points = walls.flatMap((wall) => [wall.start, wall.end]);

  return (
    <div className="relative h-screen w-screen bg-slate-950 text-slate-100">
      <div className="absolute left-4 top-4 z-10 rounded-lg border border-slate-700 bg-slate-900/80 p-3 shadow-lg backdrop-blur-sm">
        <p className="text-[10px] uppercase tracking-[0.24em] text-sky-300">Shared design</p>
        <h1 className="mt-2 text-xl font-semibold text-white">{project.name}</h1>
      </div>

      <SpatialCanvas walls={walls} rooms={project.rooms} points={points} readOnly />
    </div>
  );
}
