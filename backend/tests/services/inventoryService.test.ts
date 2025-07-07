import { addInventory, deleteInventory, findAll, updateInventory, bulkUpsertInventory } from '@services/inventoryService';
import * as inventoryRepository from '@repositories/inventoryRepository';
import { pool } from '../../src/db';
import { ZodError } from 'zod';

describe('InventoryService', () => {
  beforeEach(async () => {
    if (inventoryRepository.findAll) {
      await inventoryRepository.findAll().then(rows =>
        Promise.all(rows.map(row => inventoryRepository.deleteRow(row.id)))
      );
    }
    jest.clearAllMocks();
  });

  it('should add a valid inventory row (happy path)', async () => {
    const row = {
      sku: 'UK-ADD-1',
      description: 'AddInventory Test',
      store: 'KEN',
      quantity: 77,
      last_upload: new Date(),
      ingestion_id: 123,
    };

    const inserted = await addInventory(row);

    expect(inserted).toBeDefined();
    expect(inserted.sku).toBe('UK-ADD-1');
    expect(inserted.store).toBe('KEN');
    expect(inserted.quantity).toBe(77);
    expect(inserted.description).toBe('AddInventory Test');
    expect(inserted.ingestion_id).toBe(123);
    expect(inserted).toHaveProperty('id');
  });

  it('should fail validation for invalid sku and store', async () => {
    const invalidRow = {
      sku: 'INVALID-SKU',
      description: 'Invalid SKU and Store Test',
      store: 'INVALID_STORE',
      quantity: 10,
      last_upload: new Date(),
      ingestion_id: 456,
    };

    await expect(addInventory(invalidRow)).rejects.toThrow(ZodError);
  });

  it('should delete an existing inventory row (happy path)', async () => {
    const row = {
      sku: 'UK-DEL-1',
      description: 'Delete Test',
      store: 'KEN',
      quantity: 22,
      last_upload: new Date(),
      ingestion_id: 123,
    };
    const inserted = await addInventory(row);

    await expect(deleteInventory(inserted.id)).resolves.toBeUndefined();

    const afterDelete = await inventoryRepository.findById(inserted.id);
    expect(afterDelete).toBeNull();
  });

  it('should throw if trying to delete a non-existent inventory row', async () => {
    await expect(deleteInventory(999999)).rejects.toThrow('does not exist');
  });

  it('should update an existing inventory row (happy path)', async () => {
    const row = {
        sku: 'UK-UPD-1',
        description: 'Original Desc',
        store: 'KEN',
        quantity: 10,
        last_upload: new Date(),
        ingestion_id: 123,
    };
    const inserted = await addInventory(row);

    const updated = await updateInventory(inserted.id, { description: 'Updated Desc', quantity: 99 });

    expect(updated).toBeDefined();
    expect(updated.description).toBe('Updated Desc');
    expect(updated.quantity).toBe(99);
  });

  it('should throw if trying to update sku or store', async () => {
    const row = {
        sku: 'UK-UPD-2',
        description: 'Original Desc',
        store: 'KEN',
        quantity: 10,
        last_upload: new Date(),
        ingestion_id: 123,
    };
    const inserted = await addInventory(row);

    await expect(updateInventory(inserted.id, { sku: 'UK-NEW' } as any)).rejects.toThrow('Cannot update SKU or store');
    await expect(updateInventory(inserted.id, { store: 'BAT' } as any)).rejects.toThrow('Cannot update SKU or store');
  });

  it('should throw if inventory row does not exist', async () => {
    await expect(updateInventory(999999, { description: 'Does not exist' })).rejects.toThrow('does not exist');
  });

  it('should throw on validation error (negative quantity)', async () => {
    const row = {
        sku: 'UK-UPD-3',
        description: 'Original Desc',
        store: 'KEN',
        quantity: 10,
        last_upload: new Date(),
        ingestion_id: 123,
    };
    const inserted = await addInventory(row);

    await expect(updateInventory(inserted.id, { quantity: -10 })).rejects.toThrow(ZodError);
  });

  it('should bulk upsert multiple inventory rows (happy path)', async () => {
    const rows = [
        {
        sku: 'UK-BULK-1',
        description: 'Bulk Insert 1',
        store: 'KEN',
        quantity: 5,
        last_upload: new Date(),
        ingestion_id: 1001,
        },
        {
        sku: 'UK-BULK-2',
        description: 'Bulk Insert 2',
        store: 'BAT',
        quantity: 15,
        last_upload: new Date(),
        ingestion_id: 1001,
        },
        {
        sku: 'UK-BULK-3',
        description: 'Bulk Insert 3',
        store: 'HOM',
        quantity: 25,
        last_upload: new Date(),
        ingestion_id: 1001,
        },
    ];

    await expect(bulkUpsertInventory(rows, 1001)).resolves.toBeUndefined();

    for (const r of rows) {
        const found = await inventoryRepository.findBySkuAndStore(r.sku, r.store);
        expect(found).toBeDefined();
        expect(found!.quantity).toBe(r.quantity);
        expect(found!.description).toBe(r.description);
        expect(found!.ingestion_id).toBe(1001);
    }
  });

  it('should throw if any inventory row in bulk upsert is invalid', async () => {
    const rows = [
        {
        sku: 'UK-BULK-4',
        description: 'Bulk Invalid 1',
        store: 'KEN',
        quantity: 5,
        last_upload: new Date(),
        ingestion_id: 1002,
        },
        {
        sku: 'NOT-UK-BULK',
        description: 'Bulk Invalid 2',
        store: 'BAT',
        quantity: 15,
        last_upload: new Date(),
        ingestion_id: 1002,
        },
    ];

    await expect(bulkUpsertInventory(rows, 1002)).rejects.toThrow();
  });

  it('should return all inventory rows', async () => {
    const items = [
      {
        sku: 'UK-FIND-1',
        description: 'FindAll 1',
        store: 'KEN',
        quantity: 1,
        last_upload: new Date(),
        ingestion_id: 111,
      },
      {
        sku: 'UK-FIND-2',
        description: 'FindAll 2',
        store: 'BAT',
        quantity: 2,
        last_upload: new Date(),
        ingestion_id: 111,
      },
    ];

    for (const row of items) {
      await addInventory(row);
    }

    const all = await findAll();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBeGreaterThanOrEqual(items.length);

    const skus = all.map(i => i.sku);
    expect(skus).toEqual(expect.arrayContaining(['UK-FIND-1', 'UK-FIND-2']));
  });
});

afterAll(async () => {
  await pool.end();
});
