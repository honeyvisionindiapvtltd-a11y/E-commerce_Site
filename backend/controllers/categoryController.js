import Category from "../models/Category.js";
import Product from "../models/Product.js";

const categoryProjection = "_id name slug description image icon parentCategory isActive sortOrder";

const getCategoryProductCounts = async () => {
  const [categoryCounts, subCategoryCounts] = await Promise.all([
    Product.aggregate([
      {
        $match: {
          isActive: { $ne: false },
          category: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]),
    Product.aggregate([
      {
        $match: {
          isActive: { $ne: false },
          subCategory: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$subCategory",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  return {
    categoryCountMap: new Map(categoryCounts.map((item) => [String(item._id), item.count])),
    subCategoryCountMap: new Map(subCategoryCounts.map((item) => [String(item._id), item.count])),
  };
};

const enrichCategoryWithCount = (category, categoryCountMap, subCategoryCountMap, childIds = []) => {
  const categoryId = String(category._id);
  const directCount = categoryCountMap.get(categoryId) || 0;
  const childCount = (childIds || []).reduce((total, subCategoryId) => total + (subCategoryCountMap.get(String(subCategoryId)) || 0), 0);

  return {
    ...category,
    productCount: directCount + childCount,
  };
};

// ==========================================
// GET ALL MAIN CATEGORIES
// WITH PRODUCT COUNTS
// ==========================================

const getMainCategories = async (req, res) => {
  try {
    const [categories, { categoryCountMap, subCategoryCountMap }, rawCategoryTree] = await Promise.all([
      Category.find({
        parentCategory: null,
        isActive: true,
      }).select(categoryProjection).sort({ sortOrder: 1 }).lean(),
      getCategoryProductCounts(),
      Category.find({ isActive: true }).select("_id parentCategory").lean(),
    ]);

    const childIdsByParent = new Map();
    rawCategoryTree.forEach((category) => {
      if (!category.parentCategory) return;
      const parentId = String(category.parentCategory);
      const bucket = childIdsByParent.get(parentId) || [];
      bucket.push(category._id);
      childIdsByParent.set(parentId, bucket);
    });

    const result = categories.map((category) =>
      enrichCategoryWithCount(category, categoryCountMap, subCategoryCountMap, childIdsByParent.get(String(category._id)) || [])
    );

    res.status(200).json({
      success: true,
      count: result.length,
      categories: result,
    });
  } catch (error) {
    console.error("getMainCategories:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};

// ==========================================
// GET CATEGORY BY ID
// ==========================================

const getCategoryById = async (req, res) => {
  try {
    const [category, subcategories, { categoryCountMap, subCategoryCountMap }] = await Promise.all([
      Category.findById(req.params.id).select(categoryProjection).lean(),
      Category.find({
        parentCategory: req.params.id,
        isActive: true,
      }).select(categoryProjection).sort({ sortOrder: 1 }).lean(),
      getCategoryProductCounts(),
    ]);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const subcategoryIds = subcategories.map((item) => item._id);
    const subcategoriesWithCounts = subcategories.map((subcategory) =>
      enrichCategoryWithCount(subcategory, categoryCountMap, subCategoryCountMap)
    );
    const productCount = (categoryCountMap.get(String(category._id)) || 0) + subcategoryIds.reduce((total, item) => total + (subCategoryCountMap.get(String(item)) || 0), 0);

    res.status(200).json({
      success: true,
      category: {
        ...category,
        productCount,
      },
      subcategories: subcategoriesWithCounts,
    });
  } catch (error) {
    console.error("getCategoryById:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
};

// ==========================================
// GET CATEGORY BY SLUG
// ==========================================

const getCategoryBySlug = async (req, res) => {
  try {
    const [category, subcategories, { categoryCountMap, subCategoryCountMap }] = await Promise.all([
      Category.findOne({
        slug: req.params.slug,
        isActive: true,
      }).select(categoryProjection).lean(),
      Category.find({
        parentCategory: req.params.id,
        isActive: true,
      }).select(categoryProjection).sort({ sortOrder: 1 }).lean(),
      getCategoryProductCounts(),
    ]);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const subcategoryIds = subcategories.map((item) => item._id);
    const subcategoriesWithCounts = subcategories.map((subcategory) =>
      enrichCategoryWithCount(subcategory, categoryCountMap, subCategoryCountMap)
    );
    const productCount = (categoryCountMap.get(String(category._id)) || 0) + subcategoryIds.reduce((total, item) => total + (subCategoryCountMap.get(String(item)) || 0), 0);

    res.status(200).json({
      success: true,
      category: {
        ...category,
        productCount,
      },
      subcategories: subcategoriesWithCounts,
    });
  } catch (error) {
    console.error("getCategoryBySlug:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
};

// ==========================================
// GET SUBCATEGORIES
// ==========================================

const getSubcategories = async (req, res) => {
  try {
    const [subcategories, { subCategoryCountMap }] = await Promise.all([
      Category.find({
        parentCategory: req.params.categoryId,
        isActive: true,
      }).select(categoryProjection).sort({ sortOrder: 1 }).lean(),
      getCategoryProductCounts(),
    ]);

    const result = subcategories.map((subcategory) =>
      enrichCategoryWithCount(subcategory, new Map(), subCategoryCountMap)
    );

    res.status(200).json({
      success: true,
      count: result.length,
      subcategories: result,
    });
  } catch (error) {
    console.error("getSubcategories:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch subcategories",
      error: error.message,
    });
  }
};

// ==========================================
// GET COMPLETE CATEGORY TREE
// WITH PRODUCT COUNTS
// ==========================================

const getCategoryTree = async (req, res) => {
  try {
    const lightMode = String(req.query.light || req.query.summary || "false").toLowerCase() === "true";

    if (lightMode) {
      const mainCategories = await Category.find({
        parentCategory: null,
        isActive: true,
      }).select("_id name slug description image icon parentCategory isActive sortOrder").sort({ sortOrder: 1 }).lean();

      const result = await Promise.all(
        mainCategories.map(async (category) => {
          const subcategories = await Category.find({
            parentCategory: category._id,
            isActive: true,
          }).select("_id name slug description image icon parentCategory isActive sortOrder").sort({ sortOrder: 1 }).lean();

          return {
            ...category,
            subcategories,
            children: subcategories,
          };
        })
      );

      return res.status(200).json({
        success: true,
        count: result.length,
        categories: result,
      });
    }

    const [mainCategories, { categoryCountMap, subCategoryCountMap }, allCategories] = await Promise.all([
      Category.find({
        parentCategory: null,
        isActive: true,
      }).select(categoryProjection).sort({ sortOrder: 1 }).lean(),
      getCategoryProductCounts(),
      Category.find({ isActive: true }).select("_id parentCategory name slug image icon isActive sortOrder").lean(),
    ]);

    const subcategoriesByParent = new Map();
    allCategories.forEach((category) => {
      if (!category.parentCategory) return;
      const parentId = String(category.parentCategory);
      const bucket = subcategoriesByParent.get(parentId) || [];
      bucket.push(category);
      subcategoriesByParent.set(parentId, bucket);
    });

    const result = mainCategories.map((category) => {
      const childCategories = subcategoriesByParent.get(String(category._id)) || [];
      const childIds = childCategories.map((item) => item._id);
      const subcategoriesWithCounts = childCategories.map((subcategory) =>
        enrichCategoryWithCount(subcategory, categoryCountMap, subCategoryCountMap)
      );
      const productCount = (categoryCountMap.get(String(category._id)) || 0) + childIds.reduce((total, item) => total + (subCategoryCountMap.get(String(item)) || 0), 0);

      return {
        ...category,
        productCount,
        subcategories: subcategoriesWithCounts,
      };
    });

    res.status(200).json({
      success: true,
      count: result.length,
      categories: result,
    });
  } catch (error) {
    console.error("getCategoryTree:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch category tree",
      error: error.message,
    });
  }
};

// ==========================================
// CREATE CATEGORY
// ==========================================

const createCategory = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      image,
      icon,
      parentCategory,
      sortOrder,
    } = req.body;

    const existingCategory = await Category.findOne({
      slug,
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this slug already exists",
      });
    }

    const category = await Category.create({
      name,
      slug,
      description,
      image,
      icon,
      parentCategory: parentCategory || null,
      sortOrder: sortOrder || 0,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("createCategory:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create category",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE CATEGORY
// ==========================================

const updateCategory = async (req, res) => {
  try {
    if (req.body.slug) {
      const duplicate = await Category.findOne({
        slug: req.body.slug,
        _id: { $ne: req.params.id },
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Category with this slug already exists",
        });
      }
    }

    if (req.body.parentCategory) {
      if (String(req.body.parentCategory) === String(req.params.id)) {
        return res.status(400).json({ success: false, message: "A category cannot be its own parent" });
      }
      const parent = await Category.findOne({ _id: req.body.parentCategory, parentCategory: null });
      if (!parent) {
        return res.status(400).json({ success: false, message: "Invalid parent category" });
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("updateCategory:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE CATEGORY
// ==========================================

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(
      req.params.id
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const subcategories =
      await Category.countDocuments({
        parentCategory: category._id,
      });

    if (subcategories > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete category because it contains subcategories",
      });
    }

    const productsUsingCategory =
      await Product.countDocuments({
        $or: [
          { category: category._id },
          { subCategory: category._id },
        ],
      });

    if (productsUsingCategory > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete category because products are using it",
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("deleteCategory:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: error.message,
    });
  }
};

export {
  getMainCategories,
  getCategoryById,
  getCategoryBySlug,
  getSubcategories,
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
};