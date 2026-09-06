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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, './.env') });

validateEnvironment();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const localFrontendOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://192.168.31.5:5173',
];
const configuredFrontendOrigins = String(process.env.FRONTEND_URL || '')
  .split(',').map((origin) => origin.trim()).filter(Boolean);
const allowedOrigins = new Set([...localFrontendOrigins, ...configuredFrontendOrigins]);
const isAllowedDevelopmentOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.31\.5):\d+$/.test(origin);
let databaseAvailable = false;

const connectDatabase = async () => {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await mongoose.connect(dbConfig.mongoUri, { serverSelectionTimeoutMS: 5000 });
      databaseAvailable = true;
      console.log('MongoDB connected');
      return;
    } catch (error) {
      lastError = error;
      console.error(`MongoDB connection attempt ${attempt}/3 failed:`, error.message);
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }

  if (process.env.NODE_ENV === 'production') {
    throw lastError;
  }
  console.warn('Continuing in non-production mode without MongoDB. Database routes will return 503.');
};

app.use(cors({ origin: (origin, callback) => {
  if (!origin || allowedOrigins.has(origin) || isAllowedDevelopmentOrigin(origin)) return callback(null, true);
  return callback(new Error('Origin is not allowed by CORS'));
}, credentials: true }));

// Stripe requires the raw body to validate webhooks. Mount webhook before body parsers.
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleWebhook);
app.use('/api/webhooks', webhookRoutes);

app.use(express.json());
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

// Start server with robust DB/connect logic
const startServer = async () => {
  try {
    await connectDatabase();
  } catch (err) {
    console.error('Fatal: MongoDB connection failed during startup.', err.message);
    process.exit(1);
  }

  try {
    await connectNativeMongoClient();
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

  const startListening = (port) => {
    const server = http.createServer(app);
    initializeRealtime(server);

    server.listen(port, '0.0.0.0', () => {
      console.log(`HoneyVision API listening on http://localhost:${port}`);
      console.log(`Network access: http://192.168.31.5:${port}`);
      console.log('Socket.io server initialized');
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        const nextPort = port + 1;
        console.warn(`Port ${port} is busy. Retrying on port ${nextPort}...`);
        startListening(nextPort);
        return;
      }

      console.error('Failed to start server:', err);
      process.exit(1);
    });
  };

  startListening(PORT);
};

startServer();
