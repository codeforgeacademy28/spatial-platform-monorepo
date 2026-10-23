import type { BuildingModel } from '@spatial/core';

/**
 * Return the interpolated floor elevation when a plan-space point is inside
 * a staircase footprint. Coordinates are in the building's unrotated plan
 * space; null means the point is not on any staircase.
 */
export function stairFloorElevationAtPoint(x: number, z: number, building: BuildingModel): number | null {
  for (const stair of building.stairs) {
    const dx = x - stair.position[0];
    const dz = z - stair.position[2];
    const cos = Math.cos(stair.rotationY);
    const sin = Math.sin(stair.rotationY);
    const localX = cos * dx - sin * dz;
    const localZ = sin * dx + cos * dz;
    if (Math.abs(localX) > stair.width / 2 + 0.3 || Math.abs(localZ) > stair.run / 2 + 0.3) continue;
    const from = building.levels.find((level) => level.id === stair.fromLevelId)?.elevation ?? 0;
    const to = building.levels.find((level) => level.id === stair.toLevelId)?.elevation ?? from + stair.rise;
    const progress = Math.max(0, Math.min(1, (stair.run / 2 - localZ) / stair.run));
    return from + (to - from) * progress;
  }
  return null;
}
