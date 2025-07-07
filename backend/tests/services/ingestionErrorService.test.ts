import { correctError, addError } from '@services/ingestionErrorService';
import * as ingestionRepo from '@repositories/ingestionRepository';
import * as ingestionErrorRepo from '@repositories/ingestionErrorRepository';
import { pool } from '../../src/db';

describe('IngestionErrorService', () => {
  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE ingestion_error RESTART IDENTITY CASCADE;');
    await pool.query('TRUNCATE TABLE ingestion RESTART IDENTITY CASCADE;');
  });

  it('should update/correct fields on an error row (happy path)', async () => {
    const ingestion = await ingestionRepo.create({ status: 'processing', total_rows: 1 });

    const errorRow = await addError({
      ingestion_id: ingestion.id,
      row_number: 1,
      error_msg: 'Initial error',
      raw_data: { sku: 'BAD', store: 'KEN', quantity: -1 },
    });

    const corrected = await correctError(errorRow.id, {
      error_msg: 'Fixed error',
      raw_data: { sku: 'UK-CORRECT-1', store: 'KEN', quantity: 10 }
    });

    expect(corrected).not.toBeNull();
    expect(corrected!.id).toBe(errorRow.id);
    expect(corrected!.error_msg).toBe('Fixed error');
    expect(corrected!.raw_data).toMatchObject({ sku: 'UK-CORRECT-1', store: 'KEN', quantity: 10 });

    const refetched = await ingestionErrorRepo.findById(errorRow.id);
    expect(refetched).not.toBeNull();
    expect(refetched!.error_msg).toBe('Fixed error');
  });

  // TODO: Add more tests for other service functions
});

afterAll(async () => {
  await pool.end();
});
