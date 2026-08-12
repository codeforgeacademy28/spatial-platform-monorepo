function pointsMatch(p1, p2, tolerance = 0.01) {
    return Math.abs(p1.x - p2.x) <= tolerance && Math.abs(p1.y - p2.y) <= tolerance;
}
function wallGeometryMatches(w1, w2, tolerance = 0.01) {
    const directMatch = pointsMatch(w1.start, w2.start, tolerance) && pointsMatch(w1.end, w2.end, tolerance);
    const reverseMatch = pointsMatch(w1.start, w2.end, tolerance) && pointsMatch(w1.end, w2.start, tolerance);
    return ((directMatch || reverseMatch) &&
        Math.abs(w1.thickness - w2.thickness) <= tolerance &&
        Math.abs(w1.height - w2.height) <= tolerance);
}
function wallMoved(w1, w2) {
    const sameStartOrEnd = pointsMatch(w1.start, w2.start) ||
        pointsMatch(w1.start, w2.end) ||
        pointsMatch(w1.end, w2.start) ||
        pointsMatch(w1.end, w2.end);
    return sameStartOrEnd || w1.id === w2.id;
}
export function diffProjects(versionA, versionB) {
    const wallsA = versionA.rooms.flatMap((r) => r.wallSegments);
    const wallsB = versionB.rooms.flatMap((r) => r.wallSegments);
    const diffsA = [];
    const diffsB = [];
    const matchedBIds = new Set();
    let addedCount = 0;
    let removedCount = 0;
    let shiftedCount = 0;
    let unchangedCount = 0;
    for (const wallA of wallsA) {
        const exactMatchB = wallsB.find((wB) => !matchedBIds.has(wB.id) && wallGeometryMatches(wallA, wB));
        if (exactMatchB) {
            matchedBIds.add(exactMatchB.id);
            diffsA.push({ wall: wallA, changeType: 'unchanged', comparedWall: exactMatchB });
            unchangedCount += 1;
            continue;
        }
        const movedMatchB = wallsB.find((wB) => !matchedBIds.has(wB.id) && wallMoved(wallA, wB));
        if (movedMatchB) {
            matchedBIds.add(movedMatchB.id);
            diffsA.push({ wall: wallA, changeType: 'shifted', comparedWall: movedMatchB });
            shiftedCount += 1;
            continue;
        }
        diffsA.push({ wall: wallA, changeType: 'removed' });
        removedCount += 1;
    }
    for (const wallB of wallsB) {
        if (matchedBIds.has(wallB.id)) {
            const matchInA = diffsA.find((dA) => dA.comparedWall?.id === wallB.id);
            diffsB.push({
                wall: wallB,
                changeType: matchInA?.changeType ?? 'unchanged',
                comparedWall: matchInA?.wall,
            });
        }
        else {
            diffsB.push({ wall: wallB, changeType: 'added' });
            addedCount += 1;
        }
    }
    return {
        versionA,
        versionB,
        wallsA: diffsA,
        wallsB: diffsB,
        stats: {
            addedCount,
            removedCount,
            shiftedCount,
            unchangedCount,
        },
    };
}
//# sourceMappingURL=version-diff.js.map