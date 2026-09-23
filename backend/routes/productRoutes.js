import express from 'express';
import multer from 'multer';
import {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getBestSellers,
  getNewArrivals,
  searchByImage,
  getProductImageIndexSummary,
  refreshProductImageIndex,
} from '../controllers/productController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!file || !file.mimetype || !/^image\//.test(file.mimetype)) {
      return callback(new Error('Only image files are allowed.'));
    }
    return callback(null, true);
  },
});

router.get('/featured', getFeaturedProducts);
router.get('/best-sellers', getBestSellers);
router.get('/new-arrivals', getNewArrivals);
router.get('/image-index-summary', getProductImageIndexSummary);
router.post('/image-index-refresh', protect, requireAdmin, refreshProductImageIndex);
router.post('/search-by-image', upload.single('image'), searchByImage);
router.get('/', getProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);
router.post('/', protect, requireAdmin, createProduct);
router.put('/:id', protect, requireAdmin, updateProduct);
router.delete('/:id', protect, requireAdmin, deleteProduct);

export default router;