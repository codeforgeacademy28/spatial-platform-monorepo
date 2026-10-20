import { ProjectSchema } from '@spatial/core';
import type { Project } from '@spatial/core';

interface SharedProjectResponse {
  project?: unknown;
  shareToken?: string;
  publishedAt?: string;
  persistence?: 'durable' | 'local-only';
}

interface SaveProjectResponse {
  project: unknown;
  message?: string;
  persistence?: 'durable' | 'local-only';
}

export type SaveResult =
  | { status: 'durable'; project: Project }
  | { status: 'local-only'; project: Project; message: string };

function getApiBaseUrl(): string { return import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''; }

async function parseError(response: Response, fallback: string): Promise<Error> {
  try {
    const payload = (await response.json()) as { error?: string; message?: string };
    return new Error(payload.error ?? payload.message ?? fallback);
  } catch { return new Error(fallback); }
}

export async function saveProject(project: Project): Promise<SaveResult> {
  const response = await fetch(`${getApiBaseUrl()}/api/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(project) });
  if (!response.ok) throw await parseError(response, 'Unable to save the project to the server.');
  const payload = (await response.json()) as SaveProjectResponse;
  const savedProject = ProjectSchema.parse(payload.project);
  if (payload.persistence === 'durable') return { status: 'durable', project: savedProject };
  return { status: 'local-only', project: savedProject, message: payload.message ?? 'Server storage is temporary.' };
}

export async function fetchSharedProject(token: string): Promise<Project> {
  const response = await fetch(`${getApiBaseUrl()}/api/projects/share/${encodeURIComponent(token)}`);
  if (!response.ok) throw await parseError(response, 'Unable to load the published design.');
  const payload = (await response.json()) as SharedProjectResponse;
  return ProjectSchema.parse(payload.project ?? payload);
}
