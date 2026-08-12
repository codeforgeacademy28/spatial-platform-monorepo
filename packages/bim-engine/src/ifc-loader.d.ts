import { IfcAPI } from 'web-ifc';
export interface IfcMeshData {
    expressID: number;
    vertices: number[];
    indices: number[];
}
export interface IfcElementSummary {
    id: number;
    type: string;
    globalId?: string;
    name?: string;
}
export interface IfcParseResult {
    modelId: number;
    meshes: IfcMeshData[];
    elements: IfcElementSummary[];
}
export declare function createIfcApi(): Promise<IfcAPI>;
export declare function getIfcElementSummaries(ifcApi: IfcAPI, modelId: number): IfcElementSummary[];
export declare function collectIfcMeshes(ifcApi: IfcAPI, modelId: number): Promise<IfcMeshData[]>;
export declare function parseIfcFile(buffer: ArrayBuffer): Promise<IfcParseResult>;
//# sourceMappingURL=ifc-loader.d.ts.map