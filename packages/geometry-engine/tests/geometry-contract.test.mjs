import test from 'node:test';
import assert from 'node:assert/strict';
import { detectClosedRooms, extrudeWallSegment, generateRoomFloorMesh } from '../dist/index.js';

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
