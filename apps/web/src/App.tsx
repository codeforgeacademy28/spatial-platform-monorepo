import { useEffect, useMemo, useState } from 'react';
import { detectClosedRooms } from '@spatial/geometry-engine';
import { PointSchema, ProjectSchema, loadProjectFromLocalStorage, saveProjectToLocalStorage } from '@spatial/core';
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
const VERSION_STORAGE_KEY = 'spatial-platform-version-history-v1';
type ViewMode = 'editor' | '3d' | 'spatial';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function buildProject(projectName: string, walls: WallSegment[], rooms: Room[], id = 'project-1'): Project {
  return {
    id,
    name: projectName,
    walls,
    rooms,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function readLocalVersions(): Project[] {
  try {
    const raw = window.localStorage.getItem(VERSION_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      const result = ProjectSchema.safeParse(item);
      return result.success ? [result.data] : [];
    });
  } catch {
    return [];
  }
}

export function App(): JSX.Element {
  const [projectName, setProjectName] = useState('Spatial Project');
  const [walls, setWalls] = useState<WallSegment[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [shareUrl, setShareUrl] = useState('');
  const [sharedProject, setSharedProject] = useState<Project | null>(null);
  const [versions, setVersions] = useState<Project[]>([]);
  const [selectedVersionIds, setSelectedVersionIds] = useState<string[]>([]);
  const [comparisonPair, setComparisonPair] = useState<[Project, Project] | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [blueprintUploaded, setBlueprintUploaded] = useState(false);
  const [roomsValidated, setRoomsValidated] = useState(false);
  const [refLength, setRefLength] = useState(4);
  const [lastSavedProject, setLastSavedProject] = useState<Project | null>(null);

  useEffect(() => {
    setPoints(walls.flatMap((wall) => [wall.start, wall.end]).map((point) => PointSchema.parse(point)));
  }, [walls]);

  useEffect(() => {
    setVersions(readLocalVersions());
  }, []);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('share');
    if (!token) return;

    let mounted = true;
    fetchSharedProject(token)
      .then((loaded) => {
        if (!mounted) return;
        const normalized = ProjectSchema.parse(loaded);
        setProjectName(normalized.name);
        setWalls(normalized.walls);
        setRooms(normalized.rooms.filter((room) => room.wallSegments.length > 0));
        setRoomsValidated(normalized.rooms.length > 0);
        setBlueprintUploaded(true);
        setLastSavedProject(normalized);
        setViewMode('3d');
        setSharedProject(normalized);
        setSaveState('saved');
        setSaveMessage(`Loaded shared project · ${normalized.walls.length} walls`);
      })
      .catch((error) => {
        console.error(error);
        setSaveState('error');
        setSaveMessage(error instanceof Error ? error.message : 'Unable to load shared project.');
      });

    return () => {
      mounted = false;
    };
  }, []);

  const project = useMemo(() => buildProject(projectName, walls, rooms), [projectName, walls, rooms]);
  const { dispatchSpatialAction } = useSpatialActionDispatcher(walls, rooms, setWalls, setRooms);

  const handleSaveProject = async (): Promise<void> => {
    setSaveState('saving');
    setSaveMessage('Saving project…');
    try {
      saveProjectToLocalStorage(project, STORAGE_KEY);
      const saved = ProjectSchema.parse(await saveProjectToServer(project));
      setProjectName(saved.name);
      setLastSavedProject(saved);
      setSaveState('saved');
      setSaveMessage(`Saved to server · ${saved.walls.length} walls · ${saved.rooms.length} rooms`);
    } catch (error) {
      console.error(error);
      setSaveState('error');
      setSaveMessage(error instanceof Error ? error.message : 'Server save failed. Local copy retained.');
    }
  };

  const handleShareDesign = async (): Promise<void> => {
    setSaveState('saving');
    setSaveMessage('Publishing project…');
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';
      const response = await fetch(`${apiBaseUrl}/api/projects/${encodeURIComponent(project.id)}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      if (!response.ok) throw new Error(`Publish failed (${response.status}).`);
      const payload = (await response.json()) as { shareUrl?: string; shareToken?: string };
      const nextShareUrl = payload.shareToken
        ? `${window.location.origin}/?share=${payload.shareToken}`
        : payload.shareUrl ?? `${window.location.origin}/?share=`;
      setShareUrl(nextShareUrl);
      setSaveState('saved');
      setSaveMessage('Project published successfully.');
    } catch (error) {
      console.error(error);
      setSaveState('error');
      setSaveMessage(error instanceof Error ? error.message : 'Project publish failed.');
    }
  };

  const handleLoadProject = (): void => {
    try {
      const loaded = loadProjectFromLocalStorage(STORAGE_KEY);
      if (!loaded) {
        setSaveState('error');
        setSaveMessage('No local project found.');
        return;
      }
      const normalized = ProjectSchema.parse(loaded);
      const validatedRooms = normalized.rooms.filter((room) => room.wallSegments.length > 0);
      setProjectName(normalized.name);
      setWalls(normalized.walls);
      setRooms(validatedRooms);
      setRoomsValidated(validatedRooms.length > 0);
      setBlueprintUploaded(normalized.walls.length > 0 || validatedRooms.length > 0);
      setLastSavedProject(normalized);
      setViewMode('editor');
      setSaveState('saved');
      setSaveMessage(`Loaded local copy · ${normalized.walls.length} walls`);
    } catch (error) {
      console.error(error);
      setSaveState('error');
      setSaveMessage(error instanceof Error ? error.message : 'Unable to load the saved project.');
    }
  };

  const handleRevertProject = (): void => {
    if (!lastSavedProject) {
      setSaveMessage('No saved baseline is available to revert to.');
      return;
    }
    if (!window.confirm('Revert all unsaved wall and room changes to the last saved project?')) return;
    setProjectName(lastSavedProject.name);
    setWalls(lastSavedProject.walls);
    setRooms(lastSavedProject.rooms.filter((room) => room.wallSegments.length > 0));
    setRoomsValidated(lastSavedProject.rooms.length > 0);
    setViewMode('editor');
    setSaveState('saved');
    setSaveMessage('Reverted to the last saved project.');
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
    const versionNumber = versions.length + 1;
    const version = buildProject(`${projectName} (v${versionNumber})`, walls, rooms, `project-1-v${Date.now()}-${versionNumber}`);
    const nextVersions = [...versions, version];
    setVersions(nextVersions);
    window.localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(nextVersions));
    setSelectedVersionIds(nextVersions.length <= 2 ? nextVersions.map((item) => item.id) : [nextVersions[nextVersions.length - 2].id, nextVersions[nextVersions.length - 1].id]);

    try {
      await saveProjectToServer(version);
      setSaveMessage(`Version ${versionNumber} saved · ${nextVersions.length} versions available for comparison.`);
    } catch (error) {
      console.error(error);
      setSaveState('error');
      setSaveMessage(`Version ${versionNumber} kept locally · server persistence failed.`);
    }
  };

  const toggleVersionSelection = (versionId: string): void => {
    setSelectedVersionIds((current) => {
      if (current.includes(versionId)) return current.filter((id) => id !== versionId);
      if (current.length >= 2) return [current[1], versionId];
      return [...current, versionId];
    });
  };

  const handleCompareVersions = (): void => {
    if (selectedVersionIds.length !== 2) {
      setSaveState('error');
      setSaveMessage('Select exactly two saved versions to compare.');
      return;
    }
    const selected = selectedVersionIds
      .map((id) => versions.find((version) => version.id === id))
      .filter((version): version is Project => Boolean(version));
    if (selected.length !== 2) {
      setSaveState('error');
      setSaveMessage('The selected versions are no longer available in this browser session.');
      return;
    }
    setComparisonPair([selected[0], selected[1]]);
  };

  const handleBlueprintUpload = (file: File): void => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      window.alert('Blueprint upload currently supports JPG and PNG images.');
      return;
    }
    setBlueprintUploaded(true);
    setRoomsValidated(false);
    setSaveState('idle');
    setSaveMessage('Blueprint loaded. Calibrate the scale, then trace walls.');
  };

  const handleReview3D = (): void => {
    if (!walls.length) {
      setSaveState('error');
      setSaveMessage('Draw at least one wall before opening the 3D review.');
      return;
    }
    setViewMode('3d');
  };

  const handleEnterSpatial = (): void => {
    if (!walls.length) {
      setSaveState('error');
      setSaveMessage('Create wall geometry before entering Spatial View.');
      return;
    }
    setViewMode('spatial');
  };

  const currentStep = !blueprintUploaded ? 1 : !walls.length ? 3 : !roomsValidated ? 4 : viewMode === 'editor' ? 5 : 6;
  const steps = [
    { number: 1, title: 'Upload blueprint', detail: 'JPG/PNG floor plan' },
    { number: 2, title: 'Calibrate scale', detail: 'Set a known length' },
    { number: 3, title: 'Trace walls', detail: `${walls.length} wall segments` },
    { number: 4, title: 'Detect & validate rooms', detail: `${rooms.length} rooms detected` },
    { number: 5, title: 'Review 3D model', detail: 'Inspect generated geometry' },
    { number: 6, title: 'Spatial / AR', detail: 'Final presentation stage' },
  ];

  if (sharedProject) return <ClientViewer project={sharedProject} />;
  if (comparisonPair) return <VersionComparer versionA={comparisonPair[0]} versionB={comparisonPair[1]} onClose={() => setComparisonPair(null)} />;

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
            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Workflow</p><h1 className="mt-1 text-lg font-semibold text-white">Blueprint → Spatial 3D</h1></div>
            <span className="spatial-badge">Step {Math.min(currentStep, 6)}/6</span>
          </div>
          <p className="mb-3 text-xs leading-5 text-slate-400">Complete each stage in order. Drawn walls are the canonical geometry used by 3D, versions, comparison and spatial view.</p>
          <div className="spatial-stepper">{steps.map((step) => { const complete = currentStep > step.number; const active = currentStep === step.number; return <div key={step.number} className={`spatial-step ${active ? 'is-active' : ''} ${complete ? 'is-complete' : ''}`}><span className="spatial-step-number">{complete ? '✓' : step.number}</span><div className="min-w-0"><div className="text-sm font-medium text-slate-100">{step.title}</div><div className="text-xs text-slate-500">{step.detail}</div></div></div>; })}</div>
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
          onShare={handleShareDesign}
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
          onRevert={handleRevertProject}
          hasSavedBaseline={Boolean(lastSavedProject)}
          saveState={saveState}
        />

        {versions.length > 0 ? (
          <section className="mx-4 mb-4 rounded-xl border border-purple-500/30 bg-purple-500/5 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-300">Version history</p>
                <h3 className="mt-1 text-sm font-semibold text-white">Select two versions to compare</h3>
              </div>
              <span className="rounded-full border border-purple-500/30 px-2 py-1 text-[10px] text-purple-200">{selectedVersionIds.length}/2 selected</span>
            </div>
            <div className="mt-3 space-y-2">
              {versions.map((version, index) => {
                const selected = selectedVersionIds.includes(version.id);
                return (
                  <button key={version.id} type="button" onClick={() => toggleVersionSelection(version.id)} className={`w-full rounded-lg border px-3 py-2 text-left ${selected ? 'border-purple-400 bg-purple-500/15' : 'border-slate-700 bg-slate-900/70 hover:border-slate-600'}`}>
                    <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-white">Version {index + 1}</span><span className="text-xs text-slate-400">{selected ? 'Selected' : 'Select'}</span></div>
                    <div className="mt-1 text-xs text-slate-400">{version.name} · {version.walls.length} walls · {version.rooms.length} rooms</div>
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={handleCompareVersions} disabled={selectedVersionIds.length !== 2} className="mt-3 w-full rounded bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40">Compare Selected Versions</button>
          </section>
        ) : null}

        <div className="border-t border-slate-800 p-3"><AiAssistantPanel walls={walls} onDispatchAction={dispatchSpatialAction} /></div>
      </aside>

      <main className="relative min-w-0 flex-1 overflow-hidden">
        <SpatialCanvas walls={walls} rooms={rooms} points={points} />
        <div className="spatial-viewport-card"><div className="spatial-viewport-label">{viewMode === '3d' ? '3D REVIEW' : 'LIVE 3D PREVIEW'}</div><div className="mt-1 text-sm font-medium text-white">{walls.length} wall segments · {rooms.length} rooms</div><div className="spatial-grid-hint">Drag to orbit · scroll to zoom · right-drag to pan</div></div>
        <SpatialHeader projectName={projectName} onProjectNameChange={setProjectName} onSave={handleSaveProject} onLoad={handleLoadProject} onShare={handleShareDesign} onSaveVersion={handleSaveVersion} onEnterAr={handleEnterSpatial} refLength={refLength} onScaleChange={setRefLength} onUploadBlueprint={handleBlueprintUpload} />
        <CanvasOverlay scaleMetric={refLength} unit="meters" />
      </main>
    </div>
  );
}
