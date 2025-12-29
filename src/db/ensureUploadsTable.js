// src/db/ensureUploadsTable.js
// Shared PostgreSQL pool + helper to ensure the `uploads` table exists.
//
// Usage from a backend (A or B):
//   const { pool, ensureUploadsTable, insertUploadRecord } = require('../db/ensureUploadsTable');
//   await ensureUploadsTable('A'); // or 'B' for backend B
//   app.listen(PORT, () => console.log('Backend A listening...', PORT));

const { Pool } = require('pg');

// Build the pool from environment variables.
// You can either:
//   - use a single DATABASE_URL, or
//   - use DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD
//
// This matches typical AKS + Postgres setups.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.DB_HOST || undefined,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
  database: process.env.DB_NAME || undefined,
  user: process.env.DB_USER || undefined,
  password: process.env.DB_PASSWORD || undefined,
  ssl:
    process.env.DB_SSL === 'true' || process.env.PGSSLMODE === 'require'
      ? { rejectUnauthorized: false }
      : false,
});

/**
 * Ensure the `uploads` table exists.
 *
 * @param {string} backendNameHint Optional backend name to log (e.g., "A" or "B")
 */
async function ensureUploadsTable(backendNameHint) {
  const sql = `
    CREATE TABLE IF NOT EXISTS uploads (
      id              SERIAL PRIMARY KEY,
      backend_name    TEXT        NOT NULL,
      original_name   TEXT        NOT NULL,
      stored_name     TEXT        NOT NULL,
      mime_type       TEXT,
      size_bytes      BIGINT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  try {
    console.log(
      `Ensuring uploads table exists${
        backendNameHint ? ` (backend ${backendNameHint})` : ''
      }...`
    );
    await pool.query(sql);
    console.log('✅ uploads table is ready');
  } catch (err) {
    console.error('❌ Failed to ensure uploads table:', err);
    // If you want to fail fast when the schema is missing, uncomment:
    // process.exit(1);
  }
}

/**
 * Helper to insert a row into `uploads`.
 * You can call this from your upload handlers in backend A/B.
 *
 * @param {object} params
 * @param {string} params.backendName   "A" or "B"
 * @param {string} params.originalName  Original filename from the user
 * @param {string} params.storedName    Name you stored the file as
 * @param {string} [params.mimeType]    MIME type if known
 * @param {number} [params.sizeBytes]   File size in bytes
 * @returns {Promise<object>} The inserted row
 */
async function insertUploadRecord({
  backendName,
  originalName,
  storedName,
  mimeType,
  sizeBytes,
}) {
  const sql = `
    INSERT INTO uploads (
      backend_name,
      original_name,
      stored_name,
      mime_type,
      size_bytes
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const values = [
    backendName,
    originalName,
    storedName,
    mimeType || null,
    typeof sizeBytes === 'number' ? sizeBytes : null,
  ];

  const result = await pool.query(sql, values);
  return result.rows[0];
}

module.exports = {
  pool,
  ensureUploadsTable,
  insertUploadRecord,
};
