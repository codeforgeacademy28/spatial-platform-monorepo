import test from 'node:test';
import assert from 'node:assert/strict';
import { cloneProject } from '../dist/index.js';

function makeProject() {
  return {
    id: 'project-1',
    name: 'Snapshot Test',
    walls: [{
      id: 'wall-1', roomId: 'unassigned', start: { x: 0, y: 0 }, end: { x: 4, y: 0 }, thickness: 0.2, height: 3, length: 4,
      createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    }],
    rooms: [{
      id: 'room-1', projectId: 'project-1', name: 'Room 1', polygon: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }],
      wallSegments: [], floorArea: 8, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    }],
    scaleMetersPerPixel: 0.02,
    sceneAssets: [{
      id: 'art-1', assetType: 'image', name: 'Memory', assetUrl: 'data:image/svg+xml,example',
      anchor: { type: 'world', position: [1, 2, 3] },
      createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    }],
    wallOpenings: [{
      id: 'door-1', wallId: 'wall-1', type: 'door', offset: 2, width: 0.9, height: 2.1, bottom: 0, doorState: 'closed',
      createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    }],
    presentation: { title: 'Original', subtitle: 'Subtitle', finalMessage: 'Message', theme: 'romantic', ceilingEnabled: true },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

test('cloneProject produces an immutable deep snapshot', () => {
  const original = makeProject();
  const snapshot = cloneProject(original);
  original.name = 'Changed';
  original.walls[0].start.x = 99;
  original.rooms[0].polygon[0].x = 99;
  original.sceneAssets[0].anchor.position[0] = 99;
  original.wallOpenings[0].width = 9;
  original.presentation.title = 'Changed';
  assert.equal(snapshot.name, 'Snapshot Test');
  assert.equal(snapshot.walls[0].start.x, 0);
  assert.equal(snapshot.rooms[0].polygon[0].x, 0);
  assert.equal(snapshot.sceneAssets[0].anchor.position[0], 1);
  assert.equal(snapshot.wallOpenings[0].width, 0.9);
  assert.equal(snapshot.presentation.title, 'Original');
});
