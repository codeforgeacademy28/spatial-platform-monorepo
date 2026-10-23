import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import app from '../src/app.js';
import { getSupabasePersistenceReadiness } from '../src/config/supabase.js';

test('Supabase readiness reports missing server configuration without exposing secret values', () => {
  const names = [
    'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
    'PERSISTENCE_DEFAULT_TENANT_ID', 'PERSISTENCE_DEFAULT_ORGANIZATION_ID', 'PERSISTENCE_DEFAULT_OWNER_ID',
  ] as const;
  const previous = new Map(names.map((name) => [name, process.env[name]]));
  try {
    for (const name of names) delete process.env[name];
    const missing = getSupabasePersistenceReadiness();
    assert.equal(missing.configured, false);
    assert.deepEqual(new Set(missing.missing), new Set(names));

    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-only-test-key';
    process.env.PERSISTENCE_DEFAULT_TENANT_ID = '00000000-0000-4000-8000-000000000001';
    process.env.PERSISTENCE_DEFAULT_ORGANIZATION_ID = '00000000-0000-4000-8000-000000000002';
    process.env.PERSISTENCE_DEFAULT_OWNER_ID = '00000000-0000-4000-8000-000000000003';
    const ready = getSupabasePersistenceReadiness();
    assert.equal(ready.configured, true);
    assert.deepEqual(ready.missing, []);
  } finally {
    for (const name of names) {
      const value = previous.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test('local-only API save/list/open round-trips a full versioned project', async () => {
  const previousMode = process.env.SUPABASE_PERSISTENCE_ENABLED;
  process.env.SUPABASE_PERSISTENCE_ENABLED = 'false';
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const timestamp = new Date().toISOString();
  const id = randomUUID();
  const project = {
    id,
    name: 'Persistence contract test',
    walls: [],
    rooms: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    building: {
      schemaVersion: 1,
      levels: [{ id: 'ground', name: 'Ground Floor', elevation: 0, wallHeight: 2.7, order: 0 }],
      floorSlabs: [],
      stairs: [],
      components: [{
        id: 'sofa', levelId: 'ground', type: 'sofa', name: 'Test sofa',
        position: [1, 0, 2], rotation: [0, 0, 0], scale: [1, 1, 1],
        dimensions: { width: 2, height: 0.8, depth: 0.8 },
      }],
    },
  };

  try {
    const saveResponse = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    assert.equal(saveResponse.status, 201);
    const saved = await saveResponse.json() as { project: { id: string }; persistence: string };
    assert.equal(saved.project.id, id);
    assert.equal(saved.persistence, 'local-only');

    const listResponse = await fetch(`${baseUrl}/api/projects`);
    assert.equal(listResponse.status, 200);
    const listed = await listResponse.json() as { projects: Array<{ id: string }>; persistence: string };
    assert.equal(listed.persistence, 'local-only');
    assert.ok(listed.projects.some((entry) => entry.id === id));

    const openResponse = await fetch(`${baseUrl}/api/projects/${id}`);
    assert.equal(openResponse.status, 200);
    const opened = await openResponse.json() as { project: typeof project; persistence: string };
    assert.equal(opened.persistence, 'local-only');
    assert.equal(opened.project.building.components[0]?.name, 'Test sofa');
    assert.equal(opened.project.building.levels[0]?.name, 'Ground Floor');

    process.env.SUPABASE_PERSISTENCE_ENABLED = 'true';
    const invalidIdResponse = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...project, id: 'legacy-id' }),
    });
    assert.equal(invalidIdResponse.status, 400);
    const invalidIdPayload = await invalidIdResponse.json() as { code?: string };
    assert.equal(invalidIdPayload.code, 'PROJECT_ID_MUST_BE_UUID');

    // Missing database configuration must fail closed rather than silently
    // report a process-local cache write as durable success.
    const configNames = [
      'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
      'PERSISTENCE_DEFAULT_TENANT_ID', 'PERSISTENCE_DEFAULT_ORGANIZATION_ID', 'PERSISTENCE_DEFAULT_OWNER_ID',
    ] as const;
    const previousConfig = new Map(configNames.map((name) => [name, process.env[name]]));
    try {
      for (const name of configNames) delete process.env[name];
      process.env.PERSISTENCE_DEFAULT_TENANT_ID = '00000000-0000-4000-8000-000000000001';
      process.env.PERSISTENCE_DEFAULT_ORGANIZATION_ID = '00000000-0000-4000-8000-000000000002';
      process.env.PERSISTENCE_DEFAULT_OWNER_ID = '00000000-0000-4000-8000-000000000003';
      const failedDurableId = randomUUID();
      const durableSave = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...project, id: failedDurableId }),
      });
      assert.equal(durableSave.status, 503);
      const durableSavePayload = await durableSave.json() as { code?: string; persistence?: string };
      assert.equal(durableSavePayload.code, 'PERSISTENCE_FAILED');
      assert.equal(durableSavePayload.persistence, undefined);

      process.env.SUPABASE_PERSISTENCE_ENABLED = 'false';
      const notCached = await fetch(`${baseUrl}/api/projects/${failedDurableId}`);
      assert.equal(notCached.status, 404);
      process.env.SUPABASE_PERSISTENCE_ENABLED = 'true';

      const durableList = await fetch(`${baseUrl}/api/projects`);
      assert.equal(durableList.status, 503);
      const durableListPayload = await durableList.json() as { code?: string };
      assert.equal(durableListPayload.code, 'PERSISTENCE_READ_FAILED');

      const durableOpen = await fetch(`${baseUrl}/api/projects/${id}`);
      assert.equal(durableOpen.status, 503);
      const durableOpenPayload = await durableOpen.json() as { code?: string };
      assert.equal(durableOpenPayload.code, 'PERSISTENCE_READ_FAILED');
    } finally {
      for (const name of configNames) {
        const value = previousConfig.get(name);
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    if (previousMode === undefined) delete process.env.SUPABASE_PERSISTENCE_ENABLED;
    else process.env.SUPABASE_PERSISTENCE_ENABLED = previousMode;
  }
});
