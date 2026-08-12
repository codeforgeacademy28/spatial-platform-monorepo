import earcut from 'earcut';
import { RoomSchema } from '@spatial/core';
function pointKey(point) {
    return `${point.x.toFixed(4)}:${point.y.toFixed(4)}`;
}
function calculatePolygonArea(points) {
    if (points.length < 3) {
        return 0;
    }
    let area = 0;
    for (let index = 0; index < points.length; index += 1) {
        const current = points[index];
        const next = points[(index + 1) % points.length];
        area += current.x * next.y - next.x * current.y;
    }
    return Math.abs(area) / 2;
}
function normalizePolygon(points) {
    if (points.length < 3) {
        return points;
    }
    const centroid = points.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
    const center = {
        x: centroid.x / points.length,
        y: centroid.y / points.length,
    };
    const ordered = [...points]
        .map((point) => ({
        point,
        angle: Math.atan2(point.y - center.y, point.x - center.x),
    }))
        .sort((left, right) => left.angle - right.angle)
        .map((item) => item.point);
    const unique = [];
    for (const point of ordered) {
        const key = pointKey(point);
        if (!unique.some((entry) => pointKey(entry) === key)) {
            unique.push(point);
        }
    }
    if (unique.length < 3) {
        return unique;
    }
    return unique;
}
function traceLoopFromWall(walls, startWall, unvisited) {
    const points = [startWall.start];
    const wallIds = [startWall.id];
    unvisited.delete(startWall.id);
    let previousEndpoint = startWall.start;
    let currentEndpoint = startWall.end;
    let currentWall = startWall;
    for (let step = 0; step < walls.length * 3; step += 1) {
        const nextWalls = walls.filter((wall) => {
            if (!unvisited.has(wall.id) || wall.id === currentWall.id) {
                return false;
            }
            return pointKey(wall.start) === pointKey(currentEndpoint) || pointKey(wall.end) === pointKey(currentEndpoint);
        });
        if (nextWalls.length === 0) {
            return null;
        }
        const nextWall = nextWalls.find((wall) => {
            const otherEndpoint = pointKey(wall.start) === pointKey(currentEndpoint) ? wall.end : wall.start;
            return pointKey(otherEndpoint) !== pointKey(previousEndpoint);
        }) ?? nextWalls[0];
        const nextEndpoint = pointKey(nextWall.start) === pointKey(currentEndpoint) ? nextWall.end : nextWall.start;
        if (pointKey(nextEndpoint) === pointKey(startWall.start) && points.length >= 2) {
            points.push(startWall.start);
            return { points, wallIds };
        }
        if (points.some((point) => pointKey(point) === pointKey(nextEndpoint))) {
            return null;
        }
        points.push(nextEndpoint);
        wallIds.push(nextWall.id);
        unvisited.delete(nextWall.id);
        previousEndpoint = currentEndpoint;
        currentEndpoint = nextEndpoint;
        currentWall = nextWall;
    }
    return null;
}
export function detectClosedRooms(walls, projectId = 'project-1', roomNamePrefix = 'Room') {
    if (walls.length === 0) {
        return [];
    }
    const unvisited = new Set(walls.map((wall) => wall.id));
    const detectedLoops = [];
    for (const wall of walls) {
        if (!unvisited.has(wall.id)) {
            continue;
        }
        const loop = traceLoopFromWall(walls, wall, new Set(unvisited));
        if (!loop || loop.points.length < 3) {
            continue;
        }
        const wallSet = new Set(loop.wallIds);
        if (wallSet.size < 3) {
            continue;
        }
        detectedLoops.push(loop);
    }
    return detectedLoops.map((loop, index) => {
        const polygon = normalizePolygon(loop.points);
        const wallSegments = walls.filter((wall) => loop.wallIds.includes(wall.id));
        const room = {
            id: `room-${index + 1}`,
            projectId,
            name: `${roomNamePrefix} ${index + 1}`,
            polygon,
            wallSegments,
            floorArea: calculatePolygonArea(polygon),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        return RoomSchema.parse(room);
    });
}
export function generateRoomFloorMesh(room) {
    if (room.polygon.length < 3) {
        return {
            roomId: room.id,
            vertices: [],
            indices: [],
        };
    }
    const polygon = normalizePolygon(room.polygon);
    const flattened = polygon.flatMap((point) => [point.x, point.y]);
    const indices = earcut(flattened, null, 2);
    const vertices = polygon.flatMap((point) => [point.x, 0, point.y]);
    return {
        roomId: room.id,
        vertices,
        indices,
    };
}
//# sourceMappingURL=room-detector.js.map