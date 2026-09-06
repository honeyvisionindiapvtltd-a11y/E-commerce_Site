import express from "express";
import NewsletterSubscription from "../models/NewsletterSubscription.js";

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/subscribe", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!emailPattern.test(email)) {
    return res.status(400).json({ success: false, message: "Please provide a valid email address." });
  }

  try {
    await NewsletterSubscription.create({ email });
    return res.status(201).json({ success: true, message: "You are subscribed to HoneyVision updates." });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: "This email is already subscribed." });
    }
    console.error("Newsletter subscription failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to subscribe right now. Please try again later." });
  }
});

export default router;
