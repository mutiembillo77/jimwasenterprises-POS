// Ledger Module - Financial tracking and reporting for Jimwas POS

import { getAllTransactions, getAllInstallmentPayments, getAllLoyaltyTransactions, getBusinessSettings } from './db';

export interface LedgerEntry {
  id: string;
  date: string;
  type: 'sale' | 'refund' | 'installment_payment' | 'loyalty_redemption' | 'void';
  reference_id: string;
  reference_type: string;
  description: string;
  amount: number;
  payment_method: string;
  customer_id?: string;
  customer_name?: string;
  cashier_id?: string;
  cashier_name?: string;
  branch_id?: string;
  sync_status: 'pending' | 'synced';
}

export interface DailySummary {
  date: string;
  total_sales: number;
  total_refunds: number;
  total_voids: number;
  total_installment_payments: number;
  total_loyalty_redemptions: number;
  net_revenue: number;
  transaction_count: number;
  by_payment_method: Record<string, number>;
}

export interface PeriodSummary {
  start_date: string;
  end_date: string;
  total_sales: number;
  total_refunds: number;
  total_voids: number;
  total_installment_payments: number;
  net_revenue: number;
  transaction_count: number;
  average_daily: number;
  by_payment_method: Record<string, number>;
  daily_breakdown: DailySummary[];
}

export async function getLedgerEntries(
  dateFrom?: string,
  dateTo?: string,
  type?: string
): Promise<LedgerEntry[]> {
  const transactions = await getAllTransactions();
  const installmentPayments = await getAllInstallmentPayments();
  const loyaltyTransactions = await getAllLoyaltyTransactions();

  const entries: LedgerEntry[] = [];

  // Process transactions
  for (const tx of transactions) {
    const txDate = tx.created_at?.split('T')[0] || '';
    if (dateFrom && txDate < dateFrom) continue;
    if (dateTo && txDate > dateTo) continue;

    const entry: LedgerEntry = {
      id: tx.id,
      date: tx.created_at,
      type: tx.status === 'voided' ? 'void' : tx.status === 'refunded' ? 'refund' : 'sale',
      reference_id: tx.id,
      reference_type: 'transaction',
      description: tx.status === 'voided' ? 'Voided Sale' : tx.status === 'refunded' ? 'Refunded Sale' : 'Sale',
      amount: tx.total_amount,
      payment_method: tx.payment_method,
      customer_id: tx.customer_id,
      cashier_id: tx.cashier_id,
      cashier_name: tx.cashier_name,
      branch_id: tx.branch_id,
      sync_status: tx.sync_status,
    };

    if (type && entry.type !== type) continue;

    entries.push(entry);
  }

  // Process installment payments
  for (const payment of installmentPayments) {
    const payDate = payment.created_at?.split('T')[0] || '';
    if (dateFrom && payDate < dateFrom) continue;
    if (dateTo && payDate > dateTo) continue;

    const entry: LedgerEntry = {
      id: payment.id,
      date: payment.created_at,
      type: 'installment_payment',
      reference_id: payment.id,
      reference_type: 'installment_payment',
      description: 'Installment Payment',
      amount: payment.amount,
      payment_method: payment.payment_method,
      sync_status: payment.sync_status,
    };

    if (type && entry.type !== type) continue;

    entries.push(entry);
  }

  // Process loyalty redemptions
  for (const loyalty of loyaltyTransactions) {
    if (loyalty.transaction_type !== 'redeemed') continue;

    const loyDate = loyalty.created_at?.split('T')[0] || '';
    if (dateFrom && loyDate < dateFrom) continue;
    if (dateTo && loyDate > dateTo) continue;

    const entry: LedgerEntry = {
      id: loyalty.id,
      date: loyalty.created_at,
      type: 'loyalty_redemption',
      reference_id: loyalty.id,
      reference_type: 'loyalty_transaction',
      description: 'Loyalty Points Redemption',
      amount: loyalty.points, // Points used, not currency
      payment_method: 'loyalty',
      customer_id: loyalty.customer_id,
      sync_status: loyalty.sync_status,
    };

    if (type && entry.type !== type) continue;

    entries.push(entry);
  }

  // Sort by date descending
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return entries;
}

export async function getDailySummary(date: string): Promise<DailySummary> {
  const entries = await getLedgerEntries(date, date);

  const summary: DailySummary = {
    date,
    total_sales: 0,
    total_refunds: 0,
    total_voids: 0,
    total_installment_payments: 0,
    total_loyalty_redemptions: 0,
    net_revenue: 0,
    transaction_count: 0,
    by_payment_method: {},
  };

  for (const entry of entries) {
    switch (entry.type) {
      case 'sale':
        summary.total_sales += entry.amount;
        summary.transaction_count++;
        break;
      case 'refund':
        summary.total_refunds += entry.amount;
        break;
      case 'void':
        summary.total_voids += entry.amount;
        break;
      case 'installment_payment':
        summary.total_installment_payments += entry.amount;
        break;
      case 'loyalty_redemption':
        summary.total_loyalty_redemptions += entry.amount;
        break;
    }

    // Payment method breakdown
    const method = entry.payment_method || 'unknown';
    summary.by_payment_method[method] = (summary.by_payment_method[method] || 0) + entry.amount;
  }

  summary.net_revenue = summary.total_sales + summary.total_installment_payments - summary.total_refunds;

  return summary;
}

export async function getPeriodSummary(
  startDate: string,
  endDate: string
): Promise<PeriodSummary> {
  const entries = await getLedgerEntries(startDate, endDate);

  const summary: PeriodSummary = {
    start_date: startDate,
    end_date: endDate,
    total_sales: 0,
    total_refunds: 0,
    total_voids: 0,
    total_installment_payments: 0,
    net_revenue: 0,
    transaction_count: 0,
    average_daily: 0,
    by_payment_method: {},
    daily_breakdown: [],
  };

  // Group by day
  const dailyMap = new Map<string, DailySummary>();

  for (const entry of entries) {
    const entryDate = entry.date.split('T')[0];

    if (!dailyMap.has(entryDate)) {
      dailyMap.set(entryDate, {
        date: entryDate,
        total_sales: 0,
        total_refunds: 0,
        total_voids: 0,
        total_installment_payments: 0,
        total_loyalty_redemptions: 0,
        net_revenue: 0,
        transaction_count: 0,
        by_payment_method: {},
      });
    }

    const daily = dailyMap.get(entryDate)!;

    switch (entry.type) {
      case 'sale':
        summary.total_sales += entry.amount;
        daily.total_sales += entry.amount;
        summary.transaction_count++;
        daily.transaction_count++;
        break;
      case 'refund':
        summary.total_refunds += entry.amount;
        daily.total_refunds += entry.amount;
        break;
      case 'void':
        summary.total_voids += entry.amount;
        daily.total_voids += entry.amount;
        break;
      case 'installment_payment':
        summary.total_installment_payments += entry.amount;
        daily.total_installment_payments += entry.amount;
        break;
      case 'loyalty_redemption':
        summary.total_loyalty_redemptions += entry.amount;
        daily.total_loyalty_redemptions += entry.amount;
        break;
    }

    // Payment method breakdown
    const method = entry.payment_method || 'unknown';
    summary.by_payment_method[method] = (summary.by_payment_method[method] || 0) + entry.amount;
    daily.by_payment_method[method] = (daily.by_payment_method[method] || 0) + entry.amount;
  }

  // Calculate daily net revenue
  for (const daily of dailyMap.values()) {
    daily.net_revenue = daily.total_sales + daily.total_installment_payments - daily.total_refunds;
  }

  summary.net_revenue = summary.total_sales + summary.total_installment_payments - summary.total_refunds;

  // Calculate average daily
  const days = Math.max(1, dailyMap.size);
  summary.average_daily = summary.net_revenue / days;

  // Sort daily breakdown by date
  summary.daily_breakdown = Array.from(dailyMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return summary;
}

export async function getTodaySummary(): Promise<DailySummary> {
  const today = new Date().toISOString().split('T')[0];
  return getDailySummary(today);
}

export async function getMonthSummary(): Promise<PeriodSummary> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startDate = startOfMonth.toISOString().split('T')[0];
  const endDate = now.toISOString().split('T')[0];
  return getPeriodSummary(startDate, endDate);
}

export async function getWeekSummary(): Promise<PeriodSummary> {
  const now = new Date();
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startDate = startOfWeek.toISOString().split('T')[0];
  const endDate = now.toISOString().split('T')[0];
  return getPeriodSummary(startDate, endDate);
}

export function formatCurrency(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: 'Cash',
    mpesa: 'M-Pesa',
    card: 'Card',
    bank_transfer: 'Bank Transfer',
    loyalty: 'Loyalty Points',
    unknown: 'Other',
  };
  return labels[method] || method;
}
