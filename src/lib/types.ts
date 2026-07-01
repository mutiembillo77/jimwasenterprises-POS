export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  loyalty_points: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
  sync_status: 'pending' | 'synced';
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  cost: number;
  stock: number;
  category?: string;
  image_url?: string;
  low_stock_alert?: number;
  barcode?: string;
  tax_category?: 'exempt' | 'standard_16';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sync_status: 'pending' | 'synced';
  local_id?: string;
}

export interface TransactionItem {
  id: string;
  transaction_id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  // Sale type: 'retail', 'wholesale', 'lipa_mdogo', 'kyamaa'
  sale_type: 'retail' | 'wholesale' | 'lipa_mdogo' | 'kyamaa';
  // User and operational context
  cashier_id: string;
  branch_id?: string;
  shift_id?: string;
  // Customer and payment
  customer_id?: string;
  total_amount: number;
  amount_paid: number;
  change_amount: number;
  payment_method: string;
  discount_amount?: number;
  discount_reason?: string;
  tax_amount?: number;
  // Transaction state
  status: 'completed' | 'voided' | 'pending' | 'refunded' | 'suspended';
  void_reason?: string;
  voided_by?: string;
  voided_at?: string;
  refund_reason?: string;
  refunded_by?: string;
  refunded_at?: string;
  // Additional context
  notes?: string;
  receipt_number?: string;
  reference_number?: string;
  // Timestamps and sync
  created_at: string;
  updated_at?: string;
  sync_status: 'pending' | 'synced';
  // Items
  items: TransactionItem[];
}

export interface InstallmentPlan {
  id: string;
  customer_id: string;
  product_id: string;
  product_name: string;
  total_amount: number;
  amount_paid: number;
  installment_count: number;
  status: 'active' | 'completed' | 'cancelled';
  product_released: boolean;
  release_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  sync_status: 'pending' | 'synced';
}

export interface InstallmentPayment {
  id: string;
  plan_id: string;
  amount: number;
  payment_method: string;
  notes?: string;
  created_at: string;
  sync_status: 'pending' | 'synced';
}

export interface LoyaltyTransaction {
  id: string;
  customer_id: string;
  points: number;
  transaction_type: 'earned' | 'redeemed';
  source: string;
  reference_id?: string;
  created_at: string;
  sync_status: 'pending' | 'synced';
}

export interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface StockMovement {
  id: string;
  product_id: string;
  qty_delta: number;
  reason: 'sale' | 'return' | 'restock' | 'adjustment' | 'initial' | 'transfer_in' | 'transfer_out';
  note?: string;
  balance_after: number;
  reference_type?: 'sale' | 'delivery' | 'adjustment' | 'transfer';
  reference_id?: string;
  branch_id?: string;
  created_at: string;
  created_by: string;
  sync_status: 'pending' | 'synced';
  local_id?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sync_status: 'pending' | 'synced';
}

export interface Delivery {
  id: string;
  supplier_id?: string;
  delivery_note_number?: string;
  status: 'pending' | 'received' | 'cancelled';
  total_items: number;
  total_value: number;
  notes?: string;
  received_by?: string;
  received_at?: string;
  created_at: string;
  updated_at: string;
  sync_status: 'pending' | 'synced';
}

export interface DeliveryItem {
  id: string;
  delivery_id: string;
  product_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  sync_status: 'pending' | 'synced';
}

export interface StockAdjustment {
  id: string;
  product_id: string;
  previous_stock: number;
  new_stock: number;
  reason: string;
  note?: string;
  created_by: string;
  created_at: string;
  sync_status: 'pending' | 'synced';
  local_id?: string;
}

// Domain Models for V2

export interface Shift {
  id: string;
  cashier_id: string;
  branch_id?: string;
  opening_balance: number;
  closing_balance?: number;
  status: 'open' | 'closing' | 'closed';
  opened_at: string;
  closed_at?: string;
  transactions_count: number;
  opening_notes?: string;
  closing_notes?: string;
  created_at: string;
  updated_at?: string;
  sync_status: 'pending' | 'synced';
}

export interface CashDrawer {
  id: string;
  shift_id: string;
  cashier_id: string;
  branch_id?: string;
  opening_balance: number;
  cash_received: number;
  cash_paid: number;
  cash_on_hand: number;
  expected_balance: number;
  variance: number;
  variance_reason?: string;
  status: 'open' | 'balanced' | 'variance' | 'closed';
  opened_at: string;
  closed_at?: string;
  created_at: string;
  updated_at?: string;
  sync_status: 'pending' | 'synced';
}

export interface PaymentTransaction {
  id: string;
  transaction_id: string;
  payment_method: 'cash' | 'card' | 'mpesa' | 'bank_transfer' | 'cheque' | 'other';
  amount: number;
  reference_number?: string;
  status: 'completed' | 'pending' | 'failed' | 'reversed';
  processor_id?: string;
  processor_name?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  sync_status: 'pending' | 'synced';
  // M-Pesa STK PUSH fields
  checkout_request_id?: string;
  phone_number?: string;
  stk_status?: 'pending' | 'confirmed' | 'failed' | 'timeout';
  webhook_received?: string;
  polling_confirmation?: string;
  confirmation_source?: 'webhook' | 'polling';
  callback_data?: Record<string, unknown>;
  completion_mode?: 'auto' | 'manual';
  polling_attempts?: number;
  polling_stopped_at?: string;
  mpesa_receipt_number?: string;
}

export interface StockTake {
  id: string;
  branch_id?: string;
  counted_by: string;
  status: 'draft' | 'in_progress' | 'completed' | 'reconciled';
  total_variance: number;
  variance_reason?: string;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at?: string;
  sync_status: 'pending' | 'synced';
}

export interface StockTakeItem {
  id: string;
  stock_take_id: string;
  product_id: string;
  expected_quantity: number;
  counted_quantity: number;
  variance: number;
  notes?: string;
  sync_status: 'pending' | 'synced';
}

export interface InventoryAdjustment {
  id: string;
  product_id: string;
  adjustment_qty: number;
  reason: 'damage' | 'theft' | 'recount' | 'sample' | 'expiry' | 'transfer' | 'other';
  branch_id?: string;
  approved_by?: string;
  created_by: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  sync_status: 'pending' | 'synced';
}
