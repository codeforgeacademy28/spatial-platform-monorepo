import type { WallSegment } from '@spatial/core';

export interface Vertex3D {
  x: number;
  y: number;
  z: number;
}

export interface WallFace {
  vertices: readonly [Vertex3D, Vertex3D, Vertex3D, Vertex3D];
}

export interface WallExtrusion {
  id: string;
  bottomCorners: readonly Vertex3D[];
  topCorners: readonly Vertex3D[];
  polygonCornerJoins: {
    bottom: readonly Vertex3D[];
    top: readonly Vertex3D[];
  };
  vertices: readonly Vertex3D[];
  faces: readonly WallFace[];
}

function toVertex3D(x: number, y: number, z: number): Vertex3D {
  return { x, y, z };
}

export function extrudeWallSegment(
  wall: Pick<WallSegment, 'id' | 'start' | 'end' | 'thickness' | 'height'>,
): WallExtrusion {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const length = Math.hypot(dx, dy);

  const normalX = length > 0 ? -(dy / length) : 0;
  const normalY = length > 0 ? dx / length : 0;
  const halfThickness = wall.thickness / 2;

  const offsetX = normalX * halfThickness;
  const offsetY = normalY * halfThickness;

  const bottomA = toVertex3D(wall.start.x + offsetX, wall.start.y + offsetY, 0);
  const bottomB = toVertex3D(wall.end.x + offsetX, wall.end.y + offsetY, 0);
  const bottomC = toVertex3D(wall.end.x - offsetX, wall.end.y - offsetY, 0);
  const bottomD = toVertex3D(wall.start.x - offsetX, wall.start.y - offsetY, 0);

  const topA = toVertex3D(bottomA.x, bottomA.y, wall.height);
  const topB = toVertex3D(bottomB.x, bottomB.y, wall.height);
  const topC = toVertex3D(bottomC.x, bottomC.y, wall.height);
  const topD = toVertex3D(bottomD.x, bottomD.y, wall.height);

  const bottomCorners: readonly Vertex3D[] = [bottomA, bottomB, bottomC, bottomD];
  const topCorners: readonly Vertex3D[] = [topA, topB, topC, topD];

  const vertices: readonly Vertex3D[] = [...bottomCorners, ...topCorners];

  const faces: readonly WallFace[] = [
    { vertices: [bottomA, bottomB, bottomC, bottomD] },
    { vertices: [topA, topB, topC, topD] },
    { vertices: [bottomA, bottomB, topB, topA] },
    { vertices: [bottomB, bottomC, topC, topB] },
    { vertices: [bottomC, bottomD, topD, topC] },
    { vertices: [bottomD, bottomA, topA, topD] },
  ];

  return {
    id: wall.id,
    bottomCorners,
    topCorners,
    polygonCornerJoins: {
      bottom: bottomCorners,
      top: topCorners,
    },
    vertices,
    faces,
  };
}

export function extrudeWallSegments(
  walls: ReadonlyArray<Pick<WallSegment, 'id' | 'start' | 'end' | 'thickness' | 'height'>>,
): readonly WallExtrusion[] {
  return walls.map((wall) => extrudeWallSegment(wall));
}
