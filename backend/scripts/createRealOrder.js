import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

dotenv.config();

const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/honeyvision';

const main = async () => {
  await mongoose.connect(uri);

  const product = await Product.findOne({});
  if (!product) {
    throw new Error('No product found in database. Seed products before creating a real order.');
  }

  let user = await User.findOne({ email: 'realorder@example.com' });
  if (!user) {
    user = new User({
      name: 'Real Order User',
      email: 'realorder@example.com',
      phone: '+919876543210',
      interest: 'AI Cameras',
      role: 'customer',
      status: 'Active',
      profile: {
        fullName: 'Real Order User',
        email: 'realorder@example.com',
        phone: '+919876543210',
        country: 'India',
      },
    });
    user.setPassword('Password123');
    await user.save();
  }

  const orderNumber = `HV${Date.now().toString().slice(-8)}`;

  const order = await Order.create({
    orderNumber,
    user: user._id,
    items: [
      {
        product: product._id,
        name: product.name,
        quantity: 1,
        price: product.price,
        image: product.thumbnail || '',
      },
    ],
    shippingAddress: {
      name: user.name,
      phone: user.phone,
      addressLine1: '123 Real Street',
      city: 'Bhubaneswar',
      state: 'Odisha',
      postalCode: '751001',
      country: 'India',
    },
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    subtotal: product.price,
    shippingCharge: 0,
    discount: 0,
    totalAmount: product.price,
    status: 'ORDER_PLACED',
    trackingNumber: `HVTRK${Date.now().toString().slice(-10)}`,
    courierName: 'HoneyVision Delivery',
    trackingEvents: [
      {
        status: 'ORDER_PLACED',
        title: 'Order Placed',
        description: 'Your order has been placed successfully.',
        location: 'Bhubaneswar',
        timestamp: new Date(),
        completed: true,
      },
    ],
  });

  const dbCount = await Order.countDocuments();
  const saved = await Order.findOne({ _id: order._id }).lean();

  console.log(JSON.stringify({
    message: 'REAL_ORDER_CREATED',
    userEmail: user.email,
    orderNumber: order.orderNumber,
    orderId: String(order._id),
    totalOrdersInDb: dbCount,
    savedOrder: {
      orderNumber: saved.orderNumber,
      status: saved.status,
      user: String(saved.user),
      totalAmount: saved.totalAmount,
      createdAt: saved.createdAt,
    },
  }, null, 2));

  await mongoose.disconnect();
};

main().catch((error) => {
  console.error('ERROR:', error.message);
  process.exit(1);
});
