import { z } from 'zod';

export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface WallSegment {
  id: string;
  roomId: string;
  start: Point;
  end: Point;
  thickness: number;
  height: number;
  length: number;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  projectId: string;
  name: string;
  polygon: Point[];
  wallSegments: WallSegment[];
  floorArea?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  walls: WallSegment[];
  rooms: Room[];
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  ADMIN = 'admin',
  ARCHITECT = 'architect',
  CLIENT = 'client',
  VIEWER = 'viewer',
}

export const PointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  z: z.number().finite().optional(),
});

export const WallSegmentSchema = z.object({
  id: z.string().trim().min(1),
  roomId: z.string().trim().min(1),
  start: PointSchema,
  end: PointSchema,
  thickness: z.number().positive(),
  height: z.number().positive(),
  length: z.number().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const RoomSchema = z.object({
  id: z.string().trim().min(1),
  projectId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(200),
  polygon: z.array(PointSchema).min(3),
  wallSegments: z.array(WallSegmentSchema).default([]),
  floorArea: z.number().nonnegative().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ProjectSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional(),
  walls: z.array(WallSegmentSchema).default([]),
  rooms: z.array(RoomSchema).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).transform((project) => ({
  ...project,
  walls: project.walls.length > 0 ? project.walls : project.rooms.flatMap((room) => room.wallSegments),
}));

export const UserRoleSchema = z.nativeEnum(UserRole);

export * from './database.js';
export * from './serializer.js';

export type PointInput = z.infer<typeof PointSchema>;
export type WallSegmentInput = z.infer<typeof WallSegmentSchema>;
export type RoomInput = z.infer<typeof RoomSchema>;
export type ProjectInput = z.infer<typeof ProjectSchema>;
export type UserRoleInput = z.infer<typeof UserRoleSchema>;
