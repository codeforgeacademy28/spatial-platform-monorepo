import { useEffect, useMemo, useState } from 'react';
import { detectClosedRooms } from '@spatial/geometry-engine';
import { PointSchema, loadProjectFromLocalStorage, saveProjectToLocalStorage } from '@spatial/core';
import type { Point, Project, Room, WallSegment } from '@spatial/core';
import { FloorPlanOverlay } from './components/FloorPlanOverlay';
import { SpatialCanvas } from './components/SpatialCanvas';

const STORAGE_KEY = 'spatial-platform-project-v1';

export function App(): JSX.Element {
  const [projectName, setProjectName] = useState('Spatial Project');
  const [walls, setWalls] = useState<WallSegment[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    const validatedPoints = walls.flatMap((wall) => [wall.start, wall.end]).map((point) => PointSchema.parse(point));
    setPoints(validatedPoints);
  }, [walls]);

  useEffect(() => {
    const nextRooms = detectClosedRooms(walls, 'project-1', 'Room');
    setRooms(nextRooms);
  }, [walls]);

  const project = useMemo<Project>(
    () => ({
      id: 'project-1',
      name: projectName,
      rooms,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    [projectName, rooms],
  );

  const handleSaveProject = (): void => {
    saveProjectToLocalStorage(project, STORAGE_KEY);
  };

  const handleLoadProject = (): void => {
    const loadedProject = loadProjectFromLocalStorage(STORAGE_KEY);
    if (!loadedProject) {
      return;
    }

    const loadedWalls: WallSegment[] = loadedProject.rooms.flatMap((room: Room) => room.wallSegments);

    setProjectName(loadedProject.name);
    setRooms(loadedProject.rooms);
    setWalls(loadedWalls);
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100">
      <aside className="w-[440px] shrink-0 border-r border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <FloorPlanOverlay
          walls={walls}
          rooms={rooms}
          setWalls={setWalls}
          setRooms={setRooms}
          projectName={projectName}
          onProjectNameChange={setProjectName}
          onSave={handleSaveProject}
          onLoad={handleLoadProject}
        />
      </aside>

      <main className="flex-1">
        <SpatialCanvas walls={walls} rooms={rooms} points={points} />
      </main>
    </div>
  );
}
