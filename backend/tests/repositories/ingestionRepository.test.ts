import * as ingestionRepo from '@repositories/ingestionRepository';
import { pool } from '../../src/db';

beforeEach(async () => {
  await pool.query('TRUNCATE TABLE ingestion RESTART IDENTITY CASCADE;');
});

describe('Ingestion Repository', () => {
  it('should return all ingestions', async () => {
    const rows = [
      await ingestionRepo.create({ status: 'processing', total_rows: 10 }),
      await ingestionRepo.create({ status: 'complete', total_rows: 8 }),
      await ingestionRepo.create({ status: 'error', total_rows: 5 }),
    ];

    const all = await ingestionRepo.findAll();

    expect(all).toHaveLength(rows.length);

    all.forEach((row, i) => {
      expect(row).toHaveProperty('id');
      expect(row.status).toBe(rows[i].status);
      expect(typeof row.error_count === 'number' || row.error_count === null).toBe(true);
      expect(typeof row.total_rows === 'number' || row.total_rows === null).toBe(true);
      expect(row.created_at).toBeInstanceOf(Date);
    });
  });

  it('should fetch a specific ingestion by its ID', async () => {
    const created = await ingestionRepo.create({ status: 'processing', total_rows: 15 });
    const found = await ingestionRepo.findById(created.id);

    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.status).toBe('processing');
    expect(found!.total_rows).toBe(15);
    expect(found!.created_at).toBeInstanceOf(Date);

    const notFound = await ingestionRepo.findById(999999);
    expect(notFound).toBeNull();
});

  it('should create a new ingestion row', async () => {
    const status = 'processing';
    const total_rows = 42;
    const created = await ingestionRepo.create({ status, total_rows });

    // Basic assertions
    expect(created).toHaveProperty('id');
    expect(created.status).toBe(status);
    expect(created.total_rows).toBe(total_rows);
    expect(created.error_count === null || typeof created.error_count === 'number').toBe(true);
    expect(created.created_at).toBeInstanceOf(Date);

    // Confirm it's in the database
    const found = await ingestionRepo.findById(created.id);
    expect(found).not.toBeNull();
    expect(found!.status).toBe(status);
  });

  it('should update the status and error_count of an ingestion row', async () => {
    const created = await ingestionRepo.create({ status: 'processing', total_rows: 23 });

    await ingestionRepo.updateStatus(created.id, 'complete', 5);

    const updated = await ingestionRepo.findById(created.id);
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe('complete');
    expect(updated!.error_count).toBe(5);

    await ingestionRepo.updateStatus(created.id, 'error');
    const updatedAgain = await ingestionRepo.findById(created.id);
    expect(updatedAgain).not.toBeNull();
    expect(updatedAgain!.status).toBe('error');
    expect(updatedAgain!.error_count).toBe(5);
  });
});

afterAll(async () => {
  await pool.end();
});
