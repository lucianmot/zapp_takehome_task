import { pool } from '../db';

function mapInventoryRow(row: any): InventoryRow {
  return {
    ...row,
    last_upload: row.last_upload instanceof Date ? row.last_upload : new Date(row.last_upload),
  };
}

export type InventoryRow = {
  id: number;
  sku: string;
  description: string | null;
  store: string;
  quantity: number;
  last_upload: Date;
  ingestion_id: number;
};

export async function findAll(): Promise<InventoryRow[]> {
  const result = await pool.query('SELECT * FROM inventory ORDER BY id ASC');
  return result.rows.map(mapInventoryRow);
}

export async function findById(id: number): Promise<InventoryRow | null> {
  const result = await pool.query(
    'SELECT * FROM inventory WHERE id = $1',
    [id]
  );
  return result.rows[0] ? mapInventoryRow(result.rows[0]) : null;
}

export async function findBySkuAndStore(sku: string, store: string): Promise<InventoryRow | null> {
  const result = await pool.query(
    'SELECT * FROM inventory WHERE sku = $1 AND store = $2',
    [sku, store]
  );
  return result.rows[0] ? mapInventoryRow(result.rows[0]) : null;
}

export async function insert(row: Omit<InventoryRow, 'id'>): Promise<InventoryRow> {
  const result = await pool.query(
    `INSERT INTO inventory (sku, description, store, quantity, last_upload, ingestion_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [row.sku, row.description, row.store, row.quantity, row.last_upload, row.ingestion_id]
  );
  return mapInventoryRow(result.rows[0]);
}

export async function update(
  id: number,
  fields: Partial<Omit<InventoryRow, 'id'>>
): Promise<InventoryRow | null> {
  const setClauses: string[] = [];
  const values: (string | number | Date | null)[] = [];
  let i = 1;
  for (const [key, value] of Object.entries(fields)) {
    setClauses.push(`${key} = $${i}`);
    values.push(value);
    i++;
  }
  // no fields update
  if (setClauses.length === 0) {
    return findById(id);
  }
  values.push(id);

  const result = await pool.query(
    `UPDATE inventory SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return result.rows[0] ? mapInventoryRow(result.rows[0]) : null;
}

export async function deleteRow(id: number): Promise<void> {
  await pool.query('DELETE FROM inventory WHERE id = $1', [id]);
}

export async function bulkUpsert(
  rows: Omit<InventoryRow, 'id'>[],
  ingestion_id: number
): Promise<void> {
  if (rows.length === 0) return;

  // values clause and params for bulk insert
  const values: (string | number | Date | null)[] = [];
  const valueClauses: string[] = [];

  rows.forEach((row, idx) => {
    // 6 cols per row: sku, desc, store, quantity, last_upload, ingestion_id
    valueClauses.push(
      `($${idx * 6 + 1}, $${idx * 6 + 2}, $${idx * 6 + 3}, $${idx * 6 + 4}, $${idx * 6 + 5}, $${idx * 6 + 6})`
    );
    values.push(
      row.sku,
      row.description,
      row.store,
      row.quantity,
      row.last_upload,
      ingestion_id
    );
  });

  const query = `
    INSERT INTO inventory (sku, description, store, quantity, last_upload, ingestion_id)
    VALUES ${valueClauses.join(', ')}
    ON CONFLICT (sku, store)
    DO UPDATE SET
      description = EXCLUDED.description,
      quantity = EXCLUDED.quantity,
      last_upload = EXCLUDED.last_upload,
      ingestion_id = EXCLUDED.ingestion_id
  `;

  await pool.query(query, values);
}