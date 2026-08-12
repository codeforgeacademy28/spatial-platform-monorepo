import { type SpatialComment } from '@spatial/collaboration';
import type { Point, Room, WallSegment } from '@spatial/core';
interface SpatialCanvasProps {
    projectId?: string;
    walls: WallSegment[];
    rooms: Room[];
    points: Point[];
    readOnly?: boolean;
    onCommentAdd?: (comment: SpatialComment) => void;
}
export declare function SpatialCanvas({ projectId, walls, rooms, points, readOnly, onCommentAdd, }: SpatialCanvasProps): JSX.Element;
export {};
//# sourceMappingURL=SpatialCanvas.d.ts.map