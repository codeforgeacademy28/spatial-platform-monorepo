import { ProjectSchema } from './index.js';
export function serializeProject(project) {
    const validatedProject = ProjectSchema.parse(project);
    return JSON.stringify(validatedProject, null, 2);
}
export function deserializeProject(rawProject) {
    const parsed = JSON.parse(rawProject);
    return ProjectSchema.parse(parsed);
}
export function saveProjectToLocalStorage(project, storageKey = 'spatial-project-v1') {
    const storage = globalThis.localStorage;
    if (!storage) {
        return;
    }
    storage.setItem(storageKey, serializeProject(project));
}
export function loadProjectFromLocalStorage(storageKey = 'spatial-project-v1') {
    const storage = globalThis.localStorage;
    if (!storage) {
        return null;
    }
    const rawProject = storage.getItem(storageKey);
    if (!rawProject) {
        return null;
    }
    try {
        return deserializeProject(rawProject);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=serializer.js.map