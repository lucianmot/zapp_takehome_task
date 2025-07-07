import * as inventoryRepo from '../src/repository/inventoryRepository';
import { pool } from '../src/db';

describe('Inventory Repository', () => {
  it('should fetch all inventory rows (empty initially)', async () => {
    const all = await inventoryRepo.findAll();
    expect(Array.isArray(all)).toBe(true);
  });
});

afterAll(async () => {
  await pool.end();
});