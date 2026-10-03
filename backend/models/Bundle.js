import mongoose from "mongoose";

const bundleItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
  },
  { _id: false }
);

const bundleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 1000 },
    mainProduct: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    products: {
      type: [bundleItemSchema],
      required: true,
      validate: [(items) => items.length > 0, "A bundle needs at least one product."],
    },
    discountType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    discountValue: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true, index: true },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    displayPriority: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: "bundles" }
);

bundleSchema.index({ mainProduct: 1, active: 1, displayPriority: -1 });
bundleSchema.index({ "products.productId": 1, active: 1 });

export default mongoose.models.Bundle || mongoose.model("Bundle", bundleSchema);