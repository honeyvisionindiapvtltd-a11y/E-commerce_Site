import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import dbConfig from '../config/db.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

const downloads = process.env.CATALOG_DIR || 'C:/Users/User/Downloads';
const readJson = async (fileName) => JSON.parse(await fs.readFile(path.join(downloads, fileName), 'utf8'));

const importCatalog = async () => {
  const [categoriesData, subcategoriesData, productsData] = await Promise.all([
    readJson('categories.json'),
    readJson('subcategories.json'),
    readJson('products.json'),
  ]);

  if (!Array.isArray(categoriesData) || !Array.isArray(subcategoriesData) || !Array.isArray(productsData)) {
    throw new Error('Catalog JSON files must each contain an array');
  }

  await mongoose.connect(dbConfig.mongoUri, { serverSelectionTimeoutMS: 15000 });
  console.log(`Importing ${categoriesData.length} categories, ${subcategoriesData.length} subcategories, and ${productsData.length} products`);

  await Product.deleteMany({});
  await Category.deleteMany({});

  const categoryIds = new Map();
  for (const category of categoriesData) {
    const created = await Category.create({
      name: category.name,
      slug: category.slug,
      description: category.description || `${category.name} products`,
      sortOrder: Number(category.sortOrder || 0),
      isActive: category.isActive !== false,
      parentCategory: null,
    });
    categoryIds.set(category.id, created._id);
  }

  const subcategoryIds = new Map();
  for (const subcategory of subcategoriesData) {
    const parentId = categoryIds.get(subcategory.categoryId);
    if (!parentId) throw new Error(`Missing parent category for ${subcategory.id}`);

    const created = await Category.create({
      name: subcategory.name,
      slug: subcategory.slug,
      description: subcategory.description || `${subcategory.name} products`,
      sortOrder: Number(subcategory.sortOrder || 0),
      isActive: subcategory.isActive !== false,
      parentCategory: parentId,
    });
    subcategoryIds.set(subcategory.id, created._id);
  }

  const products = productsData.map((product) => {
    const categoryId = categoryIds.get(product.categoryId);
    const subCategoryId = product.subCategoryId ? subcategoryIds.get(product.subCategoryId) : null;
    if (!categoryId) throw new Error(`Missing category for product ${product.sku}`);
    if (product.subCategoryId && !subCategoryId) throw new Error(`Missing subcategory for product ${product.sku}`);

    const mrp = Number(product.pricing?.mrp || product.pricing?.sellingPrice || 0);
    const price = Number(product.pricing?.sellingPrice || mrp);
    const images = Array.isArray(product.images) ? product.images.map((image) => image.url).filter(Boolean) : [];
    const warranty = product.warranty?.period
      ? `${product.warranty.period}${product.warranty.type ? ` - ${product.warranty.type}` : ''}`
      : '';

    return {
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      brand: product.brand || 'HoneyVision',
      category: categoryId,
      subCategory: subCategoryId,
      shortDescription: product.shortDescription || product.name,
      description: product.shortDescription || product.name,
      price,
      mrp,
      discountPercentage: mrp ? Math.max(0, Math.round(((mrp - price) / mrp) * 100)) : 0,
      stock: Number(product.inventory?.stock || 0),
      images,
      thumbnail: images[0] || '',
      specifications: product.specifications || {},
      warranty,
      tags: Array.isArray(product.tags) ? product.tags : [],
      featured: Boolean(product.flags?.featured),
      bestSeller: Boolean(product.flags?.bestSeller),
      newArrival: Boolean(product.flags?.newArrival),
      isActive: product.isActive !== false,
    };
  });

  await Product.insertMany(products, { ordered: true });
  console.log(`Imported ${categoriesData.length} categories, ${subcategoriesData.length} subcategories, and ${products.length} products`);
};

try {
  await importCatalog();
} catch (error) {
  console.error('Catalog import failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
