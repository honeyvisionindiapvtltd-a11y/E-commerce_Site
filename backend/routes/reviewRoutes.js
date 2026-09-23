import express from "express";
import {
  createReview,
  getProductReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  markHelpful,
} from "../controllers/reviewController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get reviews for a product
router.get("/product/:productId", getProductReviews);

// Create a new review (requires auth)
router.post("/", verifyToken, createReview);

// Get user's reviews (requires auth)
router.get("/my-reviews", verifyToken, getUserReviews);

// Update a review (requires auth)
router.put("/:reviewId", verifyToken, updateReview);

// Delete a review (requires auth)
router.delete("/:reviewId", verifyToken, deleteReview);

// Mark review as helpful
router.post("/:reviewId/helpful", markHelpful);

export default router;
