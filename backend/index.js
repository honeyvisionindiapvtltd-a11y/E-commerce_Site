import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import storeRoutes from './routes/store.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', storeRoutes);

app.listen(PORT, () => {
  console.log(`HoneyVision API listening on http://localhost:${PORT}`);
});
