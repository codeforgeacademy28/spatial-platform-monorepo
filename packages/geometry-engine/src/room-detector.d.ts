import type { Room, WallSegment } from '@spatial/core';
export interface RoomFloorMesh {
    roomId: string;
    vertices: number[];
    indices: number[];
}
export declare function detectClosedRooms(walls: readonly WallSegment[], projectId?: string, roomNamePrefix?: string): Room[];
export declare function generateRoomFloorMesh(room: Room): RoomFloorMesh;
//# sourceMappingURL=room-detector.d.ts.map