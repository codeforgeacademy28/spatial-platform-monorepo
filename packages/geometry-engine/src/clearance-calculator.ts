import type { Point, Room, WallSegment } from '@spatial/core';

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function getBoundingBoxForPoints(points: Point[]): BoundingBox {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);

  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

export function getBoundingBoxForWallSegment(wall: WallSegment): BoundingBox {
  return getBoundingBoxForPoints([wall.start, wall.end]);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function distancePointToLineSegment(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy);
  const clamped = clamp(t, 0, 1);
  const projection = {
    x: start.x + clamped * dx,
    y: start.y + clamped * dy,
  };

  return Math.hypot(point.x - projection.x, point.y - projection.y);
}

function distanceSegmentToSegment(aStart: Point, aEnd: Point, bStart: Point, bEnd: Point): number {
  const distances = [
    distancePointToLineSegment(aStart, bStart, bEnd),
    distancePointToLineSegment(aEnd, bStart, bEnd),
    distancePointToLineSegment(bStart, aStart, aEnd),
    distancePointToLineSegment(bEnd, aStart, aEnd),
  ];

  return Math.min(...distances);
}

export function getEdgeSegmentsForBox(box: BoundingBox): Array<{ start: Point; end: Point }> {
  return [
    { start: { x: box.minX, y: box.minY }, end: { x: box.maxX, y: box.minY } },
    { start: { x: box.maxX, y: box.minY }, end: { x: box.maxX, y: box.maxY } },
    { start: { x: box.maxX, y: box.maxY }, end: { x: box.minX, y: box.maxY } },
    { start: { x: box.minX, y: box.maxY }, end: { x: box.minX, y: box.minY } },
  ];
}

export function calculateBoxToSegmentDistance(box: BoundingBox, wall: WallSegment): number {
  const wallStart = wall.start;
  const wallEnd = wall.end;
  const boxEdges = getEdgeSegmentsForBox(box);

  return Math.min(...boxEdges.map((edge) => distanceSegmentToSegment(edge.start, edge.end, wallStart, wallEnd)));
}

export function calculateMinimumClearanceBetweenRoomAndWalls(room: Room, allWalls: readonly WallSegment[]): number {
  const roomBox = getBoundingBoxForPoints(room.polygon);
  const roomWallIds = new Set(room.wallSegments.map((wall) => wall.id));
  const adjacentWalls = allWalls.filter((wall) => !roomWallIds.has(wall.id));

  if (adjacentWalls.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.min(...adjacentWalls.map((wall) => calculateBoxToSegmentDistance(roomBox, wall)));
}

export function calculateMinimumClearanceBetweenWallAndWalls(
  wall: WallSegment,
  allWalls: readonly WallSegment[],
): number {
  const wallBox = getBoundingBoxForWallSegment(wall);
  const adjacentWalls = allWalls.filter((candidate) => candidate.id !== wall.id);

  if (adjacentWalls.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.min(...adjacentWalls.map((candidate) => calculateBoxToSegmentDistance(wallBox, candidate)));
}

export function calculateRoomArea(room: Room): number {
  if (room.polygon.length < 3) {
    return 0;
  }

  let sum = 0;
  for (let index = 0; index < room.polygon.length; index += 1) {
    const current = room.polygon[index];
    const next = room.polygon[(index + 1) % room.polygon.length];
    sum += current.x * next.y - next.x * current.y;
  }

  return Math.abs(sum) / 2;
}
