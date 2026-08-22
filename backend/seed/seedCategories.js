import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dbConfig from '../config/db.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { categoriesData } from './categoriesData.js';

dotenv.config();

const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const legacyCategoryAliases = {
  'cctv-surveillance': 'cctv-cameras',
  'nvr-dvr-surveillance-storage': 'nvr-and-dvr',
  networking: 'networking-equipment',
  'cables-connectors': 'cables-and-connectors',
  'stands-racks-mounts': 'camera-mounts-and-stands',
  'storage-memory': 'storage-devices',
  'it-essentials-accessories': 'computer-accessories',
  'installation-tools-equipment': 'computer-accessories',
  'access-control-attendance': 'access-control',
  'led-displays-digital-signage': 'led-displays',
  'audio-visual': 'led-displays',
  'office-equipment-accessories': 'computer-accessories',
  'smart-devices-wearables': 'smart-wearables',
  smps: 'smps-computer-components',
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

    let mainCategoryCount = 0;
    let subCategoryCount = 0;
    const desiredSlugs = new Set();
    const desiredCategoriesBySlug = new Map();

    for (let i = 0; i < catalogCategories.length; i++) {
      const categoryData = catalogCategories[i];
      const mainSlug = categoryData.slug || slugify(categoryData.name);
      desiredSlugs.add(mainSlug);
      desiredCategoriesBySlug.set(mainSlug, { slug: mainSlug, name: categoryData.name, parentSlug: null });

      const mainCategory = await Category.findOneAndUpdate(
        { slug: mainSlug },
        {
        name: categoryData.name,
        slug: mainSlug,
        description: categoryData.description || `${categoryData.name} products`,
        icon: categoryData.icon || 'folder',
        parentCategory: null,
        sortOrder: i + 1,
        isActive: categoryData.status !== 'inactive',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      mainCategoryCount++;
      console.log(`  ✓ ${mainCategory.name}`);

      if (Array.isArray(categoryData.subcategories) && categoryData.subcategories.length > 0) {
        for (let j = 0; j < categoryData.subcategories.length; j++) {
          const subData = categoryData.subcategories[j];
          const subSlug = subData.slug || slugify(subData.name);
          desiredSlugs.add(subSlug);
          desiredCategoriesBySlug.set(subSlug, {
            slug: subSlug,
            name: subData.name,
            parentSlug: mainSlug,
          });

          await Category.findOneAndUpdate(
            { slug: subSlug },
            {
            name: subData.name,
            slug: subSlug,
            description: subData.description || `${subData.name}`,
            parentCategory: mainCategory._id,
            sortOrder: j + 1,
            isActive: true,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );

          subCategoryCount++;
        }
      }
    }

    const staleCategories = await Category.find({ slug: { $nin: [...desiredSlugs] } }).select('_id slug');
    let removedStaleCount = 0;
    let retainedReferencedCount = 0;

    for (const staleCategory of staleCategories) {
      const staleDetails = await Category.findById(staleCategory._id).select('name slug parentCategory');
      const aliasSlug = legacyCategoryAliases[staleDetails.slug] || staleDetails.slug;
      let replacement = desiredCategoriesBySlug.get(aliasSlug);
      let isUnmatchedSubcategory = false;
      const hasStoredParent = staleDetails.parentCategory
        ? await Category.exists({ _id: staleDetails.parentCategory })
        : false;

      if (!replacement && hasStoredParent) {
        const staleParent = await Category.findById(staleDetails.parentCategory).select('slug');
        const replacementParentSlug = legacyCategoryAliases[staleParent?.slug] || staleParent?.slug;
        replacement = [...desiredCategoriesBySlug.values()].find((category) =>
          category.parentSlug === replacementParentSlug && category.name === staleDetails.name
        );
        if (!replacement) {
          replacement = [...desiredCategoriesBySlug.values()].find((category) =>
            category.slug === replacementParentSlug && category.parentSlug === null
          );
          isUnmatchedSubcategory = Boolean(replacement);
        }
      }

      if (replacement) {
        const replacementCategory = await Category.findOne({ slug: replacement.slug }).select('_id');
        await Product.updateMany(
          { category: staleCategory._id },
          { $set: { category: replacementCategory._id } }
        );
        await Product.updateMany(
          { subCategory: staleCategory._id },
          { $set: { subCategory: isUnmatchedSubcategory ? null : replacementCategory._id } }
        );
      } else if (await Product.exists({
        $or: [{ category: staleCategory._id }, { subCategory: staleCategory._id }],
      })) {
        if (!hasStoredParent && staleDetails.parentCategory) {
          await Product.updateMany(
            { subCategory: staleCategory._id },
            { $set: { subCategory: null } }
          );
          await Product.updateMany(
            { category: staleCategory._id },
            { $set: { category: (await Category.findOne({ slug: 'computer-accessories' }).select('_id'))._id } }
          );
        } else {
          retainedReferencedCount++;
          console.warn(`⚠️  Retained stale category ${staleDetails.slug}: no canonical replacement`);
          continue;
        }
      }

      await Category.deleteOne({ _id: staleCategory._id });
      removedStaleCount++;
    }

    console.log('\n================================');
    console.log('✅ CATEGORY IMPORT COMPLETED');
    console.log('================================');
    console.log(`📁 Main Categories: ${mainCategoryCount}`);
    console.log(`📚 Subcategories: ${subCategoryCount}`);
    console.log(`📊 Total Categories: ${mainCategoryCount + subCategoryCount}`);
    console.log(`🧹 Stale categories removed: ${removedStaleCount}`);
    console.log(`⚠️  Referenced stale categories retained: ${retainedReferencedCount}`);
    console.log('================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Category import failed:', error);
    process.exit(1);
  }
};

seedCategories();