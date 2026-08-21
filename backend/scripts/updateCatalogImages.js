import dotenv from "dotenv";
import mongoose from "mongoose";
import dbConfig from "../config/db.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { categoriesData } from "../seed/categoriesData.js";
import { productData } from "../seed/productData.js";

dotenv.config();

const updateCatalogImages = async () => {
  try {
    await mongoose.connect(dbConfig.mongoUri);

    const categoryImages = new Map();
    let categoriesUpdated = 0;

    for (const categoryData of categoriesData) {
      const categoryImage = categoryData.src || categoryData.image || "";
      const category = await Category.findOneAndUpdate(
        { slug: categoryData.slug },
        { $set: { image: categoryImage } },
        { new: true }
      );

      if (category) {
        categoryImages.set(categoryData.slug, categoryImage);
        categoriesUpdated += 1;
      }

      for (const subcategoryData of categoryData.subcategories || []) {
        const subcategoryImage = subcategoryData.src || subcategoryData.image || categoryImage;
        const subcategory = await Category.findOneAndUpdate(
          { slug: subcategoryData.slug },
          { $set: { image: subcategoryImage } },
          { new: true }
        );

        if (subcategory) categoriesUpdated += 1;
      }
    }

    let productsUpdated = 0;
    for (const productDataItem of productData) {
      const image = productDataItem.src || productDataItem.image || productDataItem.thumbnail || "";
      if (!image) continue;

      const result = await Product.updateOne(
        { sku: productDataItem.sku },
        { $set: { thumbnail: image, images: [image] } }
      );

      productsUpdated += result.matchedCount;
    }

    console.log(`Updated ${categoriesUpdated} categories and ${productsUpdated} products.`);
  } catch (error) {
    console.error("Catalog image update failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

updateCatalogImages();
