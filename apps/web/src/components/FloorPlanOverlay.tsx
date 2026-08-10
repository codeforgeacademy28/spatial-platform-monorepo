import { useEffect, useMemo, useRef, useState } from 'react';
import { WallSegmentSchema } from '@spatial/core';
import type { Room, WallSegment } from '@spatial/core';

interface FloorPlanOverlayProps {
  walls: WallSegment[];
  rooms: Room[];
  setWalls: React.Dispatch<React.SetStateAction<WallSegment[]>>;
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  projectName: string;
  onProjectNameChange: (value: string) => void;
  onSave: () => void;
  onLoad: () => void;
}

interface TracePoint {
  x: number;
  y: number;
}

interface DrawingLine {
  start: TracePoint;
  end: TracePoint;
}

function parsePointsToWallSegment(start: TracePoint, end: TracePoint, scaleMetersPerPixel: number): WallSegment {
  const wallLength = Math.hypot(end.x - start.x, end.y - start.y) * scaleMetersPerPixel;

  return {
    id: `wall-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    roomId: 'room-1',
    start: { x: start.x, y: start.y },
    end: { x: end.x, y: end.y },
    thickness: 0.2,
    height: 3,
    length: wallLength,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
}: FloorPlanOverlayProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [referenceLengthMeters, setReferenceLengthMeters] = useState<number>(1);
  const [scaleMetersPerPixel, setScaleMetersPerPixel] = useState<number>(0.01);
  const [currentLine, setCurrentLine] = useState<DrawingLine | null>(null);
  const [drawingLines, setDrawingLines] = useState<DrawingLine[]>([]);

  const wallList = useMemo(() => walls, [walls]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const width = 400;
    const height = 520;
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#0f172a';
    context.fillRect(0, 0, width, height);

    if (imageData) {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const displayWidth = aspectRatio > 1 ? width : width * 0.9;
        const displayHeight = aspectRatio > 1 ? displayWidth / aspectRatio : height * 0.7;
        const offsetX = (width - displayWidth) / 2;
        const offsetY = (height - displayHeight) / 2;

        context.drawImage(img, offsetX, offsetY, displayWidth, displayHeight);

        context.strokeStyle = '#f8fafc';
        context.lineWidth = 1.4;
        context.setLineDash([6, 6]);
        context.strokeRect(offsetX, offsetY, displayWidth, displayHeight);
        context.setLineDash([]);

        drawingLines.forEach((line) => {
          context.beginPath();
          context.moveTo(line.start.x, line.start.y);
          context.lineTo(line.end.x, line.end.y);
          context.strokeStyle = '#22d3ee';
          context.lineWidth = 2.5;
          context.stroke();
        });

        if (currentLine) {
          context.beginPath();
          context.moveTo(currentLine.start.x, currentLine.start.y);
          context.lineTo(currentLine.end.x, currentLine.end.y);
          context.strokeStyle = '#f59e0b';
          context.lineWidth = 2.5;
          context.stroke();
        }
      };
      img.src = imageData;
    }

    wallList.forEach((wall) => {
      context.beginPath();
      context.moveTo(wall.start.x, wall.start.y);
      context.lineTo(wall.end.x, wall.end.y);
      context.strokeStyle = '#fef3c7';
      context.lineWidth = 2.5;
      context.stroke();
    });

    context.strokeStyle = '#e2e8f0';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(20, 30);
    context.lineTo(120, 30);
    context.stroke();
    context.fillStyle = '#e2e8f0';
    context.font = '12px sans-serif';
    context.fillText(`Scale: ${referenceLengthMeters}m`, 20, 18);
  }, [currentLine, drawingLines, imageData, referenceLengthMeters, wallList]);

  const getCanvasPoint = (event: React.MouseEvent<HTMLCanvasElement>): TracePoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      return null;
    }

    return { x, y };
  };

  const handlePointerDown = (event: React.MouseEvent<HTMLCanvasElement>): void => {
    const point = getCanvasPoint(event);
    if (!point) {
      return;
    }

    setIsDrawing(true);
    setCurrentLine({ start: point, end: point });
  };

  const handlePointerMove = (event: React.MouseEvent<HTMLCanvasElement>): void => {
    if (!isDrawing) {
      return;
    }

    const point = getCanvasPoint(event);
    if (!point || !currentLine) {
      return;
    }

    setCurrentLine({ start: currentLine.start, end: point });
  };

  const handlePointerUp = (): void => {
    if (!isDrawing || !currentLine) {
      return;
    }

    const newWall = parsePointsToWallSegment(currentLine.start, currentLine.end, scaleMetersPerPixel);
    const parsedWall = WallSegmentSchema.parse(newWall);
    setWalls((previous) => [...previous, parsedWall]);
    setDrawingLines((previous) => [...previous, currentLine]);
    setCurrentLine(null);
    setIsDrawing(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      setImageData(result);
    };
    reader.readAsDataURL(file);
  };

  const handleReferenceScale = (): void => {
    const mpx = referenceLengthMeters / 100;
    setScaleMetersPerPixel(mpx);
  };

  const lines = drawingLines.length > 0 ? drawingLines : wallList.map((wall) => ({
    start: { x: wall.start.x, y: wall.start.y },
    end: { x: wall.end.x, y: wall.end.y },
  }));

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
      <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-3">
        <label className="block text-xs uppercase tracking-[0.2em] text-slate-400">Project name</label>
        <input
          value={projectName}
          onChange={(event) => onProjectNameChange(event.target.value)}
          className="mt-2 w-full rounded border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-slate-100"
        />

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onSave}
            className="flex-1 rounded bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            Save Project
          </button>
          <button
            type="button"
            onClick={onLoad}
            className="flex-1 rounded bg-slate-700 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
          >
            Load Project
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="cursor-pointer rounded-md border border-sky-500 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-200">
          Upload blueprint
          <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleImageUpload} />
        </label>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-950 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-300">
          <span>Reference line length</span>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={referenceLengthMeters}
            onChange={(event) => setReferenceLengthMeters(Number(event.target.value) || 1)}
            className="w-20 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-slate-100"
          />
          <span>m</span>
          <button
            type="button"
            onClick={handleReferenceScale}
            className="rounded bg-slate-700 px-2 py-1 text-xs font-medium text-slate-100 hover:bg-slate-600"
          >
            Apply
          </button>
        </div>

        <canvas
          ref={canvasRef}
          className="h-[520px] w-full cursor-crosshair rounded-md border border-slate-700 bg-slate-950"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Detected rooms</p>
        <div className="mt-3 space-y-2 text-xs text-slate-300">
          {rooms.length === 0 ? (
            <div className="rounded border border-slate-700 bg-slate-800/70 px-2 py-2 text-slate-400">
              No closed room loops detected yet.
            </div>
          ) : (
            rooms.map((room) => (
              <div key={room.id} className="rounded border border-slate-700 bg-slate-800/70 p-2">
                <input
                  value={room.name}
                  onChange={(event) => handleRoomNameChange(room.id, event.target.value)}
                  className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                />
                <div className="mt-1 text-slate-400">{room.floorArea?.toFixed(2) ?? '0.00'} m²</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Wall trace status</p>
        <p className="mt-2 text-sm text-slate-200">{wallList.length} wall segments tracked</p>
        <div className="mt-3 space-y-2 text-xs text-slate-300">
          {lines.slice(-5).map((line, index) => (
            <div key={`${index}-${line.start.x}-${line.start.y}`} className="rounded border border-slate-700 bg-slate-800/70 px-2 py-1">
              {index + 1}: ({line.start.x.toFixed(1)}, {line.start.y.toFixed(1)}) → ({line.end.x.toFixed(1)}, {line.end.y.toFixed(1)})
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
