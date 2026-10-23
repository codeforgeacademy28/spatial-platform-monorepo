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

test('known 4 m by 6 m room preserves scale and center at a calibrated yaw', () => {
  const width = 4;
  const depth = 6;
  const centerX = width / 2;
  const centerY = depth / 2;
  const yaw = Math.PI / 6;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const translation = [-(cos * centerX + sin * centerY), 0, -4 + sin * centerX - cos * centerY];
  const corners = [
    { x: 0, y: 0 }, { x: width, y: 0 },
    { x: width, y: depth }, { x: 0, y: depth },
  ];
  const worldCorners = corners.map((point) => floorPlanToWorld(point, translation, yaw));
  const xs = worldCorners.map((point) => point.x);
  const zs = worldCorners.map((point) => point.z);
  closeTo(Math.max(...xs) - Math.min(...xs), Math.abs(cos) * width + Math.abs(sin) * depth);
  closeTo(Math.max(...zs) - Math.min(...zs), Math.abs(sin) * width + Math.abs(cos) * depth);
  const center = floorPlanToWorld({ x: centerX, y: centerY }, translation, yaw);
  closeTo(center.x, 0);
  closeTo(center.z, -4);
  for (const corner of corners) {
    const world = floorPlanToWorld(corner, translation, yaw);
    const restored = worldToFloorPlan(world.x, world.z, translation, yaw);
    closeTo(restored.x, corner.x);
    closeTo(restored.y, corner.y);
  }
});

test('inverse transform does not introduce an offset at 90 degrees', () => {
  const translation = [-5, 0, 6];
  const point = { x: 10, y: 5 };
  const world = floorPlanToWorld(point, translation, Math.PI / 2);
  const recovered = worldToFloorPlan(world.x, world.z, translation, Math.PI / 2);
  closeTo(recovered.x, point.x);
  closeTo(recovered.y, point.y);
});
