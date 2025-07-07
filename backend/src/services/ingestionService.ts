import * as ingestionRepository from '@repositories/ingestionRepository';
import * as inventoryService from '@services/inventoryService';
import * as ingestionErrorService from '@services/ingestionErrorService';
import { inventoryRowSchema } from '@validation/inventorySchemas';

let ingestionStartCount = 0;
let ingestionUpdateStatusCount = 0;
let ingestionGetByIdCount = 0;
let ingestionGetAllCount = 0;

const allowedStatuses = ['processing', 'error', 'complete'] as const;
type Status = typeof allowedStatuses[number];

export async function updateStatus(id: number, status: Status, errorCount: number) {
  ingestionUpdateStatusCount++;
  console.info(`[updateStatus] Called (${ingestionUpdateStatusCount} times). id=${id}, status=${status}, errorCount=${errorCount}`);
  if (!allowedStatuses.includes(status)) {
    const msg = `Invalid status: ${status}`;
    console.error('[updateStatus] Error:', msg);
    throw new Error(msg);
  }
  try {
    await ingestionRepository.updateStatus(id, status, errorCount);
  } catch (error) {
    console.error('[updateStatus] Error:', error);
    throw error;
  }
}

export async function startIngestion(rows: any[]) {
  ingestionStartCount++;
  console.info(`[startIngestion] Called (${ingestionStartCount} times). rows.length=${rows.length}`);
  try {
    const ingestion = await ingestionRepository.create({
      status: 'processing',
      total_rows: rows.length,
    });

    const validRows: any[] = [];
    const errors: Array<{ ingestion_id: number, row_number: number, error_msg: string, raw_data: any }> = [];

    rows.forEach((row, i) => {
      const result = inventoryRowSchema.safeParse(row);
      if (result.success) {
        validRows.push({ ...result.data, ingestion_id: ingestion.id });
      } else {
        errors.push({
          ingestion_id: ingestion.id,
          row_number: i + 1,
          error_msg: result.error.errors.map(e => e.message).join('; '),
          raw_data: row,
        });
      }
    });

    if (validRows.length > 0) {
      await inventoryService.bulkUpsertInventory(validRows, ingestion.id);
    }

    if (errors.length > 0) {
      await ingestionErrorService.bulkAddErrors(errors);
    }

    console.info(`[startIngestion] validRows count: ${validRows.length}, errors count: ${errors.length}`);

    await updateStatus(
      ingestion.id,
      errors.length > 0 ? 'error' : 'complete',
      errors.length
    );

    return {
      ingestion_id: ingestion.id,
      total: rows.length,
      success: validRows.length,
      errors,
    };
  } catch (error) {
    console.error('[startIngestion] Error:', error);
    throw error;
  }
}

export async function getAllIngestions() {
  ingestionGetAllCount++;
  console.info(`[getAllIngestions] Called (${ingestionGetAllCount} times). Fetching all ingestion records`);
  try {
    return await ingestionRepository.findAll();
  } catch (error) {
    console.error('[getAllIngestions] Error:', error);
    throw error;
  }
}

export async function getIngestionById(id: number) {
  ingestionGetByIdCount++;
  console.info(`[getIngestionById] Called (${ingestionGetByIdCount} times). id=${id}`);
  if (typeof id !== 'number' || id <= 0) {
    const msg = 'Ingestion id must be a positive number';
    console.error('[getIngestionById] Error:', msg);
    throw new Error(msg);
  }
  try {
    const ingestion = await ingestionRepository.findById(id);
    if (!ingestion) {
      const msg = `Ingestion with id ${id} does not exist`;
      console.error('[getIngestionById] Error:', msg);
      throw new Error(msg);
    }
    return ingestion;
  } catch (error) {
    console.error('[getIngestionById] Error:', error);
    throw error;
  }
}
