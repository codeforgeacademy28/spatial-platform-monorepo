import type { Point, Project, WallSegment } from '@spatial/core';

export type DiffChangeType = 'added' | 'removed' | 'shifted' | 'unchanged';

export interface WallDiffResult {
  wall: WallSegment;
  changeType: DiffChangeType;
  comparedWall?: WallSegment;
}

export interface ProjectDiff {
  versionA: Project;
  versionB: Project;
  wallsA: WallDiffResult[];
  wallsB: WallDiffResult[];
  stats: {
    addedCount: number;
    removedCount: number;
    shiftedCount: number;
    unchangedCount: number;
  };
}

function getProjectWalls(project: Project): WallSegment[] {
  return project.walls.length > 0 ? project.walls : project.rooms.flatMap((room) => room.wallSegments);
}

function pointsMatch(p1: Point, p2: Point, tolerance = 0.05): boolean {
  return Math.abs(p1.x - p2.x) <= tolerance && Math.abs(p1.y - p2.y) <= tolerance;
}

function wallGeometryMatches(w1: WallSegment, w2: WallSegment, tolerance = 0.05): boolean {
  const directMatch = pointsMatch(w1.start, w2.start, tolerance) && pointsMatch(w1.end, w2.end, tolerance);
  const reverseMatch = pointsMatch(w1.start, w2.end, tolerance) && pointsMatch(w1.end, w2.start, tolerance);
  return (directMatch || reverseMatch) && Math.abs(w1.thickness - w2.thickness) <= tolerance && Math.abs(w1.height - w2.height) <= tolerance;
}

function wallMoved(w1: WallSegment, w2: WallSegment): boolean {
  const sameEndpoint = pointsMatch(w1.start, w2.start) || pointsMatch(w1.start, w2.end) || pointsMatch(w1.end, w2.start) || pointsMatch(w1.end, w2.end);
  return sameEndpoint || w1.id === w2.id;
}

export function diffProjects(versionA: Project, versionB: Project): ProjectDiff {
  const wallsA = getProjectWalls(versionA);
  const wallsB = getProjectWalls(versionB);
  const diffsA: WallDiffResult[] = [];
  const diffsB: WallDiffResult[] = [];
  const matchedBIds = new Set<string>();
  let addedCount = 0;
  let removedCount = 0;
  let shiftedCount = 0;
  let unchangedCount = 0;

  for (const wallA of wallsA) {
    const exactMatchB = wallsB.find((wallB) => !matchedBIds.has(wallB.id) && wallGeometryMatches(wallA, wallB));
    if (exactMatchB) {
      matchedBIds.add(exactMatchB.id);
      diffsA.push({ wall: wallA, changeType: 'unchanged', comparedWall: exactMatchB });
      unchangedCount += 1;
      continue;
    }

    const movedMatchB = wallsB.find((wallB) => !matchedBIds.has(wallB.id) && wallMoved(wallA, wallB));
    if (movedMatchB) {
      matchedBIds.add(movedMatchB.id);
      diffsA.push({ wall: wallA, changeType: 'shifted', comparedWall: movedMatchB });
      shiftedCount += 1;
      continue;
    }

    diffsA.push({ wall: wallA, changeType: 'removed' });
    removedCount += 1;
  }

  for (const wallB of wallsB) {
    const matchInA = diffsA.find((diff) => diff.comparedWall?.id === wallB.id);
    if (matchInA) {
      diffsB.push({ wall: wallB, changeType: matchInA.changeType, comparedWall: matchInA.wall });
    } else {
      diffsB.push({ wall: wallB, changeType: 'added' });
      addedCount += 1;
    }
  }

  return { versionA, versionB, wallsA: diffsA, wallsB: diffsB, stats: { addedCount, removedCount, shiftedCount, unchangedCount } };
}
