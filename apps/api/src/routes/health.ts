import { Router, type Request, type Response } from 'express';
import { getSupabasePersistenceReadiness } from '../config/supabase.js';

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

export default router;
