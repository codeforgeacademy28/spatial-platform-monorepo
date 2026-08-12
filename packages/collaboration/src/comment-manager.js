import { z } from 'zod';
export const SpatialVectorSchema = z.object({
    x: z.number().finite(),
    y: z.number().finite(),
    z: z.number().finite(),
});
export const SpatialCommentSchema = z.object({
    id: z.string().trim().min(1),
    projectId: z.string().trim().min(1),
    author: z.string().trim().min(1).max(80),
    text: z.string().trim().min(1).max(500),
    position: SpatialVectorSchema,
    normal: SpatialVectorSchema,
    createdAt: z.string().datetime(),
});
export const CreateSpatialCommentInputSchema = SpatialCommentSchema.omit({
    id: true,
    createdAt: true,
});
export function createSpatialComment(input) {
    const commentId = input.id ?? `comment-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return SpatialCommentSchema.parse({
        ...input,
        id: commentId,
        createdAt: input.createdAt ?? new Date().toISOString(),
    });
}
//# sourceMappingURL=comment-manager.js.map