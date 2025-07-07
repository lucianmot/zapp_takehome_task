import * as inventoryRepository from '../repositories/inventoryRepository';
import { InventoryRow } from '../repositories/inventoryRepository';
import { inventoryRowSchema, inventoryUpdateSchema } from '../validation/inventorySchemas';

// counters for demo metrics
// usually these would done using a proper metrics library
// but to showcase the concept, we'll use simple counters
let inventoryAddCount = 0;
let inventoryDeleteCount = 0;
let inventoryUpdateCount = 0;
let inventoryBulkUpsertCount = 0;

let inventoryFindAllCount = 0;

export async function addInventory(row: Omit<InventoryRow, 'id'>) {
  inventoryAddCount++;
  console.info(`[addInventory] Called (${inventoryAddCount} times). Args:`, row);
  try {
    console.info('[addInventory] Validating row...');
    if (typeof row.last_upload === 'string') {
      row.last_upload = new Date(row.last_upload);
    }
    inventoryRowSchema.parse(row);
    console.info('[addInventory] Validation passed.');

    console.info('[addInventory] Checking for existing inventory (sku/store)...');
    const exists = await inventoryRepository.findBySkuAndStore(row.sku, row.store);
    if (exists) {
      console.warn('[addInventory] Duplicate found for sku/store:', row.sku, row.store);
      throw new Error('Inventory row with this SKU and store already exists');
    }

    console.info('[addInventory] Inserting inventory row...');
    const inserted = await inventoryRepository.insert(row);
    console.info('[addInventory] Insert successful. Inserted row:', inserted);
    return inserted;
  } catch (error) {
    console.error('[addInventory] Error:', error);
    throw error;
  }
}

export async function deleteInventory(id: number): Promise<void> {
  inventoryDeleteCount++;
  console.info(`[deleteInventory] Called (${inventoryDeleteCount} times). Args: id=${id}`);
  try {
    console.info('[deleteInventory] Checking if row exists...');
    const exists = await inventoryRepository.findById(id);
    if (!exists) {
      console.warn(`[deleteInventory] Inventory row with id ${id} does not exist`);
      throw new Error(`Inventory row with id ${id} does not exist`);
    }
    console.info('[deleteInventory] Deleting inventory row...');
    await inventoryRepository.deleteRow(id);
    console.info(`[deleteInventory] Delete successful for id=${id}`);
  } catch (error) {
    console.error('[deleteInventory] Error:', error);
    throw error;
  }
}

export async function updateInventory(id: number, fields: Partial<Omit<InventoryRow, 'id'>>): Promise<InventoryRow> {
  inventoryUpdateCount++;
  console.info(`[updateInventory] Called (${inventoryUpdateCount} times). Args: id=${id}, fields=`, fields);
  try {
    console.info('[updateInventory] Validating update fields...');
    inventoryUpdateSchema.parse(fields);
    console.info('[updateInventory] Validation passed.');
    if ('sku' in fields || 'store' in fields) {
      console.warn('[updateInventory] Attempt to update sku/store, which is not allowed.');
      throw new Error('Cannot update SKU or store of existing inventory row');
    }

    console.info('[updateInventory] Checking if row exists...');
    const existing = await inventoryRepository.findById(id);
    if (!existing) {
      console.warn(`[updateInventory] Inventory row with id ${id} does not exist`);
      throw new Error(`Inventory row with id ${id} does not exist`);
    }

    console.info('[updateInventory] Updating inventory row...');
    const updated = await inventoryRepository.update(id, fields);
    if (!updated) {
      console.warn(`[updateInventory] Failed to update inventory row with id ${id}`);
      throw new Error(`Failed to update inventory row with id ${id}`);
    }
    console.info('[updateInventory] Update successful. Updated row:', updated);
    return updated;
  } catch (error) {
    console.error('[updateInventory] Error:', error);
    throw error;
  }
}

export async function bulkUpsertInventory(
  rows: Omit<InventoryRow, 'id'>[],
  ingestion_id: number
): Promise<void> {
  inventoryBulkUpsertCount++;
  console.info(`[bulkUpsertInventory] Called (${inventoryBulkUpsertCount} times). Args: rows.length=${rows.length}, ingestion_id=${ingestion_id}`);
  try {
    console.info('[bulkUpsertInventory] Validating each row...');
    rows.forEach(row => {
      inventoryRowSchema.parse(row);
    });
    console.info('[bulkUpsertInventory] All rows validated.');

    console.info('[bulkUpsertInventory] Performing bulk upsert...');
    await inventoryRepository.bulkUpsert(rows, ingestion_id);
    console.info('[bulkUpsertInventory] Bulk upsert successful.');
  } catch (error) {
    console.error('[bulkUpsertInventory] Error:', error);
    throw error;
  }
}

export async function findAll(): Promise<InventoryRow[]> {
  inventoryFindAllCount++;
  console.info(`[findAll] Called (${inventoryFindAllCount} times)`);
  try {
    const rows = await inventoryRepository.findAll();
    console.info(`[findAll] Returned ${rows.length} inventory rows.`);
    return rows;
  } catch (error) {
    console.error('[findAll] Error:', error);
    throw error;
  }
}
