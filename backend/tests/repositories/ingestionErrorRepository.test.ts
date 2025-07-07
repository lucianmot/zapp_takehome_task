import * as ingestionErrorRepo from '@repositories/ingestionErrorRepository';
import * as ingestionRepo from '@repositories/ingestionRepository';
import * as inventoryRepo from '@repositories/inventoryRepository';
import { pool } from '../../src/db';

beforeEach(async () => {
  await pool.query('TRUNCATE TABLE ingestion_error RESTART IDENTITY CASCADE;');
  await pool.query('TRUNCATE TABLE ingestion RESTART IDENTITY CASCADE;');
});

describe('IngestionErrorRepository', () => {
  it('should insert an ingestion error row', async () => {
    const ingestion = await ingestionRepo.create({ status: 'processing', total_rows: 1 });
    const errorRow = await ingestionErrorRepo.insert({
      ingestion_id: ingestion.id,
      row_number: 1,
      error_msg: 'Test error',
      raw_data: { sku: 'BAD', quantity: -999 }
    });
    expect(errorRow).toHaveProperty('id');
    expect(errorRow.ingestion_id).toBe(ingestion.id);
    expect(errorRow.row_number).toBe(1);
    expect(errorRow.error_msg).toBe('Test error');
    expect(errorRow.raw_data).toMatchObject({ sku: 'BAD', quantity: -999 });
  });

  it('should find errors by ingestion id', async () => {
    const ingestion = await ingestionRepo.create({ status: 'processing', total_rows: 2 });
    await ingestionErrorRepo.insert({
      ingestion_id: ingestion.id,
      row_number: 1,
      error_msg: 'Error one',
      raw_data: { foo: 1 }
    });
    await ingestionErrorRepo.insert({
      ingestion_id: ingestion.id,
      row_number: 2,
      error_msg: 'Error two',
      raw_data: { bar: 2 }
    });
    const errors = await ingestionErrorRepo.findByIngestionId(ingestion.id);
    expect(errors.length).toBe(2);
    expect(errors[0].row_number).toBe(1);
    expect(errors[1].row_number).toBe(2);
  });

  it('should update an ingestion error row', async () => {
    const ingestion = await ingestionRepo.create({ status: 'processing', total_rows: 1 });
    const inserted = await ingestionErrorRepo.insert({
      ingestion_id: ingestion.id,
      row_number: 1,
      error_msg: 'Original error',
      raw_data: { foo: 'bar' }
    });
    const updated = await ingestionErrorRepo.update(inserted.id, {
      error_msg: 'Updated error',
      raw_data: { foo: 'baz', extra: 123 }
    });
    expect(updated).not.toBeNull();
    expect(updated!.error_msg).toBe('Updated error');
    expect(updated!.raw_data).toMatchObject({ foo: 'baz', extra: 123 });
  });

  it('should delete an ingestion error row', async () => {
    const ingestion = await ingestionRepo.create({ status: 'processing', total_rows: 1 });
    const errorRow = await ingestionErrorRepo.insert({
      ingestion_id: ingestion.id,
      row_number: 1,
      error_msg: 'Test delete',
      raw_data: { sku: 'X', quantity: -1 }
    });
    const found = await ingestionErrorRepo.findById(errorRow.id);
    expect(found).not.toBeNull();

    await ingestionErrorRepo.deleteRow(errorRow.id);

    const afterDelete = await ingestionErrorRepo.findById(errorRow.id);
    expect(afterDelete).toBeNull();
  });

  it('should fetch an ingestion error row by its ID', async () => {
    const ingestion = await ingestionRepo.create({ status: 'processing', total_rows: 1 });
    const inserted = await ingestionErrorRepo.insert({
        ingestion_id: ingestion.id,
        row_number: 1,
        error_msg: 'Find by ID test',
        raw_data: { sku: 'TEST', quantity: -100 }
    });

    const found = await ingestionErrorRepo.findById(inserted.id);

    expect(found).not.toBeNull();
    expect(found!.id).toBe(inserted.id);
    expect(found!.ingestion_id).toBe(ingestion.id);
    expect(found!.row_number).toBe(1);
    expect(found!.error_msg).toBe('Find by ID test');
    expect(found!.raw_data).toMatchObject({ sku: 'TEST', quantity: -100 });

    const notFound = await ingestionErrorRepo.findById(999999);
    expect(notFound).toBeNull();
  });

  it('should bulk insert multiple ingestion error rows', async () => {
    const ingestion = await ingestionRepo.create({ status: 'processing', total_rows: 3 });
    const errorRows = [
        {
        ingestion_id: ingestion.id,
        row_number: 1,
        error_msg: 'First error',
        raw_data: { sku: 'BULK1', quantity: -1 }
        },
        {
        ingestion_id: ingestion.id,
        row_number: 2,
        error_msg: 'Second error',
        raw_data: { sku: 'BULK2', quantity: -2 }
        },
        {
        ingestion_id: ingestion.id,
        row_number: 3,
        error_msg: 'Third error',
        raw_data: { sku: 'BULK3', quantity: -3 }
        }
    ];

    await ingestionErrorRepo.bulkInsert(errorRows);

    const found = await ingestionErrorRepo.findByIngestionId(ingestion.id);
    expect(found).toHaveLength(3);
    expect(found.map(e => e.error_msg)).toEqual(
        expect.arrayContaining(['First error', 'Second error', 'Third error'])
    );
    expect(found[0].raw_data).toMatchObject({ sku: 'BULK1', quantity: -1 });
    expect(found[1].raw_data).toMatchObject({ sku: 'BULK2', quantity: -2 });
    expect(found[2].raw_data).toMatchObject({ sku: 'BULK3', quantity: -3 });
  });

  it('should move a corrected error row to inventory and delete it from errors', async () => {
    const ingestion = await ingestionRepo.create({ status: 'processing', total_rows: 1 });

    const errorRow = await ingestionErrorRepo.insert({
        ingestion_id: ingestion.id,
        row_number: 1,
        error_msg: 'Move to inventory test',
        raw_data: {
        sku: 'MOVE-123',
        description: 'Moved Item',
        store: 'MOVE_STORE',
        quantity: 42,
        }
    });

    await ingestionErrorRepo.moveToInventory(errorRow.id);

    const stillExists = await ingestionErrorRepo.findById(errorRow.id);
    expect(stillExists).toBeNull();

    const inventoryRows = await inventoryRepo.findAll();
    const moved = inventoryRows.find(row =>
        row.sku === 'MOVE-123' && row.store === 'MOVE_STORE'
    );
    expect(moved).toBeDefined();
    expect(moved!.description).toBe('Moved Item');
    expect(moved!.quantity).toBe(42);
    expect(moved!.ingestion_id).toBe(ingestion.id);
  });
});

afterAll(async () => {
  await pool.end();
});