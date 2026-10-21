import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveCircleMovementWithWallSliding } from '../dist/wall-collision.js';

const verticalWall = {
  start: { x: 0, y: -5 },
  end: { x: 0, y: 5 },
  thickness: 0.2,
};
const radius = 0.28;

function closeTo(actual, expected, epsilon = 1e-4) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
}

test('wall sliding preserves tangential movement without crossing the wall', () => {
  const previous = { x: -1, y: -2 };
  const requested = { x: 1, y: 1 };

  const resolved = resolveCircleMovementWithWallSliding(previous, requested, [verticalWall], radius);

  assert.ok(resolved.x < -0.37, `player crossed or penetrated the wall: x=${resolved.x}`);
  assert.ok(resolved.y > previous.y + 0.5, `player did not slide along the wall: y=${resolved.y}`);
});

test('unobstructed movement reaches the requested destination exactly', () => {
  const previous = { x: -2, y: -2 };
  const requested = { x: -1, y: 1 };

  assert.deepEqual(
    resolveCircleMovementWithWallSliding(previous, requested, [verticalWall], radius),
    requested,
  );
});

test('zero movement remains unchanged', () => {
  const previous = { x: -1, y: 0.5 };

  assert.deepEqual(
    resolveCircleMovementWithWallSliding(previous, previous, [verticalWall], radius),
    previous,
  );
});

test('non-finite requests fail closed at the previous position', () => {
  const previous = { x: -1, y: 0 };
  const requested = { x: Number.NaN, y: 2 };

  const resolved = resolveCircleMovementWithWallSliding(previous, requested, [verticalWall], radius);

  closeTo(resolved.x, previous.x);
  closeTo(resolved.y, previous.y);
});
