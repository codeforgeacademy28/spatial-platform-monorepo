import { z } from 'zod';
export declare const MoveWallSchema: z.ZodObject<{
    wallId: z.ZodString;
    deltaX: z.ZodNumber;
    deltaY: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    wallId: string;
    deltaX: number;
    deltaY: number;
}, {
    wallId: string;
    deltaX: number;
    deltaY: number;
}>;
export declare const ResizeRoomSchema: z.ZodObject<{
    roomId: z.ZodString;
    percentage: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    roomId: string;
    percentage: number;
}, {
    roomId: string;
    percentage: number;
}>;
export declare const ChangeMaterialSchema: z.ZodObject<{
    targetId: z.ZodString;
    colorHex: z.ZodString;
}, "strip", z.ZodTypeAny, {
    targetId: string;
    colorHex: string;
}, {
    targetId: string;
    colorHex: string;
}>;
export declare const SpatialQuerySchema: z.ZodObject<{
    queryType: z.ZodEnum<["clearance", "area"]>;
    objectId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    queryType: "clearance" | "area";
    objectId: string;
}, {
    queryType: "clearance" | "area";
    objectId: string;
}>;
export type MoveWallCommand = z.infer<typeof MoveWallSchema>;
export type ResizeRoomCommand = z.infer<typeof ResizeRoomSchema>;
export type ChangeMaterialCommand = z.infer<typeof ChangeMaterialSchema>;
export type SpatialQueryCommand = z.infer<typeof SpatialQuerySchema>;
//# sourceMappingURL=command-schemas.d.ts.map