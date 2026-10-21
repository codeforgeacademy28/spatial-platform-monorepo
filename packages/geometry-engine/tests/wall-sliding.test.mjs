import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveCircleMovementWithWallSliding } from '../dist/wall-collision.js';

const wall = { start: { x: 0, y: -5 }, end: { x: 0, y: 5 }, thickness: 0.2 };
const radius = 0.28;

function closeTo(actual, expected, epsilon = 0.002) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be close to ${expected}`);
}

test('wall sliding preserves tangential movement when a diagonal step meets a wall', () => {
  const resolved = resolveCircleMovementWithWallSliding({ x: -1, y: -2 }, { x: 1, y: 2 }, [wall], radius);
  assert.ok(resolved.x < 0, 'player remains on the starting side of the wall');
  closeTo(resolved.x, -(radius + wall.thickness / 2));
  closeTo(resolved.y, 2);
});

test('wall sliding does not change unobstructed movement', () => {
  const resolved = resolveCircleMovementWithWallSliding({ x: -2, y: 0 }, { x: -1, y: 3 }, [wall], radius);
  closeTo(resolved.x, -1);
  closeTo(resolved.y, 3);
});

test('wall sliding rejects invalid movement input without moving the player', () => {
  const resolved = resolveCircleMovementWithWallSliding({ x: 2, y: 3 }, { x: Number.NaN, y: 4 }, [wall], radius);
  assert.deepEqual(resolved, { x: 2, y: 3 });
});
