import { ProjectSchema } from '@spatial/core';
import type { Project } from '@spatial/core';

interface SharedProjectResponse {
  project?: unknown;
  shareToken?: string;
  publishedAt?: string;
}

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';
}

export async function fetchSharedProject(token: string): Promise<Project> {
  const response = await fetch(`${getApiBaseUrl()}/api/projects/share/${encodeURIComponent(token)}`);

  if (!response.ok) {
    throw new Error('Unable to load the published design. Verify VITE_API_BASE_URL and the API deployment.');
  }

  const payload = (await response.json()) as SharedProjectResponse;
  const parsedProject = payload.project ?? payload;

  return ProjectSchema.parse(parsedProject);
}
