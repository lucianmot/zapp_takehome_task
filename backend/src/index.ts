import express from 'express';
import { pool } from './db';

const app = express();
const PORT = process.env.PORT || 3001;

// middleware
app.use(express.json());

// health check
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err });
  }
});

app.get('/', (req, res) => {
  res.send('JustZapp backend is running!');
});

// server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running at http://localhost:${PORT}`);
});