import assert from 'node:assert/strict';
import test from 'node:test';
import { floorPlanToWorld, worldToFloorPlan } from '../dist/spatial-transforms.js';

function closeTo(actual, expected, epsilon = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= epsilon, 'coordinate values should match');
}

test('floor-plan/world conversion is invertible for quarter-turn orientations', () => {
  const point = { x: 2.4, y: -7.1 };
  const translation = [1.25, 0, -3.5];
  for (const yaw of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
    const world = floorPlanToWorld(point, translation, yaw);
    const roundTrip = worldToFloorPlan(world.x, world.z, translation, yaw);
    closeTo(roundTrip.x, point.x);
    closeTo(roundTrip.y, point.y);
  }
});

test('rotated layout bounds center maps to the intended world center', () => {
  const centerX = 10;
  const centerY = 5;
  const translation = [-centerY, 0, centerX - 4];
  const world = floorPlanToWorld({ x: centerX, y: centerY }, translation, Math.PI / 2);
  closeTo(world.x, 0);
  closeTo(world.z, -4);
});

test('inverse transform does not introduce an offset at 90 degrees', () => {
  const translation = [-5, 0, 6];
  const point = { x: 10, y: 5 };
  const world = floorPlanToWorld(point, translation, Math.PI / 2);
  const recovered = worldToFloorPlan(world.x, world.z, translation, Math.PI / 2);
  closeTo(recovered.x, point.x);
  closeTo(recovered.y, point.y);
});
