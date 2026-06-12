// backend/src/routes/reportRouter.ts
import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const reportsFile = path.resolve(__dirname, '../../data/reports.json');

// Ensure reports file exists
if (!fs.existsSync(reportsFile)) {
  fs.mkdirSync(path.dirname(reportsFile), { recursive: true });
  fs.writeFileSync(reportsFile, JSON.stringify([]));
}

// Helper to read reports
function readReports() {
  const raw = fs.readFileSync(reportsFile, 'utf-8');
  try { return JSON.parse(raw); } catch { return []; }
}

// GET all reports
router.get('/', (_req: Request, res: Response) => {
  const reports = readReports();
  res.json(reports);
});

// POST a new report
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, description, lng, lat } = req.body;
    if (!type || !description || typeof lng !== 'number' || typeof lat !== 'number') {
      return res.status(400).json({ error: 'Invalid report payload.' });
    }
    const reports = readReports();
    const newReport = { id: Date.now(), type, description, location: { lng, lat }, timestamp: new Date().toISOString() };
    reports.push(newReport);
    fs.writeFileSync(reportsFile, JSON.stringify(reports, null, 2));
    res.status(201).json(newReport);
  } catch (err) {
    next(err);
  }
});

export default router;
