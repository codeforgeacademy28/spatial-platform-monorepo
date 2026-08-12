import type { Project } from '@spatial/core';
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
export declare function answerSpatialQuery(project: Project, query: SpatialQuery): SpatialQueryResult;
//# sourceMappingURL=spatial-qa.d.ts.map