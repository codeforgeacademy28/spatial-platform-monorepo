import type { Room, WallSegment } from '@spatial/core';

interface RoomHighlightListProps {
  rooms: Room[];
  walls: WallSegment[];
  selectedRoomId: string | null;
  onSelect: (roomId: string | null) => void;
}

export function RoomHighlightList({ rooms, walls, selectedRoomId, onSelect }: RoomHighlightListProps): JSX.Element {
  if (!rooms.length) return <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-500">Room selection will appear after a closed room is detected.</div>;
  return (
    <section className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">Room validation</p>
          <h3 className="mt-1 text-sm font-semibold text-white">Select a room to highlight its walls</h3>
        </div>
        <span className="text-xs text-slate-400">{rooms.length} rooms</span>
      </div>
      <div className="mt-3 space-y-2">
        {rooms.map((room) => {
          const roomWallIds = new Set(room.wallSegments.map((wall) => wall.id));
          const availableWalls = walls.filter((wall) => roomWallIds.has(wall.id));
          const selected = selectedRoomId === room.id;
          return (
            <button key={room.id} type="button" onClick={() => onSelect(selected ? null : room.id)} className={`w-full rounded-lg border px-3 py-2 text-left transition ${selected ? 'border-violet-300 bg-violet-500/20' : 'border-slate-700 bg-slate-900 hover:border-violet-400/60'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-white">{room.name}</span>
                <span className="text-xs text-slate-400">{availableWalls.length} walls</span>
              </div>
              <div className="mt-1 text-xs text-slate-400">{room.floorArea.toFixed(2)} m²</div>
              {selected ? <div className="mt-2 text-[11px] text-violet-200">Highlighted in 2D and 3D. Click again to clear.</div> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
