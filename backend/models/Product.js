import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    sku: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    mrp: {
      type: Number,
      default: 0,
      min: 0,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    image: {
      type: String,
      default: "",
    },

    specifications: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: true,
  }
);

const productSchema = new mongoose.Schema(
  {
    // ==========================================
    // BASIC INFORMATION
    // ==========================================

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    brand: {
      type: String,
      default: "HoneyVision",
      trim: true,
    },

    productType: {
      type: String,
      enum: [
        "physical",
        "combo",
        "service",
        "software",
        "subscription",
      ],
      default: "physical",
    },

    // ==========================================
    // CATEGORY
    // ==========================================

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    // ==========================================
    // DESCRIPTION
    // ==========================================

    shortDescription: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    // ==========================================
    // PRICING
    // ==========================================

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    mrp: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
    },

    gstPercentage: {
      type: Number,
      default: 18,
      min: 0,
    },

    // ==========================================
    // INVENTORY
    // ==========================================

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    lowStockThreshold: {
      type: Number,
      default: 5,
    },

    stockStatus: {
      type: String,
      enum: [
        "in_stock",
        "low_stock",
        "out_of_stock",
        "pre_order",
      ],
      default: "in_stock",
    },

    // ==========================================
    // IMAGES
    // ==========================================

    images: [
      {
        type: String,
      },
    ],

    thumbnail: {
      type: String,
      default: "",
    },

    videoUrl: {
      type: String,
      default: "",
    },

    // ==========================================
    // SPECIFICATIONS
    // ==========================================

    specifications: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ==========================================
    // VARIANTS
    // ==========================================

    variants: [variantSchema],

    // ==========================================
    // WARRANTY
    // ==========================================

    warranty: {
      type: String,
      default: "",
    },

    // ==========================================
    // SERVICES
    // ==========================================

    installationAvailable: {
      type: Boolean,
      default: false,
    },

    installationPrice: {
      type: Number,
      default: 0,
    },

    installationDescription: {
      type: String,
      default: "",
    },

    // ==========================================
    // PRODUCT FLAGS
    // ==========================================

    featured: {
      type: Boolean,
      default: false,
    },

    bestSeller: {
      type: Boolean,
      default: false,
    },

    newArrival: {
      type: Boolean,
      default: false,
    },

    recommended: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // ==========================================
    // TAGS
    // ==========================================

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    // ==========================================
    // RATINGS
    // ==========================================

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviewCount: {
      type: Number,
      default: 0,
    },

    // ==========================================
    // RELATED PRODUCTS
    // ==========================================

    relatedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    // ==========================================
    // SEO
    // ==========================================

    metaTitle: {
      type: String,
      default: "",
    },

    metaDescription: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Automatically calculate stock status
productSchema.pre("save", function () {
  if (this.stock === 0) {
    this.stockStatus = "out_of_stock";
  } else if (this.stock <= this.lowStockThreshold) {
    this.stockStatus = "low_stock";
  } else {
    this.stockStatus = "in_stock";
  }
});

export default mongoose.model('Product', productSchema);