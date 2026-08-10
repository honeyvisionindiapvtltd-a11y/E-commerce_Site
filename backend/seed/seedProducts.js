import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dbConfig from '../config/db.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { productData } from './productData.js';

dotenv.config();

const categorySlugAliases = {
  'cctv-surveillance': 'cctv-surveillance',
  'ip-cameras': 'cctv-surveillance',
  'storage': 'storage-hard-drives',
  'fiber-optics': 'cabling-accessories',
  'video-conferencing': 'video-conferencing',
  'access-control': 'access-control',
  dvr: 'dvr-nvr-recording',
  nvr: 'dvr-nvr-recording',
  networking: 'networking-products',
  routers: 'networking-products',
  'wifi-wireless': 'networking-products',
  computers: 'computers-laptops',
  laptops: 'computers-laptops',
  'monitors-displays': 'computers-laptops',
  'digital-signage': 'led-displays-signage',
  'ups-power': 'ups-power-solutions',
  'smart-home-iot': 'smart-home-automation',
  'video-door-phone': 'video-door-phones',
  'time-attendance': 'access-control',
  'intrusion-alarm': 'alarm-safety-systems',
  'fire-alarm': 'alarm-safety-systems',
  'audio-systems': 'audio-visual',
  projectors: 'office-equipment',
  'cables-accessories': 'cabling-accessories',
  'smart-agriculture': 'smart-agriculture',
  'ai-software': 'cloud-software',
  servers: 'servers-data-center',
  drones: 'drones-accessories',
  'ups-power-solutions': 'ups-power-solutions',
};

const subCategorySlugAliases = {
  'ai-ip-cameras': 'ip-cameras',
  'ip-bullet-cameras': 'bullet-cameras',
  'ip-dome-cameras': 'dome-cameras',
  'four-channel-dvr': 'dvr',
  '4-channel-dvr': 'dvr',
  '8-channel-dvr': 'dvr',
  '16-channel-dvr': 'dvr',
  '8-channel-nvr': 'nvr',
  '16-channel-nvr': 'nvr',
  '32-channel-nvr': 'nvr',
  'surveillance-hard-drives': 'surveillance-hdd',
  'biometric-access-control': 'biometric-access-controllers',
  'face-attendance': 'face-recognition-attendance',
  'face-recognition': 'face-recognition-attendance',
  'smart-video-door-phone': 'smart-video-doorbells',
  'wireless-alarm': 'wireless-alarm-systems',
  'motion-sensors': 'pir-motion-sensors',
  'door-sensors': 'door-magnetic-sensors',
  'wifi-routers': 'routers',
  '4g-routers': 'routers',
  'wifi-access-points': 'wi-fi-access-points',
  'outdoor-access-points': 'outdoor-wi-fi',
  'fiber-cables': 'fiber-optic-cable',
  'network-cables': 'cat6-network-cable',
  'usb-accessories': 'usb-cables',
  'sfp-modules': 'fiber-optic-cable',
  'desktop-computers': 'business-desktops',
  'mini-pc': 'mini-pcs',
  'professional-monitors': 'computer-monitors',
  'digital-signage': 'digital-signage-displays',
  'business-projectors': 'office-projectors',
  '4k-projectors': 'office-projectors',
  amplifiers: 'power-amplifiers',
  microphones: 'wireless-microphones',
  'conference-cameras': 'conference-cameras',
  'conference-bars': 'conference-bars',
  'cctv-power-supplies': 'power-distribution-units',
  'smart-locks': 'smart-door-locks',
  'smart-sensors': 'smart-motion-sensors',
  'video-analytics': 'ai-video-analytics-software',
  'cloud-vms': 'video-management-software',
  'vehicle-detection': 'ai-video-analytics-software',
};

const resolveCategorySlug = (rawSlug) => categorySlugAliases[rawSlug] || rawSlug;
const resolveSubCategorySlug = (rawSlug) => subCategorySlugAliases[rawSlug] || rawSlug;

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
    console.log('Starting product seed...');

    let created = 0;
    let skipped = 0;

    for (const data of productData) {
      const targetCategorySlug = resolveCategorySlug(data.categorySlug);
      const category = await Category.findOne({
        slug: targetCategorySlug,
        parentCategory: null,
      });

      if (!category) {
        console.log(`Category not found: ${data.categorySlug} -> ${targetCategorySlug}`);
        skipped++;
        continue;
      }

      let subCategory = null;

      if (data.subCategorySlug) {
        const targetSubCategorySlug = resolveSubCategorySlug(data.subCategorySlug);

        subCategory = await Category.findOne({
          slug: targetSubCategorySlug,
          parentCategory: category._id,
        });

        if (!subCategory) {
          subCategory = await Category.findOne({
            slug: { $regex: targetSubCategorySlug.replace(/-/g, '.*'), $options: 'i' },
            parentCategory: category._id,
          });
        }

        if (!subCategory) {
          console.log(`Subcategory not found: ${data.subCategorySlug} -> ${targetSubCategorySlug} (continuing without subcategory)`);
        }
      }

      const existingProduct = await Product.findOne({ sku: data.sku });
      if (existingProduct) {
        console.log(`Already exists: ${data.name}`);
        skipped++;
        continue;
      }

      let discountPercentage = 0;
      if (data.mrp && data.price) {
        discountPercentage = Math.round(((data.mrp - data.price) / data.mrp) * 100);
      }

      await Product.create({
        ...data,
        category: category._id,
        subCategory: subCategory ? subCategory._id : null,
        discountPercentage,
        featured: false,
        bestSeller: false,
        newArrival: true,
        recommended: false,
        isActive: true,
        images: data.images || [data.thumbnail || data.image || ''],
        thumbnail: data.thumbnail || data.image || '',
        rating: data.rating || 4.5,
        reviewCount: data.reviewCount || 0,
        shortDescription: data.shortDescription || data.description || '',
        description: data.description || data.shortDescription || '',
      });

      created++;
      console.log(`Created: ${data.name}`);
    }

    console.log('--------------------------------');
    console.log(`Products created: ${created}`);
    console.log(`Products skipped: ${skipped}`);
    console.log('--------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Product seed error:', error);
    process.exit(1);
  }
};

seedProducts();