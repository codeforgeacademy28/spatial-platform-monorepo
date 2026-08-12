import { z } from 'zod';
import { ChangeMaterialSchema, MoveWallSchema, ResizeRoomSchema, SpatialQuerySchema } from '../schemas/command-schemas.js';
export type SupportedProvider = 'openai' | 'groq';
export type SpatialActionCommand = z.infer<typeof MoveWallSchema> | z.infer<typeof ResizeRoomSchema> | z.infer<typeof ChangeMaterialSchema> | z.infer<typeof SpatialQuerySchema>;
export interface SpatialActionRequest {
    provider: SupportedProvider;
    model: string;
    apiKey: string;
    prompt: string;
    temperature?: number;
}
export interface SpatialActionResponse {
    raw: unknown;
    action: SpatialActionCommand;
    provider: SupportedProvider;
    model: string;
}
export declare function generateSpatialAction(request: SpatialActionRequest): Promise<SpatialActionResponse>;
//# sourceMappingURL=llm-provider.d.ts.map