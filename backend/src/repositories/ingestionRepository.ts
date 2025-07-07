import { pool } from '../db';

export type Ingestion = {
  id: number;
  created_at: Date;
  status: string;
  error_count: number | null;
  total_rows: number | null;
};

export async function create({
  status,
  total_rows,
}: {
  status: string;
  total_rows: number;
}): Promise<Ingestion> {
  const result = await pool.query(
    `INSERT INTO ingestion (status, total_rows)
     VALUES ($1, $2)
     RETURNING *`,
    [status, total_rows]
  );

  return {
    ...result.rows[0],
    created_at: new Date(result.rows[0].created_at),
  };
}

export async function findAll(): Promise<Ingestion[]> {
  const result = await pool.query(
    `SELECT * FROM ingestion ORDER BY id ASC`
  );
  return result.rows.map(row => ({
    ...row,
    created_at: new Date(row.created_at),
  }));
}

export async function findById(id: number): Promise<Ingestion | null> {
  const result = await pool.query(
    `SELECT * FROM ingestion WHERE id = $1`,
    [id]
  );
  if (!result.rows[0]) return null;
  return {
    ...result.rows[0],
    created_at: new Date(result.rows[0].created_at),
  };
}

export async function updateStatus(
  id: number,
  status: string,
  error_count?: number
): Promise<void> {
  const fields = ['status'];
  const values: (string | number)[] = [status];

  if (typeof error_count === 'number') {
    fields.push('error_count');
    values.push(error_count);
  }

  const setClause = fields.map((field, idx) => `${field} = $${idx + 1}`).join(', ');
  values.push(id);

  await pool.query(
    `UPDATE ingestion SET ${setClause} WHERE id = $${values.length}`,
    values
  );
}
