import useSWR, { mutate } from 'swr';

export type Ingestion = {
  id: number;
  created_at: string;
  status: string;
  error_count: number;
  total_rows: number;
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

// GET all ingestions
export function useAllIngestions() {
  const { data, error, isLoading } = useSWR<Ingestion[]>(
    'http://localhost:3001/api/ingestions',
    fetcher
  );
  return { ingestions: data ?? [], error, isLoading };
}

// GET a single ingestion by id
export function useIngestionById(id: number | undefined) {
  const { data, error, isLoading } = useSWR<Ingestion>(
    id ? `http://localhost:3001/api/ingestions/${id}` : null,
    fetcher
  );
  return { ingestion: data, error, isLoading };
}

// POST new ingestion (CSV upload)
export function useStartIngestion() {
  const startIngestion = async (rows: any[]) => {
    const res = await fetch('http://localhost:3001/api/ingestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to start ingestion');
    }

    await mutate('http://localhost:3001/api/ingestions');
    return res.json();
  };
  return { startIngestion };
}