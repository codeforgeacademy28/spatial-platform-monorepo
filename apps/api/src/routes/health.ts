import { Router, type Request, type Response } from 'express';
import { getSupabasePersistenceReadiness, supabaseAdmin } from '../config/supabase.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  const durablePersistenceEnabled = (process.env.SUPABASE_PERSISTENCE_ENABLED ?? 'false').toLowerCase() === 'true';
  const supabaseReadiness = getSupabasePersistenceReadiness();
  res.status(200).json({
    ok: true,
    service: 'spatial-api',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    persistence: {
      mode: durablePersistenceEnabled ? 'durable-requested' : 'local-only',
      configurationReady: durablePersistenceEnabled && supabaseReadiness.configured,
      missingConfiguration: durablePersistenceEnabled ? supabaseReadiness.missing : [],
    },
  });
});

/**
 * Live durable-storage readiness probe. Unlike /health, this actually queries
 * the projects table, so deployment checks can distinguish valid env vars
 * from a missing/unreachable/mis-migrated Supabase database.
 */
router.get('/health/ready', async (_req: Request, res: Response) => {
  const durablePersistenceEnabled = (process.env.SUPABASE_PERSISTENCE_ENABLED ?? 'false').toLowerCase() === 'true';
  const readiness = getSupabasePersistenceReadiness();
  if (!durablePersistenceEnabled) {
    res.status(503).json({ ok: false, code: 'DURABLE_PERSISTENCE_DISABLED', persistence: { mode: 'local-only', ready: false } });
    return;
  }
  if (!readiness.configured) {
    res.status(503).json({ ok: false, code: 'PERSISTENCE_CONFIGURATION_MISSING', persistence: { mode: 'durable-requested', ready: false, missingConfiguration: readiness.missing } });
    return;
  }
  try {
    const { error } = await supabaseAdmin.from('projects').select('id').limit(1);
    if (error) {
      console.error('Supabase readiness query failed:', error);
      res.status(503).json({ ok: false, code: 'SUPABASE_QUERY_FAILED', persistence: { mode: 'durable-requested', ready: false, databaseReachable: false } });
      return;
    }
    res.status(200).json({ ok: true, persistence: { mode: 'durable', ready: true, configurationReady: true, databaseReachable: true } });
  } catch (error) {
    console.error('Supabase readiness probe failed:', error);
    res.status(503).json({ ok: false, code: 'SUPABASE_QUERY_FAILED', persistence: { mode: 'durable-requested', ready: false, databaseReachable: false } });
  }
});

export default router;
