import assert from 'node:assert/strict';
import test from 'node:test';
import { ProjectSchema, cloneProject, deserializeProject, serializeProject } from '../dist/index.js';

const timestamp = '2026-10-23T00:00:00.000Z';

function legacyProject() {
  return {
    id: 'project-legacy',
    name: 'Legacy house',
    walls: [],
    rooms: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

test('legacy projects migrate to a versioned ground-floor building model', () => {
  const project = ProjectSchema.parse(legacyProject());
  assert.equal(project.building?.schemaVersion, 1);
  assert.equal(project.building?.orientationYawRadians, Math.PI / 2);
  assert.equal(project.building?.levels.length, 1);
  assert.equal(project.building?.levels[0]?.id, 'level-ground');
  assert.deepEqual(project.building?.floorSlabs, []);
  assert.deepEqual(project.building?.stairs, []);
  assert.deepEqual(project.building?.components, []);
});

test('building model validates floors, stairs, transforms, and catalog components', () => {
  const project = ProjectSchema.parse({
    ...legacyProject(),
    building: {
      schemaVersion: 1,
      orientationYawRadians: Math.PI / 6,
      levels: [
        { id: 'ground', name: 'Ground Floor', elevation: 0, wallHeight: 2.8, order: 0 },
        { id: 'first', name: 'First Floor', elevation: 2.8, wallHeight: 2.7, order: 1 },
      ],
      floorSlabs: [{
        id: 'slab-ground', levelId: 'ground',
        outline: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 4 }, { x: 0, y: 4 }],
        thickness: 0.2, materialHex: '#cbd5e1',
      }],
      stairs: [{
        id: 'stairs-1', fromLevelId: 'ground', toLevelId: 'first',
        position: [1, 0, 1], rotationY: 0, width: 1, run: 3.5, rise: 2.8, stepCount: 16,
      }],
      components: [{
        id: 'door-1', levelId: 'ground', type: 'door', name: 'Entry door',
        position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1],
        dimensions: { width: 0.9, height: 2.1, depth: 0.08 }, doorState: 'closed',
      }],
    },
  });
  assert.equal(project.building?.orientationYawRadians, Math.PI / 6);
  assert.equal(project.building?.levels.length, 2);
  assert.equal(project.building?.floorSlabs[0]?.outline.length, 4);
  assert.equal(project.building?.stairs[0]?.stepCount, 16);
  assert.equal(project.building?.components[0]?.doorState, 'closed');
});

test('project validation rejects dangling or out-of-bounds wall openings', () => {
  const wall = {
    id: 'wall-1', roomId: 'room-1',
    start: { x: 0, y: 0 }, end: { x: 4, y: 0 },
    thickness: 0.15, height: 2.7, length: 4,
    createdAt: timestamp, updatedAt: timestamp,
  };
  const base = { ...legacyProject(), walls: [wall] };
  const opening = {
    id: 'door-1', wallId: 'wall-1', type: 'door', offset: 2,
    width: 0.9, height: 2.1, bottom: 0, doorState: 'closed',
    createdAt: timestamp, updatedAt: timestamp,
  };
  assert.equal(ProjectSchema.parse({ ...base, wallOpenings: [opening] }).wallOpenings[0].id, 'door-1');
  assert.throws(
    () => ProjectSchema.parse({ ...base, wallOpenings: [{ ...opening, wallId: 'missing-wall' }] }),
    /Opening references missing wall/,
  );
  assert.throws(
    () => ProjectSchema.parse({ ...base, wallOpenings: [{ ...opening, offset: 0.1 }] }),
    /Opening must fit completely within its wall length/,
  );
  assert.throws(
    () => ProjectSchema.parse({ ...base, wallOpenings: [{ ...opening, height: 3 }] }),
    /Opening bottom plus height must not exceed wall height/,
  );
});

test('clone and JSON round-trip preserve all nested building data without aliasing', () => {
  const project = ProjectSchema.parse({
    ...legacyProject(),
    building: {
      schemaVersion: 1,
      levels: [{ id: 'ground', name: 'Ground Floor', elevation: 0, wallHeight: 2.7, order: 0 }],
      floorSlabs: [{
        id: 'slab', levelId: 'ground',
        outline: [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 3 }],
        thickness: 0.2, materialHex: '#abcdef',
      }],
      stairs: [{
        id: 'stairs', fromLevelId: 'ground', toLevelId: 'first',
        position: [1, 2, 3], width: 1, run: 2, rise: 2.7, stepCount: 12,
      }],
      components: [{
        id: 'sofa', levelId: 'ground', type: 'sofa', name: 'Living room sofa',
        position: [2, 0, 1], rotation: [0, 0.5, 0], scale: [1, 1, 1],
        dimensions: { width: 2, height: 0.9, depth: 0.8 },
      }],
    },
  });
  const cloned = cloneProject(project);
  assert.ok(cloned.building);
  cloned.building.levels[0].name = 'Changed';
  cloned.building.floorSlabs[0].outline[0].x = 99;
  cloned.building.stairs[0].position[0] = 99;
  cloned.building.components[0].position[0] = 99;
  assert.equal(project.building?.levels[0]?.name, 'Ground Floor');
  assert.equal(project.building?.floorSlabs[0]?.outline[0]?.x, 0);
  assert.equal(project.building?.stairs[0]?.position[0], 1);
  assert.equal(project.building?.components[0]?.position[0], 2);

  const restored = deserializeProject(serializeProject(project));
  assert.deepEqual(restored.building, project.building);
});
