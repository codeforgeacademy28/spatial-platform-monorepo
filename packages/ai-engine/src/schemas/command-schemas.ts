import { z } from 'zod';

export const MoveWallSchema = z.object({
  wallId: z.string().trim().min(1),
  deltaX: z.number().finite(),
  deltaY: z.number().finite(),
});

export const ResizeRoomSchema = z.object({
  roomId: z.string().trim().min(1),
  percentage: z.number().finite(),
});

export const ChangeMaterialSchema = z.object({
  targetId: z.string().trim().min(1),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const SpatialQuerySchema = z.object({
  queryType: z.enum(['clearance', 'area']),
  objectId: z.string().trim().min(1),
});

export type MoveWallCommand = z.infer<typeof MoveWallSchema>;
export type ResizeRoomCommand = z.infer<typeof ResizeRoomSchema>;
export type ChangeMaterialCommand = z.infer<typeof ChangeMaterialSchema>;
export type SpatialQueryCommand = z.infer<typeof SpatialQuerySchema>;
