import mongoose from "mongoose";

const deliveryDaysSchema = new mongoose.Schema(
  {
    min: { type: Number, required: true, min: 0, max: 30, validate: Number.isInteger },
    max: {
      type: Number,
      required: true,
      min: 0,
      max: 30,
      validate: [Number.isInteger, "Maximum delivery days must be an integer"],
    },
  },
  { _id: false },
);

deliveryDaysSchema.path("max").validate(function validateRange(value) {
  return value >= this.min;
}, "Maximum delivery days must be greater than or equal to minimum delivery days");

const deliveryZoneSchema = new mongoose.Schema(
  {
    country: { type: String, required: true, trim: true, default: "India" },
    state: { type: String, required: true, trim: true, default: "Odisha" },
    city: { type: String, required: true, trim: true },
    aliases: { type: [String], default: [] },
    pincode: { type: String, required: true, match: /^\d{6}$/, trim: true },
    areas: { type: [String], default: [] },
    serviceable: { type: Boolean, default: true, index: true },
    deliveryCharge: { type: Number, default: 0, min: 0 },
    estimatedDeliveryDays: { type: deliveryDaysSchema, default: () => ({ min: 1, max: 2 }) },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

deliveryZoneSchema.index({ country: 1, state: 1, city: 1, pincode: 1 }, { unique: true });
deliveryZoneSchema.index({ pincode: 1, active: 1, serviceable: 1 });
deliveryZoneSchema.index({ city: 1, pincode: 1 });

deliveryZoneSchema.pre("save", function normalizeFields() {
  this.country = this.country.trim();
  this.state = this.state.trim();
  this.city = this.city.trim();
  this.pincode = this.pincode.trim();
  this.aliases = this.aliases.map((alias) => alias.trim()).filter(Boolean);
  this.areas = this.areas.map((area) => area.trim()).filter(Boolean);
});

export default mongoose.model("DeliveryZone", deliveryZoneSchema);
