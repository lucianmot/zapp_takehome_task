CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  sku TEXT NOT NULL,
  description TEXT,
  store TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  last_upload TIMESTAMP,
  ingestion_id INTEGER
);

ALTER TABLE inventory ADD CONSTRAINT unique_sku_store UNIQUE (sku, store);

CREATE TABLE IF NOT EXISTS ingestion (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  status TEXT,
  error_count INTEGER,
  total_rows INTEGER
);

CREATE TABLE IF NOT EXISTS ingestion_error (
  id SERIAL PRIMARY KEY,
  ingestion_id INTEGER REFERENCES ingestion(id),
  row_number INTEGER,
  error_msg TEXT,
  raw_data JSONB
);