import { Transaction, Customer, Product } from '../types';
import { transactionRepository } from '../repositories/TransactionRepository';

export interface SalesReport {
  period: { start: Date; end: Date };
  totalSales: number;
  transactionCount: number;
  totalDiscount: number;
  totalTax: number;
  totalCash: number;
  totalCard: number;
  totalMpesa: number;
  averageTransaction: number;
  salesByType: Record<string, { count: number; amount: number }>;
  topProducts: Array<{ product: string; quantity: number; revenue: number }>;
  topCustomers: Array<{ customer: string; purchases: number; spent: number }>;
}

export interface CashierReport {
  cashierId: string;
  cashierName: string;
  period: { start: Date; end: Date };
  totalSales: number;
  transactionCount: number;
  totalDiscount: number;
  totalCash: number;
  discrepancy: number;
  accuracy: number; // percentage
}

export interface InventoryReport {
  product: string;
  sku: string;
  currentStock: number;
  reorderLevel: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  lastRestocked: Date;
  avgDailySales: number;
  daysUntilStockout?: number;
}

export interface DashboardMetrics {
  today: {
    sales: number;
    transactions: number;
    averageValue: number;
    topSaleType: string;
  };
  thisWeek: {
    sales: number;
    transactions: number;
    dayWithHighestSales: string;
  };
  thisMonth: {
    sales: number;
    transactions: number;
    targetProgress: number; // percentage
  };
  topPerformers: Array<{
    rank: number;
    cashier: string;
    sales: number;
    transactions: number;
  }>;
}

export class ReportingService {
  /**
   * Generate sales report for a date range
   */
  async generateSalesReport(startDate: Date, endDate: Date): Promise<SalesReport> {
    const transactions = await transactionRepository.getByDateRange(startDate, endDate);

    // Calculate totals
    const totalSales = transactions.reduce((sum, t) => sum + t.total_amount, 0);
    const totalDiscount = transactions.reduce((sum, t) => sum + t.discount_amount, 0);
    const totalTax = transactions.reduce((sum, t) => sum + t.tax_amount, 0);

    // Payment method breakdown
    const paymentMethods = transactions.reduce(
      (acc, t) => {
        acc[t.payment_method] = (acc[t.payment_method] || 0) + t.total_amount;
        return acc;
      },
      {} as Record<string, number>
    );

    // Sales by type
    const salesByType = transactions.reduce(
      (acc, t) => {
        if (!acc[t.sale_type]) {
          acc[t.sale_type] = { count: 0, amount: 0 };
        }
        acc[t.sale_type].count += 1;
        acc[t.sale_type].amount += t.total_amount;
        return acc;
      },
      {} as Record<string, { count: number; amount: number }>
    );

    // Top products
    const productMap = new Map<
      string,
      { product: string; quantity: number; revenue: number }
    >();
    transactions.forEach((t) => {
      t.items?.forEach((item) => {
        const key = item.product_id;
        if (!productMap.has(key)) {
          productMap.set(key, { product: item.product_name, quantity: 0, revenue: 0 });
        }
        const existing = productMap.get(key)!;
        existing.quantity += item.quantity;
        existing.revenue += item.subtotal;
      });
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Top customers
    const customerMap = new Map<string, { customer: string; purchases: number; spent: number }>();
    transactions.forEach((t) => {
      if (t.customer_id) {
        const key = t.customer_id;
        if (!customerMap.has(key)) {
          customerMap.set(key, { customer: 'Customer', purchases: 0, spent: 0 });
        }
        const existing = customerMap.get(key)!;
        existing.purchases += 1;
        existing.spent += t.total_amount;
      }
    });

    const topCustomers = Array.from(customerMap.values())
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 10);

    return {
      period: { start: startDate, end: endDate },
      totalSales,
      transactionCount: transactions.length,
      totalDiscount,
      totalTax,
      totalCash: paymentMethods['cash'] || 0,
      totalCard: paymentMethods['card'] || 0,
      totalMpesa: paymentMethods['mpesa'] || 0,
      averageTransaction: transactions.length > 0 ? totalSales / transactions.length : 0,
      salesByType,
      topProducts,
      topCustomers,
    };
  }

  /**
   * Generate cashier performance report
   */
  async generateCashierReport(cashierId: string, startDate: Date, endDate: Date): Promise<CashierReport> {
    const transactions = await transactionRepository.getByCashierId(cashierId, startDate, endDate);

    const totalSales = transactions.reduce((sum, t) => sum + t.total_amount, 0);
    const totalDiscount = transactions.reduce((sum, t) => sum + t.discount_amount, 0);
    const totalCash = transactions
      .filter((t) => t.payment_method === 'cash')
      .reduce((sum, t) => sum + t.amount_paid, 0);

    // Calculate accuracy (would compare with actual drawer count in real app)
    const expectedCash = totalCash + 50000; // Add opening balance
    const accuracy = 98; // Mock accuracy score

    return {
      cashierId,
      cashierName: 'Cashier Name', // Would be fetched from user data
      period: { start: startDate, end: endDate },
      totalSales,
      transactionCount: transactions.length,
      totalDiscount,
      totalCash,
      discrepancy: 500, // Mock discrepancy
      accuracy,
    };
  }

  /**
   * Generate dashboard metrics
   */
  async generateDashboardMetrics(): Promise<DashboardMetrics> {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get transactions for different periods
    const todayTxns = await transactionRepository.getByDateRange(startOfToday, today);
    const weekTxns = await transactionRepository.getByDateRange(weekStart, today);
    const monthTxns = await transactionRepository.getByDateRange(monthStart, today);

    // Calculate metrics
    const todaySales = todayTxns.reduce((sum, t) => sum + t.total_amount, 0);
    const weekSales = weekTxns.reduce((sum, t) => sum + t.total_amount, 0);
    const monthSales = monthTxns.reduce((sum, t) => sum + t.total_amount, 0);

    // Top sale type today
    const saleTypeMap = todayTxns.reduce(
      (acc, t) => {
        acc[t.sale_type] = (acc[t.sale_type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const topSaleType = Object.entries(saleTypeMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'retail';

    // Top cashiers this month
    const cashierMap = new Map<string, { cashier: string; sales: number; transactions: number }>();
    monthTxns.forEach((t) => {
      const key = t.cashier_id;
      if (!cashierMap.has(key)) {
        cashierMap.set(key, { cashier: t.cashier_id, sales: 0, transactions: 0 });
      }
      const existing = cashierMap.get(key)!;
      existing.sales += t.total_amount;
      existing.transactions += 1;
    });

    const topPerformers = Array.from(cashierMap.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
      .map((p, i) => ({ rank: i + 1, ...p }));

    // Monthly target (mock: 500,000)
    const monthlyTarget = 500000;
    const targetProgress = (monthSales / monthlyTarget) * 100;

    return {
      today: {
        sales: todaySales,
        transactions: todayTxns.length,
        averageValue: todayTxns.length > 0 ? todaySales / todayTxns.length : 0,
        topSaleType,
      },
      thisWeek: {
        sales: weekSales,
        transactions: weekTxns.length,
        dayWithHighestSales: 'Monday', // Would calculate actual highest day
      },
      thisMonth: {
        sales: monthSales,
        transactions: monthTxns.length,
        targetProgress: Math.min(targetProgress, 100),
      },
      topPerformers,
    };
  }

  /**
   * Generate inventory report
   */
  async generateInventoryReport(products: Product[]): Promise<InventoryReport[]> {
    return products.map((p) => ({
      product: p.name,
      sku: p.sku || 'N/A',
      currentStock: p.stock,
      reorderLevel: p.reorder_level,
      status: p.stock <= 0 ? 'out-of-stock' : p.stock <= p.reorder_level ? 'low-stock' : 'in-stock',
      lastRestocked: new Date(p.updated_at),
      avgDailySales: 10, // Mock average
      daysUntilStockout: p.stock > 0 && p.stock <= p.reorder_level ? Math.ceil(p.stock / 10) : undefined,
    }));
  }
}

export const reportingService = new ReportingService();
