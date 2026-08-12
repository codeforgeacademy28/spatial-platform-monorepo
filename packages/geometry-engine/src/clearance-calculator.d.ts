import type { Point, Room, WallSegment } from '@spatial/core';
export interface BoundingBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}
export declare function getBoundingBoxForPoints(points: Point[]): BoundingBox;
export declare function getBoundingBoxForWallSegment(wall: WallSegment): BoundingBox;
export declare function getEdgeSegmentsForBox(box: BoundingBox): Array<{
    start: Point;
    end: Point;
}>;
export declare function calculateBoxToSegmentDistance(box: BoundingBox, wall: WallSegment): number;
export declare function calculateMinimumClearanceBetweenRoomAndWalls(room: Room, allWalls: readonly WallSegment[]): number;
export declare function calculateMinimumClearanceBetweenWallAndWalls(wall: WallSegment, allWalls: readonly WallSegment[]): number;
export declare function calculateRoomArea(room: Room): number;
//# sourceMappingURL=clearance-calculator.d.ts.map