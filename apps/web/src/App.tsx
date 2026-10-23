import { useCallback, useEffect, useMemo, useState } from 'react';
import { detectClosedRooms } from '@spatial/geometry-engine';
import { BuildingModelSchema, PointSchema, ProjectSchema, loadProjectFromLocalStorage, saveProjectToLocalStorage } from '@spatial/core';
import type { BuildingModel, Point, Project, Room, SceneAsset, PresentationConfig, WallOpening, WallSegment } from '@spatial/core';
import type { Dispatch, SetStateAction } from 'react';
import { ClientViewer } from './components/ClientViewer';
import { FloorPlanOverlay } from './components/FloorPlanOverlay';
import { SpatialCanvas } from './components/SpatialCanvas';
import { SceneStudioPanel } from './components/SceneStudioPanel';
import { PresentationExperience } from './components/PresentationExperience';
import { VersionComparer } from './components/VersionComparer';
import { VersionHistoryPanel } from './components/VersionHistoryPanel';
import { RoomHighlightList } from './components/RoomHighlightList';
import { AiAssistantPanel } from './components/AiAssistantPanel';
import { ArViewport } from './components/ArViewport';
import { CanvasOverlay } from './components/ui/CanvasOverlay';
import { SpatialHeader } from './components/ui/SpatialHeader';
import { useSpatialActionDispatcher } from './hooks/useSpatialActionDispatcher';
import { fetchSharedProject, listSavedProjects, loadSavedProject, saveProject as saveProjectToServer } from './services/api-client';
import { SavedProjectsDialog, type SavedProjectEntry } from './components/SavedProjectsDialog';

const STORAGE_KEY = 'spatial-platform-project-v1';
const VERSION_STORAGE_KEY = 'spatial-platform-project-versions-v2';
const PROJECT_LIBRARY_KEY = 'spatial-platform-project-library-v1';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEFAULT_SCALE_METERS_PER_PIXEL = 0.02;
type ViewMode = 'editor' | '3d' | 'spatial';
type SaveState = 'idle' | 'saving' | 'saved' | 'local-only' | 'error';

function cloneWalls(walls: WallSegment[]): WallSegment[] {
  return walls.map((wall) => ({ ...wall, start: { ...wall.start }, end: { ...wall.end } }));
}

function cloneProject(project: Project): Project {
  return {
    ...project,
    walls: cloneWalls(project.walls),
    rooms: project.rooms.map((room) => ({
      ...room,
      polygon: room.polygon.map((point) => ({ ...point })),
      wallSegments: cloneWalls(room.wallSegments),
    })),
    sceneAssets: project.sceneAssets?.map((asset) => ({
      ...asset,
      anchor: asset.anchor.type === 'wall'
        ? { ...asset.anchor }
        : { ...asset.anchor, position: [...asset.anchor.position] as [number, number, number] },
      light: asset.light ? { ...asset.light } : undefined,
    })),
    wallOpenings: project.wallOpenings?.map((opening) => ({ ...opening })),
    presentation: project.presentation ? { ...project.presentation } : undefined,
    building: project.building ? {
      ...project.building,
      levels: project.building.levels.map((level) => ({ ...level })),
      floorSlabs: project.building.floorSlabs.map((slab) => ({ ...slab, outline: slab.outline.map((point) => ({ ...point })) })),
      stairs: project.building.stairs.map((stair) => ({ ...stair, position: [...stair.position] as [number, number, number] })),
      components: project.building.components.map((component) => ({ ...component, position: [...component.position] as [number, number, number], rotation: [...component.rotation] as [number, number, number], scale: [...component.scale] as [number, number, number], dimensions: component.dimensions ? { ...component.dimensions } : undefined })),
    } : undefined,
  };
}

function buildProject(projectName: string, walls: WallSegment[], rooms: Room[], scaleMetersPerPixel: number, id: string, createdAt: string, updatedAt: string): Project {
  return { id, name: projectName, walls: cloneWalls(walls), sceneAssets: [], wallOpenings: [], presentation: { title: 'A Walk Through Us', subtitle: 'A birthday gallery made just for you', finalMessage: 'I would choose you in every room, every version, every lifetime. ❤️', theme: 'romantic', ceilingEnabled: true }, rooms: rooms.map((room) => ({ ...room, polygon: room.polygon.map((point) => ({ ...point })), wallSegments: cloneWalls(room.wallSegments) })), scaleMetersPerPixel, createdAt, updatedAt };
}

function readLocalProjectLibrary(): Project[] {
  try {
    const raw = window.localStorage.getItem(PROJECT_LIBRARY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const items = Array.isArray(parsed) ? parsed : [];
    const projects = items.flatMap((item) => { const result = ProjectSchema.safeParse(item); return result.success ? [result.data] : []; });
    const legacy = loadProjectFromLocalStorage(STORAGE_KEY);
    if (legacy) { const result = ProjectSchema.safeParse(legacy); if (result.success && !projects.some((project) => project.id === result.data.id)) projects.push(result.data); }
    return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch { return []; }
}

function writeLocalProjectLibrary(project: Project): void {
  const existing = readLocalProjectLibrary().filter((item) => item.id !== project.id);
  window.localStorage.setItem(PROJECT_LIBRARY_KEY, JSON.stringify([cloneProject(project), ...existing].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))));
}

function readLocalVersions(): Project[] {
  try {
    const raw = window.localStorage.getItem(VERSION_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => { const result = ProjectSchema.safeParse(item); return result.success ? [result.data] : []; });
  } catch { return []; }
}

export function App(): JSX.Element {
  const [projectId, setProjectId] = useState<string>(() => crypto.randomUUID());
  const [projectCreatedAt, setProjectCreatedAt] = useState(() => new Date().toISOString());
  const [projectUpdatedAt, setProjectUpdatedAt] = useState(() => new Date().toISOString());
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
  const [scaleCalibrated, setScaleCalibrated] = useState(false);
  const [scaleMetersPerPixel, setScaleMetersPerPixel] = useState(DEFAULT_SCALE_METERS_PER_PIXEL);
  const [roomsValidated, setRoomsValidated] = useState(false);
  const [refLength, setRefLength] = useState(4);
  const [lastSavedProject, setLastSavedProject] = useState<Project | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [sceneAssets, setSceneAssets] = useState<SceneAsset[]>([]);
  const [wallOpenings, setWallOpenings] = useState<WallOpening[]>([]);
  const [presentation, setPresentation] = useState<PresentationConfig>({ title: 'A Walk Through Us', subtitle: 'A birthday gallery made just for you', finalMessage: 'I would choose you in every room, every version, every lifetime. ❤️', theme: 'romantic', ceilingEnabled: true });
  const [presentationMode, setPresentationMode] = useState(false);
  const [building, setBuilding] = useState<BuildingModel>(() => BuildingModelSchema.parse({}));
  const [savedProjectsOpen, setSavedProjectsOpen] = useState(false);
  const [savedProjects, setSavedProjects] = useState<SavedProjectEntry[]>([]);
  const [savedProjectsLoading, setSavedProjectsLoading] = useState(false);
  const [savedProjectsError, setSavedProjectsError] = useState('');

  useEffect(() => { setPoints(walls.flatMap((wall) => [wall.start, wall.end]).map((point) => PointSchema.parse(point))); }, [walls]);
  useEffect(() => { const localVersions = readLocalVersions(); setVersions(localVersions); if (localVersions.length === 2) setSelectedVersionIds(localVersions.map((version) => version.id)); }, []);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('share');
    if (!token) return;
    let mounted = true;
    fetchSharedProject(token).then((loaded) => {
      if (!mounted) return;
      const normalized = ProjectSchema.parse(loaded);
      setProjectId(normalized.id); setProjectCreatedAt(normalized.createdAt); setProjectUpdatedAt(normalized.updatedAt); setBuilding(normalized.building ?? BuildingModelSchema.parse({})); setProjectName(normalized.name); setWalls(cloneWalls(normalized.walls)); setSceneAssets(normalized.sceneAssets ?? []); setWallOpenings(normalized.wallOpenings ?? []); setPresentation(normalized.presentation ?? presentation); setRooms(normalized.rooms.filter((room) => room.wallSegments.length > 0)); setRoomsValidated(normalized.rooms.length > 0); setBlueprintUploaded(true); setScaleMetersPerPixel(normalized.scaleMetersPerPixel ?? DEFAULT_SCALE_METERS_PER_PIXEL); setScaleCalibrated(Boolean(normalized.scaleMetersPerPixel)); setLastSavedProject(cloneProject(normalized)); setViewMode('3d'); setSharedProject(normalized); setSaveState('saved'); setSaveMessage(`Loaded shared project · ${normalized.walls.length} walls`);
    }).catch((error) => { console.error(error); setSaveState('error'); setSaveMessage(error instanceof Error ? error.message : 'Unable to load shared project.'); });
    return () => { mounted = false; };
  }, []);

  const project = useMemo(() => ({ ...buildProject(projectName, walls, rooms, scaleMetersPerPixel, projectId, projectCreatedAt, projectUpdatedAt), sceneAssets, wallOpenings, presentation, building }), [projectId, projectCreatedAt, projectUpdatedAt, projectName, walls, rooms, scaleMetersPerPixel, sceneAssets, wallOpenings, presentation, building]);
  const updateWalls: Dispatch<SetStateAction<WallSegment[]>> = useCallback((next) => { setRoomsValidated(false); setSelectedRoomId(null); setRooms([]); setWalls(next); }, []);
  const { dispatchSpatialAction } = useSpatialActionDispatcher(walls, rooms, updateWalls, setRooms);

  const handleSaveProject = async (): Promise<void> => {
    setSaveState('saving'); setSaveMessage('Saving project…');
    let projectToSave: Project | null = null;
    try {
      const saveTimestamp = new Date().toISOString();
      projectToSave = { ...cloneProject(project), id: UUID_PATTERN.test(project.id) ? project.id : crypto.randomUUID(), createdAt: projectCreatedAt, updatedAt: saveTimestamp };
      setProjectId(projectToSave.id); setProjectUpdatedAt(saveTimestamp);
      saveProjectToLocalStorage(projectToSave, STORAGE_KEY);
      writeLocalProjectLibrary(projectToSave);
      const result = await saveProjectToServer(projectToSave);
      const saved = result.project;
      setProjectId(saved.id); setProjectCreatedAt(saved.createdAt); setProjectUpdatedAt(saved.updatedAt); setProjectName(saved.name); setScaleMetersPerPixel(saved.scaleMetersPerPixel ?? scaleMetersPerPixel);
      setScaleCalibrated(Boolean(saved.scaleMetersPerPixel)); setLastSavedProject(cloneProject(saved));
      if (result.status === 'local-only') { setSaveState('local-only'); setSaveMessage('Saved to this browser and temporary API memory — NOT confirmed in Supabase.'); return; }
      setSaveState('saved'); setSaveMessage(`Saved to Supabase · ${saved.walls.length} walls · ${saved.rooms.length} rooms`);
    } catch (error) {
      console.error(error); setSaveState('error');
      setSaveMessage(error instanceof Error ? `Supabase save failed; browser recovery copy kept. ${error.message}` : 'Supabase save failed; browser recovery copy kept.');
    }
  };

  const handleShareDesign = async (): Promise<void> => {
    setSaveState('saving'); setSaveMessage('Publishing project…');
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';
      const response = await fetch(`${apiBaseUrl}/api/projects/${encodeURIComponent(project.id)}/publish`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(project) });
      if (!response.ok) throw new Error(`Publish failed (${response.status}).`);
      const payload = (await response.json()) as { shareUrl?: string; shareToken?: string };
      setShareUrl(payload.shareToken ? `${window.location.origin}/?share=${payload.shareToken}` : payload.shareUrl ?? `${window.location.origin}/?share=`); setSaveState('saved'); setSaveMessage('Project published successfully.');
    } catch (error) { console.error(error); setSaveState('error'); setSaveMessage(error instanceof Error ? error.message : 'Project publish failed.'); }
  };

  const refreshSavedProjects = async (): Promise<void> => {
    setSavedProjectsLoading(true); setSavedProjectsError('');
    const localEntries: SavedProjectEntry[] = readLocalProjectLibrary().map((item) => ({ project: item, source: 'This browser · local recovery', remote: false }));
    try {
      const result = await listSavedProjects();
      const remoteEntries: SavedProjectEntry[] = result.projects.map((item) => ({
        project: item,
        source: result.persistence === 'durable' ? 'Supabase · durable' : 'API memory · temporary (not Supabase)',
        remote: true,
      }));
      const byId = new Map<string, SavedProjectEntry>();
      for (const entry of localEntries) byId.set(entry.project.id, entry);
      for (const entry of remoteEntries) byId.set(entry.project.id, entry);
      setSavedProjects([...byId.values()].sort((a, b) => b.project.updatedAt.localeCompare(a.project.updatedAt)));
      if (result.persistence !== 'durable') setSavedProjectsError(result.message ?? 'The API is not using durable Supabase persistence. Projects in API memory can disappear when it restarts.');
    } catch (error) {
      setSavedProjects(localEntries);
      setSavedProjectsError(`Could not retrieve projects from the server. Showing browser recovery projects only. ${error instanceof Error ? error.message : ''}`);
    } finally { setSavedProjectsLoading(false); }
  };

  const handleLoadProject = (): void => {
    setSavedProjectsOpen(true);
    void refreshSavedProjects();
  };

  const applyProjectToEditor = (loaded: Project, source: string): void => {
    const normalizedInput = ProjectSchema.parse(loaded);
    const normalized = UUID_PATTERN.test(normalizedInput.id) ? normalizedInput : { ...normalizedInput, id: crypto.randomUUID() };
    const validatedRooms = normalized.rooms.filter((room) => room.wallSegments.length > 0);
    setProjectId(normalized.id); setProjectCreatedAt(normalized.createdAt); setProjectUpdatedAt(normalized.updatedAt); setBuilding(normalized.building ?? BuildingModelSchema.parse({})); setProjectName(normalized.name); setWalls(cloneWalls(normalized.walls)); setRooms(validatedRooms);
    setSceneAssets(normalized.sceneAssets ?? []); setWallOpenings(normalized.wallOpenings ?? []);
    setPresentation(normalized.presentation ?? presentation); setRoomsValidated(validatedRooms.length > 0);
    setBlueprintUploaded(normalized.walls.length > 0 || validatedRooms.length > 0);
    setScaleMetersPerPixel(normalized.scaleMetersPerPixel ?? DEFAULT_SCALE_METERS_PER_PIXEL);
    setScaleCalibrated(Boolean(normalized.scaleMetersPerPixel)); setLastSavedProject(cloneProject(normalized));
    setSelectedRoomId(null); setSelectedWallId(null); setViewMode('editor'); setSharedProject(null);
    setSavedProjectsOpen(false); setSaveState('saved');
    setSaveMessage(`Opened “${normalized.name}” from ${source} · ${normalized.walls.length} walls`);
  };

  const handleOpenSavedProject = async (entry: SavedProjectEntry): Promise<void> => {
    try {
      if (entry.remote) {
        setSavedProjectsLoading(true); setSavedProjectsError('');
        const result = await loadSavedProject(entry.project.id);
        applyProjectToEditor(result.project, result.persistence === 'durable' ? 'Supabase' : 'temporary API memory');
      } else {
        applyProjectToEditor(entry.project, 'this browser');
      }
    } catch (error) {
      setSavedProjectsError(error instanceof Error ? error.message : 'Unable to open the selected project.');
    } finally { setSavedProjectsLoading(false); }
  };

  const handleRevertProject = (): void => {
    if (!lastSavedProject) { setSaveMessage('No saved baseline is available to revert to.'); return; }
    if (!window.confirm('Revert all unsaved wall and room changes to the last saved project?')) return;
    setProjectId(lastSavedProject.id); setProjectCreatedAt(lastSavedProject.createdAt); setProjectUpdatedAt(lastSavedProject.updatedAt); setBuilding(lastSavedProject.building ?? BuildingModelSchema.parse({})); setProjectName(lastSavedProject.name); setWalls(cloneWalls(lastSavedProject.walls)); setRooms(lastSavedProject.rooms.filter((room) => room.wallSegments.length > 0)); setSceneAssets(lastSavedProject.sceneAssets ?? []); setWallOpenings(lastSavedProject.wallOpenings ?? []); setPresentation(lastSavedProject.presentation ?? presentation); setRoomsValidated(lastSavedProject.rooms.length > 0); setScaleMetersPerPixel(lastSavedProject.scaleMetersPerPixel ?? DEFAULT_SCALE_METERS_PER_PIXEL); setScaleCalibrated(Boolean(lastSavedProject.scaleMetersPerPixel)); setSelectedRoomId(null); setViewMode('editor'); setSaveState('saved'); setSaveMessage('Reverted to the last saved project.');
  };

  const handleDetectRooms = (): void => {
    if (!scaleCalibrated) { setSaveState('error'); setSaveMessage('Calibrate scale before validating rooms.'); return; }
    const nextRooms = detectClosedRooms(walls, projectId, 'Room'); setRooms(nextRooms); setSelectedRoomId(null); setRoomsValidated(nextRooms.length > 0);
    if (!nextRooms.length) { setSaveState('error'); setSaveMessage('No closed rooms detected. Check wall endpoints and close the loop.'); return; }
    setSaveState('saved'); setSaveMessage(`${nextRooms.length} room${nextRooms.length === 1 ? '' : 's'} detected.`);
  };

  const handleSaveVersion = async (): Promise<void> => {
    const versionNumber = versions.length + 1;
    if (!walls.length) { setSaveState('error'); setSaveMessage('Cannot save an empty version. Draw wall geometry first.'); return; }
    const versionTimestamp = new Date().toISOString();
    const version = cloneProject({
      ...project,
      id: crypto.randomUUID(),
      name: `${projectName} (v${versionNumber})`,
      createdAt: versionTimestamp,
      updatedAt: versionTimestamp,
    });
    const nextVersions = [...versions, version]; setVersions(nextVersions); window.localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(nextVersions)); setSelectedVersionIds(nextVersions.length <= 2 ? nextVersions.map((item) => item.id) : [nextVersions[nextVersions.length - 2].id, nextVersions[nextVersions.length - 1].id]);
    try { writeLocalProjectLibrary(version); const result = await saveProjectToServer(version); if (result.status === 'local-only') { setSaveState('local-only'); setSaveMessage('Version kept in this browser and temporary API memory — NOT confirmed in Supabase.'); return; } setSaveState('saved'); setSaveMessage(`Version ${versionNumber} saved · ${nextVersions.length} versions available.`); }
    catch (error) { console.error(error); setSaveState('error'); setSaveMessage(`Version ${versionNumber} kept locally · server persistence failed.`); }
  };

  const toggleVersionSelection = (versionId: string): void => setSelectedVersionIds((current) => current.includes(versionId) ? current.filter((id) => id !== versionId) : current.length >= 2 ? [current[1], versionId] : [...current, versionId]);

  const handleCompareVersions = (): void => {
    if (selectedVersionIds.length !== 2) { setSaveState('error'); setSaveMessage('Select exactly two saved versions to compare.'); return; }
    const selected = selectedVersionIds.map((id) => versions.find((version) => version.id === id)).filter((version): version is Project => Boolean(version));
    if (selected.length !== 2) { setSaveState('error'); setSaveMessage('The selected versions are no longer available.'); return; }
    if (selected.some((version) => version.walls.length === 0)) { setSaveState('error'); setSaveMessage('One selected version has no wall geometry. Save that version again after drawing walls.'); return; }
    setComparisonPair([cloneProject(selected[0]), cloneProject(selected[1])]);
  };

  const handleBlueprintUpload = (file: File): void => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) { window.alert('Blueprint upload currently supports JPG and PNG images.'); return; }
    setBlueprintUploaded(true); setScaleCalibrated(false); setRoomsValidated(false); setSelectedRoomId(null); setSaveState('idle'); setSaveMessage('Blueprint loaded. Calibrate the scale before tracing walls.');
  };

  const handleScaleCalibrated = (nextScale: number): void => {
    if (!Number.isFinite(nextScale) || nextScale <= 0) { setScaleCalibrated(false); setSaveState('error'); setSaveMessage('Scale must be a positive number.'); return; }
    setScaleMetersPerPixel(nextScale); setScaleCalibrated(true); setRoomsValidated(false); setSaveState('saved'); setSaveMessage(`Scale calibrated · ${nextScale.toFixed(4)} m/pixel`);
  };

  const handleReview3D = (): void => {
    if (!scaleCalibrated) { setSaveState('error'); setSaveMessage('Calibrate scale before opening the 3D review.'); return; }
    if (!walls.length) { setSaveState('error'); setSaveMessage('Draw at least one wall before opening the 3D review.'); return; }
    setViewMode('3d');
  };
  const handleEnterSpatial = (): void => {
    if (!scaleCalibrated) { setSaveState('error'); setSaveMessage('Calibrate scale before entering Spatial View.'); return; }
    if (!walls.length) { setSaveState('error'); setSaveMessage('Create wall geometry before entering Spatial View.'); return; }
    setViewMode('spatial');
  };

  const currentStep = !blueprintUploaded ? 1 : !scaleCalibrated ? 2 : !walls.length ? 3 : !roomsValidated ? 4 : viewMode === 'editor' ? 5 : 6;
  const steps = [
    { number: 1, title: 'Upload blueprint', detail: 'JPG/PNG floor plan' },
    { number: 2, title: 'Calibrate scale', detail: scaleCalibrated ? `${scaleMetersPerPixel.toFixed(4)} m/pixel` : 'Apply a known length' },
    { number: 3, title: 'Trace walls', detail: `${walls.length} wall segments` },
    { number: 4, title: 'Detect & validate rooms', detail: `${rooms.length} rooms detected` },
    { number: 5, title: 'Review 3D model', detail: 'Inspect generated geometry' },
    { number: 6, title: 'Spatial / AR', detail: 'Final presentation stage' },
  ];

  if (presentationMode) return <PresentationExperience walls={walls} rooms={rooms} sceneAssets={sceneAssets} wallOpenings={wallOpenings} presentation={presentation} onExit={() => setPresentationMode(false)} />;
  if (sharedProject) return <ClientViewer project={sharedProject} />;
  if (comparisonPair) return <VersionComparer versionA={comparisonPair[0]} versionB={comparisonPair[1]} onClose={() => setComparisonPair(null)} />;
  if (viewMode === 'spatial') return <div className="relative h-screen w-screen bg-slate-950"><ArViewport walls={walls} rooms={rooms} points={points} /><div className="absolute left-4 top-4 z-50 flex gap-2"><button type="button" onClick={() => setViewMode('3d')} className="rounded-lg bg-slate-900/90 px-4 py-2 text-sm font-medium text-white shadow-lg">Back to 3D</button><button type="button" onClick={() => setViewMode('editor')} className="rounded-lg bg-slate-900/90 px-4 py-2 text-sm font-medium text-white shadow-lg">Back to Editor</button></div></div>;

  return (
    <div className="spatial-shell flex h-screen w-screen overflow-hidden text-slate-100">
      <aside className="spatial-sidebar relative z-30 h-full w-[440px] shrink-0 overflow-y-auto border-r border-slate-800/80 p-3">
        <div className="spatial-panel mb-3 p-3"><div className="mb-2 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Workflow</p><h1 className="mt-1 text-lg font-semibold text-white">Blueprint → Spatial 3D</h1></div><span className="spatial-badge">Step {Math.min(currentStep, 6)}/6</span></div><p className="mb-3 text-xs leading-5 text-slate-400">Complete each stage in order. Drawn walls are the canonical geometry used by 3D, versions, comparison and spatial view.</p><div className="spatial-stepper">{steps.map((step) => { const complete = currentStep > step.number; const active = currentStep === step.number; return <div key={step.number} className={`spatial-step ${active ? 'is-active' : ''} ${complete ? 'is-complete' : ''}`}><span className="spatial-step-number">{complete ? '✓' : step.number}</span><div className="min-w-0"><div className="text-sm font-medium text-slate-100">{step.title}</div><div className="text-xs text-slate-500">{step.detail}</div></div></div>; })}</div>{saveMessage ? <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${saveState === 'error' ? 'border-rose-500/40 bg-rose-500/10 text-rose-200' : saveState === 'local-only' ? 'border-amber-500/40 bg-amber-500/10 text-amber-100' : 'border-slate-700 bg-slate-900/70 text-slate-300'}`}>{saveMessage}</div> : null}</div>
        <FloorPlanOverlay walls={walls} rooms={rooms} setWalls={updateWalls} setRooms={setRooms} projectName={projectName} onProjectNameChange={setProjectName} onSave={handleSaveProject} onLoad={handleLoadProject} onShare={handleShareDesign} onEnterAr={handleEnterSpatial} shareUrl={shareUrl} onSaveVersion={handleSaveVersion} onCompareVersions={handleCompareVersions} savedVersionsCount={versions.length} onBlueprintUploaded={handleBlueprintUpload} onDetectRooms={handleDetectRooms} roomsValidated={roomsValidated} onReview3D={handleReview3D} onEnterSpatial={handleEnterSpatial} onRevert={handleRevertProject} hasSavedBaseline={Boolean(lastSavedProject)} saveState={saveState} blueprintUploaded={blueprintUploaded} scaleCalibrated={scaleCalibrated} scaleMetersPerPixel={scaleMetersPerPixel} onScaleCalibrated={handleScaleCalibrated} />
        <SceneStudioPanel walls={walls} selectedWallId={selectedWallId} setSelectedWallId={setSelectedWallId} setWalls={setWalls} setSceneAssets={setSceneAssets} setWallOpenings={setWallOpenings} presentation={presentation} setPresentation={setPresentation} /><div className="mt-3 space-y-3"><RoomHighlightList rooms={rooms} walls={walls} selectedRoomId={selectedRoomId} onSelect={setSelectedRoomId} /><VersionHistoryPanel versions={versions} selectedVersionIds={selectedVersionIds} onToggle={toggleVersionSelection} onCompare={handleCompareVersions} /></div>
        <div className="border-t border-slate-800 p-3 mt-3"><AiAssistantPanel walls={walls} onDispatchAction={dispatchSpatialAction} /></div>
      </aside>
      <main className="relative min-w-0 flex-1 overflow-hidden"><SpatialCanvas walls={walls} rooms={rooms} points={points} selectedRoomId={selectedRoomId} /><button type="button" onClick={() => setPresentationMode(true)} disabled={!walls.length} className="absolute right-5 bottom-5 z-40 rounded-full bg-gradient-to-r from-fuchsia-600 via-rose-500 to-amber-500 px-5 py-3 text-xs font-bold text-white shadow-2xl disabled:opacity-40">✨ Preview Birthday Gallery</button><div className="spatial-viewport-card"><div className="spatial-viewport-label">{viewMode === '3d' ? '3D REVIEW' : 'LIVE 3D PREVIEW'}</div><div className="mt-1 text-sm font-medium text-white">{walls.length} wall segments · {rooms.length} rooms</div><div className="spatial-grid-hint">Drag to orbit · scroll to zoom · right-drag to pan</div></div><SpatialHeader projectName={projectName} onProjectNameChange={setProjectName} onSave={handleSaveProject} onLoad={handleLoadProject} onShare={handleShareDesign} onSaveVersion={handleSaveVersion} onEnterAr={handleEnterSpatial} refLength={refLength} onScaleChange={setRefLength} onUploadBlueprint={handleBlueprintUpload} /><CanvasOverlay scaleMetric={refLength} unit="meters" /></main>
      <SavedProjectsDialog open={savedProjectsOpen} projects={savedProjects} loading={savedProjectsLoading} error={savedProjectsError} onRefresh={() => void refreshSavedProjects()} onOpen={(entry) => void handleOpenSavedProject(entry)} onClose={() => setSavedProjectsOpen(false)} />
    </div>
  );
}
