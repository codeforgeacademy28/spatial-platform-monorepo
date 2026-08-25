import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import healthRouter from './routes/health.js';
import projectsRouter from './routes/projects.js';
import aiRouter from './routes/ai.js';
import uploadsRouter from './routes/uploads.js';
import { apiRateLimiter } from './middleware/rate-limiter.js';
import { sanitizeRequestBody } from './middleware/sanitizer.js';

const app = express();

const configuredOrigins = (process.env.WEB_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const projectVercelOriginPattern = /^https:\/\/spatial-platform-monorepo(?:-[a-z0-9-]+)?-snm5\.vercel\.app$/i;
const productionVercelOrigin = 'https://spatial-platform-monorepo-web.vercel.app';

function isAllowedOrigin(origin?: string): boolean {
  if (!origin) return true;
  if (configuredOrigins.includes(origin)) return true;
  if (origin === 'http://localhost:5173') return true;
  if (origin === productionVercelOrigin) return true;
  return projectVercelOriginPattern.test(origin);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin is not allowed by the API CORS policy.'));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use(apiRateLimiter as any);
app.use(sanitizeRequestBody);

app.use(healthRouter);
app.use(projectsRouter);
app.use(aiRouter);
app.use(uploadsRouter);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('Unhandled API error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

export default app;
