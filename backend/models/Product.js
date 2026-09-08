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

    series: { type: String, default: "", trim: true },
    productFamily: { type: String, default: "", trim: true },
    model: { type: String, default: "", trim: true },
    modelVersion: { type: String, default: "", trim: true },
    hardwareVersion: { type: String, default: "", trim: true },
    firmwareVersion: { type: String, default: "", trim: true },
    cameraType: { type: String, default: "", trim: true },
    technology: { type: String, default: "", trim: true },
    connectivity: { type: String, default: "", trim: true },
    resolution: { type: String, default: "", trim: true },
    megapixels: { type: Number, min: 0, default: null },
    lens: { type: String, default: "", trim: true },
    lensType: { type: String, default: "", trim: true },
    imageSensor: { type: String, default: "", trim: true },
    fieldOfView: { type: String, default: "", trim: true },
    frameRate: { type: String, default: "", trim: true },
    nightVision: { type: Boolean, default: false },
    nightVisionType: { type: String, default: "", trim: true },
    nightVisionRange: { type: String, default: "", trim: true },
    infrared: { type: Boolean, default: false },
    whiteLight: { type: Boolean, default: false },
    starlight: { type: Boolean, default: false },
    aiEnabled: { type: Boolean, default: false },
    aiFeatures: [{ type: String, trim: true }],
    microphone: { type: Boolean, default: false },
    speaker: { type: Boolean, default: false },
    twoWayAudio: { type: Boolean, default: false },
    storageType: { type: String, default: "", trim: true },
    maxStorage: { type: String, default: "", trim: true },
    cloudStorage: { type: Boolean, default: false },
    indoorOutdoor: { type: String, default: "", trim: true },
    weatherproof: { type: Boolean, default: false },
    ipRating: { type: String, default: "", trim: true },
    ikRating: { type: String, default: "", trim: true },
    powerType: { type: String, default: "", trim: true },
    powerInput: { type: String, default: "", trim: true },
    powerConsumption: { type: String, default: "", trim: true },
    poe: { type: Boolean, default: false },
    poeStandard: { type: String, default: "", trim: true },
    wifi: { type: Boolean, default: false },
    fourG: { type: Boolean, default: false },
    solar: { type: Boolean, default: false },
    battery: { type: Boolean, default: false },
    vandalProof: { type: Boolean, default: false },
    onvif: { type: Boolean, default: false },
    rtsp: { type: Boolean, default: false },
    applications: [{ type: String, trim: true }],

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

productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ isActive: 1, category: 1, createdAt: -1 });
productSchema.index({ isActive: 1, subCategory: 1, createdAt: -1 });
productSchema.index({ isActive: 1, brand: 1, createdAt: -1 });
productSchema.index({ isActive: 1, price: 1, createdAt: -1 });
productSchema.index({ isActive: 1, stock: 1, createdAt: -1 });
productSchema.index({ isActive: 1, featured: 1, createdAt: -1 });
productSchema.index({ isActive: 1, bestSeller: 1, createdAt: -1 });
productSchema.index({ isActive: 1, newArrival: 1, createdAt: -1 });

export default mongoose.model('Product', productSchema);