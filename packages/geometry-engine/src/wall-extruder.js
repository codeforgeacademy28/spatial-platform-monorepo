function toVertex3D(x, y, z) {
    return { x, y, z };
}
export function extrudeWallSegment(wall) {
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const length = Math.hypot(dx, dy);
    const normalX = length > 0 ? -(dy / length) : 0;
    const normalY = length > 0 ? dx / length : 0;
    const halfThickness = wall.thickness / 2;
    const offsetX = normalX * halfThickness;
    const offsetY = normalY * halfThickness;
    const bottomA = toVertex3D(wall.start.x + offsetX, wall.start.y + offsetY, 0);
    const bottomB = toVertex3D(wall.end.x + offsetX, wall.end.y + offsetY, 0);
    const bottomC = toVertex3D(wall.end.x - offsetX, wall.end.y - offsetY, 0);
    const bottomD = toVertex3D(wall.start.x - offsetX, wall.start.y - offsetY, 0);
    const topA = toVertex3D(bottomA.x, bottomA.y, wall.height);
    const topB = toVertex3D(bottomB.x, bottomB.y, wall.height);
    const topC = toVertex3D(bottomC.x, bottomC.y, wall.height);
    const topD = toVertex3D(bottomD.x, bottomD.y, wall.height);
    const bottomCorners = [bottomA, bottomB, bottomC, bottomD];
    const topCorners = [topA, topB, topC, topD];
    const vertices = [...bottomCorners, ...topCorners];
    const faces = [
        { vertices: [bottomA, bottomB, bottomC, bottomD] },
        { vertices: [topA, topB, topC, topD] },
        { vertices: [bottomA, bottomB, topB, topA] },
        { vertices: [bottomB, bottomC, topC, topB] },
        { vertices: [bottomC, bottomD, topD, topC] },
        { vertices: [bottomD, bottomA, topA, topD] },
    ];
    return {
        id: wall.id,
        bottomCorners,
        topCorners,
        polygonCornerJoins: {
            bottom: bottomCorners,
            top: topCorners,
        },
        vertices,
        faces,
    };
}
export function extrudeWallSegments(walls) {
    return walls.map((wall) => extrudeWallSegment(wall));
}
//# sourceMappingURL=wall-extruder.js.map