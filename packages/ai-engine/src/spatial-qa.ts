import type { Project, Room, WallSegment } from '@spatial/core';
import {
  calculateMinimumClearanceBetweenRoomAndWalls,
  calculateMinimumClearanceBetweenWallAndWalls,
  calculateRoomArea,
} from '@spatial/geometry-engine';

export interface SpatialQuery {
  queryType: 'clearance' | 'area';
  objectId: string;
}

export interface SpatialQueryResult {
  queryType: 'clearance' | 'area';
  objectId: string;
  answer: string;
  value?: number;
  units?: 'meters' | 'square_meters';
  passed?: boolean;
}

function findRoomById(project: Project, roomId: string): Room | undefined {
  return project.rooms.find((room: Room) => room.id === roomId);
}

function findWallById(project: Project, wallId: string): WallSegment | undefined {
  return project.rooms
    .flatMap((room: Room) => room.wallSegments)
    .find((wall: WallSegment) => wall.id === wallId);
}

export function answerSpatialQuery(project: Project, query: SpatialQuery): SpatialQueryResult {
  const { objectId, queryType } = query;
  const room = findRoomById(project, objectId);

  if (queryType === 'area') {
    if (!room) {
      return {
        queryType,
        objectId,
        answer: `Room with ID ${objectId} was not found in the project.`,
      };
    }

    const area = calculateRoomArea(room);
    return {
      queryType,
      objectId,
      answer: `The floor area for room ${room.name} (${room.id}) is ${area.toFixed(2)} square meters.`,
      value: area,
      units: 'square_meters',
      passed: area > 0,
    };
  }

  const wall = findWallById(project, objectId);
  if (room) {
    const allWalls = project.rooms.flatMap((currentRoom: Room) => currentRoom.wallSegments);
    const clearance = calculateMinimumClearanceBetweenRoomAndWalls(room, allWalls);
    const passed = clearance >= 1;
    return {
      queryType,
      objectId,
      answer: `The minimum clearance around room ${room.name} (${room.id}) is ${clearance.toFixed(2)} meters.${
        passed ? ' This meets a 1 meter clearance threshold.' : ' This is below the recommended 1 meter clearance.'
      }`,
      value: clearance,
      units: 'meters',
      passed,
    };
  }

  if (wall) {
    const allWalls = project.rooms.flatMap((currentRoom: Room) => currentRoom.wallSegments);
    const clearance = calculateMinimumClearanceBetweenWallAndWalls(wall, allWalls);
    const passed = clearance >= 0.3;
    return {
      queryType,
      objectId,
      answer: `The minimum clearance around wall ${wall.id} is ${clearance.toFixed(2)} meters.${
        passed ? ' This is above a 0.3 meter buffer.' : ' This is below the suggested minimum clearance.'
      }`,
      value: clearance,
      units: 'meters',
      passed,
    };
  }

  return {
    queryType,
    objectId,
    answer: `No room or wall with ID ${objectId} was found in the project.`,
  };
}
