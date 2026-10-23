import { z } from 'zod';

export const BUILDING_SCHEMA_VERSION = 1;

export const BuildingLevelSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1).max(120),
  elevation: z.number().finite(),
  wallHeight: z.number().positive().default(2.7),
  order: z.number().int().nonnegative(),
});
export type BuildingLevel = z.infer<typeof BuildingLevelSchema>;

const BuildingPlanPointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

export const FloorSlabSchema = z.object({
  id: z.string().trim().min(1),
  levelId: z.string().trim().min(1),
  outline: z.array(BuildingPlanPointSchema).min(3),
  thickness: z.number().positive().max(1).default(0.2),
  materialHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#cbd5e1'),
});
export type FloorSlab = z.infer<typeof FloorSlabSchema>;

export const StaircaseSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1).max(120).default('Staircase'),
  fromLevelId: z.string().trim().min(1),
  toLevelId: z.string().trim().min(1),
  position: z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]),
  rotationY: z.number().finite().default(0),
  width: z.number().positive().max(10),
  run: z.number().positive().max(50),
  rise: z.number().positive().max(20),
  stepCount: z.number().int().min(2).max(100),
  materialHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#b8a58b'),
});
export type Staircase = z.infer<typeof StaircaseSchema>;

export const BuildingComponentTypeSchema = z.enum([
  'door', 'window', 'column', 'beam', 'partition', 'roof', 'railing',
  'sofa', 'chair', 'table', 'bed', 'wardrobe', 'cabinet', 'kitchen-unit',
  'sink', 'toilet', 'bathtub', 'shower', 'appliance', 'light', 'switch',
  'socket', 'curtain', 'blind', 'rug', 'artwork', 'plant', 'fence', 'gate',
  'driveway', 'pool', 'custom',
]);
export type BuildingComponentType = z.infer<typeof BuildingComponentTypeSchema>;

export const BuildingComponentSchema = z.object({
  id: z.string().trim().min(1),
  levelId: z.string().trim().min(1),
  type: BuildingComponentTypeSchema,
  name: z.string().trim().min(1).max(200),
  position: z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]),
  rotation: z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]).default([0, 0, 0]),
  scale: z.tuple([z.number().positive(), z.number().positive(), z.number().positive()]).default([1, 1, 1]),
  dimensions: z.object({
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    depth: z.number().positive().optional(),
  }).optional(),
  materialHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  assetUrl: z.string().trim().optional(),
  isVisible: z.boolean().default(true),
  doorState: z.enum(['open', 'closed']).optional(),
  isLocked: z.boolean().default(false),
});
export type BuildingComponent = z.infer<typeof BuildingComponentSchema>;

/**
 * Additive, versioned building structure. Legacy Project.walls/rooms remain
 * supported while every renderer and editor migrates to this shared model.
 */
export const BuildingModelSchema = z.object({
  schemaVersion: z.number().int().min(1).default(BUILDING_SCHEMA_VERSION),
  levels: z.array(BuildingLevelSchema).min(1).default([
    { id: 'level-ground', name: 'Ground Floor', elevation: 0, wallHeight: 2.7, order: 0 },
  ]),
  floorSlabs: z.array(FloorSlabSchema).default([]),
  ceilingEnabled: z.boolean().default(false),
  isolateActiveLevel: z.boolean().default(false),
  stairs: z.array(StaircaseSchema).default([]),
  components: z.array(BuildingComponentSchema).default([]),
});
export type BuildingModel = z.infer<typeof BuildingModelSchema>;
