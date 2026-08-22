import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

/**
 * Category page - Redirects to Products page with category filter
 * This ensures all products use the same filtering, sorting, and pagination logic
 */
export default function Category() {
  const { categorySlug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (categorySlug) {
      navigate(`/products?category=${encodeURIComponent(categorySlug)}`);
    } else {
      navigate("/products");
    }
  }, [categorySlug, navigate]);

  return null;
}
