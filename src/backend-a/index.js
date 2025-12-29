const express = require('express');
const multer = require('multer');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 5000;

// PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Configure Multer (Using Memory Storage)
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

// The NEW Upload Route
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Save metadata to the database
    const query = `
      INSERT INTO uploads (backend_name, file_name, file_size, mime_type)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [
      process.env.BACKEND_NAME || 'backend-a', 
      req.file.originalname,
      req.file.size,
      req.file.mimetype
    ];

    const dbRes = await pool.query(query, values);

    res.json({
      message: 'File metadata saved successfully',
      file: req.file.originalname,
      db_entry: dbRes.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database insertion failed' });
  }
});

// Keep your old test routes if you want
app.get('/api/a', async (req, res) => { /* ... existing code ... */ });

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});