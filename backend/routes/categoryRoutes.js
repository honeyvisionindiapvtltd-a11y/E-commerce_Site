import express from 'express';
import {
  getMainCategories,
  getCategoryById,
  getCategoryBySlug,
  getSubcategories,
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getMainCategories);
router.get('/tree', getCategoryTree);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:categoryId/subcategories', getSubcategories);
router.get('/:id', getCategoryById);
router.post('/', protect, requireAdmin, createCategory);
router.put('/:id', protect, requireAdmin, updateCategory);
router.delete('/:id', protect, requireAdmin, deleteCategory);

export default router;