export type FloorPlanPoint = { x: number; y: number };
export type WorldTranslation = [number, number, number];

/**
 * Convert floor-plan coordinates (x/y, in meters) into Three.js world X/Z
 * coordinates using the same Y-axis rotation as the rendered building group.
 */
export function floorPlanToWorld(
  point: FloorPlanPoint,
  translation: WorldTranslation,
  yawRadians: number,
): { x: number; z: number } {
  const cos = Math.cos(yawRadians);
  const sin = Math.sin(yawRadians);
  return {
    x: translation[0] + cos * point.x + sin * point.y,
    z: translation[2] - sin * point.x + cos * point.y,
  };
}

/**
 * Inverse of floorPlanToWorld. Collision and interaction queries must use this
 * rather than duplicating or approximating the rendered group's transform.
 */
export function worldToFloorPlan(
  sceneX: number,
  sceneZ: number,
  translation: WorldTranslation,
  yawRadians: number,
): FloorPlanPoint {
  const dx = sceneX - translation[0];
  const dz = sceneZ - translation[2];
  const cos = Math.cos(yawRadians);
  const sin = Math.sin(yawRadians);
  return {
    x: cos * dx - sin * dz,
    y: sin * dx + cos * dz,
  };
}
