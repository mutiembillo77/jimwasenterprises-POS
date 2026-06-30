import { Transaction } from '../types';
import { BaseRepository, QueryOptions } from './BaseRepository';

export interface TransactionFilter {
  saleType?: 'retail' | 'wholesale' | 'lipa_mdogo' | 'kyamaa';
  cashierId?: string;
  customerId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  branchId?: string;
}

export class TransactionRepository extends BaseRepository<Transaction> {
  constructor() {
    super('transactions');
  }

  /**
   * Get transactions with role-based filtering
   * Regular cashiers can only see their own transactions
   * Managers can see all transactions in their branch
   * Admins can see all transactions
   */
  async getForRole(
    userRole: string,
    userId: string,
    branchId?: string,
    options?: QueryOptions
  ): Promise<Transaction[]> {
    const allTransactions = await this.getAll(options);

    let filtered = allTransactions;

    // Role-based filtering
    if (userRole === 'cashier') {
      // Cashiers can only see their own transactions
      filtered = filtered.filter((t) => t.cashier_id === userId);
    } else if (userRole === 'manager') {
      // Managers can see all transactions in their branch
      if (branchId) {
        filtered = filtered.filter((t) => t.branch_id === branchId);
      }
    }
    // Admins see all transactions (no filtering)

    return filtered;
  }

  /**
   * Get transactions filtered by multiple criteria
   */
  async findByCriteria(
    filter: TransactionFilter,
    options?: QueryOptions
  ): Promise<Transaction[]> {
    let transactions = await this.getAll();

    if (filter.saleType) {
      transactions = transactions.filter((t) => t.sale_type === filter.saleType);
    }

    if (filter.cashierId) {
      transactions = transactions.filter((t) => t.cashier_id === filter.cashierId);
    }

    if (filter.customerId) {
      transactions = transactions.filter((t) => t.customer_id === filter.customerId);
    }

    if (filter.status) {
      transactions = transactions.filter((t) => t.status === filter.status);
    }

    if (filter.paymentMethod) {
      transactions = transactions.filter((t) => t.payment_method === filter.paymentMethod);
    }

    if (filter.branchId) {
      transactions = transactions.filter((t) => t.branch_id === filter.branchId);
    }

    if (filter.startDate) {
      transactions = transactions.filter((t) => t.created_at >= filter.startDate!);
    }

    if (filter.endDate) {
      transactions = transactions.filter((t) => t.created_at <= filter.endDate!);
    }

    if (options?.limit) {
      const offset = options.offset || 0;
      transactions = transactions.slice(offset, offset + options.limit);
    }

    return transactions;
  }

  /**
   * Get transaction summary for a cashier's shift
   */
  async getShiftSummary(
    cashierId: string,
    shiftId: string
  ): Promise<{
    totalTransactions: number;
    totalSales: number;
    totalCash: number;
    totalCard: number;
    totalMpesa: number;
  }> {
    const transactions = await this.findByCriteria({
      cashierId,
    });

    const shiftTransactions = transactions.filter((t) => t.shift_id === shiftId && t.status === 'completed');

    const summary = {
      totalTransactions: shiftTransactions.length,
      totalSales: shiftTransactions.reduce((sum, t) => sum + t.total_amount, 0),
      totalCash: shiftTransactions.filter((t) => t.payment_method === 'cash').reduce((sum, t) => sum + t.amount_paid, 0),
      totalCard: shiftTransactions.filter((t) => t.payment_method === 'card').reduce((sum, t) => sum + t.amount_paid, 0),
      totalMpesa: shiftTransactions
        .filter((t) => t.payment_method === 'mpesa')
        .reduce((sum, t) => sum + t.amount_paid, 0),
    };

    return summary;
  }

  /**
   * Get daily sales report with filtering for role
   */
  async getDailySalesReport(
    date: string,
    userRole: string,
    userId: string,
    branchId?: string
  ): Promise<Transaction[]> {
    const transactions = await this.getForRole(userRole, userId, branchId);

    return transactions.filter((t) => t.created_at.startsWith(date) && t.status === 'completed');
  }

  /**
   * Void a transaction
   */
  async voidTransaction(transactionId: string, reason: string, voidedBy: string): Promise<Transaction | undefined> {
    const transaction = await this.getById(transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const updated: Transaction = {
      ...transaction,
      status: 'voided',
      void_reason: reason,
      voided_by: voidedBy,
      voided_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    await this.update(updated);
    return updated;
  }

  /**
   * Create refund for a transaction
   */
  async createRefund(transactionId: string, reason: string, refundedBy: string): Promise<Transaction | undefined> {
    const transaction = await this.getById(transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const updated: Transaction = {
      ...transaction,
      status: 'refunded',
      refund_reason: reason,
      refunded_by: refundedBy,
      refunded_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    await this.update(updated);
    return updated;
  }
}

export const transactionRepository = new TransactionRepository();
