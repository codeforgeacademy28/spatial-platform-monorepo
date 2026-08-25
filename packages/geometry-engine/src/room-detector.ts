import earcut from 'earcut';
import { RoomSchema } from '@spatial/core';
import type { Point, Room, WallSegment } from '@spatial/core';

export interface RoomFloorMesh { roomId: string; vertices: number[]; indices: number[] }
const POINT_TOLERANCE = 0.05;

function pointsMatch(p1: Point, p2: Point, tolerance = POINT_TOLERANCE): boolean { return Math.hypot(p1.x - p2.x, p1.y - p2.y) <= tolerance; }
function calculatePolygonArea(points: Point[]): number { if (points.length < 3) return 0; let area = 0; for (let index = 0; index < points.length; index += 1) { const current = points[index]; const next = points[(index + 1) % points.length]; area += current.x * next.y - next.x * current.y; } return Math.abs(area) / 2; }

function traceLoopFromWall(walls: readonly WallSegment[], startWall: WallSegment, unvisited: Set<string>): { points: Point[]; wallIds: string[] } | null {
  const points: Point[] = [startWall.start];
  const wallIds: string[] = [startWall.id];
  unvisited.delete(startWall.id);
  let previousEndpoint = startWall.start;
  let currentEndpoint = startWall.end;

  for (let step = 0; step < walls.length + 1; step += 1) {
    const nextWalls = walls.filter((wall) => unvisited.has(wall.id) && (pointsMatch(wall.start, currentEndpoint) || pointsMatch(wall.end, currentEndpoint)));
    if (nextWalls.length === 0) return null;

    const nextWall = nextWalls.find((wall) => {
      const otherEndpoint = pointsMatch(wall.start, currentEndpoint) ? wall.end : wall.start;
      return !pointsMatch(otherEndpoint, previousEndpoint);
    }) ?? nextWalls[0];

    const nextEndpoint = pointsMatch(nextWall.start, currentEndpoint) ? nextWall.end : nextWall.start;
    if (pointsMatch(nextEndpoint, startWall.start)) return { points: [...points, startWall.start], wallIds: [...wallIds, nextWall.id] };
    if (points.some((point) => pointsMatch(point, nextEndpoint))) return null;

    points.push(nextEndpoint);
    wallIds.push(nextWall.id);
    unvisited.delete(nextWall.id);
    previousEndpoint = currentEndpoint;
    currentEndpoint = nextEndpoint;
  }
  return null;
}

function normalizeLoop(points: Point[]): Point[] { return points.length >= 2 && pointsMatch(points[0], points[points.length - 1]) ? points.slice(0, -1) : points; }

export function detectClosedRooms(walls: readonly WallSegment[], projectId = 'project-1', roomNamePrefix = 'Room'): Room[] {
  if (walls.length < 3) return [];
  const unvisited = new Set(walls.map((wall) => wall.id));
  const detectedLoops: Array<{ points: Point[]; wallIds: string[] }> = [];

  for (const wall of walls) {
    if (!unvisited.has(wall.id)) continue;
    const loop = traceLoopFromWall(walls, wall, unvisited);
    if (!loop) continue;
    const points = normalizeLoop(loop.points);
    const uniqueWallIds = [...new Set(loop.wallIds)];
    if (points.length < 3 || uniqueWallIds.length < 3) continue;
    const area = calculatePolygonArea(points);
    if (area <= POINT_TOLERANCE * POINT_TOLERANCE) continue;
    detectedLoops.push({ points, wallIds: uniqueWallIds });
  }

  return detectedLoops.map((loop, index) => {
    const roomWallIds = new Set(loop.wallIds);
    const wallSegments = walls.filter((wall) => roomWallIds.has(wall.id));
    return RoomSchema.parse({
      id: `room-${index + 1}`,
      projectId,
      name: `${roomNamePrefix} ${index + 1}`,
      polygon: loop.points,
      wallSegments,
      floorArea: calculatePolygonArea(loop.points),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Room);
  });
}

export function generateRoomFloorMesh(room: Room): RoomFloorMesh {
  if (room.polygon.length < 3) return { roomId: room.id, vertices: [], indices: [] };
  const polygon = normalizeLoop(room.polygon);
  const flattened = polygon.flatMap((point) => [point.x, point.y]);
  const indices = earcut(flattened, null, 2);
  const vertices = polygon.flatMap((point) => [point.x, 0, point.y]);
  return { roomId: room.id, vertices, indices };
}
