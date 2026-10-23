import type { WallOpening, WallSegment } from '@spatial/core';

interface Interval { start: number; end: number }

/**
 * Produces collision-only wall segments with open door spans removed.
 * Rendering must continue to use the original walls plus wall-opening geometry.
 */
export function wallsWithPassableOpenings(
  walls: readonly WallSegment[],
  openings: readonly WallOpening[],
): WallSegment[] {
  const result: WallSegment[] = [];
  for (const wall of walls) {
    const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
    if (length <= 0.001) continue;
    const intervals: Interval[] = openings
      .filter((opening) => opening.wallId === wall.id && opening.type === 'door' && opening.doorState === 'open')
      .map((opening) => ({
        start: Math.max(0, opening.offset - opening.width / 2),
        end: Math.min(length, opening.offset + opening.width / 2),
      }))
      .filter((interval) => interval.end - interval.start > 0.001)
      .sort((a, b) => a.start - b.start);
    if (!intervals.length) {
      result.push(wall);
      continue;
    }

    const merged: Interval[] = [];
    for (const interval of intervals) {
      const previous = merged[merged.length - 1];
      if (previous && interval.start <= previous.end) previous.end = Math.max(previous.end, interval.end);
      else merged.push({ ...interval });
    }

    const dx = (wall.end.x - wall.start.x) / length;
    const dy = (wall.end.y - wall.start.y) / length;
    const appendSegment = (startDistance: number, endDistance: number, suffix: string): void => {
      if (endDistance - startDistance <= 0.001) return;
      const start = { x: wall.start.x + dx * startDistance, y: wall.start.y + dy * startDistance };
      const end = { x: wall.start.x + dx * endDistance, y: wall.start.y + dy * endDistance };
      result.push({
        ...wall,
        id: `${wall.id}:passage:${suffix}`,
        start,
        end,
        length: endDistance - startDistance,
      });
    };

    let cursor = 0;
    merged.forEach((interval, index) => {
      appendSegment(cursor, interval.start, `before-${index}`);
      cursor = Math.max(cursor, interval.end);
    });
    appendSegment(cursor, length, 'after');
  }
  return result;
}
