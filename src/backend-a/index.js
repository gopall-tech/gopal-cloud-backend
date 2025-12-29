const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,
  ssl: { rejectUnauthorized: false } // Required for Azure
});

// Root Route
app.get('/', (req, res) => {
  res.send('Backend A is Running!');
});

// The Main Endpoint (Matches the David Reference)
app.get('/api/a', async (req, res) => {
  try {
    // 1. Log the request to the Database
    const client = await pool.connect();
    const query = `
      INSERT INTO requests (backend_name, ts, meta) 
      VALUES ($1, NOW(), $2) 
      RETURNING *;
    `;
    const values = ['backend-a', { uploaded: true }];
    const result = await client.query(query, values);
    client.release();

    // 2. Send response to UI
    res.json({
      backend: 'backend-a',
      message: 'Hello from Backend A',
      db_entry: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(port, () => {
  console.log(`Backend A listening on port ${port}`);
});