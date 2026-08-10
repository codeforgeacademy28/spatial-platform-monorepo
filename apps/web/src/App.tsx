import { useEffect, useState } from 'react';
import { PointSchema } from '@spatial/core';
import type { Point, WallSegment } from '@spatial/core';
import { FloorPlanOverlay } from './components/FloorPlanOverlay';
import { SpatialCanvas } from './components/SpatialCanvas';

export function App(): JSX.Element {
  const [walls, setWalls] = useState<WallSegment[]>([]);
  const [points, setPoints] = useState<Point[]>([]);

  useEffect(() => {
    const validatedPoints = walls.flatMap((wall) => [wall.start, wall.end]).map((point) => PointSchema.parse(point));
    setPoints(validatedPoints);
  }, [walls]);

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100">
      <aside className="w-[440px] shrink-0 border-r border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <FloorPlanOverlay walls={walls} setWalls={setWalls} />
      </aside>

      <main className="flex-1">
        <SpatialCanvas walls={walls} points={points} />
      </main>
    </div>
  );
}
