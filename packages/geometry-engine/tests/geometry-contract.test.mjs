import test from 'node:test';
import assert from 'node:assert/strict';
import { detectClosedRooms, extrudeWallSegment, generateRoomFloorMesh, collidesWithWallPosition, movementBlockedByWalls, resolveMovementWithWalls, wallsWithPassableOpenings, stairFloorElevationAtPoint } from '../dist/index.js';

function wall(id, start, end) {
  return {
    id,
    roomId: 'unassigned',
    start,
    end,
    thickness: 0.2,
    height: 3,
    length: Math.hypot(end.x - start.x, end.y - start.y),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

const rectangle = [
  wall('w1', { x: 0, y: 0 }, { x: 4, y: 0 }),
  wall('w2', { x: 4, y: 0 }, { x: 4, y: 4 }),
  wall('w3', { x: 4, y: 4 }, { x: 0, y: 4 }),
  wall('w4', { x: 0, y: 4 }, { x: 0, y: 0 }),
];

test('wall extrusion preserves canonical wall identity and dimensions', () => {
  const result = extrudeWallSegment(rectangle[0]);
  assert.equal(result.id, 'w1');
  assert.equal(result.bottomCorners.length, 4);
  assert.equal(result.topCorners.length, 4);
  assert.equal(result.topCorners[0].z, 3);
  assert.equal(result.topCorners[1].z, 3);
  const centerlineLength = Math.hypot(rectangle[0].end.x - rectangle[0].start.x, rectangle[0].end.y - rectangle[0].start.y);
  assert.equal(centerlineLength, rectangle[0].length);
});

test('closed rectangle produces exactly one room with exact wall membership and area', () => {
  const rooms = detectClosedRooms(rectangle);
  assert.equal(rooms.length, 1);
  assert.equal(rooms[0].wallSegments.length, 4);
  assert.deepEqual(rooms[0].wallSegments.map((item) => item.id).sort(), ['w1', 'w2', 'w3', 'w4']);
  assert.equal(rooms[0].floorArea, 16);
});

test('open loop produces no room and no floor mesh', () => {
  const rooms = detectClosedRooms(rectangle.slice(0, 3));
  assert.equal(rooms.length, 0);
  const mesh = generateRoomFloorMesh({
    id: 'invalid',
    projectId: 'project-1',
    name: 'Invalid',
    polygon: [{ x: 0, y: 0 }, { x: 4, y: 0 }],
    wallSegments: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });
  assert.deepEqual(mesh.vertices, []);
  assert.deepEqual(mesh.indices, []);
});

test('near-matching endpoints within tolerance still form one room', () => {
  const slightlyClosed = [
    wall('w1', { x: 0, y: 0 }, { x: 4, y: 0 }),
    wall('w2', { x: 4, y: 0 }, { x: 4, y: 4 }),
    wall('w3', { x: 4, y: 4 }, { x: 0, y: 4 }),
    wall('w4', { x: 0, y: 4 }, { x: 0, y: 0.02 }),
  ];
  const rooms = detectClosedRooms(slightlyClosed);
  assert.equal(rooms.length, 1);
  assert.equal(rooms[0].wallSegments.length, 4);
});

test('wall collision blocks a position that enters the wall clearance', () => {
  const boundary = wall('boundary', { x: 0, y: -2 }, { x: 0, y: 2 });
  assert.equal(collidesWithWallPosition(0.1, 0, [boundary]), true);
  assert.equal(collidesWithWallPosition(1, 0, [boundary]), false);
});

test('swept wall collision blocks a movement that would cross a wall in one frame', () => {
  const boundary = wall('boundary', { x: 0, y: -2 }, { x: 0, y: 2 });
  assert.equal(movementBlockedByWalls(-0.5, 0, 1, 0, [boundary]), true);
  assert.equal(movementBlockedByWalls(-1, 3, 1, 0, [boundary]), false);
});

test('diagonal movement into an angled wall is blocked or reduced to a safe slide', () => {
  const diagonalWall = wall('diagonal', { x: 0, y: 0 }, { x: 2, y: 2 });
  const resolved = resolveMovementWithWalls(0.5, -0.1, { x: 0.2, y: 0.5 }, [diagonalWall]);
  assert.ok(Math.hypot(resolved.x, resolved.y) < Math.hypot(0.2, 0.5));
  assert.equal(movementBlockedByWalls(0.5, -0.1, resolved.x, resolved.y, [diagonalWall]), false);
});

test('only open door openings remove collision across the doorway span', () => {
  const boundary = wall('boundary', { x: 0, y: 0 }, { x: 4, y: 0 });
  const baseOpening = {
    id: 'door-1', wallId: 'boundary', type: 'door', offset: 2,
    width: 1, height: 2.1, bottom: 0,
    createdAt: '2026-10-23T00:00:00.000Z', updatedAt: '2026-10-23T00:00:00.000Z',
  };
  const closed = wallsWithPassableOpenings([boundary], [{ ...baseOpening, doorState: 'closed' }]);
  assert.equal(closed.length, 1);
  assert.equal(closed[0].length, 4);

  const open = wallsWithPassableOpenings([boundary], [{ ...baseOpening, doorState: 'open' }]);
  assert.equal(open.length, 2);
  assert.ok(Math.abs(open.reduce((sum, segment) => sum + segment.length, 0) - 3) < 0.001);
  assert.equal(movementBlockedByWalls(1.5, -0.5, 2.5, 0.5, open), false);
});

test('window openings do not make a wall passable at floor level', () => {
  const boundary = wall('boundary', { x: 0, y: 0 }, { x: 4, y: 0 });
  const windowOpening = {
    id: 'window-1', wallId: 'boundary', type: 'window', offset: 2,
    width: 1, height: 1, bottom: 1,
    createdAt: '2026-10-23T00:00:00.000Z', updatedAt: '2026-10-23T00:00:00.000Z',
  };
  const result = wallsWithPassableOpenings([boundary], [windowOpening]);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, boundary.id);
});

test('staircase elevation rises deterministically from lower to upper floor', () => {
  const building = {
    schemaVersion: 1,
    levels: [
      { id: 'ground', name: 'Ground', elevation: 0, wallHeight: 2.7, order: 0 },
      { id: 'upper', name: 'Upper', elevation: 3, wallHeight: 2.7, order: 1 },
    ],
    floorSlabs: [],
    stairs: [{
      id: 'stairs', fromLevelId: 'ground', toLevelId: 'upper',
      position: [0, 0, 0], rotationY: 0, width: 1, run: 3, rise: 3, stepCount: 16,
    }],
    components: [],
  };
  assert.equal(stairFloorElevationAtPoint(0, 1.5, building), 0);
  assert.equal(stairFloorElevationAtPoint(0, 0, building), 1.5);
  assert.equal(stairFloorElevationAtPoint(0, -1.5, building), 3);
  assert.equal(stairFloorElevationAtPoint(2, 0, building), null);
});
