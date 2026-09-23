import mongoose from 'mongoose';
import dbConfig from '../config/db.js';
import { indexProductImageCatalog, getProductImageIndexSummary } from '../services/productImageSearchService.js';

const args = new Set(process.argv.slice(2));

const run = async () => {
  await mongoose.connect(dbConfig.mongoUri, { serverSelectionTimeoutMS: 15000 });
  console.log('Connected to MongoDB for image indexing');
  console.log('Indexing HoneyVision catalog product images...');

  const summary = await indexProductImageCatalog({
    reindexAll: args.has('--all'),
    reindexFailed: args.has('--failed'),
    reindexOutdated: args.has('--outdated'),
  });

  console.log(JSON.stringify(summary, null, 2));
  console.log('Image index summary:', await getProductImageIndexSummary());
};

run().catch((error) => {
  console.error('Image indexing failed:', error);
  process.exit(1);
});
