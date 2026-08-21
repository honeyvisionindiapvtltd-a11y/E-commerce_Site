import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

async function checkProduct() {
  try {
    const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(MONGO_URI);
    
    const product = await Product.findOne({ stock: { $gte: 1 } });
    console.log('Product found:', product?.name);
    console.log('Product _id:', product?._id);
    console.log('Product _id as string:', product?._id?.toString());
    
    // Try to find by the same ID we just got
    if (product) {
      const refoundProduct = await Product.findById(product._id);
      console.log('Refound product:', refoundProduct?.name);
      
      const refoundByString = await Product.findById(product._id.toString());
      console.log('Refound by string:', refoundByString?.name);
    }
    
    const totalProducts = await Product.countDocuments();
    console.log('Total products in DB:', totalProducts);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkProduct();
