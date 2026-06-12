import { Request, Response, NextFunction } from 'express';

/**
 * Middleware that checks for a valid API key in the `x-api-key` header.
 * The expected key is stored in the `.env` file as VINMAPS_API_KEY.
 * If the header is missing or does not match, the request is rejected with 401.
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const providedKey = req.header('x-api-key');
  const expectedKey = process.env.VINMAPS_API_KEY;
  if (!expectedKey) {
    // In case the env var is missing we consider it a server mis‑configuration.
    return res.status(500).json({ error: 'Server configuration error: missing VINMAPS_API_KEY' });
  }
  if (providedKey !== expectedKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
}
