import { useEffect, useMemo, useState } from 'react';
import { detectClosedRooms } from '@spatial/geometry-engine';
import { PointSchema, loadProjectFromLocalStorage, saveProjectToLocalStorage } from '@spatial/core';
import type { Point, Project, Room, WallSegment } from '@spatial/core';
import { ClientViewer } from './components/ClientViewer';
import { FloorPlanOverlay } from './components/FloorPlanOverlay';
import { SpatialCanvas } from './components/SpatialCanvas';
import { VersionComparer } from './components/VersionComparer';
import { AiAssistantPanel } from './components/AiAssistantPanel';
import { ArViewport } from './components/ArViewport';
import { CanvasOverlay } from './components/ui/CanvasOverlay';
import { SpatialHeader } from './components/ui/SpatialHeader';
import { useSpatialActionDispatcher } from './hooks/useSpatialActionDispatcher';
import { fetchSharedProject, saveProject as saveProjectToServer } from './services/api-client';

const STORAGE_KEY = 'spatial-platform-project-v1';
type ViewMode = 'editor' | '3d' | 'spatial';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function createStarterWalls(): WallSegment[] {
  const now = new Date().toISOString();
  const makeWall = (id: string, start: Point, end: Point): WallSegment => ({
    id,
    roomId: 'room-1',
    start,
    end,
    thickness: 0.2,
    height: 3,
    length: Math.hypot(end.x - start.x, end.y - start.y),
    createdAt: now,
    updatedAt: now,
  });

  return [
    makeWall('starter-wall-1', { x: 1, y: 1 }, { x: 5, y: 1 }),
    makeWall('starter-wall-2', { x: 5, y: 1 }, { x: 5, y: 4 }),
    makeWall('starter-wall-3', { x: 5, y: 4 }, { x: 1, y: 4 }),
    makeWall('starter-wall-4', { x: 1, y: 4 }, { x: 1, y: 1 }),
  ];
}

function buildProject(projectName: string, walls: WallSegment[], rooms: Room[]): Project {
  return {
    id: 'project-1',
    name: projectName,
    walls,
    rooms,
    createdAt: '2026-08-25T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  };
}

export function App(): JSX.Element {
  const [projectName, setProjectName] = useState('Spatial Project');
  const [walls, setWalls] = useState<WallSegment[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [sharedProject, setSharedProject] = useState<Project | null>(null);
  const [versions, setVersions] = useState<Project[]>([]);
  const [comparisonPair, setComparisonPair] = useState<[Project, Project] | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [blueprintUploaded, setBlueprintUploaded] = useState(false);
  const [roomsValidated, setRoomsValidated] = useState(false);
  const [refLength, setRefLength] = useState(4);

  useEffect(() => {
    setPoints(walls.flatMap((wall) => [wall.start, wall.end]).map((point) => PointSchema.parse(point)));
  }, [walls]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareToken = params.get('share');
    if (!shareToken) {
      setWalls(createStarterWalls());
      return;
    }

    let isMounted = true;
    fetchSharedProject(shareToken)
      .then((project) => {
        if (!isMounted) return;
        setProjectName(project.name);
        setWalls(project.walls);
        setRooms(project.rooms);
        setRoomsValidated(true);
        setViewMode('3d');
        setSharedProject(project);
      })
      .catch((error) => console.error(error));

    return () => {
      isMounted = false;
    };
  }, []);

  const project = useMemo(() => buildProject(projectName, walls, rooms), [projectName, rooms, walls]);
  const { dispatchSpatialAction } = useSpatialActionDispatcher(walls, rooms, setWalls, setRooms);

  const handleSaveProject = async (): Promise<void> => {
    setSaveState('saving');
    setSaveMessage('Saving project…');
    try {
      saveProjectToLocalStorage(project, STORAGE_KEY);
      const savedProject = await saveProjectToServer(project);
      setProjectName(savedProject.name);
      setSaveState('saved');
      setSaveMessage(`Saved to server · ${savedProject.walls.length} walls · ${savedProject.rooms.length} rooms`);
    } catch (error) {
      console.error(error);
      setSaveState('error');
      setSaveMessage(error instanceof Error ? error.message : 'Server save failed. Local copy retained.');
    }
  };

  const handleLoadProject = (): void => {
    const loadedProject = loadProjectFromLocalStorage(STORAGE_KEY);
    if (!loadedProject) {
      setSaveMessage('No local project found.');
      return;
    }
    setProjectName(loadedProject.name);
    setWalls(loadedProject.walls);
    setRooms(loadedProject.rooms);
    setRoomsValidated(loadedProject.rooms.length > 0);
    setViewMode('editor');
    setSaveState('saved');
    setSaveMessage(`Loaded local copy · ${loadedProject.walls.length} walls`);
  };

  const handleDetectRooms = (): void => {
    const nextRooms = detectClosedRooms(walls, 'project-1', 'Room');
    setRooms(nextRooms);
    setRoomsValidated(true);
    if (nextRooms.length === 0) {
      setSaveState('error');
      setSaveMessage('No closed rooms detected. Check wall endpoints and close the loop.');
      return;
    }
    setSaveState('saved');
    setSaveMessage(`${nextRooms.length} room${nextRooms.length === 1 ? '' : 's'} detected.`);
  };

  const handleSaveVersion = async (): Promise<void> => {
    const versionProject = buildProject(`${projectName} (v${versions.length + 1})`, walls, rooms);
    setVersions((previous) => [...previous, versionProject]);
    try {
      await saveProjectToServer({ ...versionProject, id: `project-1-v${versions.length + 1}` });
      setSaveMessage(`Version ${versions.length + 1} saved to server.`);
    } catch (error) {
      console.error(error);
      setSaveMessage('Version kept in this session, but server persistence failed.');
    }
  };

  const handleCompareVersions = (): void => {
    if (versions.length < 2) {
      setSaveMessage('Save at least two versions before comparing them.');
      return;
    }
    setComparisonPair([versions[versions.length - 2], versions[versions.length - 1]]);
  };

  const handleBlueprintUpload = (file: File): void => {
    const supported = ['image/jpeg', 'image/png'];
    if (!supported.includes(file.type)) {
      window.alert('Blueprint upload currently supports JPG and PNG images.');
      return;
    }
    setBlueprintUploaded(true);
    setRoomsValidated(false);
    setSaveState('idle');
    setSaveMessage('Blueprint loaded. Calibrate the scale, then trace walls.');
  };

  const handleReview3D = (): void => {
    if (walls.length === 0) {
      setSaveMessage('Draw at least one wall before opening the 3D review.');
      return;
    }
    setViewMode('3d');
  };

  const handleEnterSpatial = (): void => {
    if (walls.length === 0) {
      setSaveMessage('Create wall geometry before entering Spatial View.');
      return;
    }
    setViewMode('spatial');
  };

  const currentStep = !blueprintUploaded
    ? 1
    : walls.length === 0
      ? 3
      : !roomsValidated
        ? 4
        : viewMode === 'editor'
          ? 5
          : 6;

  const steps = [
    { number: 1, title: 'Upload blueprint', detail: 'JPG/PNG floor plan' },
    { number: 2, title: 'Calibrate scale', detail: 'Set a known length' },
    { number: 3, title: 'Trace walls', detail: `${walls.length} wall segment${walls.length === 1 ? '' : 's'}` },
    { number: 4, title: 'Detect & validate rooms', detail: `${rooms.length} room${rooms.length === 1 ? '' : 's'} detected` },
    { number: 5, title: 'Review 3D model', detail: 'Inspect generated geometry' },
    { number: 6, title: 'Spatial / AR', detail: 'Final presentation stage' },
  ];

  if (sharedProject) {
    return <ClientViewer project={sharedProject} />;
  }

  if (comparisonPair) {
    return <VersionComparer versionA={comparisonPair[0]} versionB={comparisonPair[1]} onClose={() => setComparisonPair(null)} />;
  }

  if (viewMode === 'spatial') {
    return (
      <div className="relative h-screen w-screen bg-slate-950">
        <ArViewport walls={walls} rooms={rooms} points={points} />
        <div className="absolute left-4 top-4 z-50 flex gap-2">
          <button type="button" onClick={() => setViewMode('3d')} className="rounded-lg bg-slate-900/90 px-4 py-2 text-sm font-medium text-white shadow-lg">Back to 3D</button>
          <button type="button" onClick={() => setViewMode('editor')} className="rounded-lg bg-slate-900/90 px-4 py-2 text-sm font-medium text-white shadow-lg">Back to Editor</button>
        </div>
      </div>
    );
  }

  return (
    <div className="spatial-shell flex h-screen w-screen overflow-hidden text-slate-100">
      <aside className="spatial-sidebar relative z-30 h-full w-[440px] shrink-0 overflow-y-auto border-r border-slate-800/80 p-3">
        <div className="spatial-panel mb-3 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Workflow</p>
              <h1 className="mt-1 text-lg font-semibold text-white">Blueprint → Spatial 3D</h1>
            </div>
            <span className="spatial-badge">Step {Math.min(currentStep, 6)}/6</span>
          </div>
          <p className="mb-3 text-xs leading-5 text-slate-400">Complete each stage in order. Your traced wall geometry is the canonical model used by 3D, versions, comparison and spatial view.</p>
          <div className="spatial-stepper">
            {steps.map((step) => {
              const complete = currentStep > step.number;
              const active = currentStep === step.number;
              return (
                <div key={step.number} className={`spatial-step ${active ? 'is-active' : ''} ${complete ? 'is-complete' : ''}`}>
                  <span className="spatial-step-number">{complete ? '✓' : step.number}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-100">{step.title}</div>
                    <div className="text-xs text-slate-500">{step.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {saveMessage ? <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${saveState === 'error' ? 'border-rose-500/40 bg-rose-500/10 text-rose-200' : 'border-slate-700 bg-slate-900/70 text-slate-300'}`}>{saveMessage}</div> : null}
        </div>

        <FloorPlanOverlay
          walls={walls}
          rooms={rooms}
          setWalls={setWalls}
          setRooms={setRooms}
          projectName={projectName}
          onProjectNameChange={setProjectName}
          onSave={handleSaveProject}
          onLoad={handleLoadProject}
          onShare={async () => {
            await handleSaveProject();
          }}
          onEnterAr={handleEnterSpatial}
          shareUrl={shareUrl}
          onSaveVersion={handleSaveVersion}
          onCompareVersions={handleCompareVersions}
          savedVersionsCount={versions.length}
          onBlueprintUploaded={handleBlueprintUpload}
          onDetectRooms={handleDetectRooms}
          roomsValidated={roomsValidated}
          onReview3D={handleReview3D}
          onEnterSpatial={handleEnterSpatial}
          saveState={saveState}
        />
        <div className="border-t border-slate-800 p-3">
          <AiAssistantPanel walls={walls} onDispatchAction={dispatchSpatialAction} />
        </div>
      </aside>

      <main className="relative min-w-0 flex-1 overflow-hidden">
        <SpatialCanvas walls={walls} rooms={rooms} points={points} />
        <div className="spatial-viewport-card">
          <div className="spatial-viewport-label">{viewMode === '3d' ? '3D REVIEW' : 'LIVE 3D PREVIEW'}</div>
          <div className="mt-1 text-sm font-medium text-white">{walls.length} wall segments · {rooms.length} rooms</div>
          <div className="spatial-grid-hint">Drag to orbit · scroll to zoom · right-drag to pan</div>
        </div>
        <SpatialHeader
          projectName={projectName}
          onProjectNameChange={setProjectName}
          onSave={handleSaveProject}
          onLoad={handleLoadProject}
          onShare={async () => { await handleSaveProject(); }}
          onSaveVersion={handleSaveVersion}
          onEnterAr={handleEnterSpatial}
          refLength={refLength}
          onScaleChange={setRefLength}
          onUploadBlueprint={handleBlueprintUpload}
        />
        <CanvasOverlay scaleMetric={refLength} unit="meters" />
      </main>
    </div>
  );
}
