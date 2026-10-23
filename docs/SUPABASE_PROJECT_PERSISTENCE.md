# Supabase project persistence and saved-project library

This guide configures the API to save projects durably and lets the web editor list/open saved projects. **Code support alone does not mean Supabase is enabled**: the API deliberately defaults to local-only mode.

## 1. Apply the database schema

Apply `docs/migrations/001_initial_schema.sql` to the intended Supabase project. The API expects the `projects` and `share_tokens` tables and their current columns.

The configured default owner and organization must already exist:
- `PERSISTENCE_DEFAULT_ORGANIZATION_ID` must identify a row in `organizations`.
- `PERSISTENCE_DEFAULT_OWNER_ID` must identify a row in `users`.
- Both rows' `tenant_id` values must match `PERSISTENCE_DEFAULT_TENANT_ID`.
- The user's `organization_id` must match `PERSISTENCE_DEFAULT_ORGANIZATION_ID`.

Use IDs from your own environment; do not copy the example UUIDs below as real identity records.

Example seed pattern (replace all example values before executing):

```sql
insert into organizations (id, name, slug, tenant_id)
values (
  '00000000-0000-4000-8000-000000000002',
  'Personal Workspace',
  'personal-workspace-replace-me',
  '00000000-0000-4000-8000-000000000001'
);

insert into users (id, organization_id, tenant_id, email, role)
values (
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'replace-with-an-email-you-control@example.com',
  'admin'
);
```

The example IDs are illustrative only. Use unique values and ensure the slug/email do not already exist.

## 2. Configure the API runtime

Set these variables on the **API hosting service**, not in browser-visible configuration:

- `SUPABASE_PERSISTENCE_ENABLED=true`
- `SUPABASE_URL=https://<your-project-ref>.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=<server-only service role key>`
- `PERSISTENCE_DEFAULT_TENANT_ID=<tenant UUID from the seeded organization>`
- `PERSISTENCE_DEFAULT_ORGANIZATION_ID=<seeded organization UUID>`
- `PERSISTENCE_DEFAULT_OWNER_ID=<seeded user UUID>`

Never use the service-role key as a `VITE_*` variable or put it in web source code. Restart/redeploy the API after setting runtime variables. The API returns an explicit error if durable mode is enabled but required configuration is missing.

## 3. Point the web app to the API

Set `VITE_API_BASE_URL` in the **web build environment** to the deployed API origin, for example `https://your-api.example.com` (no trailing slash required), then rebuild/redeploy the web app. If this is absent, the client uses same-origin `/api` paths, which only works when the web host proxies those paths to the API.

After deployment:
1. Open the editor and save a small test project.
2. Confirm the UI says **Saved to Supabase**, not local-only or temporary API memory.
3. Open **Saved projects**, refresh the list, and confirm the source says **Supabase · durable**.
4. Open the project and verify walls, rooms, scene assets, openings, presentation and building components restore.
5. Restart/redeploy the API and repeat steps 3–4.

Browser recovery copies are intentionally retained, but they are not a substitute for durable storage.

## 4. Run the opt-in database integration test

From the repository root, with the API environment variables above available to the test process:

```bash
SUPABASE_INTEGRATION_TESTS=true npm --workspace @spatial/api run test:integration:supabase
```

This opt-in test writes a uniquely identified fixture, closes and restarts the HTTP server, verifies that list/open read the saved project from Supabase (including scene assets, presentation and building components), and attempts to delete the fixture afterward. Use a non-production Supabase project where possible. Standard CI skips this test unless `SUPABASE_INTEGRATION_TESTS=true`.

## Security limitation

The current persistence context is a **single server-configured default owner/organization**. Do not enable this configuration for a public multi-user deployment: authenticated user identity, authorization and tenant-isolation tests must be implemented first. The service-role key bypasses Supabase RLS, so the API's server-side ownership checks are security-critical.
