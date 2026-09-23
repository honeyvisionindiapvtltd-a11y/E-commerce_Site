import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dbConfig from './config/db.js';
import { validateEnvironment } from './config/env.js';
import { connectDB as connectNativeMongoClient } from './db.js';
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
import orderRoutes from "./routes/orderRoutes.js";
import trackingRoutes from "./routes/trackingRoutes.js";
import adminRoutes from "./routes/admin.js";
import webhookRoutes from './routes/webhooks.js';
import { initializeRealtime } from './services/realtimeService.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import returnRoutes from './routes/returnRoutes.js';
import deliveryServiceabilityRoutes from './routes/deliveryServiceabilityRoutes.js';
import userRoutes from './routes/users.js';
import supportRoutes from './routes/supportRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import installationsRoutes from './routes/installations.js';
import inventoryRoutes from './routes/inventory.js';
import amcRoutes from './routes/amcRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, './.env') });

validateEnvironment();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const localFrontendOrigins = [
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
  'https://honeyvision.in',
  'https://www.honeyvision.in',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://192.168.31.5:5173',
  'http://192.168.31.5:5174',
  'http://192.168.31.6:5174',
];
const configuredFrontendOrigins = String(process.env.FRONTEND_URL || '')
  .split(',').map((origin) => origin.trim()).filter(Boolean);
const allowedOrigins = new Set([...localFrontendOrigins, ...configuredFrontendOrigins]);
const isAllowedDevelopmentOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.31\.5):\d+$/.test(origin);
let databaseAvailable = false;
let httpServer;

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const connectDatabase = async () => {
  let attempt = 0;
  while (!databaseAvailable) {
    attempt += 1;
    try {
      await mongoose.connect(dbConfig.mongoUri, { serverSelectionTimeoutMS: 5000 });
      databaseAvailable = true;
      console.log('MongoDB connected');
      return;
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt} failed:`, error.message);
      if (process.env.NODE_ENV !== 'production') return;
      await wait(Math.min(attempt * 5000, 30000));
    }
  }
};

app.use(cors({ origin: (origin, callback) => {
  if (!origin || allowedOrigins.has(origin) || isAllowedDevelopmentOrigin(origin)) return callback(null, true);
  return callback(new Error('Origin is not allowed by CORS'));
}, credentials: true }));

// Stripe requires the raw body to validate webhooks. Mount webhook before body parsers.
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleWebhook);
app.use('/api/webhooks', webhookRoutes);

app.use(express.json());

app.get('/', (req, res) => {
  const frontendUrl = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)[0];

  if (frontendUrl) {
    return res.redirect(frontendUrl);
  }

  return res.redirect('/api');
});

app.use('/api', healthRoutes);
app.use((req, res, next) => {
  if (databaseAvailable || req.path === '/health') return next();
  return res.status(503).json({ success: false, message: 'Database is temporarily unavailable. Please try again shortly.' });
});
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use(
  "/api/orders",
  orderRoutes
);
app.use(
  "/api/tracking",
  trackingRoutes
);
app.use('/api/admin', adminRoutes);
app.use('/api', installationsRoutes);
app.use('/api', storeRoutes);
app.use('/api', locationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/delivery', deliveryServiceabilityRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/amc', amcRoutes);

const startListening = () => {
  httpServer = http.createServer(app);
  initializeRealtime(httpServer);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`HoneyVision API listening on port ${PORT}`);
    console.log('Socket.io server initialized');
  });
};

const initializeDatabaseServices = async () => {
  await connectDatabase();

  try {
    await connectNativeMongoClient();
  } catch (err) {
    console.warn('Warning: MongoClient connection failed, continuing without native client.', err.message);
  }

  try {
    await ensureDeliveryIndexes();
  } catch (err) {
    console.warn('Warning: ensureDeliveryIndexes failed.', err.message);
  }

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    try {
      await seedAdmin();
    } catch (err) {
      console.warn('Warning: seedAdmin failed.', err.message);
    }
  }
};

const shutdown = async (signal) => {
  console.log(`${signal} received; shutting down gracefully`);
  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
  }
  await mongoose.disconnect();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startListening();
initializeDatabaseServices().catch((error) => {
  console.error('Database initialization failed:', error.message);
});
