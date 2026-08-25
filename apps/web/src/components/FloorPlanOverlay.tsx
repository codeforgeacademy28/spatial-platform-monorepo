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
  onSave: () => void;
  onLoad: () => void;
  onShare: () => void;
  onEnterAr?: () => void;
  shareUrl: string;
  onSaveVersion?: () => void;
  onCompareVersions?: () => void;
  savedVersionsCount?: number;
}

interface CanvasPoint {
  x: number;
  y: number;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 520;
const DEFAULT_SCALE_METERS_PER_PIXEL = 0.02;

function canvasToWorld(point: CanvasPoint, scaleMetersPerPixel: number): Point {
  return {
    x: point.x * scaleMetersPerPixel,
    y: point.y * scaleMetersPerPixel,
  };
}

function worldToCanvas(point: Point, scaleMetersPerPixel: number): CanvasPoint {
  return {
    x: point.x / scaleMetersPerPixel,
    y: point.y / scaleMetersPerPixel,
  };
}

function createWall(start: CanvasPoint, end: CanvasPoint, scaleMetersPerPixel: number, roomId = 'room-1'): WallSegment {
  const worldStart = canvasToWorld(start, scaleMetersPerPixel);
  const worldEnd = canvasToWorld(end, scaleMetersPerPixel);
  const now = new Date().toISOString();

  return {
    id: `wall-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    roomId,
    start: worldStart,
    end: worldEnd,
    thickness: 0.2,
    height: 3,
    length: Math.hypot(worldEnd.x - worldStart.x, worldEnd.y - worldStart.y),
    createdAt: now,
    updatedAt: now,
  };
}

export function FloorPlanOverlay({
  walls,
  rooms,
  setWalls,
  setRooms,
  projectName,
  onProjectNameChange,
  onSave,
  onLoad,
  onShare,
  onEnterAr,
  shareUrl,
  onSaveVersion,
  onCompareVersions,
  savedVersionsCount = 0,
}: FloorPlanOverlayProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [referenceLengthMeters, setReferenceLengthMeters] = useState(4);
  const [scaleMetersPerPixel, setScaleMetersPerPixel] = useState(DEFAULT_SCALE_METERS_PER_PIXEL);
  const [currentLine, setCurrentLine] = useState<{ start: CanvasPoint; end: CanvasPoint } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    context.fillStyle = '#020617';
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (imageData) {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height || 1;
        const maxWidth = CANVAS_WIDTH - 20;
        const maxHeight = CANVAS_HEIGHT - 60;
        let displayWidth = maxWidth;
        let displayHeight = displayWidth / aspectRatio;

        if (displayHeight > maxHeight) {
          displayHeight = maxHeight;
          displayWidth = displayHeight * aspectRatio;
        }

        const offsetX = (CANVAS_WIDTH - displayWidth) / 2;
        const offsetY = 40 + (maxHeight - displayHeight) / 2;
        context.drawImage(img, offsetX, offsetY, displayWidth, displayHeight);
      };
      img.src = imageData;
    }

    context.strokeStyle = '#334155';
    context.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += 20) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, CANVAS_HEIGHT);
      context.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += 20) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(CANVAS_WIDTH, y);
      context.stroke();
    }

    context.fillStyle = '#cbd5e1';
    context.font = '12px sans-serif';
    context.fillText('2D FLOOR PLAN — drag to draw wall segments', 12, 20);
    context.fillStyle = '#64748b';
    context.fillText(`1 px = ${scaleMetersPerPixel.toFixed(3)} m`, 12, 36);

    for (const wall of walls) {
      const start = worldToCanvas(wall.start, scaleMetersPerPixel);
      const end = worldToCanvas(wall.end, scaleMetersPerPixel);
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.strokeStyle = '#f8fafc';
      context.lineWidth = 5;
      context.stroke();
    }

    if (currentLine) {
      context.beginPath();
      context.moveTo(currentLine.start.x, currentLine.start.y);
      context.lineTo(currentLine.end.x, currentLine.end.y);
      context.strokeStyle = '#22d3ee';
      context.lineWidth = 4;
      context.stroke();
    }
  }, [currentLine, imageData, scaleMetersPerPixel, walls]);

  const getCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>): CanvasPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    return {
      x: ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    const point = getCanvasPoint(event);
    if (!point) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDrawing(true);
    setCurrentLine({ start: point, end: point });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    if (!isDrawing || !currentLine) return;

    const point = getCanvasPoint(event);
    if (!point) return;

    setCurrentLine({ start: currentLine.start, end: point });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    if (!isDrawing || !currentLine) return;

    const start = canvasToWorld(currentLine.start, scaleMetersPerPixel);
    const end = canvasToWorld(currentLine.end, scaleMetersPerPixel);
    const pixelLength = Math.hypot(currentLine.end.x - currentLine.start.x, currentLine.end.y - currentLine.start.y);

    setIsDrawing(false);
    setCurrentLine(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (pixelLength < 8) return;

    const wall = createWall(currentLine.start, currentLine.end, scaleMetersPerPixel);
    wall.start = start;
    wall.end = end;
    const parsedWall = WallSegmentSchema.parse(wall);
    setWalls((previous) => [...previous, parsedWall]);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file || !['image/jpeg', 'image/png'].includes(file.type)) return;

    const reader = new FileReader();
    reader.onload = () => setImageData(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const handleReferenceScale = (): void => {
    const nextScale = referenceLengthMeters / 200;
    setScaleMetersPerPixel(nextScale > 0 ? nextScale : DEFAULT_SCALE_METERS_PER_PIXEL);
  };

  const handleRoomNameChange = (roomId: string, nextName: string): void => {
    setRooms((previous) =>
      previous.map((room) =>
        room.id === roomId
          ? { ...room, name: nextName, updatedAt: new Date().toISOString() }
          : room,
      ),
    );
  };

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300">Spatial editor</p>
            <h2 className="mt-1 text-base font-semibold text-white">2D Floor Plan → 3D Model</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Draw wall segments in the 2D plan below. Every completed wall is converted to real-world metres and appears immediately in the 3D viewport on the right.
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-right text-[10px] text-slate-400">
            <div className="text-slate-200">{walls.length} walls</div>
            <div>{rooms.length} rooms</div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-900/80 p-3">
        <label className="block text-xs uppercase tracking-[0.2em] text-slate-400">Project name</label>
        <input
          value={projectName}
          onChange={(event) => onProjectNameChange(event.target.value)}
          className="mt-2 w-full rounded border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-slate-100"
        />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={onSave} className="rounded bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500">Save Project</button>
          <button type="button" onClick={onLoad} className="rounded bg-slate-700 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600">Load Project</button>
          <button type="button" onClick={onShare} className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">Share Design</button>
          <button type="button" onClick={onSaveVersion} className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500">Save Version</button>
        </div>
        {onEnterAr ? <button type="button" onClick={onEnterAr} className="mt-2 w-full rounded bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-500">Enter AR Viewport</button> : null}
        {onCompareVersions ? <button type="button" onClick={onCompareVersions} className="mt-2 w-full rounded bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-500">Compare Versions ({savedVersionsCount} Saved)</button> : null}
        {shareUrl ? <div className="mt-3 rounded border border-emerald-500/40 bg-emerald-500/10 p-2 text-xs text-emerald-100 break-all">{shareUrl}</div> : null}
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-950 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Draw walls in 2D</h3>
            <p className="mt-1 text-xs text-slate-400">Press and drag inside the grid. Release to create one wall.</p>
          </div>
          <label className="cursor-pointer rounded-md border border-sky-500 bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-200">
            Upload blueprint
            <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-2 py-2 text-xs text-slate-300">
          <span>Reference length</span>
          <input type="number" min="0.1" step="0.1" value={referenceLengthMeters} onChange={(event) => setReferenceLengthMeters(Number(event.target.value) || 4)} className="w-20 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-slate-100" />
          <span>m</span>
          <button type="button" onClick={handleReferenceScale} className="rounded bg-slate-700 px-2 py-1 font-medium text-slate-100 hover:bg-slate-600">Apply</button>
        </div>

        <canvas
          ref={canvasRef}
          className="mt-3 block h-[520px] w-full touch-none cursor-crosshair rounded-md border border-slate-700 bg-slate-950"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label="2D floor plan drawing canvas"
        />
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-900/80 p-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Detected rooms</p>
        <div className="mt-3 space-y-2 text-xs text-slate-300">
          {rooms.length === 0 ? (
            <div className="rounded border border-slate-700 bg-slate-800/70 px-2 py-2 text-slate-400">Draw a closed wall loop to detect a room.</div>
          ) : (
            rooms.map((room) => (
              <div key={room.id} className="rounded border border-slate-700 bg-slate-800/70 p-2">
                <input value={room.name} onChange={(event) => handleRoomNameChange(room.id, event.target.value)} className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-100" />
                <div className="mt-1 text-slate-400">{room.floorArea?.toFixed(2) ?? '0.00'} m²</div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
