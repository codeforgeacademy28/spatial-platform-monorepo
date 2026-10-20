import { useEffect, useRef, useState } from 'react';
import { WallSegmentSchema } from '@spatial/core';
import type { Point, Room, WallSegment } from '@spatial/core';

interface FloorPlanOverlayProps {
  walls: WallSegment[];
  rooms: Room[];
  setWalls: React.Dispatch<React.SetStateAction<WallSegment[]>>;
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  projectName: string;
  onProjectNameChange: (value: string) => void;
  onSave: () => void | Promise<void>;
  onLoad: () => void;
  onShare: () => void | Promise<void>;
  onEnterAr?: () => void;
  shareUrl: string;
  onSaveVersion?: () => void | Promise<void>;
  onCompareVersions?: () => void;
  savedVersionsCount?: number;
  onBlueprintUploaded?: (file: File) => void;
  onDetectRooms?: () => void;
  roomsValidated?: boolean;
  onReview3D?: () => void;
  onEnterSpatial?: () => void;
  onRevert?: () => void;
  hasSavedBaseline?: boolean;
  saveState?: 'idle' | 'saving' | 'saved' | 'local-only' | 'error';
  blueprintUploaded?: boolean;
  scaleCalibrated?: boolean;
  scaleMetersPerPixel: number;
  onScaleCalibrated?: (scaleMetersPerPixel: number) => void;
}

interface CanvasPoint { x: number; y: number }
type EditorMode = 'calibrate' | 'draw';
type WallSnapshot = WallSegment[];
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 520;
const DEFAULT_SCALE_METERS_PER_PIXEL = 0.02;
const SNAP_DISTANCE_PIXELS = 12;
const MIN_REFERENCE_PIXEL_LENGTH = 4;

function canvasToWorld(point: CanvasPoint, scale: number): Point { return { x: point.x * scale, y: point.y * scale }; }
function worldToCanvas(point: Point, scale: number): CanvasPoint { return { x: point.x / scale, y: point.y / scale }; }
function cloneWalls(walls: WallSegment[]): WallSegment[] { return walls.map((wall) => ({ ...wall, start: { ...wall.start }, end: { ...wall.end } })); }

function snapToExistingEndpoint(point: CanvasPoint, walls: WallSegment[], scale: number): CanvasPoint {
  let best: CanvasPoint | null = null;
  let bestDistance = SNAP_DISTANCE_PIXELS;
  for (const wall of walls) {
    for (const endpoint of [wall.start, wall.end]) {
      const candidate = worldToCanvas(endpoint, scale);
      const distance = Math.hypot(candidate.x - point.x, candidate.y - point.y);
      if (distance <= bestDistance) { bestDistance = distance; best = candidate; }
    }
  }
  return best ?? point;
}

function createWall(start: CanvasPoint, end: CanvasPoint, scale: number): WallSegment {
  const worldStart = canvasToWorld(start, scale); const worldEnd = canvasToWorld(end, scale); const now = new Date().toISOString();
  return { id: `wall-${Date.now()}-${Math.random().toString(16).slice(2)}`, roomId: 'unassigned', start: worldStart, end: worldEnd, thickness: 0.2, height: 3, length: Math.hypot(worldEnd.x - worldStart.x, worldEnd.y - worldStart.y), createdAt: now, updatedAt: now };
}

export function FloorPlanOverlay({
  walls, rooms, setWalls, setRooms, projectName, onProjectNameChange, onSave, onLoad, onShare,
  onEnterAr, shareUrl, onSaveVersion, onCompareVersions, savedVersionsCount = 0, onBlueprintUploaded,
  onDetectRooms, roomsValidated = false, onReview3D, onEnterSpatial, onRevert, hasSavedBaseline = false, saveState = 'idle',
  blueprintUploaded = false, scaleCalibrated = false, scaleMetersPerPixel = DEFAULT_SCALE_METERS_PER_PIXEL, onScaleCalibrated,
}: FloorPlanOverlayProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>(scaleCalibrated ? 'draw' : 'calibrate');
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [referenceLengthMeters, setReferenceLengthMeters] = useState(4);
  const [referenceLine, setReferenceLine] = useState<{ start: CanvasPoint; end: CanvasPoint } | null>(null);
  const [wallPreview, setWallPreview] = useState<{ start: CanvasPoint; end: CanvasPoint } | null>(null);
  const [undoStack, setUndoStack] = useState<WallSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<WallSnapshot[]>([]);

  useEffect(() => { setEditorMode(scaleCalibrated ? 'draw' : 'calibrate'); }, [scaleCalibrated]);

  useEffect(() => {
    const canvas = canvasRef.current; const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    canvas.width = CANVAS_WIDTH; canvas.height = CANVAS_HEIGHT;
    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); context.fillStyle = '#020617'; context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    context.strokeStyle = '#334155'; context.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += 20) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, CANVAS_HEIGHT); context.stroke(); }
    for (let y = 0; y <= CANVAS_HEIGHT; y += 20) { context.beginPath(); context.moveTo(0, y); context.lineTo(CANVAS_WIDTH, y); context.stroke(); }
    const drawForeground = (): void => {
      context.fillStyle = '#e2e8f0'; context.font = '12px sans-serif'; context.fillText('2D FLOOR PLAN', 12, 20);
      context.fillStyle = '#64748b'; context.fillText(`1 px = ${scaleMetersPerPixel.toFixed(4)} m · snap ${SNAP_DISTANCE_PIXELS}px`, 12, 36);
      for (const wall of walls) { const start = worldToCanvas(wall.start, scaleMetersPerPixel); const end = worldToCanvas(wall.end, scaleMetersPerPixel); context.beginPath(); context.moveTo(start.x, start.y); context.lineTo(end.x, end.y); context.strokeStyle = '#f8fafc'; context.lineWidth = 5; context.stroke(); }
      if (wallPreview) { context.beginPath(); context.moveTo(wallPreview.start.x, wallPreview.start.y); context.lineTo(wallPreview.end.x, wallPreview.end.y); context.strokeStyle = '#22d3ee'; context.lineWidth = 4; context.stroke(); }
      if (referenceLine) { context.beginPath(); context.moveTo(referenceLine.start.x, referenceLine.start.y); context.lineTo(referenceLine.end.x, referenceLine.end.y); context.strokeStyle = '#f59e0b'; context.lineWidth = 4; context.setLineDash([8, 5]); context.stroke(); context.setLineDash([]); const px = Math.hypot(referenceLine.end.x - referenceLine.start.x, referenceLine.end.y - referenceLine.start.y); context.fillStyle = '#fbbf24'; context.fillText(`${px.toFixed(1)} px`, referenceLine.end.x + 8, referenceLine.end.y - 8); }
      if (!blueprintUploaded) { context.fillStyle = 'rgba(2,6,23,0.9)'; context.fillRect(0, 42, CANVAS_WIDTH, CANVAS_HEIGHT - 42); context.fillStyle = '#94a3b8'; context.fillText('Upload a blueprint to begin.', 125, CANVAS_HEIGHT / 2); }
    };
    if (!imageData) { drawForeground(); return; }
    const img = new Image(); img.onload = () => { const aspectRatio = img.width / img.height || 1; const maxWidth = CANVAS_WIDTH - 20; const maxHeight = CANVAS_HEIGHT - 60; let displayWidth = maxWidth; let displayHeight = displayWidth / aspectRatio; if (displayHeight > maxHeight) { displayHeight = maxHeight; displayWidth = displayHeight * aspectRatio; } const offsetX = (CANVAS_WIDTH - displayWidth) / 2; const offsetY = 40 + (maxHeight - displayHeight) / 2; context.globalAlpha = 0.78; context.drawImage(img, offsetX, offsetY, displayWidth, displayHeight); context.globalAlpha = 1; drawForeground(); }; img.src = imageData;
  }, [wallPreview, referenceLine, imageData, scaleMetersPerPixel, walls, blueprintUploaded]);

  const getCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>): CanvasPoint | null => { const canvas = canvasRef.current; if (!canvas) return null; const rect = canvas.getBoundingClientRect(); if (!rect.width || !rect.height) return null; return { x: ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH, y: ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT }; };
  const replaceWalls = (next: WallSnapshot, recordUndo = true): void => { if (recordUndo) setUndoStack((previous) => [...previous, cloneWalls(walls)].slice(-50)); setWalls(cloneWalls(next)); setRedoStack([]); setRooms([]); };
  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    if (!blueprintUploaded) return;
    const point = getCanvasPoint(event); if (!point) return; event.currentTarget.setPointerCapture(event.pointerId); setIsPointerDown(true);
    if (editorMode === 'calibrate') setReferenceLine({ start: point, end: point }); else if (scaleCalibrated) { const start = snapToExistingEndpoint(point, walls, scaleMetersPerPixel); setWallPreview({ start, end: start }); }
  };
  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    if (!isPointerDown) return; const point = getCanvasPoint(event); if (!point) return;
    if (editorMode === 'calibrate') setReferenceLine((current) => current ? { start: current.start, end: point } : current);
    else if (scaleCalibrated) setWallPreview((current) => current ? { start: current.start, end: snapToExistingEndpoint(point, walls, scaleMetersPerPixel) } : current);
  };
  const finishPointer = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    if (!isPointerDown) return; setIsPointerDown(false); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (editorMode === 'calibrate') return;
    if (!wallPreview || !scaleCalibrated) { setWallPreview(null); return; }
    const pixelLength = Math.hypot(wallPreview.end.x - wallPreview.start.x, wallPreview.end.y - wallPreview.start.y); setWallPreview(null);
    if (pixelLength < 8) return;
    replaceWalls([...walls, WallSegmentSchema.parse(createWall(wallPreview.start, wallPreview.end, scaleMetersPerPixel))]);
  };
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>): void => { const file = event.target.files?.[0]; if (!file || !['image/jpeg', 'image/png'].includes(file.type)) { window.alert('Blueprint upload currently supports JPG and PNG images.'); return; } const reader = new FileReader(); reader.onload = () => setImageData(typeof reader.result === 'string' ? reader.result : null); reader.readAsDataURL(file); onBlueprintUploaded?.(file); setReferenceLine(null); setWallPreview(null); };
  const applyCalibration = (): void => {
    if (!referenceLine) return;
    if (!Number.isFinite(referenceLengthMeters) || referenceLengthMeters <= 0) return;
    const pixelLength = Math.hypot(referenceLine.end.x - referenceLine.start.x, referenceLine.end.y - referenceLine.start.y);
    if (pixelLength < MIN_REFERENCE_PIXEL_LENGTH) return;
    const nextScale = referenceLengthMeters / pixelLength;
    onScaleCalibrated?.(nextScale); setEditorMode('draw');
  };
  const resetCalibration = (): void => { setReferenceLine(null); setEditorMode('calibrate'); };
  const handleRoomNameChange = (roomId: string, nextName: string): void => setRooms((previous) => previous.map((room) => room.id === roomId ? { ...room, name: nextName, updatedAt: new Date().toISOString() } : room));
  const handleUndo = (): void => { const previous = undoStack.at(-1); if (!previous) return; setRedoStack((redo) => [...redo, cloneWalls(walls)].slice(-50)); setUndoStack((stack) => stack.slice(0, -1)); setWalls(cloneWalls(previous)); setRooms([]); };
  const handleRedo = (): void => { const next = redoStack.at(-1); if (!next) return; setUndoStack((stack) => [...stack, cloneWalls(walls)].slice(-50)); setRedoStack((stack) => stack.slice(0, -1)); setWalls(cloneWalls(next)); setRooms([]); };
  const handleDeleteLast = (): void => { if (walls.length) replaceWalls(walls.slice(0, -1)); };
  const handleClear = (): void => { if (!walls.length) return; if (!window.confirm('Clear all drawn wall segments and detected rooms?')) return; replaceWalls([]); };
  const measuredPixels = referenceLine ? Math.hypot(referenceLine.end.x - referenceLine.start.x, referenceLine.end.y - referenceLine.start.y) : 0;

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300">Spatial editor</p><h2 className="mt-1 text-base font-semibold text-white">2D Floor Plan → Rooms → 3D → Spatial</h2><p className="mt-1 text-xs leading-relaxed text-slate-400">Upload, calibrate, trace walls, detect rooms, review 3D, then enter Spatial View.</p></section>
      <section className="rounded-lg border border-slate-700 bg-slate-900/80 p-3"><label className="block text-xs uppercase tracking-[0.2em] text-slate-400">Project name</label><input value={projectName} onChange={(event) => onProjectNameChange(event.target.value)} className="mt-2 w-full rounded border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-slate-100" /><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={onSave} disabled={saveState === 'saving'} className="rounded bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-60">{saveState === 'saving' ? 'Saving…' : 'Save Project'}</button><button type="button" onClick={onLoad} className="rounded bg-slate-700 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600">Load Project</button><button type="button" onClick={onShare} className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">Save & Share</button><button type="button" onClick={onSaveVersion} className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500">Save Version</button></div><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" onClick={onRevert} disabled={!hasSavedBaseline} className="rounded bg-amber-700 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-40">Revert Changes</button><button type="button" onClick={handleClear} disabled={!walls.length} className="rounded bg-rose-700 px-3 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-40">Clear Plan</button></div>{onCompareVersions ? <button type="button" onClick={onCompareVersions} className="mt-2 w-full rounded bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-500">Compare Versions ({savedVersionsCount} Saved)</button> : null}{shareUrl ? <div className="mt-3 break-all rounded border border-emerald-500/40 bg-emerald-500/10 p-2 text-xs text-emerald-100">{shareUrl}</div> : null}</section>
      <section className="rounded-xl border border-slate-700 bg-slate-950 p-3"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-white">Step 1 — Upload blueprint</h3><p className="mt-1 text-xs text-slate-400">JPG or PNG floor plan. Uploading the image does not create walls or rooms.</p></div><label className="cursor-pointer rounded-md border border-sky-500 bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-200">Upload blueprint<input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleImageUpload} /></label></div><div className="mt-3 text-xs text-slate-400">{blueprintUploaded ? 'Blueprint loaded.' : 'Waiting for blueprint upload.'}</div></section>
      <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300">Step 2 — Calibrate scale</p><h3 className="mt-1 text-sm font-semibold text-white">Measure a known distance on the blueprint</h3><p className="mt-1 text-xs text-slate-400">Draw a line directly over a known dimension. The measured pixels are converted into meters-per-pixel from the length you enter.</p></div><button type="button" onClick={resetCalibration} disabled={!blueprintUploaded} className="rounded bg-slate-700 px-2 py-1 text-xs text-white disabled:opacity-40">Recalibrate</button></div><div className="mt-3 grid grid-cols-[1fr_auto_auto_auto] items-center gap-2"><input type="number" min="0.1" step="0.1" value={referenceLengthMeters} onChange={(event) => setReferenceLengthMeters(Number(event.target.value) || 0)} className="rounded border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-slate-100" /><span className="text-xs text-slate-400">meters</span><span className="text-xs text-slate-400">{measuredPixels.toFixed(1)} px</span><button type="button" onClick={applyCalibration} disabled={!blueprintUploaded || measuredPixels < MIN_REFERENCE_PIXEL_LENGTH || referenceLengthMeters <= 0} className="rounded bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-40">Apply scale</button></div><div className="mt-2 rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs">{scaleCalibrated ? <span className="text-emerald-300">✓ Calibrated · {scaleMetersPerPixel.toFixed(4)} m/pixel</span> : <span className="text-amber-300">{blueprintUploaded ? 'Draw the reference line on the canvas below.' : 'Upload a blueprint first.'}</span>}</div></section>
      <section className="rounded-xl border border-slate-700 bg-slate-950 p-3"><h3 className="text-sm font-semibold text-white">Step 3 — Trace walls</h3><p className="mt-1 text-xs text-slate-400">{scaleCalibrated ? 'Press and drag to create each wall. Endpoints snap to nearby walls.' : 'Wall tracing unlocks after scale calibration.'}</p><div className="mt-3 grid grid-cols-4 gap-2"><button type="button" onClick={handleUndo} disabled={!undoStack.length} className="rounded bg-slate-700 px-2 py-2 text-xs text-white disabled:opacity-40">Undo</button><button type="button" onClick={handleRedo} disabled={!redoStack.length} className="rounded bg-slate-700 px-2 py-2 text-xs text-white disabled:opacity-40">Redo</button><button type="button" onClick={handleDeleteLast} disabled={!walls.length} className="rounded bg-rose-700 px-2 py-2 text-xs text-white disabled:opacity-40">Delete Last</button><button type="button" onClick={handleClear} disabled={!walls.length} className="rounded bg-rose-900 px-2 py-2 text-xs text-white disabled:opacity-40">Clear</button></div><canvas ref={canvasRef} className={`mt-3 block h-[520px] w-full touch-none rounded-md border border-slate-700 bg-slate-950 ${!blueprintUploaded || (editorMode === 'draw' && !scaleCalibrated) ? 'cursor-not-allowed opacity-75' : editorMode === 'calibrate' ? 'cursor-crosshair' : 'cursor-crosshair'}`} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={finishPointer} onPointerCancel={finishPointer} aria-label="2D floor plan drawing canvas" /><div className="mt-3 flex justify-between rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs"><span><strong className="text-white">{walls.length}</strong> wall segments drawn</span><span className="text-slate-400">{!blueprintUploaded ? 'Upload blueprint first' : !scaleCalibrated ? 'Draw a reference line' : 'Wall tracing enabled'}</span></div></section>
      <section className="rounded-xl border border-slate-700 bg-slate-950 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300">Step 4</p><h3 className="mt-1 text-sm font-semibold text-white">Detect & validate rooms</h3><p className="mt-1 text-xs text-slate-400">Close the wall loop, then explicitly run room detection.</p></div><button type="button" onClick={onDetectRooms} disabled={!onDetectRooms || !scaleCalibrated || walls.length < 3} className="rounded-md bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-500 disabled:opacity-50">Detect Rooms</button></div><div className="mt-3 rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs">{roomsValidated && rooms.length ? <div className="text-emerald-300">✓ {rooms.length} room{rooms.length === 1 ? '' : 's'} detected and validated.</div> : <div className="text-slate-400">No validated rooms yet. {scaleCalibrated ? 'Close the loop and click Detect Rooms.' : 'Calibrate scale first.'}</div>}</div>{rooms.map((room) => <div key={room.id} className="mt-2 rounded border border-slate-700 bg-slate-800/70 p-2"><input value={room.name} onChange={(event) => handleRoomNameChange(room.id, event.target.value)} className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-100" /><div className="mt-1 text-slate-400">{room.floorArea?.toFixed(2) ?? '0.00'} m² · {room.wallSegments.length} walls</div></div>)}</section>
      <section className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Step 5</p><h3 className="mt-1 text-sm font-semibold text-white">Review the 3D model</h3><p className="mt-1 text-xs text-slate-400">The live 3D preview is on the right. Use this action to switch to the dedicated 3D review stage.</p><button type="button" onClick={onReview3D} disabled={!onReview3D || !scaleCalibrated || !walls.length} className="mt-3 w-full rounded bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50">Review 3D Model ({walls.length} walls · {rooms.length} rooms)</button></section>
      <section className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-300">Step 6</p><h3 className="mt-1 text-sm font-semibold text-white">Spatial / AR</h3><p className="mt-1 text-xs text-slate-400">Enter the spatial viewer only after you have verified the 3D geometry.</p><button type="button" onClick={onEnterSpatial ?? onEnterAr} disabled={!scaleCalibrated || !walls.length} className="mt-3 w-full rounded bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50">Enter Spatial View</button></section>
    </div>
  );
}
