import cors from 'cors';
import express from 'express';
import healthRouter from './routes/health.js';
import projectsRouter from './routes/projects.js';
import aiRouter from './routes/ai.js';
import uploadsRouter from './routes/uploads.js';
import { apiRateLimiter } from './middleware/rate-limiter.js';
import { sanitizeRequestBody } from './middleware/sanitizer.js';
const app = express();
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(apiRateLimiter);
app.use(sanitizeRequestBody);
app.use(healthRouter);
app.use(projectsRouter);
app.use(aiRouter);
app.use(uploadsRouter);
app.use((err, _req, res, _next) => {
    console.error('Unhandled API error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
    });
});
export default app;
//# sourceMappingURL=app.js.map