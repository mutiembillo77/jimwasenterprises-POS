import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getDB, getSyncQueue, removeFromSyncQueue, addToSyncQueue, generateId } from './db';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

// Lazy initialization - only create when needed, not at import time
function getSupabase(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[v0] Supabase URL or key not configured. Sync operations will queue offline.');
    // Return a mock that won't break, operations will queue for retry when online
    return createClient('https://placeholder.supabase.co', 'placeholder_key');
  }

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
    return supabaseInstance;
  } catch (error) {
    console.error('[v0] Failed to initialize Supabase:', error);
    // Return a mock to allow app to continue
    return createClient('https://placeholder.supabase.co', 'placeholder_key');
  }
}

// Export getter for compatibility
export function getSupabaseClient(): SupabaseClient {
  return getSupabase();
}

// Export as a proxy object for compatibility with existing imports
export const supabase = new Proxy({} as SupabaseClient, {
  get: (_target, prop) => {
    const client = getSupabase();
    return (client as any)[prop];
  },
});

let isOnline = navigator.onLine;
let isSyncing = false;

// Sync status for UI
export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error' | 'offline';

interface SyncState {
  status: SyncStatus;
  pendingCount: number;
  lastSync: string | null;
  error: string | null;
}

let syncState: SyncState = {
  status: 'synced',
  pendingCount: 0,
  lastSync: null,
  error: null,
};

const syncListeners: Set<(state: SyncState) => void> = new Set();

export function subscribeToSyncState(listener: (state: SyncState) => void): () => void {
  syncListeners.add(listener);
  return () => syncListeners.delete(listener);
}

function notifySyncState() {
  syncListeners.forEach(listener => listener({ ...syncState }));
}

export function getSyncState(): SyncState {
  return { ...syncState };
}

export function initNetworkListeners() {
  window.addEventListener('online', () => {
    isOnline = true;
    syncState.status = 'synced';
    notifySyncState();
    triggerSync();
  });

  window.addEventListener('offline', () => {
    isOnline = false;
    syncState.status = 'offline';
    notifySyncState();
  });

  // Initial sync status check
  checkPendingCount();
}

async function checkPendingCount() {
  try {
    const queue = await getSyncQueue();
    syncState.pendingCount = queue.length;
    notifySyncState();
  } catch (error) {
    console.error('Failed to check pending count:', error);
  }
}

export function getOnlineStatus(): boolean {
  return isOnline;
}

async function triggerSync() {
  if (!isOnline || isSyncing) return;

  isSyncing = true;
  syncState.status = 'syncing';
  syncState.error = null;
  notifySyncState();

  try {
    const queue = await getSyncQueue();

    let successCount = 0;
    let failCount = 0;

    for (const item of queue) {
      try {
        await processSyncItem(item);
        await removeFromSyncQueue(item.id);
        successCount++;
      } catch (error) {
        console.error('Sync failed for item:', item.id, error);
        failCount++;
      }
    }

    await syncFromRemote();

    syncState.status = 'synced';
    syncState.lastSync = new Date().toISOString();
    syncState.pendingCount = queue.length - successCount;

    if (failCount > 0) {
      syncState.error = `${failCount} items failed to sync`;
    }
  } catch (error) {
    console.error('Sync error:', error);
    syncState.status = 'error';
    syncState.error = error instanceof Error ? error.message : 'Sync failed';
  } finally {
    isSyncing = false;
    notifySyncState();
  }
}

async function processSyncItem(item: { table_name: string; operation: string; data: Record<string, unknown> }) {
  const { table_name, operation, data } = item;
  const table = getSupabase().from(table_name);

  switch (operation) {
    case 'insert':
      await table.insert(data);
      break;
    case 'update':
      await table.upsert(data);
      break;
    case 'delete':
      await table.delete().eq('id', data.id);
      break;
  }
}

async function syncFromRemote() {
  const db = await getDB();

  // Sync customers
  const { data: customers } = await getSupabase().from('customers').select('*');
  if (customers) {
    for (const customer of customers) {
      await db.put('customers', { ...customer, sync_status: 'synced' });
    }
  }

  // Sync products
  const { data: products } = await getSupabase().from('products').select('*');
  if (products) {
    for (const product of products) {
      await db.put('products', { ...product, sync_status: 'synced' });
    }
  }

  // Sync transactions
  const { data: transactions } = await getSupabase().from('transactions').select('*, transaction_items(*)');
  if (transactions) {
    for (const tx of transactions) {
      await db.put('transactions', {
        ...tx,
        sync_status: 'synced',
        items: tx.transaction_items || [],
      });
    }
  }

  // Sync installment plans
  const { data: plans } = await getSupabase().from('installment_plans').select('*');
  if (plans) {
    for (const plan of plans) {
      await db.put('installment_plans', { ...plan, sync_status: 'synced' });
    }
  }

  // Sync installment payments
  const { data: payments } = await getSupabase().from('installment_payments').select('*');
  if (payments) {
    for (const payment of payments) {
      await db.put('installment_payments', { ...payment, sync_status: 'synced' });
    }
  }

  // Sync loyalty transactions
  const { data: loyalty } = await getSupabase().from('loyalty_transactions').select('*');
  if (loyalty) {
    for (const ltx of loyalty) {
      await db.put('loyalty_transactions', { ...ltx, sync_status: 'synced' });
    }
  }

  // Sync stock movements
  const { data: stockMovements } = await getSupabase().from('stock_movements').select('*');
  if (stockMovements) {
    for (const movement of stockMovements) {
      await db.put('stock_movements', { ...movement, sync_status: 'synced' });
    }
  }

  // Sync suppliers
  const { data: suppliers } = await getSupabase().from('suppliers').select('*');
  if (suppliers) {
    for (const supplier of suppliers) {
      await db.put('suppliers', { ...supplier, sync_status: 'synced' });
    }
  }

  // Sync deliveries
  const { data: deliveries } = await getSupabase().from('deliveries').select('*');
  if (deliveries) {
    for (const delivery of deliveries) {
      await db.put('deliveries', { ...delivery, sync_status: 'synced' });
    }
  }

  // Sync users
  const { data: users } = await getSupabase().from('users').select('*');
  if (users) {
    for (const user of users) {
      await db.put('users', { ...user, sync_status: 'synced' });
    }
  }

  // Sync roles
  const { data: roles } = await getSupabase().from('roles').select('*');
  if (roles) {
    for (const role of roles) {
      await db.put('roles', { ...role, sync_status: 'synced' });
    }
  }

  // Sync audit logs
  const { data: auditLogs } = await getSupabase().from('audit_logs').select('*').order('created_at', { ascending: false }).limit(500);
  if (auditLogs) {
    for (const log of auditLogs) {
      await db.put('audit_logs', { ...log, sync_status: 'synced' });
    }
  }

  // Sync approval requests
  const { data: approvalRequests } = await getSupabase().from('approval_requests').select('*');
  if (approvalRequests) {
    for (const request of approvalRequests) {
      await db.put('approval_requests', { ...request, sync_status: 'synced' });
    }
  }

  // Sync settings
  const { data: businessSettings } = await getSupabase().from('business_settings').select('*');
  if (businessSettings && businessSettings.length > 0) {
    await db.put('business_settings', { ...businessSettings[0], sync_status: 'synced' });
  }

  const { data: mpesaSettings } = await getSupabase().from('mpesa_settings').select('*');
  if (mpesaSettings && mpesaSettings.length > 0) {
    await db.put('mpesa_settings', { ...mpesaSettings[0], sync_status: 'synced' });
  }

  const { data: paymentMethods } = await getSupabase().from('payment_methods').select('*');
  if (paymentMethods) {
    for (const method of paymentMethods) {
      await db.put('payment_methods', method);
    }
  }

  const { data: loyaltySettings } = await getSupabase().from('loyalty_settings').select('*');
  if (loyaltySettings && loyaltySettings.length > 0) {
    await db.put('loyalty_settings', { ...loyaltySettings[0], sync_status: 'synced' });
  }

  const { data: receiptSettings } = await getSupabase().from('receipt_settings').select('*');
  if (receiptSettings && receiptSettings.length > 0) {
    await db.put('receipt_settings', { ...receiptSettings[0], sync_status: 'synced' });
  }
}

export async function syncNow(): Promise<{ success: boolean; message: string }> {
  if (!isOnline) {
    return { success: false, message: 'You are offline. Changes will sync when online.' };
  }

  try {
    await triggerSync();
    return { success: true, message: 'Sync completed successfully' };
  } catch (error) {
    console.error('Sync error:', error);
    return { success: false, message: 'Sync failed. Will retry automatically.' };
  }
}

export function queueForSync(tableName: string, operation: 'insert' | 'update' | 'delete', data: unknown) {
  addToSyncQueue({
    id: generateId(),
    table_name: tableName,
    operation,
    data: data as Record<string, unknown>,
    created_at: new Date().toISOString(),
  });

  syncState.pendingCount++;
  syncState.status = 'pending';
  notifySyncState();

  if (isOnline) {
    triggerSync();
  }
}

// Customer sync functions
export async function syncInsertCustomer(customer: unknown) {
  if (!isOnline) {
    queueForSync('customers', 'insert', customer);
    return;
  }

  try {
    const { error } = await getSupabase().from('customers').insert(customer as Record<string, unknown>);
    if (error) throw error;
  } catch {
    queueForSync('customers', 'insert', customer);
  }
}

export async function syncUpdateCustomer(customer: unknown) {
  if (!isOnline) {
    queueForSync('customers', 'update', customer);
    return;
  }

  try {
    const { error } = await getSupabase().from('customers').upsert(customer as Record<string, unknown>);
    if (error) throw error;
  } catch {
    queueForSync('customers', 'update', customer);
  }
}

// Transaction sync functions
export async function syncInsertTransaction(transaction: unknown, items: unknown[]) {
  if (!isOnline) {
    queueForSync('transactions', 'insert', transaction);
    items.forEach(item => queueForSync('transaction_items', 'insert', item));
    return;
  }

  try {
    const { error: txError } = await getSupabase().from('transactions').insert(transaction as Record<string, unknown>);
    if (txError) throw txError;

    if (items.length > 0) {
      const { error: itemsError } = await getSupabase().from('transaction_items').insert(items as Record<string, unknown>[]);
      if (itemsError) throw itemsError;
    }
  } catch {
    queueForSync('transactions', 'insert', transaction);
    items.forEach(item => queueForSync('transaction_items', 'insert', item));
  }
}

// Installment plan sync functions
export async function syncInsertInstallmentPlan(plan: unknown) {
  if (!isOnline) {
    queueForSync('installment_plans', 'insert', plan);
    return;
  }

  try {
    const { error } = await getSupabase().from('installment_plans').insert(plan as Record<string, unknown>);
    if (error) throw error;
  } catch {
    queueForSync('installment_plans', 'insert', plan);
  }
}

export async function syncUpdateInstallmentPlan(plan: unknown) {
  if (!isOnline) {
    queueForSync('installment_plans', 'update', plan);
    return;
  }

  try {
    const { error } = await getSupabase().from('installment_plans').upsert(plan as Record<string, unknown>);
    if (error) throw error;
  } catch {
    queueForSync('installment_plans', 'update', plan);
  }
}

// Installment payment sync functions
export async function syncInsertInstallmentPayment(payment: unknown) {
  if (!isOnline) {
    queueForSync('installment_payments', 'insert', payment);
    return;
  }

  try {
    const { error } = await getSupabase().from('installment_payments').insert(payment as Record<string, unknown>);
    if (error) throw error;
  } catch {
    queueForSync('installment_payments', 'insert', payment);
  }
}

// Loyalty transaction sync functions
export async function syncInsertLoyaltyTransaction(loyaltyTx: unknown) {
  if (!isOnline) {
    queueForSync('loyalty_transactions', 'insert', loyaltyTx);
    return;
  }

  try {
    const { error } = await getSupabase().from('loyalty_transactions').insert(loyaltyTx as Record<string, unknown>);
    if (error) throw error;
  } catch {
    queueForSync('loyalty_transactions', 'insert', loyaltyTx);
  }
}

// Product sync functions
export async function syncInsertProduct(product: unknown) {
  if (!isOnline) {
    queueForSync('products', 'insert', product);
    return;
  }

  try {
    const { error } = await getSupabase().from('products').insert(product as Record<string, unknown>);
    if (error) throw error;
  } catch {
    queueForSync('products', 'insert', product);
  }
}

export async function syncUpdateProduct(product: unknown) {
  if (!isOnline) {
    queueForSync('products', 'update', product);
    return;
  }

  try {
    const { error } = await getSupabase().from('products').upsert(product as Record<string, unknown>);
    if (error) throw error;
  } catch {
    queueForSync('products', 'update', product);
  }
}

// Stock movement sync
export async function syncInsertStockMovement(movement: unknown) {
  if (!isOnline) {
    queueForSync('stock_movements', 'insert', movement);
    return;
  }

  try {
    const { error } = await getSupabase().from('stock_movements').insert(movement as Record<string, unknown>);
    if (error) throw error;
  } catch {
    queueForSync('stock_movements', 'insert', movement);
  }
}

// User sync functions
export async function syncInsertUser(user: unknown) {
  if (!isOnline) {
    queueForSync('users', 'insert', user);
    return;
  }

  try {
    const { error } = await getSupabase().from('users').insert(user as Record<string, unknown>);
    if (error) throw error;
  } catch {
    queueForSync('users', 'insert', user);
  }
}

export async function syncUpdateUser(user: unknown) {
  if (!isOnline) {
    queueForSync('users', 'update', user);
    return;
  }

  try {
    const { error } = await getSupabase().from('users').upsert(user as Record<string, unknown>);
    if (error) throw error;
  } catch {
    queueForSync('users', 'update', user);
  }
}

// Audit log sync
export async function syncInsertAuditLog(log: unknown) {
  if (!isOnline) {
    queueForSync('audit_logs', 'insert', log);
    return;
  }

  try {
    const { error } = await getSupabase().from('audit_logs').insert(log as Record<string, unknown>);
    if (error) throw error;
  } catch {
    queueForSync('audit_logs', 'insert', log);
  }
}

// Approval request sync
export async function syncInsertApprovalRequest(request: unknown) {
  if (!isOnline) {
    queueForSync('approval_requests', 'insert', request);
    return;
  }

  try {
    const { error } = await getSupabase().from('approval_requests').insert(request as Record<string, unknown>);
    if (error) throw error;
  } catch {
    queueForSync('approval_requests', 'insert', request);
  }
}

export async function syncUpdateApprovalRequest(request: unknown) {
  if (!isOnline) {
    queueForSync('approval_requests', 'update', request);
    return;
  }

  try {
    const { error } = await getSupabase().from('approval_requests').upsert(request as Record<string, unknown>);
    if (error) throw error;
  } catch {
    queueForSync('approval_requests', 'update', request);
  }
}

// Delivery sync
export async function syncInsertDelivery(delivery: unknown) {
  if (!isOnline) {
    queueForSync('deliveries', 'insert', delivery);
    return;
  }

  try {
    const { error } = await getSupabase().from('deliveries').insert(delivery as Record<string, unknown>);
    if (error) throw error;
  } catch {
    queueForSync('deliveries', 'insert', delivery);
  }
}

export async function syncUpdateDelivery(delivery: unknown) {
  if (!isOnline) {
    queueForSync('deliveries', 'update', delivery);
    return;
  }

  try {
    const { error } = await getSupabase().from('deliveries').upsert(delivery as Record<string, unknown>);
    if (error) throw error;
  } catch {
    queueForSync('deliveries', 'update', delivery);
  }
}
