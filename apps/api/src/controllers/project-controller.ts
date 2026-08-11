import crypto from 'node:crypto';
import { type Request, type Response } from 'express';
import { z } from 'zod';
import { checkFeatureEntitlement } from '@spatial/billing';
import {
  createSpatialComment,
  SpatialCommentSchema,
  type SpatialComment,
} from '@spatial/collaboration';
import { ProjectSchema, type Project, type ProjectInput } from '@spatial/core';
import { supabase } from '../config/supabase.js';

const projectStore = new Map<string, Project>();
const projectCommentStore = new Map<string, SpatialComment[]>();
const publishedStore = new Map<string, { id: string; name: string; project: Project; shareToken: string; publishedAt: string }>();

const projectIdParamSchema = z.object({
  id: z.string().trim().min(1),
});

const publishTokenParamSchema = z.object({
  token: z.string().trim().min(1),
});

const createCommentSchema = SpatialCommentSchema.omit({
  id: true,
  createdAt: true,
}).extend({
  projectId: z.string().trim().min(1).optional(),
});

function canUseSupabase(): boolean {
  const url = process.env.SUPABASE_URL ?? '';
  return url.length > 0 && url !== 'http://localhost:54321';
}

async function persistProject(project: Project): Promise<Project> {
  projectStore.set(project.id, project);

  if (canUseSupabase()) {
    try {
      const { error } = await supabase.from('projects').upsert({
        id: project.id,
        name: project.name,
        description: project.description ?? null,
        status: 'draft',
        project_data: project,
        updated_at: project.updatedAt,
      });

      if (error) {
        console.warn('Supabase project upsert failed:', error.message);
      }
    } catch (error) {
      console.warn('Supabase project upsert exception:', error);
    }
  }

  return project;
}

async function persistPublishedProject(entry: { id: string; name: string; project: Project; shareToken: string; publishedAt: string }): Promise<void> {
  publishedStore.set(entry.shareToken, entry);

  if (canUseSupabase()) {
    try {
      const { error } = await supabase.from('share_tokens').upsert({
        id: crypto.randomUUID(),
        project_id: entry.project.id,
        token: entry.shareToken,
        is_active: true,
        created_at: entry.publishedAt,
        updated_at: entry.publishedAt,
      });

      if (error) {
        console.warn('Supabase share token write failed:', error.message);
      }
    } catch (error) {
      console.warn('Supabase share token write exception:', error);
    }
  }
}

export async function createProjectHandler(req: Request, res: Response): Promise<void> {
  const entitlement = checkFeatureEntitlement('project-sharing');
  if (!entitlement.allowed) {
    res.status(403).json({ error: 'feature not allowed', reason: entitlement.reason ?? 'Access denied.' });
    return;
  }

  const payload = ProjectSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ error: 'invalid project payload', details: payload.error.flatten() });
    return;
  }

  const project: Project = payload.data; 
  const savedProject = await persistProject(project);

  res.status(201).json({
    project: savedProject,
    message: 'Project created successfully.',
    shareUrl: `/share/${encodeURIComponent(project.id)}`,
  });
}

export async function publishProjectHandler(req: Request, res: Response): Promise<void> {
  const entitlement = checkFeatureEntitlement('project-sharing');
  if (!entitlement.allowed) {
    res.status(403).json({ error: 'feature not allowed', reason: entitlement.reason ?? 'Access denied.' });
    return;
  }

  const params = projectIdParamSchema.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: 'invalid project id', details: params.error.flatten() });
    return;
  }

  const projectPayload = ProjectSchema.safeParse(req.body as ProjectInput);
  if (!projectPayload.success) {
    res.status(400).json({ error: 'invalid project payload', details: projectPayload.error.flatten() });
    return;
  }

  const project = projectPayload.data;
  const savedProject = await persistProject(project);
  const shareToken = crypto.randomBytes(8).toString('hex');
  const publishedEntry = {
    id: savedProject.id,
    name: savedProject.name,
    project: savedProject,
    shareToken,
    publishedAt: new Date().toISOString(),
  };

  await persistPublishedProject(publishedEntry);

  res.status(200).json({
    projectId: params.data.id,
    shareToken,
    shareUrl: `/share/${shareToken}`,
    published: publishedEntry,
  });
}

export async function createProjectCommentHandler(req: Request, res: Response): Promise<void> {
  const params = projectIdParamSchema.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: 'invalid project id', details: params.error.flatten() });
    return;
  }

  const input = createCommentSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: 'invalid comment payload', details: input.error.flatten() });
    return;
  }

  const projectId = params.data.id;
  const comment = createSpatialComment({
    ...input.data,
    projectId: input.data.projectId ?? projectId,
  });

  const nextComments = projectCommentStore.get(projectId) ?? [];
  projectCommentStore.set(projectId, [...nextComments, comment]);

  res.status(201).json({
    comment,
    message: 'Comment created successfully.',
  });
}

export async function getSharedProjectHandler(req: Request, res: Response): Promise<void> {
  const params = publishTokenParamSchema.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: 'invalid token', details: params.error.flatten() });
    return;
  }

  const published = publishedStore.get(params.data.token);
  if (!published) {
    res.status(404).json({ error: 'shared design not found' });
    return;
  }

  res.status(200).json({
    project: published.project,
    shareToken: published.shareToken,
    publishedAt: published.publishedAt,
  });
}
