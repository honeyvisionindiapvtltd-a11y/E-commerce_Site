import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, title, comment, images } = req.body;
    const userId = req.userId || req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!productId || !orderId || !rating || !title || !comment) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Verify the order belongs to the user and is delivered
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const orderUserId = order.userId || order.user?._id || order.user?.id;
    if (String(orderUserId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only review products from your orders",
      });
    }

    if (!String(order.status).toLowerCase().includes("delivered")) {
      return res.status(400).json({
        success: false,
        message: "You can only review delivered products",
      });
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      productId,
      userId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    // Create new review
    const review = new Review({
      productId,
      orderId,
      userId,
      userName: req.body.userName || order.user?.name || "Anonymous",
      userEmail: req.body.userEmail || order.user?.email || "",
      rating: Math.min(5, Math.max(1, parseInt(rating))),
      title,
      comment,
      images: Array.isArray(images) ? images.filter(Boolean) : [],
      productName: product.name,
      verified: true,
      status: "approved",
    });

    await review.save();

    // Update product rating
    await updateProductRating(productId);

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating review",
    });
  }
};

// Get reviews for a product
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const reviews = await Review.find({
      productId,
      status: "approved",
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-userEmail");

    const total = await Review.countDocuments({
      productId,
      status: "approved",
    });

    res.status(200).json({
      success: true,
      reviews,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching reviews",
    });
  }
};

// Get user's reviews
export const getUserReviews = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const reviews = await Review.find({ userId })
      .sort({ createdAt: -1 })
      .populate("productId", "name price image");

    res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching user reviews",
    });
  }
};

// Update a review
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment, images } = req.body;
    const userId = req.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (String(review.userId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own reviews",
      });
    }

    if (rating) review.rating = Math.min(5, Math.max(1, parseInt(rating)));
    if (title) review.title = title;
    if (comment) review.comment = comment;
    if (images) review.images = Array.isArray(images) ? images.filter(Boolean) : [];

    await review.save();

    // Update product rating
    await updateProductRating(review.productId);

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error updating review",
    });
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (String(review.userId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own reviews",
      });
    }

    const productId = review.productId;
    await Review.findByIdAndDelete(reviewId);

    // Update product rating
    await updateProductRating(productId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting review",
    });
  }
};

// Update product rating based on reviews
async function updateProductRating(productId) {
  try {
    const reviews = await Review.find({
      productId,
      status: "approved",
    });

    if (reviews.length === 0) {
      return;
    }

    const averageRating =
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    await Product.findByIdAndUpdate(productId, {
      rating: averageRating.toFixed(1),
      reviews: reviews.length,
      reviewCount: reviews.length,
    });
  } catch (error) {
    console.error("Error updating product rating:", error);
  }
}

// Mark review as helpful
export const markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpful: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Review marked as helpful",
      review,
    });
  } catch (error) {
    console.error("Error marking review:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error marking review",
    });
  }
}

export default {
  createReview,
  getProductReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  markHelpful,
};
