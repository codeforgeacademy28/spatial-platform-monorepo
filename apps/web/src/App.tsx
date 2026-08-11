import { useEffect, useMemo, useState } from 'react';
import { detectClosedRooms } from '@spatial/geometry-engine';
import { PointSchema, loadProjectFromLocalStorage, saveProjectToLocalStorage } from '@spatial/core';
import type { Point, Project, Room, WallSegment } from '@spatial/core';
import { ClientViewer } from './components/ClientViewer';
import { FloorPlanOverlay } from './components/FloorPlanOverlay';
import { SpatialCanvas } from './components/SpatialCanvas';
import { VersionComparer } from './components/VersionComparer';
import { fetchSharedProject } from './services/api-client';

const STORAGE_KEY = 'spatial-platform-project-v1';

export function App(): JSX.Element {
  const [projectName, setProjectName] = useState('Spatial Project');
  const [walls, setWalls] = useState<WallSegment[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [sharedProject, setSharedProject] = useState<Project | null>(null);
  const [versions, setVersions] = useState<Project[]>([]);
  const [comparisonPair, setComparisonPair] = useState<[Project, Project] | null>(null);

  useEffect(() => {
    const validatedPoints = walls.flatMap((wall) => [wall.start, wall.end]).map((point) => PointSchema.parse(point));
    setPoints(validatedPoints);
  }, [walls]);

  useEffect(() => {
    const nextRooms = detectClosedRooms(walls, 'project-1', 'Room');
    setRooms(nextRooms);
  }, [walls]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareToken = params.get('share');
    if (!shareToken) {
      return;
    }

    let isMounted = true;
    fetchSharedProject(shareToken)
      .then((project) => {
        if (isMounted) {
          setSharedProject(project);
        }
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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

  const handleShareDesign = async (): Promise<void> => {
    if (walls.length === 0 && rooms.length === 0) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/api/projects/${encodeURIComponent('project-1')}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'project-1',
          name: projectName,
          rooms,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Unable to publish design.');
      }

      const payload = (await response.json()) as {
        shareUrl?: string;
        shareToken?: string;
      };
      const nextShareUrl = payload.shareUrl ?? `${window.location.origin}/share/${payload.shareToken ?? 'unknown'}`;
      setShareUrl(nextShareUrl);
      window.alert(`Design share link: ${nextShareUrl}`);
    } catch (error) {
      console.error(error);
      window.alert('Unable to create a share link right now.');
    }
  };

  const handleSaveVersion = (): void => {
    const nextVersion: Project = {
      ...project,
      name: `${projectName} (v${versions.length + 1})`,
    };
    setVersions((prev) => [...prev, nextVersion]);
    window.alert(`Saved version: ${nextVersion.name}`);
  };

  const handleCompareVersions = (): void => {
    if (versions.length < 2) {
      window.alert('You need at least 2 saved versions to compare.');
      return;
    }
    // Compare last two versions
    setComparisonPair([versions[versions.length - 2], versions[versions.length - 1]]);
  };

  if (sharedProject) {
    return <ClientViewer project={sharedProject} />;
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100">
      {comparisonPair && (
        <VersionComparer
          versionA={comparisonPair[0]}
          versionB={comparisonPair[1]}
          onClose={() => setComparisonPair(null)}
        />
      )}
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
          onShare={handleShareDesign}
          shareUrl={shareUrl}
          onSaveVersion={handleSaveVersion}
          onCompareVersions={handleCompareVersions}
          savedVersionsCount={versions.length}
        />
      </aside>

      <main className="flex-1">
        <SpatialCanvas walls={walls} rooms={rooms} points={points} />
      </main>
    </div>
  );
}
