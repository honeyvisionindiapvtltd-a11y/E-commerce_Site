import Product from "../models/Product.js";
import Category from "../models/Category.js";

// ============================================================
// GET ALL PRODUCTS
// GET /api/products
// ============================================================

const getProducts = async (req, res) => {
  try {
    const {
      search,
      q,
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
      includeInactive,
      sort,
      page = 1,
      limit = 24,
    } = req.query;

    // ========================================================
    // BASE FILTER
    // ========================================================

    const filter = {};

    if (includeInactive !== "true") {
      filter.isActive = true;
    }

    // ========================================================
    // SEARCH
    // Supports both ?search= and ?q=
    // ========================================================

    const searchValue = search || q;

    if (searchValue && searchValue.trim()) {
      const regex = {
        $regex: searchValue.trim(),
        $options: "i",
      };

      filter.$and = [
        {
          $or: [
            { name: regex },
            { brand: regex },
            { sku: regex },
            { tags: regex },
            { shortDescription: regex },
            { description: regex },
          ],
        },
      ];
    }

    // ========================================================
    // CATEGORY
    // Supports category ID and category slug
    // ========================================================

    if (category && category.trim()) {
      let categoryData = null;

      const categoryValue = category.trim();

      // Check ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(categoryValue)) {
        categoryData = await Category.findOne({
          _id: categoryValue,
          isActive: true,
        });
      }

      // Check slug
      if (!categoryData) {
        categoryData = await Category.findOne({
          slug: categoryValue.toLowerCase(),
          isActive: true,
        });
      }

      // Category not found
      if (!categoryData) {
        return res.status(200).json({
          success: true,
          count: 0,
          totalProducts: 0,
          currentPage: 1,
          totalPages: 1,
          products: [],
        });
      }

      // ======================================================
      // MAIN CATEGORY
      // ======================================================

      if (!categoryData.parentCategory) {
        const subCategoryIds = await Category.find({
          parentCategory: categoryData._id,
          isActive: true,
        }).distinct("_id");

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
      }

      // ======================================================
      // SUBCATEGORY PASSED AS CATEGORY
      // ======================================================

      else {
        filter.subCategory = categoryData._id;
      }
    }

    // ========================================================
    // SUBCATEGORY
    // Supports subcategory ID and slug
    // ========================================================

    if (subCategory && subCategory.trim()) {
      let subCategoryData = null;

      const subCategoryValue = subCategory.trim();

      // Check ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(subCategoryValue)) {
        subCategoryData = await Category.findOne({
          _id: subCategoryValue,
          isActive: true,
        });
      }

      // Check slug
      if (!subCategoryData) {
        subCategoryData = await Category.findOne({
          slug: subCategoryValue.toLowerCase(),
          isActive: true,
        });
      }

      // Subcategory not found
      if (!subCategoryData) {
        return res.status(200).json({
          success: true,
          count: 0,
          totalProducts: 0,
          currentPage: 1,
          totalPages: 1,
          products: [],
        });
      }

      filter.subCategory = subCategoryData._id;
    }

    // ========================================================
    // BRAND
    // ========================================================

    if (brand && brand.trim()) {
      filter.brand = {
        $regex: brand.trim(),
        $options: "i",
      };
    }

    // ========================================================
    // PRODUCT TYPE
    // ========================================================

    if (productType) {
      filter.productType = productType;
    }

    // ========================================================
    // PRICE FILTER
    // ========================================================

    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice !== undefined && minPrice !== "") {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice !== undefined && maxPrice !== "") {
        filter.price.$lte = Number(maxPrice);
      }
    }

    // ========================================================
    // FEATURED
    // ========================================================

    if (featured === "true") {
      filter.featured = true;
    }

    // ========================================================
    // BEST SELLER
    // ========================================================

    if (bestSeller === "true") {
      filter.bestSeller = true;
    }

    // ========================================================
    // NEW ARRIVAL
    // ========================================================

    if (newArrival === "true") {
      filter.newArrival = true;
    }

    // ========================================================
    // IN STOCK
    // ========================================================

    if (inStock === "true") {
      filter.stock = {
        $gt: 0,
      };
    }

    // ========================================================
    // SORT
    // ========================================================

    let sortOption = {
      createdAt: -1,
    };

    switch (sort) {
      case "price_low":
        sortOption = {
          price: 1,
        };
        break;

      case "price_high":
        sortOption = {
          price: -1,
        };
        break;

      case "rating":
        sortOption = {
          rating: -1,
        };
        break;

      case "oldest":
        sortOption = {
          createdAt: 1,
        };
        break;

      case "newest":
        sortOption = {
          createdAt: -1,
        };
        break;

      case "popular":
      default:
        sortOption = {
          createdAt: -1,
        };
        break;
    }

    // ========================================================
    // PAGINATION
    // ========================================================

    const pageNumber = Math.max(
      1,
      Number(page) || 1
    );

    const limitNumber = Math.min(
      1000,
      Math.max(
        1,
        Number(limit) || 24
      )
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    // ========================================================
    // COUNT PRODUCTS
    // ========================================================

    const totalProducts =
      await Product.countDocuments(filter);

    // ========================================================
    // GET PRODUCTS
    // ========================================================

    const products = await Product.find(filter)
      .populate(
        "category",
        "name slug parentCategory"
      )
      .populate(
        "subCategory",
        "name slug parentCategory"
      )
      .populate(
        "relatedProducts",
        "name slug price thumbnail rating"
      )
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber)
      .lean();

    // ========================================================
    // RESPONSE
    // ========================================================

    res.status(200).json({
      success: true,
      count: products.length,
      totalProducts,
      currentPage: pageNumber,
      totalPages:
        Math.ceil(
          totalProducts / limitNumber
        ) || 1,
      products,
    });
  } catch (error) {
    console.error(
      "GET PRODUCTS ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// ============================================================
// GET SINGLE PRODUCT BY ID
// GET /api/products/:id
// ============================================================

const getProductById = async (req, res) => {
  try {
    const product =
      await Product.findById(req.params.id)
        .populate(
          "category",
          "name slug parentCategory"
        )
        .populate(
          "subCategory",
          "name slug parentCategory"
        )
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
    console.error(
      "GET PRODUCT BY ID ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

// ============================================================
// GET PRODUCT BY SLUG
// GET /api/products/slug/:slug
// ============================================================

const getProductBySlug = async (req, res) => {
  try {
    const product =
      await Product.findOne({
        slug: req.params.slug,
        isActive: true,
      })
        .populate(
          "category",
          "name slug parentCategory"
        )
        .populate(
          "subCategory",
          "name slug parentCategory"
        )
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
    console.error(
      "GET PRODUCT BY SLUG ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

// ============================================================
// CREATE PRODUCT
// POST /api/products
// ============================================================

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
      isActive,
      tags,
      metaTitle,
      metaDescription,
    } = req.body;

    // ========================================================
    // REQUIRED CATEGORY
    // ========================================================

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    // ========================================================
    // CHECK SKU
    // ========================================================

    if (sku) {
      const existingSKU =
        await Product.findOne({
          sku,
        });

      if (existingSKU) {
        return res.status(400).json({
          success: false,
          message: "SKU already exists",
        });
      }
    }

    // ========================================================
    // CHECK SLUG
    // ========================================================

    if (slug) {
      const existingSlug =
        await Product.findOne({
          slug,
        });

      if (existingSlug) {
        return res.status(400).json({
          success: false,
          message: "Product slug already exists",
        });
      }
    }

    // ========================================================
    // CHECK CATEGORY
    // ========================================================

    const categoryExists =
      await Category.findOne({
        _id: category,
        isActive: true,
      });

    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    // ========================================================
    // CHECK SUBCATEGORY
    // ========================================================

    if (subCategory) {
      const subCategoryExists =
        await Category.findOne({
          _id: subCategory,
          parentCategory: categoryExists._id,
          isActive: true,
        });

      if (!subCategoryExists) {
        return res.status(400).json({
          success: false,
          message:
            "Subcategory does not belong to selected category",
        });
      }
    }

    // ========================================================
    // CREATE PRODUCT
    // ========================================================

    const product =
      await Product.create({
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
        isActive,
        tags,
        metaTitle,
        metaDescription,
      });

    // ========================================================
    // POPULATE CREATED PRODUCT
    // ========================================================

    const populatedProduct =
      await Product.findById(
        product._id
      )
        .populate(
          "category",
          "name slug parentCategory"
        )
        .populate(
          "subCategory",
          "name slug parentCategory"
        );

    res.status(201).json({
      success: true,
      message:
        "Product created successfully",
      product: populatedProduct,
    });
  } catch (error) {
    console.error(
      "CREATE PRODUCT ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

// ============================================================
// UPDATE PRODUCT
// PUT /api/products/:id
// ============================================================

const updateProduct = async (req, res) => {
  try {
    const product =
      await Product.findById(
        req.params.id
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ========================================================
    // CATEGORY VALIDATION
    // ========================================================

    if (
      req.body.category ||
      req.body.subCategory
    ) {
      const categoryId =
        req.body.category ||
        product.category;

      const categoryExists =
        await Category.findOne({
          _id: categoryId,
          isActive: true,
        });

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
            parentCategory:
              categoryExists._id,
            isActive: true,
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

    // ========================================================
    // SKU DUPLICATE CHECK
    // ========================================================

    if (
      req.body.sku &&
      req.body.sku !== product.sku
    ) {
      const existingSKU =
        await Product.findOne({
          sku: req.body.sku,
          _id: {
            $ne: product._id,
          },
        });

      if (existingSKU) {
        return res.status(400).json({
          success: false,
          message: "SKU already exists",
        });
      }
    }

    // ========================================================
    // SLUG DUPLICATE CHECK
    // ========================================================

    if (
      req.body.slug &&
      req.body.slug !== product.slug
    ) {
      const existingSlug =
        await Product.findOne({
          slug: req.body.slug,
          _id: {
            $ne: product._id,
          },
        });

      if (existingSlug) {
        return res.status(400).json({
          success: false,
          message:
            "Product slug already exists",
        });
      }
    }

    // ========================================================
    // UPDATE
    // ========================================================

    Object.assign(
      product,
      req.body
    );

    await product.save();

    // ========================================================
    // POPULATE UPDATED PRODUCT
    // ========================================================

    const updatedProduct =
      await Product.findById(
        product._id
      )
        .populate(
          "category",
          "name slug parentCategory"
        )
        .populate(
          "subCategory",
          "name slug parentCategory"
        );

    res.status(200).json({
      success: true,
      message:
        "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error(
      "UPDATE PRODUCT ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

// ============================================================
// DELETE PRODUCT
// DELETE /api/products/:id
// ============================================================

const deleteProduct = async (req, res) => {
  try {
    const product =
      await Product.findById(
        req.params.id
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await Product.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message:
        "Product deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE PRODUCT ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

// ============================================================
// GET FEATURED PRODUCTS
// GET /api/products/featured
// ============================================================

const getFeaturedProducts = async (
  req,
  res
) => {
  try {
    const products =
      await Product.find({
        featured: true,
        isActive: true,
      })
        .populate(
          "category",
          "name slug parentCategory"
        )
        .populate(
          "subCategory",
          "name slug parentCategory"
        )
        .sort({
          createdAt: -1,
        })
        .limit(12);

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error(
      "GET FEATURED PRODUCTS ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch featured products",
      error: error.message,
    });
  }
};

// ============================================================
// GET BEST SELLERS
// GET /api/products/best-sellers
// ============================================================

const getBestSellers = async (
  req,
  res
) => {
  try {
    const products =
      await Product.find({
        bestSeller: true,
        isActive: true,
      })
        .populate(
          "category",
          "name slug parentCategory"
        )
        .populate(
          "subCategory",
          "name slug parentCategory"
        )
        .sort({
          rating: -1,
        })
        .limit(12);

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error(
      "GET BEST SELLERS ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch best sellers",
      error: error.message,
    });
  }
};

// ============================================================
// GET NEW ARRIVALS
// GET /api/products/new-arrivals
// ============================================================

const getNewArrivals = async (
  req,
  res
) => {
  try {
    const products =
      await Product.find({
        newArrival: true,
        isActive: true,
      })
        .populate(
          "category",
          "name slug parentCategory"
        )
        .populate(
          "subCategory",
          "name slug parentCategory"
        )
        .sort({
          createdAt: -1,
        })
        .limit(12);

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error(
      "GET NEW ARRIVALS ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch new arrivals",
      error: error.message,
    });
  }
};

// ============================================================
// EXPORTS
// ============================================================

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