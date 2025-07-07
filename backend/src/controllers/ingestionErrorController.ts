import { Request, Response } from 'express';
import * as ingestionErrorService from '@services/ingestionErrorService';
import express from 'express';

// GET /api/ingestions/:id/errors
export async function getErrorsByIngestion(req: Request, res: Response) {
  try {
    const ingestionId = Number(req.params.id);
    if (!ingestionId || ingestionId <= 0) {
      return res.status(400).json({ error: 'Invalid ingestion id' });
    }
    const errors = await ingestionErrorService.getErrorsByIngestion(ingestionId);
    res.status(200).json(errors);
  } catch (error) {
    console.error('[getErrorsByIngestion] Error:', error);
    res.status(500).json({ error: 'Failed to fetch errors for ingestion' });
  }
}

// PUT /api/ingestions/errors/:errorId
export async function correctError(req: Request, res: Response) {
  try {
    const errorId = Number(req.params.errorId);
    const fields = req.body;
    if (!errorId || errorId <= 0) {
      return res.status(400).json({ error: 'Invalid error id' });
    }
    const updated = await ingestionErrorService.correctError(errorId, fields);
    res.status(200).json(updated);
  } catch (error: any) {
    console.error('[correctError] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to correct error row' });
  }
}

// DELETE /api/ingestions/errors/:errorId
export async function deleteError(req: Request, res: Response) {
  try {
    const errorId = Number(req.params.errorId);
    if (!errorId || errorId <= 0) {
      return res.status(400).json({ error: 'Invalid error id' });
    }
    await ingestionErrorService.deleteError(errorId);
    res.status(204).send();
  } catch (error: any) {
    console.error('[deleteError] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete error row' });
  }
}

// POST /api/ingestions/errors/:errorId/promote
export async function promoteErrorToInventory(req: Request, res: Response) {
  try {
    const errorId = Number(req.params.errorId);
    if (!errorId || errorId <= 0) {
      return res.status(400).json({ error: 'Invalid error id' });
    }
    await ingestionErrorService.promoteErrorToInventory(errorId);
    res.status(200).json({ message: 'Error row promoted to inventory.' });
  } catch (error: any) {
    console.error('[promoteErrorToInventory] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to promote error row' });
  }
}

const router = express.Router();

router.get('/ingestions/:id/errors', getErrorsByIngestion);
router.put('/ingestions/errors/:errorId', correctError);
router.delete('/ingestions/errors/:errorId', deleteError);
router.post('/ingestions/errors/:errorId/promote', promoteErrorToInventory);

export default router;