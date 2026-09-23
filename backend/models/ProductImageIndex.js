import mongoose from 'mongoose';

const productImageIndexSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    productId: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      default: '',
      trim: true,
    },
    name: {
      type: String,
      default: '',
      trim: true,
    },
    brand: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      default: '',
      trim: true,
    },
    subCategory: {
      type: String,
      default: '',
      trim: true,
    },
    modelNumber: {
      type: String,
      default: '',
      trim: true,
    },
    productCode: {
      type: String,
      default: '',
      trim: true,
    },
    cloudinaryUrls: [{ type: String, trim: true }],
    thumbnail: {
      type: String,
      default: '',
      trim: true,
    },
    embedding: [{ type: Number, default: 0 }],
    searchableText: {
      type: String,
      default: '',
    },
    imageHash: {
      type: String,
      default: '',
    },
    indexingStatus: {
      type: String,
      enum: ['pending', 'indexed', 'failed', 'outdated'],
      default: 'pending',
      index: true,
    },
    embeddingVersion: {
      type: String,
      default: 'product-image-index-v1',
    },
    indexedAt: {
      type: Date,
      default: null,
    },
    updatedAt: {
      type: Date,
      default: null,
    },
    errorMessage: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

productImageIndexSchema.index({ indexingStatus: 1, updatedAt: -1 });
productImageIndexSchema.index({ brand: 1, category: 1, subCategory: 1 });
productImageIndexSchema.index({ productId: 1 }, { unique: true });

export default mongoose.model('ProductImageIndex', productImageIndexSchema);
