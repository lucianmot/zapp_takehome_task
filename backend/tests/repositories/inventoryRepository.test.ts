import * as inventoryRepo from '@repositories/inventoryRepository';
import { pool } from '../../src/db';

beforeEach(async () => {
  await pool.query('TRUNCATE TABLE inventory RESTART IDENTITY CASCADE;');
});

describe('Inventory Repository', () => {
  it('should fetch all inventory rows (empty initially)', async () => {
    const all = await inventoryRepo.findAll();
    expect(Array.isArray(all)).toBe(true);
  });

  it('should return all inserted inventory rows', async () => {
    const now = new Date();
    const testRows = [
      { sku: 'UK-1011', description: 'Item 1', store: 'KEN', quantity: 8, last_upload: now, ingestion_id: 1 },
      { sku: 'UK-1012', description: null, store: 'KEN', quantity: 6, last_upload: now, ingestion_id: 1 },
      { sku: 'UK-1013', description: 'Item 3', store: 'BAT', quantity: 4, last_upload: now, ingestion_id: 1 },
      { sku: 'UK-1021', description: 'Item 19', store: 'KEN', quantity: 9, last_upload: now, ingestion_id: 2 },
      { sku: 'UK-1032', description: 'Item 201', store: 'KEN', quantity: 7, last_upload: now, ingestion_id: 2 },
      { sku: 'UK-1003', description: 'Item 33', store: 'BAT', quantity: 3, last_upload: now, ingestion_id: 2 }
    ];

    for (const row of testRows) {
      await inventoryRepo.insert(row);
    }

    const allRows = await inventoryRepo.findAll();

    expect(allRows).toHaveLength(testRows.length);
    const skus = allRows.map(row => row.sku);
    expect(skus).toEqual(expect.arrayContaining(testRows.map(r => r.sku)));
    allRows.forEach(r => expect(r.last_upload).toBeInstanceOf(Date));
  });

  it('should fetch a specific inventory row by its ID', async () => {
    const row = {
      sku: 'UK-2001',
      description: 'Test FindById',
      store: 'LON',
      quantity: 10,
      last_upload: new Date(),
      ingestion_id: 99,
    };
    const inserted = await inventoryRepo.insert(row);

    const found = await inventoryRepo.findById(inserted.id);

    expect(found).not.toBeNull();
    expect(found!.sku).toBe(row.sku);
    expect(found!.store).toBe(row.store);
    expect(found!.description).toBe(row.description);
    expect(found!.quantity).toBe(row.quantity);
    expect(found!.last_upload).toBeInstanceOf(Date);

    const notFound = await inventoryRepo.findById(9999999);
    expect(notFound).toBeNull();
  });

  it('should insert a new inventory row', async () => {
    const row = {
      sku: 'UK-3001',
      description: 'Insert Test Item',
      store: 'NYC',
      quantity: 15,
      last_upload: new Date(),
      ingestion_id: 101,
    };
    const inserted = await inventoryRepo.insert(row);

    expect(inserted.sku).toBe(row.sku);
    expect(inserted.description).toBe(row.description);
    expect(inserted.store).toBe(row.store);
    expect(inserted.quantity).toBe(row.quantity);
    expect(inserted.ingestion_id).toBe(row.ingestion_id);
    expect(inserted.last_upload).toBeInstanceOf(Date);
    expect(inserted).toHaveProperty('id');

    const all = await inventoryRepo.findAll();
    const found = all.find(item => item.id === inserted.id);
    expect(found!.sku).toBe(row.sku);
    expect(found!.description).toBe(row.description);
    expect(found!.store).toBe(row.store);
    expect(found!.quantity).toBe(row.quantity);
    expect(found!.ingestion_id).toBe(row.ingestion_id);
    expect(found!.last_upload).toBeInstanceOf(Date);
  });

  it('should update an inventory row', async () => {
    const row = {
      sku: 'UK-4001',
      description: 'Original Description',
      store: 'PAR',
      quantity: 5,
      last_upload: new Date(),
      ingestion_id: 42,
    };
    const inserted = await inventoryRepo.insert(row);

    const updatedFields = {
      description: 'Updated Description',
      quantity: 10,
      last_upload: new Date(), // update timestamp
      ingestion_id: 100, // update ingestion id
    };
    const updated = await inventoryRepo.update(inserted.id, updatedFields);

    expect(updated).not.toBeNull();
    expect(updated!.id).toBe(inserted.id);
    expect(updated!.sku).toBe(row.sku);
    expect(updated!.store).toBe(row.store);
    expect(updated!.description).toBe(updatedFields.description);
    expect(updated!.quantity).toBe(updatedFields.quantity);
    expect(updated!.ingestion_id).toBe(updatedFields.ingestion_id);
    expect(updated!.last_upload).toBeInstanceOf(Date);

    const found = await inventoryRepo.findById(inserted.id);
    expect(found).not.toBeNull();
    expect(found!.description).toBe(updatedFields.description);
    expect(found!.quantity).toBe(updatedFields.quantity);
  });

  it('should delete an inventory row', async () => {
    const row = {
      sku: 'UK-DEL',
      description: 'Delete Me',
      store: 'MRS',
      quantity: 1,
      last_upload: new Date(),
      ingestion_id: 7,
    };
    const inserted = await inventoryRepo.insert(row);

    const exists = await inventoryRepo.findById(inserted.id);
    expect(exists).not.toBeNull();

    await inventoryRepo.deleteRow(inserted.id);

    const deleted = await inventoryRepo.findById(inserted.id);
    expect(deleted).toBeNull();
  });

  it('should bulk upsert multiple inventory rows and overwrite on conflict', async () => {
    const now = new Date();
    const rows = [
      { sku: 'UK-BU-1', description: 'Bulk 1', store: 'STORE1', quantity: 5, last_upload: now, ingestion_id: 10 },
      { sku: 'UK-BU-2', description: 'Bulk 2', store: 'STORE2', quantity: 7, last_upload: now, ingestion_id: 10 },
      { sku: 'UK-BU-3', description: 'Bulk 3', store: 'STORE3', quantity: 9, last_upload: now, ingestion_id: 10 },
    ];
    await inventoryRepo.bulkUpsert(rows, 10);

    let all = await inventoryRepo.findAll();
    expect(all).toHaveLength(3);

    for (const row of rows) {
      const found = all.find(r => r.sku === row.sku && r.store === row.store);
      expect(found).toBeDefined();
      expect(found!.description).toBe(row.description);
      expect(found!.quantity).toBe(row.quantity);
      expect(found!.ingestion_id).toBe(row.ingestion_id);
      expect(found!.last_upload).toBeInstanceOf(Date);
    }

    const updatedRows = [
      { sku: 'UK-BU-1', description: 'Bulk 1 Updated', store: 'STORE1', quantity: 10, last_upload: new Date(), ingestion_id: 20 },
      { sku: 'UK-BU-2', description: 'Bulk 2 Updated', store: 'STORE2', quantity: 12, last_upload: new Date(), ingestion_id: 20 },
      { sku: 'UK-BU-3', description: 'Bulk 3 Updated', store: 'STORE3', quantity: 15, last_upload: new Date(), ingestion_id: 20 },
    ];
    await inventoryRepo.bulkUpsert(updatedRows, 20);

    all = await inventoryRepo.findAll();
    expect(all).toHaveLength(3);

    for (const row of updatedRows) {
      const found = all.find(r => r.sku === row.sku && r.store === row.store);
      expect(found).toBeDefined();
      expect(found!.description).toBe(row.description);
      expect(found!.quantity).toBe(row.quantity);
      expect(found!.ingestion_id).toBe(row.ingestion_id);
      expect(found!.last_upload).toBeInstanceOf(Date);
    }
  });
});

afterAll(async () => {
  await pool.end();
});