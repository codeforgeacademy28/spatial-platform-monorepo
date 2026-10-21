import type { WallSegment } from '@spatial/core';

export interface NavigationOffset { x: number; y: number }
export interface NavigationMovement { x: number; y: number }

function distanceToSegment(x: number, y: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq <= Number.EPSILON) return Math.hypot(x - ax, y - ay);
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / lengthSq));
  return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
}

export function collidesWithWallPosition(
  x: number,
  y: number,
  walls: readonly WallSegment[],
  offset: NavigationOffset = { x: 0, y: 0 },
  playerRadius = 0.32,
): boolean {
  return walls.some((wall) => {
    const clearance = playerRadius + Math.max(wall.thickness * 0.5, 0.02);
    return distanceToSegment(
      x,
      y,
      wall.start.x + offset.x,
      wall.start.y + offset.y,
      wall.end.x + offset.x,
      wall.end.y + offset.y,
    ) < clearance;
  });
}

export function movementBlockedByWalls(
  startX: number,
  startY: number,
  deltaX: number,
  deltaY: number,
  walls: readonly WallSegment[],
  offset: NavigationOffset = { x: 0, y: 0 },
  playerRadius = 0.32,
  maxStep = 0.06,
): boolean {
  const distance = Math.hypot(deltaX, deltaY);
  const samples = Math.max(2, Math.ceil(distance / maxStep));
  for (let index = 1; index <= samples; index += 1) {
    const progress = index / samples;
    if (collidesWithWallPosition(startX + deltaX * progress, startY + deltaY * progress, walls, offset, playerRadius)) return true;
  }
  return false;
}

export function resolveMovementWithWalls(
  startX: number,
  startY: number,
  movement: NavigationMovement,
  walls: readonly WallSegment[],
  offset: NavigationOffset = { x: 0, y: 0 },
  playerRadius = 0.32,
): NavigationMovement {
  if ((movement.x === 0 && movement.y === 0) || walls.length === 0) return movement;

  if (!movementBlockedByWalls(startX, startY, movement.x, movement.y, walls, offset, playerRadius)) return movement;

  const xOnly: NavigationMovement = { x: movement.x, y: 0 };
  const yOnly: NavigationMovement = { x: 0, y: movement.y };
  const canMoveX = movement.x !== 0 && !movementBlockedByWalls(startX, startY, xOnly.x, xOnly.y, walls, offset, playerRadius);
  const canMoveY = movement.y !== 0 && !movementBlockedByWalls(startX, startY, yOnly.x, yOnly.y, walls, offset, playerRadius);

  if (canMoveX && canMoveY) return { x: movement.x, y: movement.y };
  if (canMoveX) return xOnly;
  if (canMoveY) return yOnly;
  return { x: 0, y: 0 };
}
