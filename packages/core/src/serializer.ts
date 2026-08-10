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
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(storageKey, serializeProject(project));
}

export function loadProjectFromLocalStorage(storageKey = 'spatial-project-v1'): Project | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawProject = window.localStorage.getItem(storageKey);
  if (!rawProject) {
    return null;
  }

  try {
    return deserializeProject(rawProject);
  } catch {
    return null;
  }
}
