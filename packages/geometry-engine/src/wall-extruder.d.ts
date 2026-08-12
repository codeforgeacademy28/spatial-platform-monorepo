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
export declare function extrudeWallSegment(wall: Pick<WallSegment, 'id' | 'start' | 'end' | 'thickness' | 'height'>): WallExtrusion;
export declare function extrudeWallSegments(walls: ReadonlyArray<Pick<WallSegment, 'id' | 'start' | 'end' | 'thickness' | 'height'>>): readonly WallExtrusion[];
//# sourceMappingURL=wall-extruder.d.ts.map