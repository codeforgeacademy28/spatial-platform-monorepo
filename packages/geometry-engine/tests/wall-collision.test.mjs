import assert from 'node:assert/strict';
import test from 'node:test';
import { isCircleMovementBlockedByWall } from '../dist/wall-collision.js';

const wall = { start: { x: 0, y: -5 }, end: { x: 0, y: 5 }, thickness: 0.2 };
const radius = 0.28;

test('swept collision blocks crossing a wall even when the step is long', () => {
  assert.equal(isCircleMovementBlockedByWall({ x: -2, y: 0 }, { x: 2, y: 0 }, wall, radius), true);
});

test('swept collision allows motion parallel to a wall outside player clearance', () => {
  assert.equal(isCircleMovementBlockedByWall({ x: -0.5, y: -2 }, { x: -0.5, y: 2 }, wall, radius), false);
});

test('swept collision allows moving away from a wall overlap', () => {
  assert.equal(isCircleMovementBlockedByWall({ x: -0.1, y: 0 }, { x: -0.5, y: 0 }, wall, radius), false);
});

test('swept collision blocks movement deeper into a wall overlap', () => {
  assert.equal(isCircleMovementBlockedByWall({ x: -0.5, y: 0 }, { x: -0.1, y: 0 }, wall, radius), true);
});

test('swept collision rejects non-finite movement input safely', () => {
  assert.equal(isCircleMovementBlockedByWall({ x: Number.NaN, y: 0 }, { x: 1, y: 0 }, wall, radius), true);
});
