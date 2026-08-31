import 'dotenv/config';
import mongoose from 'mongoose';
import Order from './models/Order.js';

const resolveMongoUri = () => {
  const directUri = process.env.MONGODB_DIRECT_URI;
  if (directUri && directUri.trim()) return directUri.trim();
  const remoteUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (remoteUri && remoteUri.trim()) return remoteUri.trim();
  return 'mongodb://127.0.0.1:27017/honeyvision';
};

const connectDB = async () => {
  try {
    const mongoUri = resolveMongoUri();
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
};

async function diagnoseDeliveryIssues() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Delivery System Diagnostic Report       ║');
  console.log('╚════════════════════════════════════════════╝\n');

  await connectDB();

  try {
    // Check order status distribution
    console.log('--- Order Status Distribution ---');
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    if (statusCounts.length === 0) {
      console.log('⚠ No orders found in database');
    } else {
      statusCounts.forEach((item) => {
        console.log(`  ${item._id}: ${item.count} order(s)`);
      });
    }

    // Check orders that can start delivery
    console.log('\n--- Orders Ready to Start Delivery ---');
    const readyOrders = await Order.find({
      status: { $in: ['PACKED', 'SHIPPED', 'FAILED_DELIVERY'] },
    }).select('orderNumber status shippingAddress.phone user');

    if (readyOrders.length === 0) {
      console.log('⚠ No orders in PACKED, SHIPPED, or FAILED_DELIVERY status');
      console.log('\nTo start delivery, orders must first be:');
      console.log('  1. PAYMENT_CONFIRMED (after payment)');
      console.log('  2. PROCESSING');
      console.log('  3. PACKED');
      console.log('  4. SHIPPED (or FAILED_DELIVERY for retry)');
      console.log('\nThen delivery agent can click "Start delivery"');
    } else {
      readyOrders.forEach((order) => {
        console.log(`  ✓ ${order.orderNumber} - ${order.status}`);
      });
    }

    // Check orders stuck in ORDER_PLACED
    console.log('\n--- Orders Stuck in ORDER_PLACED ---');
    const placedOrders = await Order.find({ status: 'ORDER_PLACED' }).select(
      'orderNumber user shippingAddress.name'
    );

    if (placedOrders.length === 0) {
      console.log('✓ No orders stuck in ORDER_PLACED');
    } else {
      console.log(`⚠ Found ${placedOrders.length} order(s) in ORDER_PLACED status:`);
      placedOrders.forEach((order) => {
        console.log(`  - ${order.orderNumber}`);
      });
      console.log('\nAction Required:');
      console.log('  1. Admin must transition these orders through workflow:');
      console.log('     ORDER_PLACED → PAYMENT_CONFIRMED → PROCESSING → PACKED → SHIPPED');
      console.log('  2. Use admin dashboard to update order status');
      console.log('  3. Or configure automatic workflow progression');
    }

    // Check for orders with missing delivery requirements
    console.log('\n--- Orders Missing Delivery Info ---');
    const incompleteOrders = await Order.find({
      $or: [
        { 'shippingAddress.phone': { $exists: false } },
        { 'shippingAddress.phone': '' },
        { 'user': { $exists: false } },
      ],
      status: { $in: ['PACKED', 'SHIPPED', 'FAILED_DELIVERY'] },
    }).select('orderNumber orderNumber status');

    if (incompleteOrders.length === 0) {
      console.log('✓ All delivery-ready orders have required info');
    } else {
      console.log(
        `⚠ Found ${incompleteOrders.length} incomplete order(s):`
      );
      incompleteOrders.forEach((order) => {
        console.log(`  - ${order.orderNumber} (missing phone or user info)`);
      });
    }

    // Check WebSocket requirements
    console.log('\n--- Backend Requirements ---');
    const requirements = [
      ['Node.js Backend', process.env.BACKEND_URL || 'http://localhost:5000'],
      ['WebSocket Support', process.env.SOCKET_IO_ENABLED !== 'false' ? 'Enabled' : 'Disabled'],
      ['JWT Secret', process.env.JWT_SECRET ? 'Configured' : '✗ Missing'],
      ['MongoDB', resolveMongoUri()],
    ];

    requirements.forEach(([key, value]) => {
      const status = value.includes('✗') ? '✗' : '✓';
      console.log(`  ${status} ${key}: ${value}`);
    });

    // Check API requirements
    console.log('\n--- Optional Services ---');
    const services = [
      ['Google Maps API', process.env.GOOGLE_MAPS_API_KEY ? 'Configured' : '⚠ Not configured'],
      ['Email Service', process.env.EMAIL_USER && process.env.EMAIL_PASSWORD ? 'Configured' : '⚠ Not configured'],
      ['Twilio SMS', process.env.TWILIO_ACCOUNT_SID ? 'Configured' : '⚠ Not configured'],
    ];

    services.forEach(([key, value]) => {
      const status = value.includes('Configured') ? '✓' : '⚠';
      console.log(`  ${status} ${key}: ${value}`);
    });

  } catch (error) {
    console.error('✗ Diagnostic failed:', error.message);
  } finally {
    await disconnectDB();
  }

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║            Troubleshooting Guide           ║');
  console.log('╚════════════════════════════════════════════╝\n');

  console.log('ISSUE 1: "Cannot start delivery from ORDER_PLACED"');
  console.log('─────────────────────────────────────────────────');
  console.log('Cause: Order needs to progress through workflow first');
  console.log('Fix:   Admin must update order status to PACKED → SHIPPED');
  console.log('');

  console.log('ISSUE 2: WebSocket connection failed');
  console.log('─────────────────────────────────────');
  console.log('Cause: Backend not running or WebSocket not initialized');
  console.log('Fix:   1. Start backend: npm start (in backend folder)');
  console.log('       2. Check PORT is 5000 in .env');
  console.log('       3. Verify CORS settings allow localhost:5173');
  console.log('');

  console.log('ISSUE 3: Google Maps API billing error');
  console.log('─────────────────────────────────────');
  console.log('Cause: Google Maps billing not enabled or API key invalid');
  console.log('Fix:   1. Enable Billing: https://console.cloud.google.com/billing');
  console.log('       2. Set GOOGLE_MAPS_API_KEY in .env');
  console.log('       3. Or disable Maps: set GOOGLE_MAPS_API_KEY=""');
  console.log('');

  console.log('ISSUE 4: Tracking Prevention blocking storage');
  console.log('────────────────────────────────────────────');
  console.log('Cause: Browser privacy settings blocking localStorage/cookies');
  console.log('Fix:   1. Disable Tracking Prevention for localhost');
  console.log('       2. Or use sessionStorage instead of localStorage');
  console.log('       3. This is normal in development');
  console.log('');
}

diagnoseDeliveryIssues().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
