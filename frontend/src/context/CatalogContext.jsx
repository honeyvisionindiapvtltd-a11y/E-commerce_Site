import { createContext, useContext, useState, useEffect } from "react";
import { products as fallbackProducts, getProductGallery } from "../lib/products";

const CatalogContext = createContext(null);
const API_BASE = import.meta.env.VITE_API_URL || "/api";

const normalizeProduct = (product) => {
  const category =
    product.category && typeof product.category === "object" ? product.category.name : product.category || "General";
  const subCategory =
    product.subCategory && typeof product.subCategory === "object"
      ? product.subCategory.name
      : product.subCategory || "";

  const gallery = getProductGallery(product);
  const fallbackImage = "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786010029/laptop_ktvxcs.png";
  const primaryImage = gallery[0] || product.thumbnail || product.image || fallbackImage;

  return {
    ...product,
    id: product._id || product.id || product.slug || `${category}-${product.name}`,
    name: product.name || "Product",
    category,
    subCategory,
    brand: product.brand || "HoneyVision",
    price: Number(product.price ?? product.salePrice ?? 0),
    mrp: Number(product.mrp ?? product.originalPrice ?? product.price ?? 0),
    rating: Number(product.rating ?? product.averageRating ?? 4.5),
    reviews: Number(product.reviewCount ?? product.reviews ?? 0),
    stock: Number(product.stock ?? 0),
    delivery: product.delivery || "Delivery available",
    thumbnail: primaryImage,
    image: primaryImage,
    images: gallery.length ? gallery : [primaryImage],
    description: product.shortDescription || product.description || "",
    features: Array.isArray(product.features) ? product.features : [],
    installationEligible: Boolean(product.installationEligible),
  };
};

export function CatalogProvider({ children }) {
  const [products, setProducts] = useState(fallbackProducts);

  useEffect(() => {
    let ignore = false;

    const loadProducts = async () => {
      try {
        const response = await fetch(`${API_BASE}/products?page=1&limit=24`);
        if (!response.ok) throw new Error("Failed to fetch products");

        const data = await response.json();
        const apiProducts = Array.isArray(data?.products)
          ? data.products
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.data)
              ? data.data
              : [];

        if (!ignore) {
          setProducts((apiProducts.length ? apiProducts : fallbackProducts).map(normalizeProduct));
        }
      } catch {
        if (!ignore) {
          setProducts(fallbackProducts.map(normalizeProduct));
        }
      }
    };

    loadProducts();
    return () => {
      ignore = true;
    };
  }, []);

  const value = {
    products,
  };

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("useCatalog must be used within CatalogProvider");
  return context;
}
