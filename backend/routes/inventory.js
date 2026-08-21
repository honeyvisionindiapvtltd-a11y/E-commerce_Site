import express from 'express';
import inventoryService from '../services/inventoryService.js';

const router = express.Router();

/**
 * GET /api/inventory/:productId
 * Get inventory for a product
 */
router.get('/:productId', async (req, res) => {
  try {
    const inventory = await inventoryService.getInventory(req.params.productId);
    res.json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/inventory/availability/check
 * Check availability for multiple items
 */
router.post('/availability/check', async (req, res) => {
  try {
    const { items } = req.body;
    const availability = await inventoryService.checkAvailability(items);
    res.json({ success: true, availability });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/inventory/:productId/stock
 * Update stock level
 */
router.post('/:productId/stock', async (req, res) => {
  try {
    const { quantity, type, orderId, reason } = req.body;
    const inventory = await inventoryService.updateStock(
      req.params.productId,
      quantity,
      type,
      orderId,
      reason
    );
    res.json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/inventory/:productId/price
 * Update price
 */
router.post('/:productId/price', async (req, res) => {
  try {
    const { newPrice, reason } = req.body;
    const inventory = await inventoryService.updatePrice(
      req.params.productId,
      newPrice,
      reason
    );
    res.json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/inventory/low-stock
 * Get low stock products
 */
router.get('/', async (req, res) => {
  try {
    const products = await inventoryService.getLowStockProducts(req.query.limit || 20);
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/inventory/alerts/list
 * Get all alerts
 */
router.get('/alerts/list', async (req, res) => {
  try {
    const alerts = await inventoryService.getAlerts(req.query.limit || 50);
    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/inventory/:productId/alerts/:alertIndex/resolve
 * Resolve an alert
 */
router.post('/:productId/alerts/:alertIndex/resolve', async (req, res) => {
  try {
    const inventory = await inventoryService.resolveAlert(
      req.params.productId,
      parseInt(req.params.alertIndex)
    );
    res.json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/inventory/stats
 * Get inventory statistics
 */
router.get('/stats/dashboard', async (req, res) => {
  try {
    const stats = await inventoryService.getInventoryStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/inventory/:productId/restock/schedule
 * Schedule a restock
 */
router.post('/:productId/restock/schedule', async (req, res) => {
  try {
    const { quantity, restockDate, supplier } = req.body;
    const inventory = await inventoryService.scheduleRestock(
      req.params.productId,
      quantity,
      new Date(restockDate),
      supplier
    );
    res.json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/inventory/:productId/restock/process
 * Process a restock
 */
router.post('/:productId/restock/process', async (req, res) => {
  try {
    const inventory = await inventoryService.processRestock(req.params.productId);
    res.json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
