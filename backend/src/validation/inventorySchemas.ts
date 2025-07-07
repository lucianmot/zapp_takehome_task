import { z } from 'zod';

export const allowedStores = ['KEN', 'BAT', 'HOM'] as const;

export const inventoryRowSchema = z.object({
  sku: z.string().regex(/^UK-[A-Za-z0-9-]+$/, { message: "SKU must start with 'UK-' followed by numbers, letters, or hyphens" }),
  description: z.string().nullable().optional(),
  store: z.enum(allowedStores),
  quantity: z.number().int().min(0),
  last_upload: z.date(),
  ingestion_id: z.number().int().min(1)
});


export const inventoryUpdateSchema = inventoryRowSchema.partial();