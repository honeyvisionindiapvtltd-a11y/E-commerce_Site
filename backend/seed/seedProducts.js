import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dbConfig from '../config/db.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { productData } from './productData.js';

dotenv.config();

const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const readCatalogProducts = async () => {
  // All external JSON data has been extracted and stored in productData.js
  if (Array.isArray(productData) && productData.length) {
    console.log(`✅ Loaded ${productData.length} products from productData.js`);
    return productData;
  }

  throw new Error('No product data found in productData.js');
};

const createUniqueSlug = async (baseValue = 'product') => {
  const base = slugify(baseValue) || 'product';
  let candidate = base;
  let counter = 2;

  while (await Product.exists({ slug: candidate })) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  return candidate;
};

const createUniqueSku = async (baseValue = 'HV-PROD') => {
  const base = String(baseValue || 'HV-PROD').trim() || 'HV-PROD';
  let candidate = base;
  let counter = 2;

  while (await Product.exists({ sku: candidate })) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  return candidate;
};

const connectDB = async () => {
  try {
    await mongoose.connect(dbConfig.mongoUri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const seedProducts = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting product seed from productData.js...');

    const catalogProducts = await readCatalogProducts();
    if (!catalogProducts.length) {
      throw new Error('No products found in product catalog');
    }

    await Product.deleteMany({});
    console.log('🗑️  Old products removed');

    let created = 0;
    let skipped = 0;

    for (const product of catalogProducts) {
      const categorySlug = product.categorySlug || '';
      const subCategorySlug = product.subCategorySlug || '';

      // Find category by slug
      const category = await Category.findOne({
        slug: categorySlug,
        parentCategory: null,
      });

      if (!category) {
        console.log(`⚠️  Category not found: ${categorySlug}`);
        skipped += 1;
        continue;
      }

      let subCategory = null;
      if (subCategorySlug) {
        subCategory = await Category.findOne({
          slug: subCategorySlug,
          parentCategory: category._id,
        });
      }

      const productName = product.name || 'Untitled Product';
      const price = Number(product.price ?? 0);
      const mrp = Number(product.mrp ?? product.price ?? 0);
      const stock = Number(product.stock ?? 0);
      const discountPercentage = mrp > 0 && price > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;

      const sku = product.sku || `HV-${created + 1}`;
      const slug = product.slug || slugify(product.name || `product-${created + 1}`);

      await Product.create({
        name: productName,
        slug: await createUniqueSlug(slug),
        sku: await createUniqueSku(sku),
        brand: product.brand || 'HoneyVision',
        category: category._id,
        subCategory: subCategory ? subCategory._id : null,
        shortDescription: product.shortDescription || product.name,
        description: product.shortDescription || product.name,
        price,
        mrp,
        discountPercentage,
        stock,
        lowStockThreshold: 5,
        images: Array.isArray(product.images) && product.images.length
          ? product.images
          : product.src || product.image
            ? [product.src || product.image]
            : [],
        thumbnail: product.thumbnail || product.src || product.image || product.images?.[0] || '',
        specifications: product.specifications || {},
        warranty: product.warranty || 'Verify with supplier',
        tags: Array.isArray(product.tags) ? product.tags : [product.brand].filter(Boolean),
        featured: Boolean(product.featured),
        bestSeller: Boolean(product.bestSeller),
        newArrival: Boolean(product.newArrival),
        recommended: false,
        isActive: product.status !== 'inactive',
      });

      created += 1;
      if (created % 20 === 0) console.log(`  ✓ ${created} products created...`);
    }

    console.log('\n================================');
    console.log(`✅ Products created: ${created}`);
    console.log(`⏭️  Products skipped: ${skipped}`);
    console.log('================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Product seed error:', error);
    process.exit(1);
  }
};

seedProducts();