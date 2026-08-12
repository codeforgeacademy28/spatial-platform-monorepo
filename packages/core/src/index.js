import { z } from 'zod';
export var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["ARCHITECT"] = "architect";
    UserRole["CLIENT"] = "client";
    UserRole["VIEWER"] = "viewer";
})(UserRole || (UserRole = {}));
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
    rooms: z.array(RoomSchema).default([]),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
export const UserRoleSchema = z.nativeEnum(UserRole);
export * from './database.js';
export * from './serializer.js';
//# sourceMappingURL=index.js.map