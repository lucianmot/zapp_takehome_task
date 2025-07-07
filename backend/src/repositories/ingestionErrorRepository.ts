import { pool } from '../db';
import * as inventoryRepo from './inventoryRepository';

export type IngestionErrorRow = {
  id: number;
  ingestion_id: number;
  row_number: number;
  error_msg: string;
  raw_data: Partial<Record<string, unknown>>;
};

export type IngestionErrorInput = {
  ingestion_id: number;
  row_number: number;
  error_msg: string;
  raw_data: Partial<Record<string, unknown>>;
};

export async function findByIngestionId(ingestion_id: number): Promise<IngestionErrorRow[]> {
  const result = await pool.query(
    `SELECT * FROM ingestion_error WHERE ingestion_id = $1 ORDER BY row_number ASC`,
    [ingestion_id]
  );
  return result.rows as IngestionErrorRow[];
}

export async function insert(errorRow: IngestionErrorInput): Promise<IngestionErrorRow> {
  const result = await pool.query(
    `INSERT INTO ingestion_error (ingestion_id, row_number, error_msg, raw_data)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      errorRow.ingestion_id,
      errorRow.row_number,
      errorRow.error_msg,
      errorRow.raw_data
    ]
  );
  return result.rows[0] as IngestionErrorRow;
}

export async function findById(id: number): Promise<IngestionErrorRow | null> {
  const result = await pool.query(
    'SELECT * FROM ingestion_error WHERE id = $1',
    [id]
  );
  return result.rows[0] as IngestionErrorRow || null;
}

export async function update(
  id: number,
  fields: Partial<Omit<IngestionErrorInput, 'ingestion_id' | 'row_number'>>,
): Promise<IngestionErrorRow | null> {
  const setClauses: string[] = [];
  const values: (string | number | Record<string, unknown>)[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(fields)) {
    setClauses.push(`${key} = $${idx}`);
    // raw_data, store as JSON
    if (key === 'raw_data' && value !== undefined) {
      values.push(JSON.stringify(value));
    } else {
      values.push(value as string);
    }
    idx++;
  }
  if (setClauses.length === 0) {
    // no update, return row
    const current = await findById(id);
    return current;
  }
  values.push(id);

  const result = await pool.query(
    `UPDATE ingestion_error SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return result.rows[0] as IngestionErrorRow | null;
}

export async function deleteRow(id: number): Promise<void> {
  await pool.query('DELETE FROM ingestion_error WHERE id = $1', [id]);
}

export async function bulkInsert(
  errorRows: IngestionErrorInput[]
): Promise<void> {
  if (errorRows.length === 0) return;

  const values: (number | number | string | Record<string, unknown>)[] = [];
  const valueClauses: string[] = [];

  errorRows.forEach((row, idx) => {
    valueClauses.push(
      `($${idx * 4 + 1}, $${idx * 4 + 2}, $${idx * 4 + 3}, $${idx * 4 + 4})`
    );
    values.push(
      row.ingestion_id,
      row.row_number,
      row.error_msg,
      JSON.stringify(row.raw_data)
    );
  });

  await pool.query(
    `
      INSERT INTO ingestion_error (ingestion_id, row_number, error_msg, raw_data)
      VALUES ${valueClauses.join(', ')}
    `,
    values
  );
}

export async function moveToInventory(id: number): Promise<void> {
  const errorRow = await findById(id);
  if (!errorRow) throw new Error(`Error row with id ${id} not found`);

  const raw = errorRow.raw_data;
  if (!raw.sku || !raw.store || typeof raw.quantity !== 'number') {
    throw new Error('Invalid data in raw_data for inventory insertion');
  }

  const inventoryInput = {
    sku: String(raw.sku),
    description: typeof raw.description === 'string' ? raw.description : null,
    store: String(raw.store),
    quantity: Number(raw.quantity),
    last_upload: new Date(),
    ingestion_id: errorRow.ingestion_id
  };

  await inventoryRepo.bulkUpsert([inventoryInput], errorRow.ingestion_id);

  await deleteRow(id);
}