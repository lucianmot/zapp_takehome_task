import useSWR, { mutate } from 'swr';

export type IngestionErrorRow = {
  id: number;
  ingestion_id: number;
  row_number: number;
  error_msg: string;
  raw_data: {
    quantity: number;
    sku: string;
    description: string;
    store: string;
  };
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

// GET errors
export function useIngestionErrors(ingestionId: number | undefined) {
  const { data, error, isLoading } = useSWR<IngestionErrorRow[]>(
    ingestionId ? `http://localhost:3001/api/ingestions/${ingestionId}/errors` : null,
    fetcher
  );
  return { errors: data ?? [], error, isLoading };
}

// PUT: correct error row
export async function correctIngestionError(errorId: number, fields: Partial<IngestionErrorRow>) {
  const res = await fetch(`http://localhost:3001/api/ingestions/errors/${errorId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to correct error row');
  }
  await mutate((key: string) => key.includes('/ingestions/') && key.includes('/errors'));
  return res.json();
}

// DELETE: remove error row
export async function deleteIngestionError(errorId: number) {
  const res = await fetch(`http://localhost:3001/api/ingestions/errors/${errorId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to delete error row');
  }
  await mutate((key: string) => key.includes('/ingestions/') && key.includes('/errors'));
  return true;
}

// POST: promote error to inventory
export async function promoteIngestionError(errorId: number) {
  const res = await fetch(`http://localhost:3001/api/ingestions/errors/${errorId}/promote`, {
    method: 'POST',
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to promote error row');
  }
  await mutate((key: string) => key.includes('/ingestions/') && key.includes('/errors'));
  return res.json();
}