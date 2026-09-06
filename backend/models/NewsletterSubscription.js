import mongoose from "mongoose";

const newsletterSubscriptionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  },
  { timestamps: true },
);

export default mongoose.model("NewsletterSubscription", newsletterSubscriptionSchema);
