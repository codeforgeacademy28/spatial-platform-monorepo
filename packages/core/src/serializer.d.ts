import type { Project } from './index.js';
export declare function serializeProject(project: Project): string;
export declare function deserializeProject(rawProject: string): Project;
export declare function saveProjectToLocalStorage(project: Project, storageKey?: string): void;
export declare function loadProjectFromLocalStorage(storageKey?: string): Project | null;
//# sourceMappingURL=serializer.d.ts.map