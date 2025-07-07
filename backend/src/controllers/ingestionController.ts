import { Request, Response } from 'express';
import * as ingestionService from '@services/ingestionService';
import express from 'express';

// GET /api/ingestions
export async function getAllIngestions(req: Request, res: Response) {
  try {
    const ingestions = await ingestionService.getAllIngestions();
    res.status(200).json(ingestions);
  } catch (error) {
    console.error('[getAllIngestions] Error:', error);
    res.status(500).json({ error: 'Failed to fetch ingestions' });
  }
}

// GET /api/ingestions/:id
export async function getIngestionById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id || id <= 0) {
      return res.status(400).json({ error: 'Invalid ingestion id' });
    }
    const ingestion = await ingestionService.getIngestionById(id);
    res.status(200).json(ingestion);
  } catch (error: any) {
    if (/does not exist/i.test(error.message)) {
      res.status(404).json({ error: error.message });
    } else {
      console.error('[getIngestionById] Error:', error);
      res.status(500).json({ error: 'Failed to fetch ingestion' });
    }
  }
}

// POST /api/ingestions
export async function startIngestion(req: Request, res: Response) {
  try {
    const rows = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Request body must be a non-empty array of rows' });
    }
    const result = await ingestionService.startIngestion(rows);
    res.status(201).json(result); // 201 Created
  } catch (error: any) {
    console.error('[startIngestion] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to start ingestion' });
  }
}

const router = express.Router();

router.get('/ingestions', getAllIngestions);
router.get('/ingestions/:id', getIngestionById);
router.post('/ingestions', startIngestion);

export default router;