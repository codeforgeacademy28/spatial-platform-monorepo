# Persistence Contract

## Purpose
Keep project persistence truthful across local development, API runtime, Supabase, versions, revert, and share.

## Modes

### Local-only mode
`SUPABASE_PERSISTENCE_ENABLED=false` (default)

The API may keep an in-memory copy for local development, but this is **not durable**. The web client refuses to report a local-only response as a successful durable save. Browser localStorage remains the recovery mechanism.

### Durable mode
`SUPABASE_PERSISTENCE_ENABLED=true`

The API obtains persistence context in this order:

1. authenticated/request headers: `x-tenant-id`, `x-organization-id`, `x-owner-id`
2. server-owned single-workspace fallback:
   - `PERSISTENCE_DEFAULT_TENANT_ID`
   - `PERSISTENCE_DEFAULT_ORGANIZATION_ID`
   - `PERSISTENCE_DEFAULT_OWNER_ID`

All values must be valid UUIDs and must identify records that satisfy the Supabase foreign-key/RLS model. Browser-controlled identifiers should only be used as an interim contract; the production target is authenticated session context.

## Save behavior
1. Validate `ProjectSchema`.
2. Keep a cloned local/in-process snapshot for recovery.
3. In durable mode, upsert the complete project into `projects.project_data` with tenant/org/owner metadata.
4. Any durable write failure returns HTTP 503 with a machine-readable persistence error code.
5. The web client keeps its local recovery copy when the durable save fails.

## Publish/share behavior
Publishing requires durable persistence. A share token is persisted in `share_tokens`; the published project is read from `projects.project_data`.

A share URL must not be presented as durable when the database is unavailable.

## Restart behavior
When durable mode is enabled and the in-memory published cache is empty, `GET /api/projects/share/:token` reads `share_tokens` and then `projects.project_data` from Supabase and validates the stored project with `ProjectSchema`.

## Version integrity
Versions are deep snapshots. Subsequent editor mutations must not change previously saved A/B comparison data. The reusable `@spatial/core` `cloneProject()` helper and its contract test enforce deep-copy semantics.

## Security rules
- Never use a synthetic user/org/tenant identity merely to satisfy database foreign keys.
- Never disable RLS to make the editor appear to save.
- Prefer authenticated session context over browser-entered identifiers.
- Keep service-role credentials server-side only.

## Release requirement
Before production release, configure durable persistence, provision the referenced organization/user/tenant records, and authenticate the request context. A production build with local-only persistence is not considered a complete release.
