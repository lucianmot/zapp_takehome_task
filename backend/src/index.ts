import express from 'express';
import { pool } from './db';
import inventoryRouter from '@controllers/inventoryController';
import ingestionRouter from '@controllers/ingestionController';
import ingestionErrorRouter from '@controllers/ingestionErrorController';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware to parse JSON
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// Register inventory router
app.use('/api', inventoryRouter);
app.use('/api', ingestionRouter);
app.use('/api', ingestionErrorRouter);

// Simple health check endpoint
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err });
  }
});

// Example root endpoint
app.get('/', (req, res) => {
  res.send('JustZapp backend is running!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running at http://localhost:${PORT}`);
});