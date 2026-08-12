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
export declare function useSpatialActionDispatcher(walls: WallSegment[], rooms: Room[], setWalls: React.Dispatch<React.SetStateAction<WallSegment[]>>, setRooms: React.Dispatch<React.SetStateAction<Room[]>>): {
    dispatchSpatialAction: (action: SpatialActionCommand) => string;
};
//# sourceMappingURL=useSpatialActionDispatcher.d.ts.map