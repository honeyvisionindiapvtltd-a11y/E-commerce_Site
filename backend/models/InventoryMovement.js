import mongoose from "mongoose";

const inventoryMovementSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, index: true },
    inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory", required: true, index: true },
    sku: { type: String, default: "", trim: true },
    movementType: {
      type: String,
      enum: [
        "INITIAL_STOCK",
        "ORDER_RESERVED",
        "ORDER_RELEASED",
        "ORDER_COMMITTED",
        "ORDER_CANCELLED",
        "RETURN_RECEIVED",
        "RETURN_RESTOCKED",
        "DAMAGED",
        "MANUAL_ADJUSTMENT",
      ],
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    previousAvailable: { type: Number, required: true, min: 0 },
    newAvailable: { type: Number, required: true, min: 0 },
    previousReserved: { type: Number, required: true, min: 0 },
    newReserved: { type: Number, required: true, min: 0 },
    previousSold: { type: Number, required: true, min: 0 },
    newSold: { type: Number, required: true, min: 0 },
    referenceType: { type: String, required: true },
    referenceId: { type: String, required: true },
    reason: { type: String, default: "" },
    performedBy: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

inventoryMovementSchema.index(
  { productId: 1, movementType: 1, referenceType: 1, referenceId: 1 },
  { unique: true },
);

export default mongoose.model("InventoryMovement", inventoryMovementSchema);