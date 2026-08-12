import Product from '../models/Product.js';
import Category from '../models/Category.js';

// ==========================================
// GET ALL PRODUCTS
// ==========================================

const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      subCategory,
      brand,
      productType,
      minPrice,
      maxPrice,
      featured,
      bestSeller,
      newArrival,
      inStock,
      sort,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {
      isActive: true,
    };

    // Search
    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          brand: {
            $regex: search,
            $options: "i",
          },
        },
        {
          sku: {
            $regex: search,
            $options: "i",
          },
        },
        {
          tags: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // Category
    if (category) {
      let categoryData;

      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        categoryData = await Category.findById(category);
      } else {
        categoryData = await Category.findOne({
          slug: category,
        });
      }

      if (categoryData) {
        if (categoryData.parentCategory === null) {
          const subcategories = await Category.find({
            parentCategory: categoryData._id,
            isActive: true,
          }).select("_id");

          const subCategoryIds = subcategories.map(
            (item) => item._id
          );

          filter.$or = [
            {
              category: categoryData._id,
            },
            {
              subCategory: {
                $in: subCategoryIds,
              },
            },
          ];
        } else {
          filter.subCategory = categoryData._id;
        }
      }
    }

    // Subcategory
    if (subCategory) {
      let subCategoryData;

      if (subCategory.match(/^[0-9a-fA-F]{24}$/)) {
        subCategoryData = await Category.findById(subCategory);
      } else {
        subCategoryData = await Category.findOne({
          slug: subCategory,
        });
      }

      if (subCategoryData) {
        filter.subCategory = subCategoryData._id;
      }
    }

    // Brand
    if (brand) {
      filter.brand = {
        $regex: brand,
        $options: "i",
      };
    }

    // Product Type
    if (productType) {
      filter.productType = productType;
    }

    // Price
    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    // Featured
    if (featured === "true") {
      filter.featured = true;
    }

    // Best Seller
    if (bestSeller === "true") {
      filter.bestSeller = true;
    }

    // New Arrival
    if (newArrival === "true") {
      filter.newArrival = true;
    }

    // In Stock
    if (inStock === "true") {
      filter.stock = {
        $gt: 0,
      };
    }

    // Sorting
    let sortOption = {
      createdAt: -1,
    };

    if (sort === "price_low") {
      sortOption = {
        price: 1,
      };
    }

    if (sort === "price_high") {
      sortOption = {
        price: -1,
      };
    }

    if (sort === "rating") {
      sortOption = {
        rating: -1,
      };
    }

    if (sort === "newest") {
      sortOption = {
        createdAt: -1,
      };
    }

    if (sort === "oldest") {
      sortOption = {
        createdAt: 1,
      };
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const skip = (pageNumber - 1) * limitNumber;

    const totalProducts = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber);

    res.status(200).json({
      success: true,
      count: products.length,
      totalProducts,
      currentPage: pageNumber,
      totalPages: Math.ceil(
        totalProducts / limitNumber
      ),
      products,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// ==========================================
// GET SINGLE PRODUCT
// ==========================================

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate(
        "relatedProducts",
        "name slug price thumbnail rating"
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

// ==========================================
// GET PRODUCT BY SLUG
// ==========================================

const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      isActive: true,
    })
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate(
        "relatedProducts",
        "name slug price thumbnail rating"
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

// ==========================================
// CREATE PRODUCT
// ==========================================

const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      sku,
      brand,
      productType,
      category,
      subCategory,
      shortDescription,
      description,
      price,
      mrp,
      discountPercentage,
      gstPercentage,
      stock,
      lowStockThreshold,
      images,
      thumbnail,
      videoUrl,
      specifications,
      variants,
      warranty,
      installationAvailable,
      installationPrice,
      installationDescription,
      featured,
      bestSeller,
      newArrival,
      recommended,
      tags,
      metaTitle,
      metaDescription,
    } = req.body;

    // Check SKU
    const existingSKU = await Product.findOne({
      sku,
    });

    if (existingSKU) {
      return res.status(400).json({
        success: false,
        message: "SKU already exists",
      });
    }

    // Check slug
    const existingSlug = await Product.findOne({
      slug,
    });

    if (existingSlug) {
      return res.status(400).json({
        success: false,
        message: "Product slug already exists",
      });
    }

    // Check category
    const categoryExists = await Category.findById(
      category
    );

    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    // Check subcategory
    if (subCategory) {
      const subCategoryExists =
        await Category.findOne({
          _id: subCategory,
          parentCategory: categoryExists._id,
        });

      if (!subCategoryExists) {
        return res.status(400).json({
          success: false,
          message:
            "Subcategory does not belong to selected category",
        });
      }
    }

    const product = await Product.create({
      name,
      slug,
      sku,
      brand,
      productType,
      category,
      subCategory,
      shortDescription,
      description,
      price,
      mrp,
      discountPercentage,
      gstPercentage,
      stock,
      lowStockThreshold,
      images,
      thumbnail,
      videoUrl,
      specifications,
      variants,
      warranty,
      installationAvailable,
      installationPrice,
      installationDescription,
      featured,
      bestSeller,
      newArrival,
      recommended,
      tags,
      metaTitle,
      metaDescription,
    });

    const populatedProduct =
      await Product.findById(product._id)
        .populate("category", "name slug")
        .populate("subCategory", "name slug");

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: populatedProduct,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE PRODUCT
// ==========================================

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Validate category/subcategory if changing
    if (req.body.category || req.body.subCategory) {
      const categoryId =
        req.body.category || product.category;

      const categoryExists =
        await Category.findById(categoryId);

      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: "Invalid category",
        });
      }

      if (req.body.subCategory) {
        const subCategoryExists =
          await Category.findOne({
            _id: req.body.subCategory,
            parentCategory: categoryId,
          });

        if (!subCategoryExists) {
          return res.status(400).json({
            success: false,
            message:
              "Subcategory does not belong to selected category",
          });
        }
      }
    }

    Object.assign(product, req.body);

    await product.save();

    const updatedProduct =
      await Product.findById(product._id)
        .populate("category", "name slug")
        .populate("subCategory", "name slug");

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE PRODUCT
// ==========================================

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

// ==========================================
// FEATURED PRODUCTS
// ==========================================

const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({
      featured: true,
      isActive: true,
    })
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .sort({ createdAt: -1 })
      .limit(12);

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch featured products",
      error: error.message,
    });
  }
};

// ==========================================
// BEST SELLERS
// ==========================================

const getBestSellers = async (req, res) => {
  try {
    const products = await Product.find({
      bestSeller: true,
      isActive: true,
    })
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .sort({ rating: -1 })
      .limit(12);

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch best sellers",
      error: error.message,
    });
  }
};

// ==========================================
// NEW ARRIVALS
// ==========================================

const getNewArrivals = async (req, res) => {
  try {
    const products = await Product.find({
      newArrival: true,
      isActive: true,
    })
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .sort({ createdAt: -1 })
      .limit(12);

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch new arrivals",
      error: error.message,
    });
  }
};

export {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getBestSellers,
  getNewArrivals,
};