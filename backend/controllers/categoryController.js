import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { categoriesData } from "../seed/categoriesData.js";

const catalogCategoryImage = (category, parentSlug = "") => {
  const parent = categoriesData.find((item) => item.slug === parentSlug);
  const categoryName = String(category.name || "").toLowerCase();
  const catalogCategory = parent?.subcategories?.find((item) => item.slug === category.slug)
    || categoriesData.find((item) => item.slug === category.slug)
    || (categoryName.includes("cctv") || categoryName.includes("camera")
      ? categoriesData.find((item) => item.slug === "cctv-cameras")
      : null)
    || (categoryName.includes("network")
      ? categoriesData.find((item) => item.slug === "networking-equipment")
      : null)
    || (categoryName.includes("display") || categoryName.includes("monitor")
      ? categoriesData.find((item) => item.slug === "monitors-and-displays")
      : null)
    || (categoryName.includes("cable") || categoryName.includes("connector")
      ? categoriesData.find((item) => item.slug === "cables-and-connectors")
      : null)
    || (categoryName.includes("stand") || categoryName.includes("rack") || categoryName.includes("mount")
      ? categoriesData.find((item) => item.slug === "camera-mounts-and-stands")
      : null)
    || (categoryName.includes("storage") || categoryName.includes("memory")
      ? categoriesData.find((item) => item.slug === "storage-devices")
      : null)
    || (categoryName.includes("accessor") || categoryName.includes("essential") || categoryName.includes("tool")
      ? categoriesData.find((item) => item.slug === "computer-accessories")
      : null)
    || (categoryName.includes("office") || categoryName.includes("printer")
      ? categoriesData.find((item) => item.slug === "printers-and-scanners")
      : null)
    || (categoryName.includes("access control") || categoryName.includes("attendance")
      ? categoriesData.find((item) => item.slug === "access-control")
      : null)
    || (categoryName.includes("smart") || categoryName.includes("wearable")
      ? categoriesData.find((item) => item.slug === "smart-wearables")
      : null)
    || (categoryName.includes("audio") || categoryName.includes("visual")
      ? categoriesData.find((item) => item.slug === "led-displays")
      : null);
  const image = category.src || category.image || catalogCategory?.src || "";

  return {
    ...category.toObject(),
    image,
    src: image,
  };
};

// ==========================================
// GET ALL MAIN CATEGORIES
// WITH PRODUCT COUNTS
// ==========================================

const getMainCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      parentCategory: null,
      isActive: true,
    }).sort({ sortOrder: 1 });

    const result = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({
          category: category._id,
          isActive: true,
        });

        const subcategoryIds = await Category.find({
          parentCategory: category._id,
          isActive: true,
        }).distinct("_id");

        const totalCount = await Product.countDocuments({
          $or: [
            {
              category: category._id,
              isActive: true,
            },
            {
              subCategory: {
                $in: subcategoryIds,
              },
              isActive: true,
            },
          ],
        });

        return {
          ...catalogCategoryImage(category),
          productCount: totalCount,
        };
      })
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

    const subcategoriesWithCounts = await Promise.all(
      subcategories.map(async (subcategory) => {
        const productCount = await Product.countDocuments({
          subCategory: subcategory._id,
          isActive: true,
        });

        return {
                ...catalogCategoryImage(subcategory, category.slug),
          productCount,
        };
      })
    );

    const subcategoryIds = subcategories.map(
      (item) => item._id
    );

    const productCount = await Product.countDocuments({
      $or: [
        {
          category: category._id,
          isActive: true,
        },
        {
          subCategory: {
            $in: subcategoryIds,
          },
          isActive: true,
        },
      ],
    });

    res.status(200).json({
      success: true,
      category: {
          ...catalogCategoryImage(category),
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
    const category = await Category.findOne({
      slug: req.params.slug,
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

    const subcategoriesWithCounts = await Promise.all(
      subcategories.map(async (subcategory) => {
        const productCount = await Product.countDocuments({
          subCategory: subcategory._id,
          isActive: true,
        });

        return {
          ...catalogCategoryImage(subcategory, category.slug),
          productCount,
        };
      })
    );

    const subcategoryIds = subcategories.map(
      (item) => item._id
    );

    const productCount = await Product.countDocuments({
      $or: [
        {
          category: category._id,
          isActive: true,
        },
        {
          subCategory: {
            $in: subcategoryIds,
          },
          isActive: true,
        },
      ],
    });

    res.status(200).json({
      success: true,
      category: {
        ...catalogCategoryImage(category),
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
    const subcategories = await Category.find({
      parentCategory: req.params.categoryId,
      isActive: true,
    }).sort({ sortOrder: 1 });

    const result = await Promise.all(
      subcategories.map(async (subcategory) => {
        const productCount = await Product.countDocuments({
          subCategory: subcategory._id,
          isActive: true,
        });

        return {
          ...catalogCategoryImage(subcategory, req.params.categoryId),
          productCount,
        };
      })
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
    const mainCategories = await Category.find({
      parentCategory: null,
      isActive: true,
    }).sort({ sortOrder: 1 });

    const result = await Promise.all(
      mainCategories.map(async (category) => {
        const subcategories = await Category.find({
          parentCategory: category._id,
          isActive: true,
        }).sort({ sortOrder: 1 });

        const subcategoriesWithCounts =
          await Promise.all(
            subcategories.map(async (subcategory) => {
              const productCount =
                await Product.countDocuments({
                  subCategory: subcategory._id,
                  isActive: true,
                });

              return {
                ...catalogCategoryImage(subcategory, category.slug),
                productCount,
              };
            })
          );

        const subcategoryIds = subcategories.map(
          (subcategory) => subcategory._id
        );

        const productCount =
          await Product.countDocuments({
            $or: [
              {
                category: category._id,
                isActive: true,
              },
              {
                subCategory: {
                  $in: subcategoryIds,
                },
                isActive: true,
              },
            ],
          });

        return {
          ...catalogCategoryImage(category),
          productCount,
          subcategories: subcategoriesWithCounts,
        };
      })
    );

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