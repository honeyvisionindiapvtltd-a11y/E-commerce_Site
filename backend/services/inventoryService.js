import Inventory from '../models/Inventory.js';
import InventoryMovement from '../models/InventoryMovement.js';
import Product from '../models/Product.js';
import { emitInventoryUpdate, emitPriceUpdate, emitAdminNotification } from './realtimeService.js';

export const isInventoryAuthorityEnabled = () => process.env.INVENTORY_AUTHORITY_ENABLED === 'true';

export const assertInventoryAuthorityReady = async () => {
  if (!isInventoryAuthorityEnabled()) return;
  const [products, inventories] = await Promise.all([
    Product.find({}, '_id').lean(),
    Inventory.find({}, 'productId').lean(),
  ]);
  const productIds = new Set(products.map((product) => String(product._id)));
  const inventoryIds = inventories.map((inventory) => String(inventory.productId));
  const inventoryIdSet = new Set(inventoryIds);
  const complete = products.length === inventories.length
    && inventoryIds.length === inventoryIdSet.size
    && [...productIds].every((productId) => inventoryIdSet.has(productId));
  if (!complete) {
    const error = new Error(`Inventory authority is not ready: ${products.length} products and ${inventories.length} complete inventory records required`);
    error.code = 'INVENTORY_AUTHORITY_NOT_READY';
    throw error;
  }
};

/**
 * Inventory Management Service
 * Real-time stock tracking, alerts, and notifications
 */

export const inventoryService = {
  async requireInventory(productId) {
    const inventory = await Inventory.findOne({ productId });
    if (!inventory) {
      const error = new Error(`Inventory is not initialized for product ${productId}`);
      error.code = 'INVENTORY_NOT_INITIALIZED';
      throw error;
    }
    return inventory;
  },

  async getAvailableStock(productId) {
    const inventory = await this.requireInventory(productId);
    return inventory.availableStock;
  },

  async checkAvailability(productId, quantity) {
    if (Array.isArray(productId)) return this.checkAvailabilityForItems(productId);
    const requested = Number(quantity);
    if (!Number.isInteger(requested) || requested < 1) return false;
    const inventory = await this.requireInventory(productId);
    return inventory.availableStock >= requested;
  },

  async recordMovement({ productId, sku = '', movementType, quantity, before, after, reference, reason = '', performedBy = null }) {
    try {
      return await InventoryMovement.create({
        productId: String(productId),
        inventoryId: after._id,
        sku,
        movementType,
        quantity,
        previousAvailable: before.availableStock,
        newAvailable: after.availableStock,
        previousReserved: before.reservedStock,
        newReserved: after.reservedStock,
        previousSold: before.soldStock,
        newSold: after.soldStock,
        referenceType: reference.type,
        referenceId: String(reference.id),
        reason,
        performedBy: performedBy ? String(performedBy) : null,
      });
    } catch (error) {
      if (error?.code === 11000) {
        return InventoryMovement.findOne({
          productId: String(productId),
          movementType,
          referenceType: reference.type,
          referenceId: String(reference.id),
        });
      }
      throw error;
    }
  },

  async reserveInventory(productId, quantity, reference) {
    const requested = Number(quantity);
    if (!Number.isInteger(requested) || requested < 1) throw new Error('Quantity must be a positive integer');
    if (!reference?.type || !reference?.id) throw new Error('Inventory reservation reference is required');

    const current = await this.requireInventory(productId);
    const updated = await Inventory.findOneAndUpdate(
      {
        productId: String(productId),
        availableStock: { $gte: requested },
        reservations: { $not: { $elemMatch: { referenceType: reference.type, referenceId: String(reference.id), status: 'RESERVED' } } },
      },
      {
        $inc: { availableStock: -requested, reservedStock: requested },
        $push: { reservations: { referenceType: reference.type, referenceId: String(reference.id), quantity: requested, status: 'RESERVED', createdAt: new Date(), updatedAt: new Date() } },
      },
      { new: true, runValidators: true },
    );
    if (!updated) {
      const latest = await Inventory.findOne({ productId: String(productId) });
      if (latest?.reservations?.some((reservation) => (
        reservation.referenceType === reference.type
        && reservation.referenceId === String(reference.id)
        && reservation.quantity === requested
        && reservation.status === 'RESERVED'
      ))) return latest;
      const error = new Error('INSUFFICIENT_STOCK');
      error.code = 'INSUFFICIENT_STOCK';
      throw error;
    }

    await this.recordMovement({
      productId,
      sku: updated.sku,
      movementType: 'ORDER_RESERVED',
      quantity: requested,
      before: { availableStock: updated.availableStock + requested, reservedStock: updated.reservedStock - requested, soldStock: updated.soldStock },
      after: updated,
      reference,
    });
    emitInventoryUpdate(String(productId), updated.availableStock, updated.status);
    return updated;
  },

  async releaseInventory(productId, quantity, reference) {
    return this.transitionReservation(productId, quantity, reference, 'RELEASED', 'ORDER_RELEASED', { $inc: { availableStock: Number(quantity), reservedStock: -Number(quantity) } });
  },

  async commitInventory(productId, quantity, reference) {
    return this.transitionReservation(productId, quantity, reference, 'COMMITTED', 'ORDER_COMMITTED', { $inc: { reservedStock: -Number(quantity), soldStock: Number(quantity) } });
  },

  async transitionReservation(productId, quantity, reference, reservationStatus, movementType, stockUpdate) {
    const requested = Number(quantity);
    if (!Number.isInteger(requested) || requested < 1) throw new Error('Quantity must be a positive integer');
    if (!reference?.type || !reference?.id) throw new Error('Inventory reference is required');
    const current = await this.requireInventory(productId);
    const hasActiveReservation = current.reservations?.some((reservation) => (
      reservation.referenceType === reference.type
      && reservation.referenceId === String(reference.id)
      && reservation.quantity === requested
      && reservation.status === 'RESERVED'
    ));
    const priorMovement = await InventoryMovement.findOne({ productId: String(productId), movementType, referenceType: reference.type, referenceId: String(reference.id) });
    if (priorMovement && !hasActiveReservation) return current;

    const updated = await Inventory.findOneAndUpdate(
      { productId: String(productId), reservations: { $elemMatch: { referenceType: reference.type, referenceId: String(reference.id), quantity: requested, status: 'RESERVED' } }, ...(reservationStatus === 'RELEASED' ? { reservedStock: { $gte: requested } } : {}) },
      { ...stockUpdate, $set: { 'reservations.$[reservation].status': reservationStatus, 'reservations.$[reservation].updatedAt': new Date() } },
      { new: true, runValidators: true, arrayFilters: [{ 'reservation.referenceType': reference.type, 'reservation.referenceId': String(reference.id), 'reservation.status': 'RESERVED' }] },
    );
    if (!updated) return current;

    await this.recordMovement({
      productId,
      sku: updated.sku,
      movementType,
      quantity: requested,
      before: reservationStatus === 'RELEASED'
        ? { availableStock: updated.availableStock - requested, reservedStock: updated.reservedStock + requested, soldStock: updated.soldStock }
        : { availableStock: updated.availableStock, reservedStock: updated.reservedStock + requested, soldStock: updated.soldStock - requested },
      after: updated,
      reference,
    });
    emitInventoryUpdate(String(productId), updated.availableStock, updated.status);
    return updated;
  },

  async restoreInventory(productId, quantity, reason, performedBy = null, reference = null) {
    const requested = Number(quantity);
    if (!Number.isInteger(requested) || requested < 1) throw new Error('Quantity must be a positive integer');
    const current = await this.requireInventory(productId);
    const updated = await Inventory.findOneAndUpdate(
      { productId: String(productId), soldStock: { $gte: requested } },
      { $inc: { availableStock: requested, soldStock: -requested }, $set: { status: 'in_stock' } },
      { new: true, runValidators: true },
    );
    if (!updated) throw new Error('INSUFFICIENT_SOLD_STOCK');
    await this.recordMovement({ productId, sku: updated.sku, movementType: 'RETURN_RESTOCKED', quantity: requested, before: current, after: updated, reference: reference || { type: 'RESTORE', id: `${productId}:${Date.now()}` }, reason, performedBy });
    emitInventoryUpdate(String(productId), updated.availableStock, updated.status);
    return updated;
  },

  async processReturnInventory(productId, quantity, disposition, reference, reason = '', performedBy = null) {
    if (!["SELLABLE_RETURN", "DAMAGED_RETURN", "REPLACEMENT", "REFUND"].includes(disposition)) throw new Error('Invalid return inventory disposition');
    if (disposition === 'REFUND' || disposition === 'REPLACEMENT') return this.requireInventory(productId);
    const requested = Number(quantity);
    if (!Number.isInteger(requested) || requested < 1) throw new Error('Quantity must be a positive integer');
    const movementType = disposition === 'DAMAGED_RETURN' ? 'DAMAGED' : 'RETURN_RESTOCKED';
    const current = await this.requireInventory(productId);
    const existing = await InventoryMovement.findOne({ productId: String(productId), movementType, referenceType: reference.type, referenceId: String(reference.id) });
    if (existing) return current;
    const updated = await Inventory.findOneAndUpdate(
      { productId: String(productId), soldStock: { $gte: requested } },
      disposition === 'DAMAGED_RETURN'
        ? { $inc: { soldStock: -requested, damagedStock: requested } }
        : { $inc: { soldStock: -requested, availableStock: requested } },
      { new: true, runValidators: true },
    );
    if (!updated) throw new Error('INSUFFICIENT_SOLD_STOCK');
    await this.recordMovement({
      productId,
      sku: updated.sku,
      movementType,
      quantity: requested,
      before: current,
      after: updated,
      reference,
      reason,
      performedBy,
    });
    emitInventoryUpdate(String(productId), updated.availableStock, updated.status);
    return updated;
  },

  async adjustInventory(productId, quantity, reason, performedBy = null, reference = null) {
    const delta = Number(quantity);
    if (!Number.isInteger(delta) || delta === 0) throw new Error('Adjustment must be a non-zero integer');
    const current = await this.requireInventory(productId);
    const updated = await Inventory.findOneAndUpdate(
      { productId: String(productId), ...(delta < 0 ? { availableStock: { $gte: Math.abs(delta) } } : {}) },
      { $inc: { availableStock: delta, totalStock: delta } },
      { new: true, runValidators: true },
    );
    if (!updated) throw new Error('INSUFFICIENT_STOCK');
    await this.recordMovement({ productId, sku: updated.sku, movementType: 'MANUAL_ADJUSTMENT', quantity: Math.abs(delta), before: current, after: updated, reference: reference || { type: 'MANUAL_ADJUSTMENT', id: `${productId}:${Date.now()}` }, reason, performedBy });
    emitInventoryUpdate(String(productId), updated.availableStock, updated.status);
    return updated;
  },

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
    const requested = Number(quantity);
    if (!Number.isInteger(requested) || requested < 1) throw new Error('Quantity must be a positive integer');
    const reference = { type: 'LEGACY_STOCK', id: orderId || `${productId}:${type}:${Date.now()}` };
    if (type === 'reserve') return this.reserveInventory(productId, requested, reference);
    if (type === 'release') return this.releaseInventory(productId, requested, reference);
    if (type === 'adjustment') {
      const current = await this.requireInventory(productId);
      const delta = requested - current.availableStock;
      return delta === 0 ? current : this.adjustInventory(productId, delta, reason, null);
    }

    const current = await this.requireInventory(productId);
    const update = type === 'in'
      ? { $inc: { availableStock: requested, totalStock: requested } }
      : type === 'damage'
        ? { $inc: { availableStock: -requested, damagedStock: requested } }
        : { $inc: { availableStock: -requested, soldStock: requested } };
    const filter = { productId: String(productId) };
    if (type === 'out' || type === 'damage') filter.availableStock = { $gte: requested };
    const updated = await Inventory.findOneAndUpdate(filter, update, { new: true, runValidators: true });
    if (!updated) throw new Error('INSUFFICIENT_STOCK');
    await this.recordMovement({
      productId,
      sku: updated.sku,
      movementType: type === 'in' ? 'INITIAL_STOCK' : type === 'damage' ? 'DAMAGED' : 'ORDER_COMMITTED',
      quantity: requested,
      before: current,
      after: updated,
      reference,
      reason,
    });
    emitInventoryUpdate(String(productId), updated.availableStock, updated.status);
    return updated;
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
  async checkAvailabilityForItems(items) {
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
