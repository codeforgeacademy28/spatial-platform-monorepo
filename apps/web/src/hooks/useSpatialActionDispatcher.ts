import { useCallback } from 'react';
import type { Room, WallSegment } from '@spatial/core';

export type MoveWallCommand = {
  wallId: string;
  deltaX: number;
  deltaY: number;
};

export type ResizeRoomCommand = {
  roomId: string;
  percentage: number;
};

export type ChangeMaterialCommand = {
  targetId: string;
  colorHex: string;
};

export type SpatialQueryCommand = {
  queryType: 'clearance' | 'area';
  objectId: string;
};

export type SpatialActionCommand = MoveWallCommand | ResizeRoomCommand | ChangeMaterialCommand | SpatialQueryCommand;

function isMoveWallCommand(action: SpatialActionCommand): action is MoveWallCommand {
  return 'wallId' in action && 'deltaX' in action && 'deltaY' in action;
}

function isResizeRoomCommand(action: SpatialActionCommand): action is ResizeRoomCommand {
  return 'roomId' in action && 'percentage' in action;
}

function isChangeMaterialCommand(action: SpatialActionCommand): action is ChangeMaterialCommand {
  return 'targetId' in action && 'colorHex' in action;
}

function isSpatialQueryCommand(action: SpatialActionCommand): action is SpatialQueryCommand {
  return 'queryType' in action && 'objectId' in action;
}

function computeLength(start: { x: number; y: number }, end: { x: number; y: number }): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return Math.hypot(dx, dy);
}

function getCentroid(points: Array<{ x: number; y: number }>): { x: number; y: number } {
  const total = points.length;
  const summed = points.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 },
  );

  return {
    x: summed.x / total,
    y: summed.y / total,
  };
}

function scalePolygon(
  points: Array<{ x: number; y: number }>,
  factor: number,
): Array<{ x: number; y: number }> {
  const centroid = getCentroid(points);
  return points.map((point) => ({
    x: centroid.x + (point.x - centroid.x) * factor,
    y: centroid.y + (point.y - centroid.y) * factor,
  }));
}

export function useSpatialActionDispatcher(
  walls: WallSegment[],
  rooms: Room[],
  setWalls: React.Dispatch<React.SetStateAction<WallSegment[]>>,
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>,
) {
  const dispatchSpatialAction = useCallback(
    (action: SpatialActionCommand): string => {
      if (isMoveWallCommand(action)) {
        setWalls((previous) =>
          previous.map((wall) =>
            wall.id !== action.wallId
              ? wall
              : {
                  ...wall,
                  start: {
                    x: wall.start.x + action.deltaX,
                    y: wall.start.y + action.deltaY,
                  },
                  end: {
                    x: wall.end.x + action.deltaX,
                    y: wall.end.y + action.deltaY,
                  },
                  length: computeLength(
                    { x: wall.start.x + action.deltaX, y: wall.start.y + action.deltaY },
                    { x: wall.end.x + action.deltaX, y: wall.end.y + action.deltaY },
                  ),
                  updatedAt: new Date().toISOString(),
                },
          ),
        );

        return `Moved wall ${action.wallId} by (${action.deltaX}, ${action.deltaY}).`;
      }

      if (isChangeMaterialCommand(action)) {
        const targetWall = walls.find((wall) => wall.id === action.targetId);
        if (targetWall) {
          setWalls((previous) =>
            previous.map((wall) =>
              wall.id !== action.targetId
                ? wall
                : { ...wall, materialHex: action.colorHex, updatedAt: new Date().toISOString() },
            ),
          );
          return `Changed wall ${action.targetId} to ${action.colorHex}.`;
        }

        const targetRoom = rooms.find((room) => room.id === action.targetId);
        if (targetRoom) {
          const roomWallIds = new Set(targetRoom.wallSegments.map((segment) => segment.id));
          setWalls((previous) =>
            previous.map((wall) =>
              roomWallIds.has(wall.id)
                ? { ...wall, materialHex: action.colorHex, updatedAt: new Date().toISOString() }
                : wall,
            ),
          );
          return `Changed material for room ${action.targetId} to ${action.colorHex}.`;
        }

        setWalls((previous) =>
          previous.map((wall) => ({
            ...wall,
            materialHex: action.colorHex,
            updatedAt: new Date().toISOString(),
          })),
        );
        return `Updated all walls to ${action.colorHex}.`;
      }

      if (isResizeRoomCommand(action)) {
        const room = rooms.find((currentRoom) => currentRoom.id === action.roomId);
        if (!room) {
          return `Room ${action.roomId} was not found.`;
        }

        const factor = 1 + action.percentage / 100;
        const scaledPolygon = scalePolygon(room.polygon, factor);
        const nextWallSegments = room.wallSegments.map((segment, index) => {
          const start = scaledPolygon[index];
          const end = scaledPolygon[(index + 1) % scaledPolygon.length];
          return {
            ...segment,
            start,
            end,
            length: computeLength(start, end),
            updatedAt: new Date().toISOString(),
          };
        });

        const roomIds = new Set(room.wallSegments.map((segment) => segment.id));
        setWalls((previous) =>
          previous.map((wall) =>
            roomIds.has(wall.id)
              ? nextWallSegments.find((segment) => segment.id === wall.id) ?? wall
              : wall,
          ),
        );

        setRooms((previous) =>
          previous.map((currentRoom) =>
            currentRoom.id !== action.roomId
              ? currentRoom
              : {
                  ...currentRoom,
                  polygon: scaledPolygon.map((point) => ({ x: point.x, y: point.y })),
                  wallSegments: nextWallSegments,
                  updatedAt: new Date().toISOString(),
                },
          ),
        );

        return `Resized room ${action.roomId} by ${action.percentage}%.`;
      }

      if (isSpatialQueryCommand(action)) {
        return `Spatial query for ${action.queryType} on ${action.objectId} cannot be applied directly to the scene.`;
      }

      return 'Received unrecognized spatial action.';
    },
    [rooms, setRooms, setWalls, walls],
  );

  return { dispatchSpatialAction };
}
