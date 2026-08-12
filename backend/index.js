import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dbConfig from './config/db.js';
import { connectDB as connectMongoClient } from './db.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import storeRoutes from './routes/store.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import locationRoutes from './routes/location.js';
import paymentRoutes from './routes/payment.js';
import { handleWebhook } from './controllers/paymentController.js';
import { ensureDeliveryIndexes } from './services/deliveryService.js';
import { seedAdmin } from './scripts/seedAdmin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, './.env') });

const app = express();
const PORT = process.env.PORT || 5000;

const connectDatabase = async () => {
  try {
    await mongoose.connect(dbConfig.mongoUri, { serverSelectionTimeoutMS: 15000 });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

app.use(cors());

// Stripe requires the raw body to validate webhooks. Mount webhook before body parsers.
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleWebhook);

app.use(express.json());
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api', storeRoutes);
app.use('/api', locationRoutes);
app.use('/api/payments', paymentRoutes);

// Start server with robust DB/connect logic
const startServer = async () => {
  try {
    // connect mongoose (for models)
    await connectDatabase();
  } catch (err) {
    console.warn('Warning: Mongoose connection failed, continuing without Mongoose.', err.message);
  }

  try {
    // connect native MongoDB client if available
    await connectMongoClient();
  } catch (err) {
    console.warn('Warning: MongoClient connection failed or MONGODB_URI not set, continuing without native client.', err.message);
  }

  try {
    // ensure indexes used by delivery service (no-op if not configured)
    await ensureDeliveryIndexes();
  } catch (err) {
    console.warn('Warning: ensureDeliveryIndexes failed or not configured.', err.message);
  }

  try {
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      await seedAdmin();
    }
  } catch (err) {
    console.warn('Warning: seedAdmin failed.', err.message);
  }

  app.listen(PORT, () => {
    console.log(`HoneyVision API listening on http://localhost:${PORT}`);
  });
};

startServer();
