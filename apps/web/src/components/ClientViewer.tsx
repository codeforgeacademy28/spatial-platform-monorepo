import { useCallback, useState } from 'react';
import type { SpatialComment } from '@spatial/collaboration';
import type { Project } from '@spatial/core';
import { SpatialCanvas } from './SpatialCanvas';
import { PresentationExperience } from './PresentationExperience';

interface ClientViewerProps { project: Project }

export function ClientViewer({ project }: ClientViewerProps): JSX.Element {
  const [presentation, setPresentation] = useState(false);
  const walls = project.walls;
  const points = walls.flatMap((wall) => [wall.start, wall.end]);

  const handleCommentAdd = useCallback(async (comment: SpatialComment): Promise<void> => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';
      await fetch(`${apiBaseUrl}/api/projects/${encodeURIComponent(project.id)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comment),
      });
    } catch (error) {
      console.error('Unable to persist comment:', error);
    }
  }, [project.id]);

  if (presentation) return <PresentationExperience walls={project.walls} rooms={project.rooms} sceneAssets={project.sceneAssets ?? []} wallOpenings={project.wallOpenings ?? []} presentation={project.presentation ?? { title: project.name, subtitle: 'A shared spatial experience', finalMessage: 'Made with love. ❤️', theme: 'romantic', ceilingEnabled: true }} onExit={() => setPresentation(false)} />;

  return (
    <div className="relative h-screen w-screen bg-slate-950 text-slate-100">
      <button type="button" onClick={() => setPresentation(true)} className="absolute right-4 top-4 z-20 rounded-full bg-gradient-to-r from-fuchsia-600 to-amber-500 px-4 py-2 text-xs font-bold text-white shadow-xl">✨ Enter Gallery</button><div className="absolute left-4 top-4 z-10 max-w-md rounded-lg border border-slate-700 bg-slate-900/75 p-3 shadow-lg backdrop-blur-sm">
        <p className="text-[10px] uppercase tracking-[0.24em] text-sky-300">Client review</p>
        <h1 className="mt-2 text-xl font-semibold text-white">{project.name}</h1>
        <p className="mt-1 text-sm text-slate-300">Read-only design review · {walls.length} walls · {project.rooms.length} rooms</p>
      </div>
      <SpatialCanvas projectId={project.id} walls={walls} rooms={project.rooms} points={points} readOnly onCommentAdd={handleCommentAdd} />
    </div>
  );
}
