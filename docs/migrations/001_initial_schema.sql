create extension if not exists "pgcrypto";

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  tenant_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  tenant_id uuid not null,
  email text not null unique,
  role text not null default 'viewer' check (role in ('admin', 'architect', 'client', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  owner_id uuid not null references users(id) on delete cascade,
  tenant_id uuid not null,
  name text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  project_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  tenant_id uuid not null,
  version_number integer not null,
  snapshot jsonb not null default '{}'::jsonb,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  unique (project_id, version_number)
);

create table if not exists spatial_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  tenant_id uuid not null,
  author_id uuid not null references users(id) on delete cascade,
  x double precision not null,
  y double precision not null,
  z double precision not null,
  normal_x double precision not null default 0,
  normal_y double precision not null default 0,
  normal_z double precision not null default 1,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists share_tokens (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  tenant_id uuid not null,
  token text not null unique,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table organizations enable row level security;
alter table users enable row level security;
alter table projects enable row level security;
alter table project_versions enable row level security;
alter table spatial_comments enable row level security;
alter table share_tokens enable row level security;

create policy "organizations_tenant_isolation" on organizations
for all to public
using (tenant_id = current_setting('app.tenant_id', true)::uuid)
with check (tenant_id = current_setting('app.tenant_id', true)::uuid);

create policy "users_tenant_isolation" on users
for all to public
using (tenant_id = current_setting('app.tenant_id', true)::uuid)
with check (tenant_id = current_setting('app.tenant_id', true)::uuid);

create policy "projects_tenant_isolation" on projects
for all to public
using (tenant_id = current_setting('app.tenant_id', true)::uuid)
with check (tenant_id = current_setting('app.tenant_id', true)::uuid);

create policy "project_versions_tenant_isolation" on project_versions
for all to public
using (tenant_id = current_setting('app.tenant_id', true)::uuid)
with check (tenant_id = current_setting('app.tenant_id', true)::uuid);

create policy "spatial_comments_tenant_isolation" on spatial_comments
for all to public
using (tenant_id = current_setting('app.tenant_id', true)::uuid)
with check (tenant_id = current_setting('app.tenant_id', true)::uuid);

create policy "share_tokens_tenant_isolation" on share_tokens
for all to public
using (tenant_id = current_setting('app.tenant_id', true)::uuid)
with check (tenant_id = current_setting('app.tenant_id', true)::uuid);

create index if not exists idx_projects_org_tenant on projects (organization_id, tenant_id);
create index if not exists idx_project_versions_project on project_versions (project_id, version_number);
create index if not exists idx_spatial_comments_project on spatial_comments (project_id, tenant_id);
create index if not exists idx_share_tokens_token on share_tokens (token, is_active);
