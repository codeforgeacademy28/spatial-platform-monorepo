import type { Project, WallSegment } from '@spatial/core';
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
export declare function diffProjects(versionA: Project, versionB: Project): ProjectDiff;
//# sourceMappingURL=version-diff.d.ts.map