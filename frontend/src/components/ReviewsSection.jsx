import React, { useState, useEffect } from "react";
import { Star, MessageSquare, AlertCircle } from "lucide-react";
import ReviewFormModal from "../components/ReviewFormModal";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const ReviewsSection = ({ orders, products, user }) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [userReviews, setUserReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch user's reviews
  useEffect(() => {
    fetchUserReviews();
  }, []);

  const fetchUserReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/reviews/my-reviews`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserReviews(data.reviews || []);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get delivered orders with products that haven't been reviewed
  const deliveredOrders = orders
    .filter((order) => String(order.status).toLowerCase().includes("delivered"))
    .map((order) => {
      const orderProducts = order.items || [];
      const reviewedProductIds = userReviews.map((r) => String(r.productId));
      const unreviewedItems = orderProducts.filter(
        (item) => !reviewedProductIds.includes(String(item.productId || item.product?.id))
      );

      return {
        ...order,
        unreviewedItems,
      };
    })
    .filter((order) => order.unreviewedItems.length > 0);

  const handleOpenReviewModal = (order, product) => {
    setSelectedOrder(order);
    setSelectedProduct(product);
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (reviewData) => {
    try {
      setReviewLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      const payload = {
        productId: selectedProduct.productId || selectedProduct.id,
        orderId: selectedOrder._id,
        userName: user?.name || "Anonymous",
        userEmail: user?.email || "",
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
        images: reviewData.images,
      };

      const response = await fetch(`${API_BASE}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit review");
      }

      setSuccessMessage("Review submitted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);

      setShowReviewModal(false);
      fetchUserReviews();
    } catch (error) {
      setError(error.message || "Error submitting review");
      console.error("Error submitting review:", error);
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mt-8 overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#F4B400] uppercase tracking-wide">
              Your Reviews
            </p>
            <h2 className="text-3xl font-bold text-[#071426] mt-2">Reviews & Ratings</h2>
            <p className="text-gray-500 mt-2">
              Share your experience with products you've purchased
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Reviews Written</p>
            <p className="text-3xl font-bold text-[#071426]">{userReviews.length}</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            ✓ {successMessage}
          </div>
        )}

        {/* Products Awaiting Review */}
        {deliveredOrders.length > 0 ? (
          <>
            <div className="mb-8">
              <h3 className="text-lg font-bold text-[#071426] mb-4">
                Write Reviews for Your Purchases
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {deliveredOrders.map((order) =>
                  order.unreviewedItems.map((item, index) => {
                    const product = products.find(
                      (p) => String(p.id) === String(item.productId || item.product?.id)
                    ) || item;

                    return (
                      <div
                        key={`${order._id}-${index}`}
                        className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition"
                      >
                        {/* Image */}
                        <div className="w-full h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
                          <img
                            src={product.image || product.images?.[0]}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <h4 className="font-semibold text-[#071426] line-clamp-2 text-sm">
                            {product.name}
                          </h4>

                          <p className="text-xs text-gray-400 mt-2">
                            Order #{order.orderNumber || order._id?.slice(-6)}
                          </p>

                          <button
                            onClick={() => handleOpenReviewModal(order, product)}
                            className="w-full mt-4 px-4 py-2 bg-[#F4B400] hover:bg-yellow-500 text-[#071426] font-semibold rounded-lg transition flex items-center justify-center gap-2"
                          >
                            <MessageSquare size={16} />
                            Write Review
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">
              No products to review yet
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Once your delivered orders arrive, you can share your reviews here
            </p>
          </div>
        )}

        {/* Your Reviews */}
        {userReviews.length > 0 && (
          <>
            <div className="border-t border-gray-200 my-8 pt-8">
              <h3 className="text-lg font-bold text-[#071426] mb-4">
                Your Reviews ({userReviews.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {userReviews.map((review) => (
                  <div
                    key={review._id}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
                  >
                    {/* Rating */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={`${
                              star <= review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </div>

                    {/* Product */}
                    <p className="text-xs text-gray-500 mb-2">
                      {review.productName}
                    </p>

                    {/* Title */}
                    <h4 className="font-semibold text-[#071426] text-sm mb-1">
                      {review.title}
                    </h4>

                    {/* Comment */}
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {review.comment}
                    </p>

                    {/* Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {review.images.slice(0, 3).map((image, idx) => (
                          <img
                            key={idx}
                            src={image}
                            alt={`Review ${idx + 1}`}
                            className="w-8 h-8 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedProduct && selectedOrder && (
        <ReviewFormModal
          product={selectedProduct}
          order={selectedOrder}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleSubmitReview}
          loading={reviewLoading}
        />
      )}
    </div>
  );
};

export default ReviewsSection;
