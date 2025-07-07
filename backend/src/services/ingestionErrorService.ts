import * as ingestionErrorRepo from '@repositories/ingestionErrorRepository';
import * as inventoryService from '@services/inventoryService';
import { IngestionErrorInput, IngestionErrorRow } from '@repositories/ingestionErrorRepository';
import { inventoryRowSchema } from '@validation/inventorySchemas';

let ingestionErrorAddCount = 0;
let ingestionErrorCorrectCount = 0;
let ingestionErrorDeleteCount = 0;
let ingestionErrorGetByIngestionCount = 0;
let ingestionErrorBulkAddCount = 0;
let ingestionErrorPromoteCount = 0;

export async function addError(errorRow: IngestionErrorInput): Promise<IngestionErrorRow> {
  ingestionErrorAddCount++;
  console.info(`[addError] Called (${ingestionErrorAddCount} times). Args:`, errorRow);
  try {
    const result = await ingestionErrorRepo.insert(errorRow);
    console.info(`[addError] Successfully inserted error row with id=${result.id}`);
    return result;
  } catch (error) {
    console.error('[addError] Error inserting error row:', error);
    throw error;
  }
}

export async function correctError(
  id: number,
  correctedFields: Partial<IngestionErrorInput>
): Promise<IngestionErrorRow | null> {
  ingestionErrorCorrectCount++;
  console.info(`[correctError] Called (${ingestionErrorCorrectCount} times). id=${id}, fields:`, correctedFields);

  try {
    const existing = await ingestionErrorRepo.findById(id);

    if (!existing) {
      console.error(`[correctError] Error row with id ${id} does not exist`);
      throw new Error(`Error row with id ${id} does not exist`);
    }

    const updatedFields = { ...existing, ...correctedFields };

    const updated = await ingestionErrorRepo.update(id, updatedFields);

    console.info(`[correctError] Successfully updated error row id=${id}`);
    return updated;
  } catch (error) {
    console.error(`[correctError] Error updating error row id=${id}:`, error);
    throw error;
  }
}

export async function deleteError(id: number): Promise<void> {
  ingestionErrorDeleteCount++;
  console.info(`[deleteError] Called (${ingestionErrorDeleteCount} times). id=${id}`);
  try {
    const existing = await ingestionErrorRepo.findById(id);
    if (!existing) {
      console.error(`[deleteError] Error row with id ${id} does not exist`);
      throw new Error(`Error row with id ${id} does not exist`);
    }
    await ingestionErrorRepo.deleteRow(id);
    console.info(`[deleteError] Deleted error row with id=${id}`);
  } catch (error) {
    console.error(`[deleteError] Failed to delete error row id=${id}:`, error);
    throw error;
  }
}

export async function getErrorsByIngestion(ingestionId: number) {
  ingestionErrorGetByIngestionCount++;
  console.info(`[getErrorsByIngestion] Called (${ingestionErrorGetByIngestionCount} times). ingestionId=${ingestionId}`);
  try {
    const errors = await ingestionErrorRepo.findByIngestionId(ingestionId);
    console.info(`[getErrorsByIngestion] Found ${errors.length} errors for ingestionId=${ingestionId}`);
    return errors;
  } catch (error) {
    console.error(`[getErrorsByIngestion] Error fetching errors for ingestionId=${ingestionId}:`, error);
    throw error;
  }
}

export async function bulkAddErrors(errorRows: IngestionErrorInput[]): Promise<void> {
  ingestionErrorBulkAddCount++;
  console.info(`[bulkAddErrors] Called (${ingestionErrorBulkAddCount} times). Adding ${errorRows.length} error rows.`);
  try {
    await ingestionErrorRepo.bulkInsert(errorRows);
    console.info(`[bulkAddErrors] Successfully added ${errorRows.length} error rows.`);
  } catch (error) {
    console.error('[bulkAddErrors] Error adding error rows:', error);
    throw error;
  }
}

export async function promoteErrorToInventory(id: number): Promise<void> {
  ingestionErrorPromoteCount++;
  console.info(`[promoteErrorToInventory] Called (${ingestionErrorPromoteCount} times). Attempting to promote error row id=${id}`);
  try {
    const errorRow = await ingestionErrorRepo.findById(id);
    if (!errorRow) {
      console.error(`[promoteErrorToInventory] Error row with id ${id} does not exist`);
      throw new Error(`Error row with id ${id} does not exist`);
    }

    const raw = errorRow.raw_data;
    const validRow = {
      sku: String(raw.sku),
      description: typeof raw.description === 'string' ? raw.description : null,
      store: String(raw.store),
      quantity: Number(raw.quantity),
      last_upload: new Date(),
      ingestion_id: errorRow.ingestion_id
    };

    inventoryRowSchema.parse(validRow);

    await inventoryService.bulkUpsertInventory([validRow], errorRow.ingestion_id);
    await ingestionErrorRepo.deleteRow(id);
    console.info(`[promoteErrorToInventory] Successfully promoted error row id=${id} to inventory.`);
  } catch (error) {
    console.error(`[promoteErrorToInventory] Failed to promote error row id=${id}:`, error);
    throw error;
  }
}