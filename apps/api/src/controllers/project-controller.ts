import crypto from 'node:crypto';
import { type Request, type Response } from 'express';
import { z } from 'zod';
import { checkFeatureEntitlement } from '@spatial/billing';
import { createSpatialComment, SpatialCommentSchema, type SpatialComment } from '@spatial/collaboration';
import { ProjectSchema, cloneProject, type Project, type ProjectInput } from '@spatial/core';
import { supabaseAdmin } from '../config/supabase.js';

const projectStore = new Map<string, Project>();
const projectCommentStore = new Map<string, SpatialComment[]>();
const publishedStore = new Map<string, { id: string; name: string; project: Project; shareToken: string; publishedAt: string }>();
const projectIdParamSchema = z.object({ id: z.string().trim().min(1) });
const publishTokenParamSchema = z.object({ token: z.string().trim().min(1) });
const createCommentSchema = SpatialCommentSchema.omit({ id: true, createdAt: true }).extend({ projectId: z.string().trim().min(1).optional() });
const persistenceContextSchema = z.object({ tenantId: z.string().uuid(), organizationId: z.string().uuid(), ownerId: z.string().uuid() });
type PersistenceContext = z.infer<typeof persistenceContextSchema>;

function durablePersistenceEnabled(): boolean { return (process.env.SUPABASE_PERSISTENCE_ENABLED ?? 'false').toLowerCase() === 'true'; }
function getPersistenceContext(req: Request): PersistenceContext | null {
  const fromRequest = persistenceContextSchema.safeParse({ tenantId: req.header('x-tenant-id'), organizationId: req.header('x-organization-id'), ownerId: req.header('x-owner-id') });
  if (fromRequest.success) return fromRequest.data;
  const fromServer = persistenceContextSchema.safeParse({ tenantId: process.env.PERSISTENCE_DEFAULT_TENANT_ID, organizationId: process.env.PERSISTENCE_DEFAULT_ORGANIZATION_ID, ownerId: process.env.PERSISTENCE_DEFAULT_OWNER_ID });
  return fromServer.success ? fromServer.data : null;
}
function requirePersistenceContext(req: Request, res: Response): PersistenceContext | null { if (!durablePersistenceEnabled()) return null; const context = getPersistenceContext(req); if (context) return context; res.status(503).json({ error: 'durable persistence is enabled but tenant context is missing', code: 'PERSISTENCE_CONTEXT_REQUIRED' }); return null; }

async function persistProject(project: Project, context: PersistenceContext | null): Promise<Project> {
  const snapshot = cloneProject(project); projectStore.set(snapshot.id, snapshot);
  if (!durablePersistenceEnabled()) return snapshot;
  if (!context) throw new Error('Durable persistence context is required.');
  const { error } = await supabaseAdmin.from('projects').upsert({ id: snapshot.id, organization_id: context.organizationId, owner_id: context.ownerId, tenant_id: context.tenantId, name: snapshot.name, description: snapshot.description ?? null, status: 'draft', project_data: snapshot, updated_at: snapshot.updatedAt });
  if (error) throw new Error(`Durable project persistence failed: ${error.message}`);
  return snapshot;
}

async function persistPublishedProject(entry: { id: string; name: string; project: Project; shareToken: string; publishedAt: string }, context: PersistenceContext): Promise<void> {
  publishedStore.set(entry.shareToken, entry);
  const { error } = await supabaseAdmin.from('share_tokens').upsert({ id: crypto.randomUUID(), organization_id: context.organizationId, project_id: entry.project.id, tenant_id: context.tenantId, token: entry.shareToken, is_active: true, created_at: entry.publishedAt, updated_at: entry.publishedAt });
  if (error) throw new Error(`Durable share-token persistence failed: ${error.message}`);
}

export async function createProjectHandler(req: Request, res: Response): Promise<void> {
  const entitlement = checkFeatureEntitlement('project-sharing'); if (!entitlement.allowed) { res.status(403).json({ error: 'feature not allowed', reason: entitlement.reason ?? 'Access denied.' }); return; }
  const payload = ProjectSchema.safeParse(req.body); if (!payload.success) { res.status(400).json({ error: 'invalid project payload', details: payload.error.flatten() }); return; }
  const context = requirePersistenceContext(req, res); if (durablePersistenceEnabled() && !context) return;
  try { const savedProject = await persistProject(payload.data, context); res.status(201).json({ project: savedProject, persistence: durablePersistenceEnabled() ? 'durable' : 'local-only', message: durablePersistenceEnabled() ? 'Project persisted successfully.' : 'Project stored in the API process only; configure durable persistence for production.' }); }
  catch (error) { console.error(error); res.status(503).json({ error: error instanceof Error ? error.message : 'Unable to persist the project.', code: 'PERSISTENCE_FAILED' }); }
}

export async function publishProjectHandler(req: Request, res: Response): Promise<void> {
  const entitlement = checkFeatureEntitlement('project-sharing'); if (!entitlement.allowed) { res.status(403).json({ error: 'feature not allowed', reason: entitlement.reason ?? 'Access denied.' }); return; }
  if (!durablePersistenceEnabled()) { res.status(503).json({ error: 'project sharing requires durable persistence to be enabled', code: 'DURABLE_PERSISTENCE_REQUIRED' }); return; }
  const params = projectIdParamSchema.safeParse(req.params); if (!params.success) { res.status(400).json({ error: 'invalid project id', details: params.error.flatten() }); return; }
  const projectPayload = ProjectSchema.safeParse(req.body as ProjectInput); if (!projectPayload.success) { res.status(400).json({ error: 'invalid project payload', details: projectPayload.error.flatten() }); return; }
  const context = requirePersistenceContext(req, res); if (!context) return;
  try { const savedProject = await persistProject(projectPayload.data, context); const shareToken = crypto.randomBytes(8).toString('hex'); const publishedEntry = { id: savedProject.id, name: savedProject.name, project: cloneProject(savedProject), shareToken, publishedAt: new Date().toISOString() }; await persistPublishedProject(publishedEntry, context); res.status(200).json({ projectId: params.data.id, shareToken, shareUrl: `/share/${shareToken}`, persistence: 'durable' }); }
  catch (error) { console.error(error); res.status(503).json({ error: error instanceof Error ? error.message : 'Unable to publish the project.', code: 'PERSISTENCE_FAILED' }); }
}

export async function createProjectCommentHandler(req: Request, res: Response): Promise<void> {
  const params = projectIdParamSchema.safeParse(req.params); if (!params.success) { res.status(400).json({ error: 'invalid project id', details: params.error.flatten() }); return; }
  const input = createCommentSchema.safeParse(req.body); if (!input.success) { res.status(400).json({ error: 'invalid comment payload', details: input.error.flatten() }); return; }
  const projectId = params.data.id; const comment = createSpatialComment({ ...input.data, projectId: input.data.projectId ?? projectId }); const nextComments = projectCommentStore.get(projectId) ?? []; projectCommentStore.set(projectId, [...nextComments, comment]); res.status(201).json({ comment, message: 'Comment created successfully.' });
}

export async function getSharedProjectHandler(req: Request, res: Response): Promise<void> {
  const params = publishTokenParamSchema.safeParse(req.params); if (!params.success) { res.status(400).json({ error: 'invalid token', details: params.error.flatten() }); return; }
  const inMemory = publishedStore.get(params.data.token);
  if (inMemory && durablePersistenceEnabled()) { res.status(200).json({ project: cloneProject(inMemory.project), shareToken: inMemory.shareToken, publishedAt: inMemory.publishedAt, persistence: 'durable' }); return; }
  if (!durablePersistenceEnabled()) { res.status(404).json({ error: 'shared design not found', code: 'DURABLE_PERSISTENCE_REQUIRED' }); return; }
  const { data: tokenRow, error: tokenError } = await supabaseAdmin.from('share_tokens').select('token, project_id, created_at, is_active').eq('token', params.data.token).eq('is_active', true).maybeSingle();
  if (tokenError) { console.error(tokenError); res.status(503).json({ error: `Unable to read share token: ${tokenError.message}`, code: 'PERSISTENCE_READ_FAILED' }); return; }
  if (!tokenRow) { res.status(404).json({ error: 'shared design not found' }); return; }
  const { data: projectRow, error: projectError } = await supabaseAdmin.from('projects').select('project_data, updated_at').eq('id', tokenRow.project_id).maybeSingle();
  if (projectError) { console.error(projectError); res.status(503).json({ error: `Unable to read shared project: ${projectError.message}`, code: 'PERSISTENCE_READ_FAILED' }); return; }
  const parsedProject = ProjectSchema.safeParse(projectRow?.project_data);
  if (!parsedProject.success) { res.status(500).json({ error: 'stored shared project is invalid', code: 'PERSISTED_PROJECT_INVALID' }); return; }
  const project = parsedProject.data; publishedStore.set(params.data.token, { id: project.id, name: project.name, project: cloneProject(project), shareToken: tokenRow.token, publishedAt: tokenRow.created_at }); res.status(200).json({ project: cloneProject(project), shareToken: tokenRow.token, publishedAt: tokenRow.created_at, persistence: 'durable' });
}
