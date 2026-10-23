import { z } from 'zod';
import { BuildingModelSchema, type BuildingModel } from './building-model.js';
export * from './building-model.js';

export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface WallSegment {
  id: string;
  roomId: string;
  levelId?: string;
  start: Point;
  end: Point;
  thickness: number;
  height: number;
  length: number;
  materialHex?: string;
  textureUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type WallOpeningType = 'door' | 'window';

export interface WallOpening {
  id: string;
  wallId: string;
  levelId?: string;
  type: WallOpeningType;
  offset: number;
  width: number;
  height: number;
  bottom: number;
  doorState?: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export type SceneAssetType = 'image' | 'light';

export interface SceneAsset {
  id: string;
  levelId?: string;
  assetType: SceneAssetType;
  name: string;
  assetUrl: string;
  frameStyle?: 'wood' | 'gold' | 'black';
  anchor:
    | {
        type: 'wall';
        wallId: string;
        offset: number;
        elevation: number;
        width: number;
        height: number;
      }
    | {
        type: 'world';
        position: [number, number, number];
      };
  light?: {
    color?: string;
    intensity?: number;
    distance?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type PresentationTheme = 'romantic' | 'museum' | 'sunset';

export interface PresentationConfig {
  title: string;
  subtitle: string;
  finalMessage: string;
  theme: PresentationTheme;
  ceilingEnabled: boolean;
}

export interface Room {
  id: string;
  projectId: string;
  levelId?: string;
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
  scaleMetersPerPixel?: number;
  sceneAssets?: SceneAsset[];
  wallOpenings?: WallOpening[];
  presentation?: PresentationConfig;
  building?: BuildingModel;
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
  levelId: z.string().trim().min(1).optional(),
  start: PointSchema,
  end: PointSchema,
  thickness: z.number().positive(),
  height: z.number().positive(),
  length: z.number().nonnegative(),
  materialHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  textureUrl: z.string().trim().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const WallOpeningSchema = z.object({
  id: z.string().trim().min(1),
  wallId: z.string().trim().min(1),
  levelId: z.string().trim().min(1).optional(),
  type: z.enum(['door', 'window']),
  offset: z.number().finite().nonnegative(),
  width: z.number().positive(),
  height: z.number().positive(),
  bottom: z.number().finite().nonnegative(),
  doorState: z.enum(['open', 'closed']).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const SceneAssetSchema = z.object({
  id: z.string().trim().min(1),
  levelId: z.string().trim().min(1).optional(),
  assetType: z.enum(['image', 'light']),
  name: z.string().trim().min(1).max(200),
  assetUrl: z.string(),
  frameStyle: z.enum(['wood', 'gold', 'black']).optional(),
  anchor: z.union([
    z.object({
      type: z.literal('wall'),
      wallId: z.string().trim().min(1),
      offset: z.number().finite().nonnegative(),
      elevation: z.number().finite().nonnegative(),
      width: z.number().positive(),
      height: z.number().positive(),
    }),
    z.object({
      type: z.literal('world'),
      position: z.tuple([z.number(), z.number(), z.number()]),
    }),
  ]),
  light: z.object({
    color: z.string().optional(),
    intensity: z.number().positive().optional(),
    distance: z.number().positive().optional(),
  }).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const PresentationConfigSchema = z.object({
  title: z.string().trim().min(1).max(200),
  subtitle: z.string().trim().max(300),
  finalMessage: z.string().trim().max(2000),
  theme: z.enum(['romantic', 'museum', 'sunset']),
  ceilingEnabled: z.boolean(),
});

export const RoomSchema = z.object({
  id: z.string().trim().min(1),
  projectId: z.string().trim().min(1),
  levelId: z.string().trim().min(1).optional(),
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
  scaleMetersPerPixel: z.number().finite().positive().optional(),
  sceneAssets: z.array(SceneAssetSchema).default([]),
  wallOpenings: z.array(WallOpeningSchema).default([]),
  presentation: PresentationConfigSchema.optional(),
  building: BuildingModelSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).superRefine((project, ctx) => {
  // Validate opening references against canonical wall geometry before the
  // renderer creates a hole. Invalid/dangling openings must not silently save.
  const walls = project.walls.length > 0 ? project.walls : project.rooms.flatMap((room) => room.wallSegments);
  const wallById = new Map(walls.map((wall) => [wall.id, wall]));
  const building = project.building ?? BuildingModelSchema.parse({});
  const levelIds = new Set(building.levels.map((level) => level.id));
  const checkLevelReference = (levelId: string | undefined, path: (string | number)[]): void => {
    if (levelId && !levelIds.has(levelId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message: `Unknown building level "${levelId}".` });
    }
  };
  walls.forEach((wall, index) => checkLevelReference(wall.levelId, ['walls', index, 'levelId']));
  project.rooms.forEach((room, index) => checkLevelReference(room.levelId, ['rooms', index, 'levelId']));
  building.floorSlabs.forEach((slab, index) => checkLevelReference(slab.levelId, ['building', 'floorSlabs', index, 'levelId']));
  building.components.forEach((component, index) => checkLevelReference(component.levelId, ['building', 'components', index, 'levelId']));
  building.stairs.forEach((stair, index) => {
    checkLevelReference(stair.fromLevelId, ['building', 'stairs', index, 'fromLevelId']);
    checkLevelReference(stair.toLevelId, ['building', 'stairs', index, 'toLevelId']);
    if (stair.fromLevelId === stair.toLevelId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['building', 'stairs', index, 'toLevelId'], message: 'Staircase must connect two different levels.' });
    }
  });
  project.wallOpenings.forEach((opening, index) => {
    const wall = wallById.get(opening.wallId);
    if (!wall) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['wallOpenings', index, 'wallId'],
        message: `Opening references missing wall "${opening.wallId}".`,
      });
      return;
    }
    const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
    const start = opening.offset - opening.width / 2;
    const end = opening.offset + opening.width / 2;
    if (start < -1e-6 || end > length + 1e-6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['wallOpenings', index, 'offset'],
        message: 'Opening must fit completely within its wall length.',
      });
    }
    if (opening.bottom + opening.height > wall.height + 1e-6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['wallOpenings', index, 'height'],
        message: 'Opening bottom plus height must not exceed wall height.',
      });
    }
  });
}).transform((project) => ({
  ...project,
  walls: project.walls.length > 0 ? project.walls : project.rooms.flatMap((room) => room.wallSegments),
  building: BuildingModelSchema.parse(project.building ?? {}),
}));

export const UserRoleSchema = z.nativeEnum(UserRole);

export * from './database.js';
export * from './serializer.js';
export * from './project-snapshot.js';

export type PointInput = z.infer<typeof PointSchema>;
export type WallSegmentInput = z.infer<typeof WallSegmentSchema>;
export type WallOpeningInput = z.infer<typeof WallOpeningSchema>;
export type SceneAssetInput = z.infer<typeof SceneAssetSchema>;
export type PresentationConfigInput = z.infer<typeof PresentationConfigSchema>;
export type RoomInput = z.infer<typeof RoomSchema>;
export type ProjectInput = z.infer<typeof ProjectSchema>;
export type UserRoleInput = z.infer<typeof UserRoleSchema>;
