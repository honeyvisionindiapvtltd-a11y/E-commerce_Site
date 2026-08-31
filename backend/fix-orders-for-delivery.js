import 'dotenv/config';
import mongoose from 'mongoose';
import Order from './models/Order.js';
import { ORDER_STATUSES } from './constants/orderStatuses.js';

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
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
};

/**
 * Transitions orders through the workflow for testing/demo purposes
 * ORDER_PLACED → PAYMENT_CONFIRMED → PROCESSING → PACKED → SHIPPED
 */
async function fixOrdersForDelivery() {
  await connectDB();

  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Order Workflow Transition Script         ║');
  console.log('╚════════════════════════════════════════════╝\n');

  try {
    // Find all ORDER_PLACED orders
    const placedOrders = await Order.find({ status: 'ORDER_PLACED' });

    if (placedOrders.length === 0) {
      console.log('✓ No orders in ORDER_PLACED status. All good!');
      await disconnectDB();
      return;
    }

    console.log(`Found ${placedOrders.length} order(s) to transition...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const order of placedOrders) {
      try {
        console.log(`Processing: ${order.orderNumber}`);

        // Step 1: ORDER_PLACED → PAYMENT_CONFIRMED
        order.status = ORDER_STATUSES.PAYMENT_CONFIRMED;
        order.paymentStatus = 'PAID';
        order.paymentMethod = order.paymentMethod || 'COD';
        await order.save();
        console.log(`  ✓ Step 1: PAYMENT_CONFIRMED`);

        // Step 2: PAYMENT_CONFIRMED → PROCESSING
        order.status = ORDER_STATUSES.PROCESSING;
        await order.save();
        console.log(`  ✓ Step 2: PROCESSING`);

        // Step 3: PROCESSING → PACKED
        order.status = ORDER_STATUSES.PACKED;
        await order.save();
        console.log(`  ✓ Step 3: PACKED`);

        // Step 4: PACKED → SHIPPED
        order.status = ORDER_STATUSES.SHIPPED;
        await order.save();
        console.log(`  ✓ Step 4: SHIPPED`);

        // Now ready for delivery agent to start delivery
        console.log(`  ✓ Ready for delivery! Delivery agent can now click "Start delivery"\n`);

        successCount++;
      } catch (error) {
        console.error(`  ✗ Error: ${error.message}\n`);
        errorCount++;
      }
    }

    console.log('╔════════════════════════════════════════════╗');
    console.log('║              Summary                       ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log(`✓ Transitioned: ${successCount} order(s)`);
    if (errorCount > 0) {
      console.log(`✗ Failed: ${errorCount} order(s)`);
    }

    // Show updated status
    const updatedOrders = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    console.log('\nUpdated Order Status Distribution:');
    updatedOrders.forEach((item) => {
      console.log(`  ${item._id}: ${item.count} order(s)`);
    });

    // Show orders ready for delivery
    const readyOrders = await Order.find({
      status: { $in: ['PACKED', 'SHIPPED', 'FAILED_DELIVERY'] },
    }).select('orderNumber status');

    console.log(`\n✓ Orders ready for delivery (${readyOrders.length}):`);
    readyOrders.forEach((order) => {
      console.log(`  - ${order.orderNumber} (${order.status})`);
    });
  } catch (error) {
    console.error('✗ Script failed:', error.message);
  } finally {
    await disconnectDB();
  }
}

fixOrdersForDelivery().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
