import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/auth.js';
import paymentRoutes from './routes/payment.js';
import trackingRoutes from './routes/tracking.js';
import adminRoutes from './routes/admin.js';
import inventoryRoutes from './routes/inventory.js';
import { initializeRealtime } from './services/realtimeService.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const localFrontendOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://192.168.31.5:5173',
];
const configuredFrontendOrigins = String(process.env.FRONTEND_URL || '')
  .split(',').map((origin) => origin.trim()).filter(Boolean);
const allowedOrigins = new Set([...localFrontendOrigins, ...configuredFrontendOrigins]);

app.use(cors({ origin: (origin, callback) => {
  if (!origin || allowedOrigins.has(origin)) return callback(null, true);
  return callback(new Error('Origin is not allowed by CORS'));
}, credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' });
});

// API Routes
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/chat', chatRoutes);

// Create HTTP server for Socket.io
const server = http.createServer(app);

// Initialize Socket.io for real-time updates
const io = initializeRealtime(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io server initialized`);
});
