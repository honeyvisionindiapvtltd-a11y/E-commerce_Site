import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';
import Product from './models/Product.js';
import User from './models/User.js';

dotenv.config();

async function testOrderCreation() {
  try {
    const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Get a real product for the order
    const product = await Product.findOne({ stock: { $gte: 1 } });
    if (!product) throw new Error('No product available');

    console.log('\nUsing product:', product.name);
    console.log('Product ID type:', typeof product._id);
    console.log('Product ID value:', String(product._id));
    console.log('Product ID from toString():', product._id.toString());

    // Create or find an existing guest user with proper password
    let guestUser = await User.findOne({ email: 'test-guest@honeyvision.local' });
    if (!guestUser) {
      guestUser = new User({
        name: 'Test Guest',
        email: 'test-guest@honeyvision.local',
        phone: '+919999999999',
        interest: 'AI Cameras',
        role: 'customer',
        status: 'Active',
        profile: {
          fullName: 'Test Guest',
          email: 'test-guest@honeyvision.local',
          phone: '+919999999999',
          country: 'India'
        }
      });
      guestUser.setPassword('test-guest-password');
      await guestUser.save();
      console.log('✓ Created test guest user');
    }

    // Simulate a guest checkout call to the API
    const checkoutPayload = {
      items: [
        {
          productId: product._id.toString(),
          product: product._id.toString(),
          quantity: 1,
          price: product.price,
          name: product.name,
        }
      ],
      shippingAddress: {
        name: 'Test Guest Customer',
        phone: '+919999999999',
        addressLine1: '123 Test Lane',
        city: 'Bhubaneswar',
        state: 'Odisha',
        postalCode: '751001',
        country: 'India'
      },
      paymentMethod: 'cod',
      deliveryType: 'courier'
    };

    console.log('\nCalling API /api/orders (guest checkout) on port 5003...');
    // Call the real API endpoint (no auth token = guest checkout)
    const apiResponse = await axios.post('http://localhost:5003/api/orders', checkoutPayload, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✓ API Response Status:', apiResponse.status);
    const orderNumber = apiResponse.data.order.orderNumber;
    console.log('✓ Order Number:', orderNumber);
    
    // Give DB a moment to persist
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify the order was saved in MongoDB
    const savedOrder = await Order.findOne({ orderNumber });
    
    if (savedOrder) {
      console.log('\n✅ SUCCESS: ORDER CONFIRMED IN MONGODB');
      console.log('   Order Number:', savedOrder.orderNumber);
      console.log('   Total Amount:', savedOrder.totalAmount);
      console.log('   Status:', savedOrder.status);
      console.log('   Items Count:', savedOrder.items.length);
      console.log('   Created At:', savedOrder.createdAt);
    } else {
      console.log('\n❌ FAILURE: ORDER NOT FOUND IN MONGODB');
      console.log('   Order was returned by API but not saved in database!');
    }
    
    // Show total order count
    const totalOrders = await Order.countDocuments();
    console.log('\nTotal Orders in DB:', totalOrders);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testOrderCreation();
