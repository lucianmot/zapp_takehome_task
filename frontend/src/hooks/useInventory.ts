import useSWR, { mutate } from 'swr';

export type InventoryRow = {
  id: number;
  quantity: number;
  sku: string;
  description: string;
  store: string;
  last_upload: string;
  ingestion_id: number;
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useInventory() {
  const { data: rows, error, isLoading } = useSWR<InventoryRow[]>(
    'http://localhost:3001/api/inventory',
    fetcher
  );

  // POST new inventory row
  const addInventory = async (row: Omit<InventoryRow, 'id'>) => {
    const res = await fetch('http://localhost:3001/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row)
    });
    if (!res.ok) throw new Error('Failed to add row');
    await mutate('http://localhost:3001/api/inventory');
    return res.json();
  };

  // PUT update
  const updateInventory = async (id: number, fields: Partial<Omit<InventoryRow, 'id'>>) => {
    const res = await fetch(`http://localhost:3001/api/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields)
    });
    if (!res.ok) throw new Error('Failed to update row');
    await mutate('http://localhost:3001/api/inventory');
    return res.json();
  };

  // DELETE
  const deleteInventory = async (id: number) => {
    const res = await fetch(`http://localhost:3001/api/inventory/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete row');
    await mutate('http://localhost:3001/api/inventory');
    return true;
  };

  return {
    rows: rows ?? [],
    loading: isLoading,
    error,
    addInventory,
    updateInventory,
    deleteInventory
  };
}