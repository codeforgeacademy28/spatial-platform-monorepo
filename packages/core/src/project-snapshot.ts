import type { Project, Room, WallSegment } from './index.js';

function cloneWall(wall: WallSegment): WallSegment {
  return { ...wall, start: { ...wall.start }, end: { ...wall.end } };
}

function cloneRoom(room: Room): Room {
  return { ...room, polygon: room.polygon.map((point) => ({ ...point })), wallSegments: room.wallSegments.map(cloneWall) };
}

export function cloneProject(project: Project): Project {
  return { ...project, walls: project.walls.map(cloneWall), rooms: project.rooms.map(cloneRoom) };
}
