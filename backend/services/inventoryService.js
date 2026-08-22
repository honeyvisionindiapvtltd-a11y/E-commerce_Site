import Inventory from '../models/Inventory.js';
import { emitInventoryUpdate, emitPriceUpdate, emitAdminNotification } from './realtimeService.js';

/**
 * Inventory Management Service
 * Real-time stock tracking, alerts, and notifications
 */

export const inventoryService = {
  /**
   * Get inventory for a product
   */
  async getInventory(productId) {
    try {
      const inventory = await Inventory.findOne({ productId });
      return inventory || { availableStock: 0, status: 'out_of_stock' };
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  },

  /**
   * Create inventory record
   */
  async createInventory(inventoryData) {
    try {
      const inventory = new Inventory(inventoryData);
      await inventory.save();
      return inventory;
    } catch (error) {
      console.error('Error creating inventory:', error);
      throw error;
    }
  },

  /**
   * Update stock - handles reservations, sales, returns
   */
  async updateStock(productId, quantity, type = 'out', orderId = null, reason = '') {
    try {
      const inventory = await Inventory.findOne({ productId });
      if (!inventory) throw new Error('Product not found');

      const previousStock = inventory.availableStock;

      // Update based on type
      switch (type) {
        case 'out': // Sale
          inventory.availableStock = Math.max(0, inventory.availableStock - quantity);
          inventory.soldStock += quantity;
          break;

        case 'in': // Restock/Return
          inventory.availableStock += quantity;
          inventory.availableStock = Math.min(inventory.totalStock, inventory.availableStock);
          break;

        case 'reserve': // Reserve for pending order
          inventory.reservedStock += quantity;
          inventory.availableStock = Math.max(0, inventory.availableStock - quantity);
          break;

        case 'release': // Release reserved stock
          inventory.reservedStock = Math.max(0, inventory.reservedStock - quantity);
          inventory.availableStock += quantity;
          break;

        case 'damage':
          inventory.availableStock = Math.max(0, inventory.availableStock - quantity);
          break;

        case 'adjustment': // Manual adjustment
          const diff = quantity - previousStock;
          inventory.availableStock = Math.max(0, quantity);
          break;
      }

      // Add movement record
      inventory.movements.push({
        type,
        quantity,
        orderId,
        reason,
      });

      // Update status based on available stock
      if (inventory.availableStock === 0) {
        inventory.status = 'out_of_stock';
      } else if (inventory.availableStock <= inventory.lowStockThreshold) {
        inventory.status = 'low_stock';
      } else {
        inventory.status = 'in_stock';
      }

      // Check and trigger alerts
      if (inventory.status === 'low_stock' && !inventory.alerts.some(a => a.type === 'low_stock' && !a.resolved)) {
        inventory.alerts.push({
          type: 'low_stock',
          message: `Stock for product ${productId} is low: ${inventory.availableStock}`,
        });

        // Emit admin notification
        emitAdminNotification(
          `Low Stock Alert: ${productId}`,
          { productId, stock: inventory.availableStock, threshold: inventory.lowStockThreshold },
          'warning'
        );
      }

      if (inventory.status === 'out_of_stock') {
        inventory.alerts.push({
          type: 'out_of_stock',
          message: `Product ${productId} is out of stock`,
        });

        emitAdminNotification(
          `Out of Stock: ${productId}`,
          { productId },
          'error'
        );
      }

      await inventory.save();

      // Emit real-time update
      emitInventoryUpdate(productId, inventory.availableStock, inventory.status);

      return inventory;
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  },

  /**
   * Update price with history tracking
   */
  async updatePrice(productId, newPrice, reason = '') {
    try {
      const inventory = await Inventory.findOne({ productId });
      if (!inventory) throw new Error('Product not found');

      const oldPrice = inventory.currentPrice;
      const discount = Math.round(((inventory.originalPrice - newPrice) / inventory.originalPrice) * 100);

      inventory.currentPrice = newPrice;
      inventory.discount = {
        percentage: discount,
        amount: inventory.originalPrice - newPrice,
      };

      // Add to price history
      inventory.priceHistory.push({
        price: oldPrice,
        reason,
      });

      // Check for price changes alert
      if (Math.abs(newPrice - oldPrice) > oldPrice * 0.1) {
        inventory.alerts.push({
          type: 'price_change',
          message: `Price changed from ${oldPrice} to ${newPrice}`,
        });
      }

      await inventory.save();

      // Emit real-time price update
      emitPriceUpdate(productId, oldPrice, newPrice, discount);

      return inventory;
    } catch (error) {
      console.error('Error updating price:', error);
      throw error;
    }
  },

  /**
   * Get low stock products
   */
  async getLowStockProducts(limit = 20) {
    try {
      const products = await Inventory.find({
        status: { $in: ['low_stock', 'out_of_stock'] },
      })
        .sort({ availableStock: 1 })
        .limit(limit);

      return products;
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      throw error;
    }
  },

  /**
   * Get inventory alerts
   */
  async getAlerts(limit = 50) {
    try {
      const alerts = await Inventory.find({ 'alerts.resolved': { $exists: false } })
        .select('productId alerts')
        .limit(limit);

      return alerts;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  },

  /**
   * Resolve alert
   */
  async resolveAlert(productId, alertIndex) {
    try {
      const inventory = await Inventory.findOne({ productId });
      if (!inventory || !inventory.alerts[alertIndex]) {
        throw new Error('Alert not found');
      }

      inventory.alerts[alertIndex].resolved = new Date();
      await inventory.save();

      return inventory;
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  },

  /**
   * Get inventory dashboard stats
   */
  async getInventoryStats() {
    try {
      const stats = await Inventory.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalStock: { $sum: '$totalStock' },
            availableStock: { $sum: '$availableStock' },
          },
        },
      ]);

      const totalAlerts = await Inventory.countDocuments({
        'alerts.resolved': { $exists: false },
      });

      const lowStockCount = await Inventory.countDocuments({
        status: 'low_stock',
      });

      return {
        byStatus: stats,
        totalAlerts,
        lowStockCount,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      throw error;
    }
  },

  /**
   * Check stock availability for multiple products
   */
  async checkAvailability(items) {
    try {
      const availability = await Promise.all(
        items.map(async (item) => {
          const inventory = await Inventory.findOne({ productId: item.productId });
          return {
            productId: item.productId,
            requested: item.quantity,
            available: inventory?.availableStock || 0,
            canFulfill: (inventory?.availableStock || 0) >= item.quantity,
          };
        })
      );

      return availability;
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  },

  /**
   * Schedule restock
   */
  async scheduleRestock(productId, quantity, restockDate, supplier = '') {
    try {
      const inventory = await Inventory.findOne({ productId });
      if (!inventory) throw new Error('Product not found');

      inventory.nextRestockDate = restockDate;
      inventory.restockQuantity = quantity;
      inventory.supplier = supplier;
      inventory.leadTime = Math.ceil(
        (restockDate - new Date()) / (1000 * 60 * 60 * 24)
      );

      await inventory.save();

      emitAdminNotification(
        `Restock Scheduled: ${productId}`,
        { productId, quantity, date: restockDate, supplier },
        'info'
      );

      return inventory;
    } catch (error) {
      console.error('Error scheduling restock:', error);
      throw error;
    }
  },

  /**
   * Process restock
   */
  async processRestock(productId) {
    try {
      const inventory = await Inventory.findOne({ productId });
      if (!inventory || !inventory.nextRestockDate) {
        throw new Error('No pending restock found');
      }

      inventory.lastRestockDate = new Date();
      inventory.totalStock += inventory.restockQuantity;
      inventory.availableStock += inventory.restockQuantity;

      if (inventory.status === 'out_of_stock') {
        inventory.status = 'in_stock';
      }

      // Clear restock schedule
      inventory.nextRestockDate = null;
      inventory.restockQuantity = 0;

      inventory.movements.push({
        type: 'in',
        quantity: inventory.restockQuantity,
        reason: 'Scheduled restock',
      });

      await inventory.save();

      emitAdminNotification(
        `Restock Completed: ${productId}`,
        { productId, quantity: inventory.restockQuantity },
        'success'
      );

      emitInventoryUpdate(productId, inventory.availableStock, inventory.status);

      return inventory;
    } catch (error) {
      console.error('Error processing restock:', error);
      throw error;
    }
  },
};

export default inventoryService;
