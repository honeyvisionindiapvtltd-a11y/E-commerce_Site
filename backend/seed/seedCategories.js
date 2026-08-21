import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dbConfig from '../config/db.js';
import Category from '../models/Category.js';
import { categoriesData } from './categoriesData.js';

dotenv.config();

const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const createUniqueSlug = async (baseSlug, parentName = '') => {
  const base = (baseSlug || parentName || 'category')
    .toLowerCase()
    .trim()
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');

  let candidate = base || 'category';
  let counter = 2;

  while (await Category.exists({ slug: candidate })) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  return candidate;
};

const readCatalogCategories = async () => {
  // All external JSON data has been extracted and stored in categoriesData.js
  if (Array.isArray(categoriesData) && categoriesData.length) {
    console.log(`✅ Loaded ${categoriesData.length} categories from categoriesData.js`);
    return categoriesData;
  }

  throw new Error('No category data found in categoriesData.js');
};

const connectDB = async () => {
  try {
    await mongoose.connect(dbConfig.mongoUri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const seedCategories = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting category seed from categoriesData.js...');

    const catalogCategories = await readCatalogCategories();

    if (!catalogCategories.length) {
      throw new Error('No categories found in categoriesData.js');
    }

    await Category.deleteMany({});
    console.log('🗑️  Old categories removed');

    let mainCategoryCount = 0;
    let subCategoryCount = 0;

    for (let i = 0; i < catalogCategories.length; i++) {
      const categoryData = catalogCategories[i];
      const mainSlug = await createUniqueSlug(categoryData.slug || slugify(categoryData.name));

      const mainCategory = await Category.create({
        name: categoryData.name,
        slug: mainSlug,
        description: categoryData.description || `${categoryData.name} products`,
        image: categoryData.src || categoryData.image || '',
        icon: categoryData.icon || 'folder',
        parentCategory: null,
        sortOrder: i + 1,
        isActive: categoryData.status !== 'inactive',
      });

      mainCategoryCount++;
      console.log(`  ✓ ${mainCategory.name}`);

      if (Array.isArray(categoryData.subcategories) && categoryData.subcategories.length > 0) {
        for (let j = 0; j < categoryData.subcategories.length; j++) {
          const subData = categoryData.subcategories[j];
          const subSlug = await createUniqueSlug(subData.slug || slugify(subData.name));

          await Category.create({
            name: subData.name,
            slug: subSlug,
            description: subData.description || `${subData.name}`,
            image: subData.src || subData.image || categoryData.src || categoryData.image || '',
            parentCategory: mainCategory._id,
            sortOrder: j + 1,
            isActive: true,
          });

          subCategoryCount++;
        }
      }
    }

    console.log('\n================================');
    console.log('✅ CATEGORY IMPORT COMPLETED');
    console.log('================================');
    console.log(`📁 Main Categories: ${mainCategoryCount}`);
    console.log(`📚 Subcategories: ${subCategoryCount}`);
    console.log(`📊 Total Categories: ${mainCategoryCount + subCategoryCount}`);
    console.log('================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Category import failed:', error);
    process.exit(1);
  }
};

seedCategories();