import { Router } from 'express';
import { z } from 'zod';
import { requireEntitlement } from '../middleware/entitlement-guard.js';
import { generateSpatialAction } from '@spatial/ai-engine';
const router = Router();
const aiCommandSchema = z.object({
    provider: z.enum(['openai', 'groq']),
    model: z.string().trim().min(1),
    apiKey: z.string().trim().min(1),
    prompt: z.string().trim().min(1),
    temperature: z.number().min(0).max(1).optional(),
});
router.post('/api/ai/command', requireEntitlement('FEATURE_AI_ASSISTANT'), async (req, res) => {
    const payload = aiCommandSchema.safeParse(req.body);
    if (!payload.success) {
        res.status(400).json({ error: 'invalid request payload', details: payload.error.flatten() });
        return;
    }
    try {
        const result = await generateSpatialAction(payload.data);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('AI command execution failed:', error);
        res.status(500).json({
            error: 'ai command failed',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
export default router;
//# sourceMappingURL=ai.js.map