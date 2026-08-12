import { z } from 'zod';
export declare const SpatialVectorSchema: z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
    z: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    x: number;
    y: number;
    z: number;
}, {
    x: number;
    y: number;
    z: number;
}>;
export declare const SpatialCommentSchema: z.ZodObject<{
    id: z.ZodString;
    projectId: z.ZodString;
    author: z.ZodString;
    text: z.ZodString;
    position: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>;
    normal: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    projectId: string;
    author: string;
    text: string;
    position: {
        x: number;
        y: number;
        z: number;
    };
    normal: {
        x: number;
        y: number;
        z: number;
    };
    createdAt: string;
}, {
    id: string;
    projectId: string;
    author: string;
    text: string;
    position: {
        x: number;
        y: number;
        z: number;
    };
    normal: {
        x: number;
        y: number;
        z: number;
    };
    createdAt: string;
}>;
export declare const CreateSpatialCommentInputSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    projectId: z.ZodString;
    author: z.ZodString;
    text: z.ZodString;
    position: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>;
    normal: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>;
    createdAt: z.ZodString;
}, "id" | "createdAt">, "strip", z.ZodTypeAny, {
    projectId: string;
    author: string;
    text: string;
    position: {
        x: number;
        y: number;
        z: number;
    };
    normal: {
        x: number;
        y: number;
        z: number;
    };
}, {
    projectId: string;
    author: string;
    text: string;
    position: {
        x: number;
        y: number;
        z: number;
    };
    normal: {
        x: number;
        y: number;
        z: number;
    };
}>;
export type SpatialVector = z.infer<typeof SpatialVectorSchema>;
export type SpatialComment = z.infer<typeof SpatialCommentSchema>;
export type CreateSpatialCommentInput = z.infer<typeof CreateSpatialCommentInputSchema>;
export declare function createSpatialComment(input: Partial<Pick<SpatialComment, 'id' | 'createdAt'>> & CreateSpatialCommentInput): SpatialComment;
//# sourceMappingURL=comment-manager.d.ts.map