import React from "react";
import { Star, ThumbsUp } from "lucide-react";

const ReviewCard = ({ review }) => {
  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={`${
              star <= rating
                ? "fill-amber-400 text-amber-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="font-semibold text-slate-800 text-sm">
            {review.userName}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {formatDate(review.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
          <span className="text-xs font-bold text-green-700">✓ Verified</span>
        </div>
      </div>

      {/* Rating */}
      <div className="mb-3">{renderStars(review.rating)}</div>

      {/* Title */}
      <h4 className="font-bold text-slate-800 text-sm mb-1">
        {review.title}
      </h4>

      {/* Comment */}
      <p className="text-sm text-slate-600 leading-5 mb-3 line-clamp-3">
        {review.comment}
      </p>

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mb-3">
          {review.images.slice(0, 3).map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Review ${index + 1}`}
              className="w-12 h-12 object-cover rounded-lg cursor-pointer hover:scale-105 transition"
            />
          ))}
        </div>
      )}

      {/* Helpful */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition">
          <ThumbsUp size={12} />
          {review.helpful || 0}
        </button>
      </div>
    </div>
  );
};

export default ReviewCard;
