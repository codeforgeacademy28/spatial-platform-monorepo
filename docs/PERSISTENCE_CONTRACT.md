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


## Saved project library and troubleshooting

The editor's **Load** action opens the saved-project library. It combines browser-local recovery copies with the server's `GET /api/projects` result; selecting a server project fetches `GET /api/projects/:id` and restores the full validated Project model. The API list/load endpoints scope durable reads by tenant, organization and owner context.

**Important: code support does not enable Supabase by itself.** The API currently defaults `SUPABASE_PERSISTENCE_ENABLED` to `false`. In that mode it reports `persistence: "local-only"` and holds a temporary in-memory API copy. The UI must not describe this as a database save. Durable deployment requires:

- `SUPABASE_PERSISTENCE_ENABLED=true`
- server-side `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` values for the correct Supabase project
- valid, already-provisioned UUIDs for `PERSISTENCE_DEFAULT_TENANT_ID`, `PERSISTENCE_DEFAULT_ORGANIZATION_ID`, and `PERSISTENCE_DEFAULT_OWNER_ID` until authenticated identity context is available
- `VITE_API_BASE_URL` configured to reach the deployed API
- the SQL migration applied to that same Supabase project

The service-role key must never be placed in Vite/browser environment variables. Do not create synthetic tenant/user rows or disable RLS to make writes appear successful. The project table uses UUID primary keys; the editor now assigns UUIDs to new projects and saved version snapshots so database writes are compatible. A successful production build does not prove that these runtime environment variables or database records exist.


## Runtime persistence health contract

`GET /health` now reports whether durable persistence was requested, whether the required server-side Supabase URL/service-role configuration appears present, and which configuration variable names are missing. This is configuration readiness only; it does not prove database reachability or successful writes. In durable mode, save/list/open must return an explicit failure if configuration or database access fails. Never expose the service-role key or put it in Vite/client environment variables.
