import type { Room, WallSegment } from '@spatial/core';

interface RoomHighlightListProps {
  rooms: Room[];
  walls: WallSegment[];
  selectedRoomId: string | null;
  onSelect: (roomId: string | null) => void;
  onFloorMaterialChange: (roomId: string, color: string) => void;
}

export function RoomHighlightList({ rooms, walls, selectedRoomId, onSelect, onFloorMaterialChange }: RoomHighlightListProps): JSX.Element {
  if (!rooms.length) return <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-500">Room selection will appear after a closed room is detected.</div>;
  return (
    <section className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">Room validation</p>
          <h3 className="mt-1 text-sm font-semibold text-white">Rooms & floor finishes</h3>
        </div>
        <span className="text-xs text-slate-400">{rooms.length} rooms</span>
      </div>
      <div className="mt-3 space-y-2">
        {rooms.map((room) => {
          const roomWallIds = new Set(room.wallSegments.map((wall) => wall.id));
          const availableWalls = walls.filter((wall) => roomWallIds.has(wall.id));
          const selected = selectedRoomId === room.id;
          const floorAreaLabel = typeof room.floorArea === 'number' ? `${room.floorArea.toFixed(2)} m²` : 'Area unavailable';
          return (
            <div key={room.id} className={`rounded-lg border p-2 transition ${selected ? 'border-violet-300 bg-violet-500/20' : 'border-slate-700 bg-slate-900'}`}>
              <button type="button" onClick={() => onSelect(selected ? null : room.id)} aria-pressed={selected} className="w-full rounded-md px-1 py-1 text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white">{room.name}</span>
                  <span className="text-xs text-slate-400">{availableWalls.length} walls</span>
                </div>
                <div className="mt-1 text-xs text-slate-400">{floorAreaLabel}</div>
                {selected ? <div className="mt-2 text-[11px] text-violet-200">Highlighted in 2D and 3D.</div> : null}
              </button>
              {selected ? <label htmlFor={`room-floor-material-${room.id}`} className="mt-2 flex items-center justify-between gap-3 border-t border-violet-300/20 pt-2 text-xs text-slate-300">Floor finish
                <input id={`room-floor-material-${room.id}`} type="color" value={room.floorMaterialHex ?? '#cbd5e1'} onChange={(event) => onFloorMaterialChange(room.id, event.target.value)} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0" />
              </label> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
