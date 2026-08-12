import { IfcAPI } from 'web-ifc';
export async function createIfcApi() {
    const ifcApi = new IfcAPI();
    await ifcApi.Init();
    return ifcApi;
}
export function getIfcElementSummaries(ifcApi, modelId) {
    const elementTypes = ['IFCWALL', 'IFCDOOR', 'IFCWINDOW'];
    const summaries = [];
    for (const typeName of elementTypes) {
        const typeCode = ifcApi.GetTypeCodeFromName(typeName);
        if (typeCode == null || Number.isNaN(typeCode)) {
            continue;
        }
        const ids = ifcApi.GetLineIDsWithType(modelId, typeCode, true);
        if (!ids) {
            continue;
        }
        for (let index = 0; index < ids.size(); index += 1) {
            const expressID = ids.get(index);
            if (typeof expressID !== 'number') {
                continue;
            }
            const line = ifcApi.GetLine(modelId, expressID, true);
            summaries.push({
                id: expressID,
                type: typeName,
                globalId: line?.GlobalId,
                name: line?.Name,
            });
        }
    }
    return summaries;
}
export function collectIfcMeshes(ifcApi, modelId) {
    const meshes = [];
    return new Promise((resolve, reject) => {
        try {
            ifcApi.StreamAllMeshes(modelId, (mesh) => {
                for (let index = 0; index < mesh.geometries.size(); index += 1) {
                    const placed = mesh.geometries.get(index);
                    if (!placed) {
                        continue;
                    }
                    const geometry = ifcApi.GetGeometry(modelId, placed.geometryExpressID);
                    if (!geometry) {
                        continue;
                    }
                    const vertexPtr = geometry.GetVertexData();
                    const indexPtr = geometry.GetIndexData();
                    const vertexCount = geometry.GetVertexDataSize();
                    const indexCount = geometry.GetIndexDataSize();
                    const vertexArray = ifcApi.GetVertexArray(vertexPtr, vertexCount);
                    const indexArray = ifcApi.GetIndexArray(indexPtr, indexCount);
                    meshes.push({
                        expressID: mesh.expressID,
                        vertices: Array.from(vertexArray),
                        indices: Array.from(indexArray),
                    });
                }
                mesh.delete();
            });
            resolve(meshes);
        }
        catch (error) {
            reject(error);
        }
    });
}
export async function parseIfcFile(buffer) {
    const ifcApi = await createIfcApi();
    const uint8Array = new Uint8Array(buffer);
    const modelId = ifcApi.OpenModel(uint8Array);
    if (modelId < 0) {
        ifcApi.Dispose();
        throw new Error('Failed to open IFC model.');
    }
    const [elements, meshes] = await Promise.all([
        Promise.resolve(getIfcElementSummaries(ifcApi, modelId)),
        collectIfcMeshes(ifcApi, modelId),
    ]);
    return {
        modelId,
        elements,
        meshes,
    };
}
//# sourceMappingURL=ifc-loader.js.map