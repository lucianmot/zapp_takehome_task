import * as ingestionService from '@services/ingestionService';
import * as ingestionRepository from '@repositories/ingestionRepository';
import { pool } from '../../src/db';

describe('IngestionService', () => {
  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE ingestion RESTART IDENTITY CASCADE;');
    await pool.query('TRUNCATE TABLE inventory RESTART IDENTITY CASCADE;');
    await pool.query('TRUNCATE TABLE ingestion_error RESTART IDENTITY CASCADE;');
  });

  it('should start ingestion and populate inventory (all valid rows)', async () => {
    const rows = [
      { sku: 'UK-INGEST-1', description: 'row 1', store: 'KEN', quantity: 1, last_upload: new Date(), ingestion_id: 1 },
      { sku: 'UK-INGEST-2', description: 'row 2', store: 'BAT', quantity: 2, last_upload: new Date(), ingestion_id: 1 }
    ];
    const result = await ingestionService.startIngestion(rows);
    expect(result.total).toBe(2);
    expect(result.success).toBe(2);
    expect(result.errors.length).toBe(0);

    for (const r of rows) {
      const found = await pool.query('SELECT * FROM inventory WHERE sku = $1 AND store = $2', [r.sku, r.store]);
      expect(found.rowCount).toBe(1);
    }
  });

  it('should start ingestion and create errors for invalid rows', async () => {
    const rows = [
      { sku: 'UK-INGEST-3', description: 'valid', store: 'KEN', quantity: 5, last_upload: new Date(), ingestion_id: 1 },
      { sku: 'INVALID', description: 'bad sku', store: 'KEN', quantity: 1, last_upload: new Date(), ingestion_id: 1 }
    ];
    const result = await ingestionService.startIngestion(rows);
    expect(result.total).toBe(2);
    expect(result.success).toBe(1);
    expect(result.errors.length).toBe(1);

    const errorRes = await pool.query('SELECT * FROM ingestion_error WHERE ingestion_id = $1', [result.ingestion_id]);
    expect(errorRes.rowCount).toBe(1);
  });

  it('should update status if valid', async () => {
    const ingestion = await ingestionRepository.create({ status: 'processing', total_rows: 1 });
    await expect(ingestionService.updateStatus(ingestion.id, 'complete', 0)).resolves.toBeUndefined();
    const found = await ingestionRepository.findById(ingestion.id);
    expect(found!.status).toBe('complete');
  });

  it('should throw on invalid status', async () => {
    const ingestion = await ingestionRepository.create({ status: 'processing', total_rows: 1 });
    await expect(ingestionService.updateStatus(ingestion.id, 'not-a-status' as any, 0)).rejects.toThrow('Invalid status');
  });

  it('should fetch ingestion by id', async () => {
    const ingestion = await ingestionRepository.create({ status: 'processing', total_rows: 1 });
    const found = await ingestionService.getIngestionById(ingestion.id);
    expect(found).toBeDefined();
    expect(found.id).toBe(ingestion.id);
  });

  it('should throw if getIngestionById is called with missing id', async () => {
    await expect(ingestionService.getIngestionById(999999)).rejects.toThrow('does not exist');
  });

  it('should fetch all ingestions', async () => {
    await ingestionRepository.create({ status: 'processing', total_rows: 1 });
    await ingestionRepository.create({ status: 'complete', total_rows: 2 });
    const all = await ingestionService.getAllIngestions();
    expect(all.length).toBe(2);
  });
});

afterAll(async () => {
  await pool.end();
});