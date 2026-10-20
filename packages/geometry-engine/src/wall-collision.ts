export interface CollisionPoint2D { x: number; y: number; }
export interface CollisionWall2D { start: CollisionPoint2D; end: CollisionPoint2D; thickness: number; }

function cross(ax: number, ay: number, bx: number, by: number): number {
  return ax * by - ay * bx;
}

export function distancePointToSegment2D(point: CollisionPoint2D, start: CollisionPoint2D, end: CollisionPoint2D): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

function segmentsIntersect(a: CollisionPoint2D, b: CollisionPoint2D, c: CollisionPoint2D, d: CollisionPoint2D): boolean {
  const rx = b.x - a.x; const ry = b.y - a.y;
  const sx = d.x - c.x; const sy = d.y - c.y;
  const denominator = cross(rx, ry, sx, sy);
  if (Math.abs(denominator) < 1e-8) return false;
  const qpx = c.x - a.x; const qpy = c.y - a.y;
  const t = cross(qpx, qpy, sx, sy) / denominator;
  const u = cross(qpx, qpy, rx, ry) / denominator;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

function distanceSegmentToSegment(a: CollisionPoint2D, b: CollisionPoint2D, c: CollisionPoint2D, d: CollisionPoint2D): number {
  if (segmentsIntersect(a, b, c, d)) return 0;
  return Math.min(distancePointToSegment2D(a, c, d), distancePointToSegment2D(b, c, d), distancePointToSegment2D(c, a, b), distancePointToSegment2D(d, a, b));
}

/**
 * Swept-circle collision query for a player moving from previous to next.
 * The caller can resolve a blocked vector along each axis to allow wall sliding.
 * A player already overlapping clearance may move outward to recover, but not
 * farther into the wall. Door/window gaps must be represented as separate wall segments.
 */
export function isCircleMovementBlockedByWall(
  previous: CollisionPoint2D,
  next: CollisionPoint2D,
  wall: CollisionWall2D,
  playerRadius: number,
): boolean {
  if (![previous.x, previous.y, next.x, next.y, wall.start.x, wall.start.y, wall.end.x, wall.end.y, wall.thickness, playerRadius].every(Number.isFinite)) return true;
  if (wall.thickness < 0 || playerRadius < 0) return true;
  const clearance = playerRadius + Math.max(0.01, wall.thickness / 2);
  const previousDistance = distancePointToSegment2D(previous, wall.start, wall.end);
  const nextDistance = distancePointToSegment2D(next, wall.start, wall.end);
  if (nextDistance < clearance && nextDistance < previousDistance - 1e-8) return true;

  const sweptDistance = distanceSegmentToSegment(previous, next, wall.start, wall.end);
  if (sweptDistance >= clearance) return false;
  const wx = wall.end.x - wall.start.x;
  const wy = wall.end.y - wall.start.y;
  const previousSide = cross(wx, wy, previous.x - wall.start.x, previous.y - wall.start.y);
  const nextSide = cross(wx, wy, next.x - wall.start.x, next.y - wall.start.y);
  return previousSide * nextSide <= 0;
}
