import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dbConfig from '../config/db.js';
import Category from '../models/Category.js';
import categories from './categoryData.js';

dotenv.config();

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

    await Category.deleteMany({});
    console.log('Old categories removed');

    let mainCategoryCount = 0;
    let subCategoryCount = 0;

    for (let i = 0; i < categories.length; i++) {
      const categoryData = categories[i];

      const mainCategory = await Category.create({
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
        icon: categoryData.icon,
        parentCategory: null,
        sortOrder: i + 1,
        isActive: true,
      });

      mainCategoryCount++;
      console.log(`Created: ${mainCategory.name}`);

      if (categoryData.subcategories && categoryData.subcategories.length > 0) {
        for (let j = 0; j < categoryData.subcategories.length; j++) {
          const subName = categoryData.subcategories[j];
          const subSlug = subName
            .toLowerCase()
            .replace(/&/g, 'and')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

          await Category.create({
            name: subName,
            slug: `${categoryData.slug}-${subSlug}`,
            description: `${subName} under ${categoryData.name}`,
            parentCategory: mainCategory._id,
            sortOrder: j + 1,
            isActive: true,
          });

          subCategoryCount++;
        }
      }
    }

    console.log('\n=================================');
    console.log('CATEGORY SEED COMPLETED');
    console.log('=================================');
    console.log(`Main Categories: ${mainCategoryCount}`);
    console.log(`Subcategories: ${subCategoryCount}`);
    console.log('=================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seedCategories();