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
    rooms: Room[];
    createdAt: string;
    updatedAt: string;
}
export declare enum UserRole {
    ADMIN = "admin",
    ARCHITECT = "architect",
    CLIENT = "client",
    VIEWER = "viewer"
}
export declare const PointSchema: z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
    z: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    x: number;
    y: number;
    z?: number | undefined;
}, {
    x: number;
    y: number;
    z?: number | undefined;
}>;
export declare const WallSegmentSchema: z.ZodObject<{
    id: z.ZodString;
    roomId: z.ZodString;
    start: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z?: number | undefined;
    }, {
        x: number;
        y: number;
        z?: number | undefined;
    }>;
    end: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z?: number | undefined;
    }, {
        x: number;
        y: number;
        z?: number | undefined;
    }>;
    thickness: z.ZodNumber;
    height: z.ZodNumber;
    length: z.ZodNumber;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    end: {
        x: number;
        y: number;
        z?: number | undefined;
    };
    length: number;
    id: string;
    createdAt: string;
    roomId: string;
    start: {
        x: number;
        y: number;
        z?: number | undefined;
    };
    thickness: number;
    height: number;
    updatedAt: string;
}, {
    end: {
        x: number;
        y: number;
        z?: number | undefined;
    };
    length: number;
    id: string;
    createdAt: string;
    roomId: string;
    start: {
        x: number;
        y: number;
        z?: number | undefined;
    };
    thickness: number;
    height: number;
    updatedAt: string;
}>;
export declare const RoomSchema: z.ZodObject<{
    id: z.ZodString;
    projectId: z.ZodString;
    name: z.ZodString;
    polygon: z.ZodArray<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z?: number | undefined;
    }, {
        x: number;
        y: number;
        z?: number | undefined;
    }>, "many">;
    wallSegments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        roomId: z.ZodString;
        start: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            z: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
            z?: number | undefined;
        }, {
            x: number;
            y: number;
            z?: number | undefined;
        }>;
        end: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            z: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
            z?: number | undefined;
        }, {
            x: number;
            y: number;
            z?: number | undefined;
        }>;
        thickness: z.ZodNumber;
        height: z.ZodNumber;
        length: z.ZodNumber;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        end: {
            x: number;
            y: number;
            z?: number | undefined;
        };
        length: number;
        id: string;
        createdAt: string;
        roomId: string;
        start: {
            x: number;
            y: number;
            z?: number | undefined;
        };
        thickness: number;
        height: number;
        updatedAt: string;
    }, {
        end: {
            x: number;
            y: number;
            z?: number | undefined;
        };
        length: number;
        id: string;
        createdAt: string;
        roomId: string;
        start: {
            x: number;
            y: number;
            z?: number | undefined;
        };
        thickness: number;
        height: number;
        updatedAt: string;
    }>, "many">>;
    floorArea: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    projectId: string;
    createdAt: string;
    name: string;
    polygon: {
        x: number;
        y: number;
        z?: number | undefined;
    }[];
    updatedAt: string;
    wallSegments: {
        end: {
            x: number;
            y: number;
            z?: number | undefined;
        };
        length: number;
        id: string;
        createdAt: string;
        roomId: string;
        start: {
            x: number;
            y: number;
            z?: number | undefined;
        };
        thickness: number;
        height: number;
        updatedAt: string;
    }[];
    floorArea?: number | undefined;
}, {
    id: string;
    projectId: string;
    createdAt: string;
    name: string;
    polygon: {
        x: number;
        y: number;
        z?: number | undefined;
    }[];
    updatedAt: string;
    wallSegments?: {
        end: {
            x: number;
            y: number;
            z?: number | undefined;
        };
        length: number;
        id: string;
        createdAt: string;
        roomId: string;
        start: {
            x: number;
            y: number;
            z?: number | undefined;
        };
        thickness: number;
        height: number;
        updatedAt: string;
    }[] | undefined;
    floorArea?: number | undefined;
}>;
export declare const ProjectSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    rooms: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        projectId: z.ZodString;
        name: z.ZodString;
        polygon: z.ZodArray<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            z: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
            z?: number | undefined;
        }, {
            x: number;
            y: number;
            z?: number | undefined;
        }>, "many">;
        wallSegments: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            roomId: z.ZodString;
            start: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                z: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                x: number;
                y: number;
                z?: number | undefined;
            }, {
                x: number;
                y: number;
                z?: number | undefined;
            }>;
            end: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                z: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                x: number;
                y: number;
                z?: number | undefined;
            }, {
                x: number;
                y: number;
                z?: number | undefined;
            }>;
            thickness: z.ZodNumber;
            height: z.ZodNumber;
            length: z.ZodNumber;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            end: {
                x: number;
                y: number;
                z?: number | undefined;
            };
            length: number;
            id: string;
            createdAt: string;
            roomId: string;
            start: {
                x: number;
                y: number;
                z?: number | undefined;
            };
            thickness: number;
            height: number;
            updatedAt: string;
        }, {
            end: {
                x: number;
                y: number;
                z?: number | undefined;
            };
            length: number;
            id: string;
            createdAt: string;
            roomId: string;
            start: {
                x: number;
                y: number;
                z?: number | undefined;
            };
            thickness: number;
            height: number;
            updatedAt: string;
        }>, "many">>;
        floorArea: z.ZodOptional<z.ZodNumber>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        projectId: string;
        createdAt: string;
        name: string;
        polygon: {
            x: number;
            y: number;
            z?: number | undefined;
        }[];
        updatedAt: string;
        wallSegments: {
            end: {
                x: number;
                y: number;
                z?: number | undefined;
            };
            length: number;
            id: string;
            createdAt: string;
            roomId: string;
            start: {
                x: number;
                y: number;
                z?: number | undefined;
            };
            thickness: number;
            height: number;
            updatedAt: string;
        }[];
        floorArea?: number | undefined;
    }, {
        id: string;
        projectId: string;
        createdAt: string;
        name: string;
        polygon: {
            x: number;
            y: number;
            z?: number | undefined;
        }[];
        updatedAt: string;
        wallSegments?: {
            end: {
                x: number;
                y: number;
                z?: number | undefined;
            };
            length: number;
            id: string;
            createdAt: string;
            roomId: string;
            start: {
                x: number;
                y: number;
                z?: number | undefined;
            };
            thickness: number;
            height: number;
            updatedAt: string;
        }[] | undefined;
        floorArea?: number | undefined;
    }>, "many">>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    name: string;
    updatedAt: string;
    rooms: {
        id: string;
        projectId: string;
        createdAt: string;
        name: string;
        polygon: {
            x: number;
            y: number;
            z?: number | undefined;
        }[];
        updatedAt: string;
        wallSegments: {
            end: {
                x: number;
                y: number;
                z?: number | undefined;
            };
            length: number;
            id: string;
            createdAt: string;
            roomId: string;
            start: {
                x: number;
                y: number;
                z?: number | undefined;
            };
            thickness: number;
            height: number;
            updatedAt: string;
        }[];
        floorArea?: number | undefined;
    }[];
    description?: string | undefined;
}, {
    id: string;
    createdAt: string;
    name: string;
    updatedAt: string;
    description?: string | undefined;
    rooms?: {
        id: string;
        projectId: string;
        createdAt: string;
        name: string;
        polygon: {
            x: number;
            y: number;
            z?: number | undefined;
        }[];
        updatedAt: string;
        wallSegments?: {
            end: {
                x: number;
                y: number;
                z?: number | undefined;
            };
            length: number;
            id: string;
            createdAt: string;
            roomId: string;
            start: {
                x: number;
                y: number;
                z?: number | undefined;
            };
            thickness: number;
            height: number;
            updatedAt: string;
        }[] | undefined;
        floorArea?: number | undefined;
    }[] | undefined;
}>;
export declare const UserRoleSchema: z.ZodNativeEnum<typeof UserRole>;
export * from './database.js';
export * from './serializer.js';
export type PointInput = z.infer<typeof PointSchema>;
export type WallSegmentInput = z.infer<typeof WallSegmentSchema>;
export type RoomInput = z.infer<typeof RoomSchema>;
export type ProjectInput = z.infer<typeof ProjectSchema>;
export type UserRoleInput = z.infer<typeof UserRoleSchema>;
//# sourceMappingURL=index.d.ts.map