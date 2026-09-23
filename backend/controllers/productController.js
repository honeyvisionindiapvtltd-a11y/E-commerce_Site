import Product from "../models/Product.js";
import Category from "../models/Category.js";
import inventoryService, { isInventoryAuthorityEnabled } from "../services/inventoryService.js";
import {
  buildListPagination,
  buildProductListProjection,
  getSearchRegex,
} from "../utils/productListQuery.js";

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
      series,
      productFamily,
      model,
      cameraType,
      technology,
      connectivity,
      resolution,
      nightVisionType,
      ipRating,
      application,
      aiFeature,
      microphone,
      speaker,
      twoWayAudio,
      nightVision,
      aiEnabled,
      indoorOutdoor,
      poe,
      wifi,
      fourG,
      productType,
      minPrice,
      maxPrice,
      featured,
      bestSeller,
      newArrival,
      inStock,
      sort,
      page = 1,
      limit = 24,
    } = req.query;

    // ========================================================
    // BASE FILTER
    // ========================================================

    // Older products may not have isActive. Treat them as visible unless explicitly disabled.
    const filter = {
      isActive: { $ne: false },
    };

    // ========================================================
    // SEARCH
    // Supports both ?search= and ?q=
    // ========================================================

    const searchValue = search || q;

    if (searchValue && searchValue.trim()) {
      const regex = getSearchRegex(searchValue.trim());

      filter.$and = [
        {
          $or: [
            { name: regex },
            { brand: regex },
            { sku: regex },
            { series: regex },
            { productFamily: regex },
            { model: regex },
            { cameraType: regex },
            { technology: regex },
            { resolution: regex },
            { aiFeatures: regex },
            { applications: regex },
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
      filter.brand = getSearchRegex(brand.trim());
    }

    const setCctvFilter = (field, value) => {
      const values = String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
      if (values.length === 1) {
        filter[field] = { $regex: values[0], $options: "i" };
      } else if (values.length > 1) {
        filter[field] = { $in: values.map((item) => new RegExp(item, "i")) };
      }
    };

    [
      ["series", series],
      ["productFamily", productFamily],
      ["model", model],
      ["cameraType", cameraType],
      ["technology", technology],
      ["connectivity", connectivity],
      ["resolution", resolution],
      ["nightVisionType", nightVisionType],
      ["ipRating", ipRating],
      ["indoorOutdoor", indoorOutdoor],
    ].forEach(([field, value]) => {
      if (value && String(value).trim()) setCctvFilter(field, value);
    });

    if (application && String(application).trim()) setCctvFilter("applications", application);
    if (aiFeature && String(aiFeature).trim()) setCctvFilter("aiFeatures", aiFeature);

    const setBooleanFilter = (field, value) => {
      if (String(value).toLowerCase() === "true") filter[field] = true;
    };
    [["microphone", microphone], ["speaker", speaker], ["twoWayAudio", twoWayAudio],
      ["nightVision", nightVision], ["aiEnabled", aiEnabled], ["poe", poe],
      ["wifi", wifi], ["fourG", fourG]].forEach(([field, value]) => setBooleanFilter(field, value));

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

    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(100, Math.max(1, Number(limit) || 24));
    const skip = (pageNumber - 1) * limitNumber;

    // ========================================================
    // COUNT PRODUCTS
    // ========================================================

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(totalProducts / limitNumber) || 1);
    const pagination = buildListPagination({
      page: pageNumber,
      limit: limitNumber,
      total: totalProducts,
    });

    // ========================================================
    // GET PRODUCTS
    // ========================================================

    const products = await Product.find(filter)
      .select(buildProductListProjection())
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
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
      totalPages,
      pagination,
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
        isActive: { $ne: false },
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
        series,
        productFamily,
        model,
        modelVersion,
        hardwareVersion,
        firmwareVersion,
        cameraType,
        technology,
        connectivity,
        resolution,
        megapixels,
        lens,
        lensType,
        nightVision,
        nightVisionType,
        nightVisionRange,
        aiEnabled,
        aiFeatures,
        microphone,
        speaker,
        twoWayAudio,
        storageType,
        maxStorage,
        indoorOutdoor,
        weatherproof,
        ipRating,
        ikRating,
        powerType,
        poe,
        poeStandard,
        wifi,
        fourG,
        onvif,
        rtsp,
        applications,
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

    if (isInventoryAuthorityEnabled()) {
      await inventoryService.createInventory({
        productId: String(product._id),
        sku: product.sku,
        totalStock: Number(stock || 0),
        availableStock: Number(stock || 0),
        reservedStock: 0,
        soldStock: 0,
        damagedStock: 0,
        lowStockThreshold: Number(lowStockThreshold || 0),
        currentPrice: Number(price || 0),
      });
    }

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
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const safeBody = { ...req.body };

    const normalizeObjectIdValue = (value) => {
      if (value === null || value === undefined || value === "") return null;
      const text = String(value).trim();
      return text || null;
    };

    const normalizeStringArray = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) {
        return value
          .map((item) => String(item).trim())
          .filter(Boolean)
          .filter((item) => item !== "undefined" && item !== "null");
      }
      if (typeof value === "string") {
        return value
          .split(/[\n,]+/)
          .map((item) => item.trim())
          .filter(Boolean);
      }
      return [];
    };

    const normalizeRelatedProducts = (value) => {
      const items = normalizeStringArray(value);
      return items.filter((item) => /^[0-9a-fA-F]{24}$/.test(item));
    };

    const nextCategory = normalizeObjectIdValue(safeBody.category);
    const nextSubCategory = normalizeObjectIdValue(safeBody.subCategory);

    if (nextCategory || nextSubCategory) {
      const categoryId = nextCategory || product.category;
      const categoryExists = await Category.findOne({
        _id: categoryId,
        isActive: true,
      });

      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: "Invalid category",
        });
      }

      if (nextSubCategory) {
        const subCategoryExists = await Category.findOne({
          _id: nextSubCategory,
          parentCategory: categoryExists._id,
          isActive: true,
        });

        if (!subCategoryExists) {
          return res.status(400).json({
            success: false,
            message: "Subcategory does not belong to selected category",
          });
        }
      }
    }

    if (safeBody.sku && safeBody.sku !== product.sku) {
      const existingSKU = await Product.findOne({
        sku: safeBody.sku,
        _id: { $ne: product._id },
      });

      if (existingSKU) {
        return res.status(400).json({
          success: false,
          message: "SKU already exists",
        });
      }
    }

    if (safeBody.slug && safeBody.slug !== product.slug) {
      const existingSlug = await Product.findOne({
        slug: safeBody.slug,
        _id: { $ne: product._id },
      });

      if (existingSlug) {
        return res.status(400).json({
          success: false,
          message: "Product slug already exists",
        });
      }
    }

    if (safeBody.tags !== undefined) {
      safeBody.tags = normalizeStringArray(safeBody.tags);
    }

    if (safeBody.images !== undefined) {
      safeBody.images = normalizeStringArray(safeBody.images);
    }

    if (safeBody.thumbnail !== undefined) {
      const thumbnail = String(safeBody.thumbnail || "").trim();
      safeBody.thumbnail = thumbnail || "";
    }

    if (safeBody.relatedProducts !== undefined) {
      safeBody.relatedProducts = normalizeRelatedProducts(safeBody.relatedProducts);
    }

    if (safeBody.category !== undefined) {
      safeBody.category = nextCategory || undefined;
    }

    if (safeBody.subCategory !== undefined) {
      safeBody.subCategory = nextSubCategory || null;
    }

    if (safeBody.stock !== undefined) {
      safeBody.stock = Number(safeBody.stock || 0);
      if (isInventoryAuthorityEnabled()) {
        if (req.body.stockAdjustment !== true) {
          return res.status(409).json({ success: false, message: "Stock changes must use the Inventory adjustment workflow." });
        }
        const inventory = await inventoryService.requireInventory(product._id);
        const delta = safeBody.stock - inventory.availableStock;
        if (delta !== 0) {
          await inventoryService.adjustInventory(product._id, delta, "Product edit stock adjustment", req.user._id, req.body.stockAdjustmentId ? { type: "PRODUCT_EDIT", id: req.body.stockAdjustmentId } : null);
        }
        delete safeBody.stock;
      }
    }
    if (safeBody.price !== undefined) safeBody.price = Number(safeBody.price || 0);
    if (safeBody.mrp !== undefined) safeBody.mrp = Number(safeBody.mrp || 0);
    if (safeBody.gstPercentage !== undefined) safeBody.gstPercentage = Number(safeBody.gstPercentage || 0);
    if (safeBody.lowStockThreshold !== undefined) safeBody.lowStockThreshold = Number(safeBody.lowStockThreshold || 0);
    if (safeBody.installationPrice !== undefined) safeBody.installationPrice = Number(safeBody.installationPrice || 0);
    if (safeBody.rating !== undefined) safeBody.rating = Number(safeBody.rating || 0);
    if (safeBody.reviewCount !== undefined) safeBody.reviewCount = Number(safeBody.reviewCount || 0);

    Object.assign(product, safeBody);

    if (!product.slug) {
      product.slug = product.name?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || product.slug;
    }

    await product.save();

    const updatedProduct = await Product.findById(product._id)
      .populate("category", "name slug parentCategory")
      .populate("subCategory", "name slug parentCategory");

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);

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
        isActive: { $ne: false },
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
        isActive: { $ne: false },
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
        isActive: { $ne: false },
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