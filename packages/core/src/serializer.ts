import type { Project } from './index';
import { ProjectSchema } from './index';

export function serializeProject(project: Project): string {
  const validatedProject = ProjectSchema.parse(project);
  return JSON.stringify(validatedProject, null, 2);
}

export function deserializeProject(rawProject: string): Project {
  const parsed = JSON.parse(rawProject) as unknown;
  return ProjectSchema.parse(parsed);
}

export function saveProjectToLocalStorage(project: Project, storageKey = 'spatial-project-v1'): void {
  const storage = globalThis.localStorage;
  if (!storage) {
    return;
  }

  storage.setItem(storageKey, serializeProject(project));
}

export function loadProjectFromLocalStorage(storageKey = 'spatial-project-v1'): Project | null {
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
  } catch {
    return null;
  }
}
