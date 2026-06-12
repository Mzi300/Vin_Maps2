import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import pino from 'pino';
import pinoHttp from 'pino-http';
import poiRouter from './routes/poiRouter';
import routeRouter from './routes/routeRouter';
import reportRouter from './routes/reportRouter';

dotenv.config();

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 60_000, // 1 minute
    max: 120, // limit each IP to 120 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(pinoHttp({ logger }));

// Health check
app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/pois', poiRouter);
app.use('/api/report', reportRouter);
app.use('/api/route', routeRouter);

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`VinMaps backend listening on port ${PORT}`);
});

export default app;
