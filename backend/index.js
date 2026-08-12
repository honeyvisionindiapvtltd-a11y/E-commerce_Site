import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import storeRoutes from './routes/store.js';
import locationRoutes from './routes/location.js';
import { connectDB } from './db.js';
import { ensureDeliveryIndexes } from './services/deliveryService.js';
import { seedAdmin } from './scripts/seedAdmin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', storeRoutes);
app.use('/api', locationRoutes);

const startServer = async () => {
  try {
    await connectDB();
    await ensureDeliveryIndexes();

    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      await seedAdmin();
    }

    app.listen(PORT, () => {
      console.log(`HoneyVision API listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
