import { Router, type Request, type Response } from 'express';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    ok: true,
    service: 'spatial-api',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
