import Category from '../models/Category.js';

// ==========================================
// GET ALL MAIN CATEGORIES
// ==========================================

const getMainCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      parentCategory: null,
      isActive: true,
    }).sort({ sortOrder: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
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
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const subcategories = await Category.find({
      parentCategory: category._id,
      isActive: true,
    }).sort({ sortOrder: 1 });

    res.status(200).json({
      success: true,
      category,
      subcategories,
    });
  } catch (error) {
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
    const category = await Category.findOne({
      slug: req.params.slug,
      parentCategory: null,
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const subcategories = await Category.find({
      parentCategory: category._id,
      isActive: true,
    }).sort({ sortOrder: 1 });

    res.status(200).json({
      success: true,
      category,
      subcategories,
    });
  } catch (error) {
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
    const subcategories = await Category.find({
      parentCategory: req.params.categoryId,
      isActive: true,
    }).sort({ sortOrder: 1 });

    res.status(200).json({
      success: true,
      count: subcategories.length,
      subcategories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch subcategories",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL CATEGORIES WITH SUBCATEGORIES
// ==========================================

const getCategoryTree = async (req, res) => {
  try {
    const mainCategories = await Category.find({
      parentCategory: null,
      isActive: true,
    }).sort({ sortOrder: 1 });

    const result = [];

    for (const category of mainCategories) {
      const subcategories = await Category.find({
        parentCategory: category._id,
        isActive: true,
      }).sort({ sortOrder: 1 });

      result.push({
        ...category.toObject(),
        subcategories,
      });
    }

    res.status(200).json({
      success: true,
      count: result.length,
      categories: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch category tree",
      error: error.message,
    });
  }
};

// ==========================================
// CREATE MAIN CATEGORY
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

    const existingCategory = await Category.findOne({ slug });

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
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check whether category has subcategories
    const subcategories = await Category.countDocuments({
      parentCategory: category._id,
    });

    if (subcategories > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete category because it contains subcategories",
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
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