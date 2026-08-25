import { useCallback } from 'react';
import type { SpatialComment } from '@spatial/collaboration';
import type { Project } from '@spatial/core';
import { SpatialCanvas } from './SpatialCanvas';

interface ClientViewerProps { project: Project }

export function ClientViewer({ project }: ClientViewerProps): JSX.Element {
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

  return (
    <div className="relative h-screen w-screen bg-slate-950 text-slate-100">
      <div className="absolute left-4 top-4 z-10 max-w-md rounded-lg border border-slate-700 bg-slate-900/75 p-3 shadow-lg backdrop-blur-sm">
        <p className="text-[10px] uppercase tracking-[0.24em] text-sky-300">Client review</p>
        <h1 className="mt-2 text-xl font-semibold text-white">{project.name}</h1>
        <p className="mt-1 text-sm text-slate-300">Read-only design review · {walls.length} walls · {project.rooms.length} rooms</p>
      </div>
      <SpatialCanvas projectId={project.id} walls={walls} rooms={project.rooms} points={points} readOnly onCommentAdd={handleCommentAdd} />
    </div>
  );
}
