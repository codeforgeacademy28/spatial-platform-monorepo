import type { UserRole } from './index.js';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppUser {
  id: string;
  organizationId: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRecord {
  id: string;
  organizationId: string;
  ownerId: string;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  projectData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectVersion {
  id: string;
  projectId: string;
  organizationId: string;
  versionNumber: number;
  snapshot: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
}

export interface SpatialComment {
  id: string;
  projectId: string;
  organizationId: string;
  authorId: string;
  x: number;
  y: number;
  z: number;
  normalX: number;
  normalY: number;
  normalZ: number;
  text: string;
  createdAt: string;
}

export interface ShareToken {
  id: string;
  organizationId: string;
  projectId: string;
  token: string;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}
