import { Router } from 'express';
const router = Router();
router.get('/health', (_req, res) => {
    res.status(200).json({
        ok: true,
        service: 'spatial-api',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});
export default router;
//# sourceMappingURL=health.js.map