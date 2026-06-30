import { Shift, CashDrawer, StockTake, InventoryAdjustment } from '../types';
import { BaseRepository, QueryOptions } from './BaseRepository';

/**
 * Shift Repository - Manages cashier shifts
 */
export class ShiftRepository extends BaseRepository<Shift> {
  constructor() {
    super('shifts');
  }

  /**
   * Get active shifts for a cashier
   */
  async getActiveSifts(cashierId: string): Promise<Shift[]> {
    return this.queryByIndex('by-cashier', cashierId);
  }

  /**
   * Get current open shift for a cashier
   */
  async getOpenShift(cashierId: string): Promise<Shift | undefined> {
    const shifts = await this.queryByIndex('by-cashier', cashierId);
    return shifts.find((s) => s.status === 'open');
  }

  /**
   * Open a new shift
   */
  async openShift(cashierId: string, openingBalance: number, branchId?: string): Promise<Shift> {
    const shift: Shift = {
      id: this.generateId(),
      cashier_id: cashierId,
      branch_id: branchId,
      opening_balance: openingBalance,
      status: 'open',
      opened_at: new Date().toISOString(),
      transactions_count: 0,
      created_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    return this.create(shift);
  }

  /**
   * Close a shift
   */
  async closeShift(shiftId: string, closingBalance: number, notes?: string): Promise<Shift | undefined> {
    const shift = await this.getById(shiftId);

    if (!shift) {
      throw new Error('Shift not found');
    }

    const updated: Shift = {
      ...shift,
      closing_balance: closingBalance,
      status: 'closed',
      closed_at: new Date().toISOString(),
      closing_notes: notes,
      sync_status: 'pending',
    };

    await this.update(updated);
    return updated;
  }

  /**
   * Get shift summary for reporting
   */
  async getShiftSummary(shiftId: string): Promise<Shift | undefined> {
    return this.getById(shiftId);
  }
}

/**
 * Cash Drawer Repository - Manages cash tracking
 */
export class CashDrawerRepository extends BaseRepository<CashDrawer> {
  constructor() {
    super('cash_drawers');
  }

  /**
   * Get active cash drawer for a shift
   */
  async getDrawerForShift(shiftId: string): Promise<CashDrawer | undefined> {
    const drawers = await this.queryByIndex('by-shift', shiftId);
    return drawers.find((d) => d.status !== 'closed');
  }

  /**
   * Open cash drawer for a shift
   */
  async openDrawer(
    shiftId: string,
    cashierId: string,
    openingBalance: number,
    branchId?: string
  ): Promise<CashDrawer> {
    const drawer: CashDrawer = {
      id: this.generateId(),
      shift_id: shiftId,
      cashier_id: cashierId,
      branch_id: branchId,
      opening_balance: openingBalance,
      cash_received: 0,
      cash_paid: 0,
      cash_on_hand: openingBalance,
      expected_balance: openingBalance,
      variance: 0,
      status: 'open',
      opened_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    return this.create(drawer);
  }

  /**
   * Record cash transaction in drawer
   */
  async recordCashTransaction(
    drawerId: string,
    amount: number,
    type: 'received' | 'paid'
  ): Promise<CashDrawer | undefined> {
    const drawer = await this.getById(drawerId);

    if (!drawer) {
      throw new Error('Cash drawer not found');
    }

    const updated: CashDrawer = { ...drawer };

    if (type === 'received') {
      updated.cash_received += amount;
    } else {
      updated.cash_paid += amount;
    }

    updated.cash_on_hand = updated.opening_balance + updated.cash_received - updated.cash_paid;
    updated.sync_status = 'pending';

    await this.update(updated);
    return updated;
  }

  /**
   * Balance and close cash drawer
   */
  async closeDrawer(
    drawerId: string,
    cashOnHand: number,
    varianceReason?: string
  ): Promise<CashDrawer | undefined> {
    const drawer = await this.getById(drawerId);

    if (!drawer) {
      throw new Error('Cash drawer not found');
    }

    const variance = cashOnHand - drawer.expected_balance;
    const status = variance === 0 ? 'balanced' : 'variance';

    const updated: CashDrawer = {
      ...drawer,
      cash_on_hand: cashOnHand,
      variance,
      variance_reason: varianceReason,
      status,
      closed_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    await this.update(updated);
    return updated;
  }
}

/**
 * Stock Take Repository - Manages physical stock counts
 */
export class StockTakeRepository extends BaseRepository<StockTake> {
  constructor() {
    super('stock_takes');
  }

  /**
   * Start a new stock take
   */
  async startStockTake(countedBy: string, branchId?: string): Promise<StockTake> {
    const stockTake: StockTake = {
      id: this.generateId(),
      branch_id: branchId,
      counted_by: countedBy,
      status: 'in_progress',
      total_variance: 0,
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    return this.create(stockTake);
  }

  /**
   * Complete stock take
   */
  async completeStockTake(
    stockTakeId: string,
    totalVariance: number,
    varianceReason?: string
  ): Promise<StockTake | undefined> {
    const stockTake = await this.getById(stockTakeId);

    if (!stockTake) {
      throw new Error('Stock take not found');
    }

    const updated: StockTake = {
      ...stockTake,
      status: 'completed',
      total_variance: totalVariance,
      variance_reason: varianceReason,
      completed_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    await this.update(updated);
    return updated;
  }
}

/**
 * Inventory Adjustment Repository - Manages stock adjustments
 */
export class InventoryAdjustmentRepository extends BaseRepository<InventoryAdjustment> {
  constructor() {
    super('inventory_adjustments');
  }

  /**
   * Get adjustments for a product
   */
  async getForProduct(productId: string): Promise<InventoryAdjustment[]> {
    return this.queryByIndex('by-product', productId);
  }

  /**
   * Get adjustments by reason
   */
  async getByReason(reason: string): Promise<InventoryAdjustment[]> {
    return this.queryByIndex('by-reason', reason);
  }

  /**
   * Create an adjustment
   */
  async createAdjustment(
    productId: string,
    quantity: number,
    reason: 'damage' | 'theft' | 'recount' | 'sample' | 'expiry' | 'transfer' | 'other',
    createdBy: string,
    branchId?: string,
    notes?: string
  ): Promise<InventoryAdjustment> {
    const adjustment: InventoryAdjustment = {
      id: this.generateId(),
      product_id: productId,
      adjustment_qty: quantity,
      reason,
      branch_id: branchId,
      created_by: createdBy,
      notes,
      created_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    return this.create(adjustment);
  }

  /**
   * Approve an adjustment
   */
  async approveAdjustment(adjustmentId: string, approvedBy: string): Promise<InventoryAdjustment | undefined> {
    const adjustment = await this.getById(adjustmentId);

    if (!adjustment) {
      throw new Error('Adjustment not found');
    }

    const updated: InventoryAdjustment = {
      ...adjustment,
      approved_by: approvedBy,
      sync_status: 'pending',
    };

    await this.update(updated);
    return updated;
  }
}

// Export singleton instances
export const shiftRepository = new ShiftRepository();
export const cashDrawerRepository = new CashDrawerRepository();
export const stockTakeRepository = new StockTakeRepository();
export const inventoryAdjustmentRepository = new InventoryAdjustmentRepository();
