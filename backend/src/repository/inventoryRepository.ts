import { pool } from '../db';

export type InventoryRow = {
  id: number;
  sku: string;
  description: string;
  store: string;
  quantity: number;
  last_upload: string;
  batch_id: number;
};

export async function findAll(): Promise<InventoryRow[]> {
  const result = await pool.query('SELECT * FROM inventory ORDER BY id ASC');
  return result.rows;
}

export async function insert(row: Omit<InventoryRow, 'id'>): Promise<InventoryRow> {
  const result = await pool.query(
    `INSERT INTO inventory (sku, description, store, quantity, last_upload, batch_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [row.sku, row.description, row.store, row.quantity, row.last_upload, row.batch_id]
  );
  return result.rows[0];
}
