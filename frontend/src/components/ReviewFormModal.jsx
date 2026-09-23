import React, { useState } from "react";
import { Star, X, Upload, AlertCircle } from "lucide-react";

const ReviewFormModal = ({ 
  product, 
  order, 
  onClose, 
  onSubmit, 
  loading = false 
}) => {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 3) {
      setError("Maximum 3 images allowed");
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError("Review title is required");
      return;
    }

    if (!comment.trim()) {
      setError("Review comment is required");
      return;
    }

    if (title.length < 10) {
      setError("Title must be at least 10 characters");
      return;
    }

    if (comment.length < 20) {
      setError("Comment must be at least 20 characters");
      return;
    }

    setError("");
    onSubmit({
      rating,
      title,
      comment,
      images,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#071426] to-[#0B315A] px-6 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Share Your Review</h2>
            <p className="text-gray-200 mt-1 text-sm">{product?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-bold text-[#071426] mb-3">
              Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={`${
                      star <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-[#071426] mb-2">
              Review Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience in one title"
              maxLength={100}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4B400]"
            />
            <p className="text-xs text-gray-400 mt-1">
              {title.length}/100 characters
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-bold text-[#071426] mb-2">
              Your Review <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your detailed experience with this product..."
              maxLength={2000}
              rows={5}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4B400] resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              {comment.length}/2000 characters
            </p>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-bold text-[#071426] mb-3">
              Add Photos (Optional)
            </label>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Review ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-[#F4B400] hover:bg-[#FFF7DB] transition">
                  <Upload size={24} className="text-gray-400 mb-2" />
                  <span className="text-xs text-gray-500 text-center">
                    Click to upload
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-400">
              Up to 3 images, JPG or PNG format
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-[#071426] font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-[#F4B400] text-[#071426] font-semibold rounded-lg hover:bg-yellow-500 disabled:opacity-50 transition"
            >
              {loading ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewFormModal;
