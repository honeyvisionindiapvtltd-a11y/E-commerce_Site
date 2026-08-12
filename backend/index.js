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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, './.env') });

const app = express();
const PORT = process.env.PORT || 5000;

const connectMongoose = async () => {
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
// Mount generic store routes after specific API routes to avoid path collisions
app.use('/api', storeRoutes);
app.use('/api', locationRoutes);
app.use('/api/payments', paymentRoutes);

// Attempt to connect to databases, but do not crash the server if unavailable
try {
  await connectMongoose();
} catch (err) {
  console.warn('Warning: Mongoose connection failed, continuing without MongoDB (mongoose).', err.message);
}

try {
  await connectMongoClient();
} catch (err) {
  console.warn('Warning: MongoClient connection failed or MONGODB_URI not set, continuing without MongoDB (native client).', err.message);
}

app.listen(PORT, () => {
  console.log(`HoneyVision API listening on http://localhost:${PORT}`);
});
