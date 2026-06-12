import { Router, Request, Response, NextFunction } from 'express';
import { POIService } from '../services/poiService';
import { validate } from '../middleware/validationMiddleware';
import { SearchPOIDto } from '../dto/poiDto';

const router = Router();

// GET /api/pois – list all (paginated in future)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pois = await POIService.findAll();
    res.json(pois);
  } catch (err) {
    next(err);
  }
});

// GET /api/pois/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const poi = await POIService.findById(req.params.id);
    if (!poi) return res.status(404).json({ error: 'POI not found' });
    res.json(poi);
  } catch (err) {
    next(err);
  }
});

// GET /api/pois/search?q=...
router.get('/search', validate(SearchPOIDto), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = (req.query.q as string) || '';
    const results = await POIService.search(query);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// GET /api/pois/near?lat=...&lon=...&radius=...
router.get('/near', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const radius = parseInt(req.query.radius as string) || 500;
    const pois = await POIService.nearby(lat, lon, radius);
    res.json(pois);
  } catch (err) {
    next(err);
  }
});

export default router;
