import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import healthRouter from './routes/health.js';
import projectsRouter from './routes/projects.js';
import aiRouter from './routes/ai.js';
import uploadsRouter from './routes/uploads.js';

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));

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
