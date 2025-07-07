import { Request, Response } from 'express';
import * as inventoryService from '@services/inventoryService';
import express from 'express';

// GET /api/inventory
export async function getAllInventory(req: Request, res: Response) {
  try {
    const rows = await inventoryService.findAll();
    res.status(200).json(rows);
  } catch (error) {
    console.error('[getAllInventory] Error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory rows' });
  }
}

// POST /api/inventory
export async function addInventory(req: Request, res: Response) {
  try {
    const newRow = req.body;
    const result = await inventoryService.addInventory(newRow);
    res.status(201).json(result); // 201 Created
  } catch (error: any) {
    // Optionally check for known errors (e.g., Zod validation, duplicate, etc.)
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else if (/already exists/i.test(error.message)) {
      res.status(409).json({ error: error.message });
    } else {
      console.error('[addInventory] Error:', error);
      res.status(500).json({ error: 'Failed to add inventory row' });
    }
  }
}

// PUT /api/inventory/:id
export async function updateInventory(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const fields = req.body;

    // Ensure id is a positive number
    if (!id || id <= 0) {
      return res.status(400).json({ error: 'Invalid inventory id' });
    }

    const updated = await inventoryService.updateInventory(id, fields);
    res.status(200).json(updated);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else if (/does not exist/i.test(error.message)) {
      res.status(404).json({ error: error.message });
    } else if (/Cannot update SKU or store/i.test(error.message)) {
      res.status(400).json({ error: error.message });
    } else {
      console.error('[updateInventory] Error:', error);
      res.status(500).json({ error: 'Failed to update inventory row' });
    }
  }
}

// DELETE /api/inventory/:id
export async function deleteInventory(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!id || id <= 0) {
      return res.status(400).json({ error: 'Invalid inventory id' });
    }

    await inventoryService.deleteInventory(id);
    res.status(204).send(); // 204 No Content on successful delete
  } catch (error: any) {
    if (/does not exist/i.test(error.message)) {
      res.status(404).json({ error: error.message });
    } else {
      console.error('[deleteInventory] Error:', error);
      res.status(500).json({ error: 'Failed to delete inventory row' });
    }
  }
}


const router = express.Router();

router.get('/inventory', getAllInventory);
router.post('/inventory', addInventory);
router.put('/inventory/:id', updateInventory);
router.delete('/inventory/:id', deleteInventory);

export default router;
