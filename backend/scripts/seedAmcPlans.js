import dotenv from 'dotenv';
import mongoose from 'mongoose';
import AMCPlan from '../models/AMCPlan.js';
import dbConfig from '../config/db.js';

dotenv.config();

const plans = [
  {
    name: 'AMC Basic',
    slug: 'amc-basic',
    description: 'Essential maintenance and technical support for reliable daily operation.',
    durationMonths: 12,
    price: 2999,
    currency: 'INR',
    serviceVisits: 2,
    responseTime: '48 business hours',
    supportHours: 'Business hours support',
    coveredServices: ['Preventive inspection', 'Remote technical guidance', 'Routine system health checks'],
    exclusions: ['Major hardware replacement', 'Third-party equipment issues'],
    eligibleCategories: ['cctv-and-surveillance', 'security-systems', 'networking'],
    eligibleProductTypes: ['physical'],
    features: ['2 scheduled service visits', 'Basic troubleshooting support', 'Service summary report'],
    termsAndConditions: 'Coverage applies to the eligible HoneyVision product selected at purchase and is valid for one year.',
    displayOrder: 1,
    isFeatured: false,
    isActive: true,
  },
  {
    name: 'AMC Standard',
    slug: 'amc-standard',
    description: 'Balanced annual coverage for homes and growing businesses that need dependable support.',
    durationMonths: 12,
    price: 5999,
    currency: 'INR',
    serviceVisits: 4,
    responseTime: '24 business hours',
    supportHours: 'Priority business hours support',
    coveredServices: ['Preventive maintenance', 'Remote troubleshooting', 'Priority technical assistance'],
    exclusions: ['Accidental damage', 'Consumables and non-HoneyVision accessories'],
    eligibleCategories: ['cctv-and-surveillance', 'security-systems', 'networking', 'audio-visual'],
    eligibleProductTypes: ['physical'],
    features: ['4 service visits', 'Priority ticket handling', 'Extended technical assistance'],
    termsAndConditions: 'Coverage applies to eligible products selected at purchase and must be used within the contract term.',
    displayOrder: 2,
    isFeatured: true,
    isActive: true,
  },
  {
    name: 'AMC Premium',
    slug: 'amc-premium',
    description: 'Comprehensive maintenance and faster support for critical surveillance and technology setups.',
    durationMonths: 12,
    price: 10999,
    currency: 'INR',
    serviceVisits: 8,
    responseTime: 'Same business day',
    supportHours: 'Priority technical support',
    coveredServices: ['Full preventive maintenance', 'Priority response', 'Detailed system inspection'],
    exclusions: ['Structural changes', 'Unsupported third-party equipment'],
    eligibleCategories: ['cctv-and-surveillance', 'security-systems', 'networking', 'audio-visual', 'it-equipment'],
    eligibleProductTypes: ['physical'],
    features: ['8 service visits', 'Fastest support response', 'Dedicated technical escalation'],
    termsAndConditions: 'Coverage is valid for the selected eligible HoneyVision products for 12 months from activation.',
    displayOrder: 3,
    isFeatured: false,
    isActive: true,
  },
];

const printSummary = (message, items) => {
  console.log(message);
  console.table(items.map((item) => ({ name: item.name, slug: item.slug, active: item.isActive, featured: item.isFeatured, price: item.price, visits: item.serviceVisits })));
};

const run = async () => {
  if (!dbConfig.mongoUri) {
    throw new Error('No MongoDB URI configured for AMC plan seeding.');
  }

  await mongoose.connect(dbConfig.mongoUri, { serverSelectionTimeoutMS: 5000 });

  const before = await AMCPlan.find({}).sort({ displayOrder: 1 }).lean();
  printSummary('AMC plans before seed:', before);

  for (const plan of plans) {
    await AMCPlan.updateOne(
      { slug: plan.slug },
      { $set: { ...plan, updatedAt: new Date() } },
      { upsert: true }
    );
  }

  const after = await AMCPlan.find({}).sort({ displayOrder: 1 }).lean();
  printSummary('AMC plans after seed:', after);

  await mongoose.disconnect();
};

try {
  await run();
  console.log('AMC plan seeding completed successfully without duplicating existing plans.');
} catch (error) {
  console.error('AMC plan seeding failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}
