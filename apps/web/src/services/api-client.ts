import { ProjectSchema } from '@spatial/core';
import type { Project } from '@spatial/core';

interface SharedProjectResponse {
  project?: unknown;
  shareToken?: string;
  publishedAt?: string;
}

export async function fetchSharedProject(token: string): Promise<Project> {
  const response = await fetch(`http://localhost:4000/api/projects/share/${encodeURIComponent(token)}`);

  if (!response.ok) {
    throw new Error('Unable to load the published design.');
  }

  const payload = (await response.json()) as SharedProjectResponse;
  const parsedProject = payload.project ?? payload;

  return ProjectSchema.parse(parsedProject);
}

export async function saveProject(project: Project): Promise<Project> {
  const validated = ProjectSchema.parse(project);
  const response = await fetch('http://localhost:4000/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validated),
  });

  if (!response.ok) {
    throw new Error('Unable to save project');
  }

  const payload = (await response.json()) as { project?: unknown };
  return ProjectSchema.parse(payload.project ?? payload);
}
