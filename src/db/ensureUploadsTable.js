// src/db/ensureUploadsTable.js
// Shared PostgreSQL pool + helpers to ensure DB tables exist (uploads + requests).

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

let pool;

if (connectionString) {
  console.log('[db] Using DATABASE_URL for PostgreSQL connection');
  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
} else {
  console.log('[db] Using discrete DB_* / PG* env vars for PostgreSQL connection');

  const host = process.env.DB_HOST || process.env.PGHOST;
  const user = process.env.DB_USER || process.env.PGUSER;
  const password = process.env.DB_PASSWORD || process.env.PGPASSWORD;
  const database = process.env.DB_NAME || process.env.PGDATABASE;
  const port = Number(process.env.DB_PORT || process.env.PGPORT || 5432);

  if (!host || !user || !password || !database) {
    console.warn(
      '[db] WARNING: One or more required DB env vars are missing. ' +
        'Current values -> host:', host,
      'user:', user,
      'database:', database
    );
  }

  pool = new Pool({
    host,
    user,
    password,
    database,
    port,
    ssl: { rejectUnauthorized: false },
  });
}

const createUploadsTableSql = `
  CREATE TABLE IF NOT EXISTS uploads (
    id           SERIAL PRIMARY KEY,
    backend_name TEXT        NOT NULL,
    file_name    TEXT        NOT NULL,
    file_size    BIGINT,
    mime_type    TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

const createRequestsTableSql = `
  CREATE TABLE IF NOT EXISTS requests (
    id           SERIAL PRIMARY KEY,
    backend_name TEXT        NOT NULL,
    ts           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    meta         JSONB
  );
`;

const patchRequestsSchemaSql = `
  DO $$
  BEGIN
    -- Add missing columns (handles older schemas that lacked ts/meta)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='requests' AND column_name='ts'
    ) THEN
      ALTER TABLE requests ADD COLUMN ts TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='requests' AND column_name='meta'
    ) THEN
      ALTER TABLE requests ADD COLUMN meta JSONB;
    END IF;

    -- Backfill ts safely (prefer created_at if it exists)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='requests' AND column_name='created_at'
    ) THEN
      EXECUTE 'UPDATE requests SET ts = COALESCE(ts, created_at, NOW()) WHERE ts IS NULL';
    ELSE
      EXECUTE 'UPDATE requests SET ts = COALESCE(ts, NOW()) WHERE ts IS NULL';
    END IF;

    -- Enforce default + NOT NULL for ts
    ALTER TABLE requests ALTER COLUMN ts SET DEFAULT NOW();
    ALTER TABLE requests ALTER COLUMN ts SET NOT NULL;
  END $$;
`;

const createIndexesSql = `
  CREATE INDEX IF NOT EXISTS idx_uploads_backend_created_at
    ON uploads (backend_name, created_at DESC);

  CREATE INDEX IF NOT EXISTS idx_requests_backend_ts
    ON requests (backend_name, ts DESC);
`;

async function ensureUploadsTable() {
  console.log('[db] Ensuring uploads and requests tables exist...');

  await pool.query(createUploadsTableSql);
  await pool.query(createRequestsTableSql);
  await pool.query(patchRequestsSchemaSql);
  await pool.query(createIndexesSql);

  console.log('✅ [db] uploads and requests tables are ready');
}

async function insertUploadRecord(backendName, fileName, fileSize, mimeType) {
  const sql = `
    INSERT INTO uploads (backend_name, file_name, file_size, mime_type)
    VALUES ($1, $2, $3, $4)
    RETURNING id, backend_name, file_name, file_size, mime_type, created_at
  `;

  const values = [
    backendName,
    fileName,
    typeof fileSize === 'number' ? fileSize : null,
    mimeType || null,
  ];

  const result = await pool.query(sql, values);
  return result.rows[0];
}

module.exports = {
  pool,
  ensureUploadsTable,
  insertUploadRecord,
};
