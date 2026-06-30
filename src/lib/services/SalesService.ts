import { Transaction, TransactionItem, Customer, Product } from '../types';
import { transactionRepository } from '../repositories/TransactionRepository';
import { generateId } from '../db';
import { salesWorkflows } from '../config/menuConfig';

export interface SalesContext {
  saleType: 'retail' | 'wholesale' | 'lipa_mdogo' | 'kyamaa';
  cashierId: string;
  shiftId?: string;
  branchId?: string;
  customerId?: string;
  customer?: Customer;
}

export interface CartItem extends TransactionItem {
  discount?: number;
  taxable?: boolean;
}

export interface SalesWorkflowState {
  context: SalesContext;
  cartItems: CartItem[];
  discount: number;
  discountReason?: string;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  paymentMethod: string;
  notes?: string;
  requiresApproval: boolean;
  approvalReason?: string;
}

export class SalesService {
  private workflowState: SalesWorkflowState | null = null;

  /**
   * Initialize a new sales workflow
   */
  initializeWorkflow(context: SalesContext): void {
    const workflow = salesWorkflows[context.saleType];

    if (!workflow) {
      throw new Error(`Invalid sale type: ${context.saleType}`);
    }

    this.workflowState = {
      context,
      cartItems: [],
      discount: workflow.defaultDiscount || 0,
      taxAmount: 0,
      totalAmount: 0,
      amountPaid: 0,
      paymentMethod: workflow.allowedPaymentMethods[0] || 'cash',
      requiresApproval: false,
    };
  }

  /**
   * Add item to cart
   */
  addToCart(product: Product, quantity: number, unitPrice?: number): void {
    if (!this.workflowState) {
      throw new Error('Workflow not initialized');
    }

    const price = unitPrice || product.price;
    const item: CartItem = {
      id: generateId(),
      product_id: product.id,
      product_name: product.name,
      quantity,
      unit_price: price,
      subtotal: price * quantity,
      taxable: product.tax_category !== 'exempt',
    };

    this.workflowState.cartItems.push(item);
    this.calculateTotals();
  }

  /**
   * Update cart item quantity
   */
  updateCartItem(itemId: string, quantity: number): void {
    if (!this.workflowState) {
      throw new Error('Workflow not initialized');
    }

    const item = this.workflowState.cartItems.find((i) => i.id === itemId);
    if (item) {
      item.quantity = quantity;
      item.subtotal = item.unit_price * quantity;
      this.calculateTotals();
    }
  }

  /**
   * Remove item from cart
   */
  removeFromCart(itemId: string): void {
    if (!this.workflowState) {
      throw new Error('Workflow not initialized');
    }

    this.workflowState.cartItems = this.workflowState.cartItems.filter((i) => i.id !== itemId);
    this.calculateTotals();
  }

  /**
   * Apply discount
   */
  applyDiscount(amount: number, reason?: string): void {
    if (!this.workflowState) {
      throw new Error('Workflow not initialized');
    }

    const workflow = salesWorkflows[this.workflowState.context.saleType];

    if (amount > 0 && workflow.requiresApprovalAbove && amount > workflow.requiresApprovalAbove) {
      this.workflowState.requiresApproval = true;
      this.workflowState.approvalReason = `Discount approval required: ${amount} exceeds limit of ${workflow.requiresApprovalAbove}`;
    }

    this.workflowState.discount = amount;
    this.workflowState.discountReason = reason;
    this.calculateTotals();
  }

  /**
   * Calculate totals including tax and discount
   */
  private calculateTotals(): void {
    if (!this.workflowState) return;

    const workflow = salesWorkflows[this.workflowState.context.saleType];
    const subtotal = this.workflowState.cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    const discountedAmount = subtotal - this.workflowState.discount;

    // Calculate tax only if applicable
    let taxAmount = 0;
    if (workflow.taxApplicable) {
      const taxableItems = this.workflowState.cartItems.filter((i) => i.taxable);
      const taxableSubtotal = taxableItems.reduce((sum, item) => sum + item.subtotal, 0);
      taxAmount = taxableSubtotal * 0.16; // 16% tax
    }

    this.workflowState.taxAmount = taxAmount;
    this.workflowState.totalAmount = discountedAmount + taxAmount;

    // Check if total requires approval
    if (workflow.requiresApprovalAbove && this.workflowState.totalAmount > workflow.requiresApprovalAbove) {
      this.workflowState.requiresApproval = true;
      this.workflowState.approvalReason = `Sale approval required: ${this.workflowState.totalAmount} exceeds limit of ${workflow.requiresApprovalAbove}`;
    }
  }

  /**
   * Set payment method
   */
  setPaymentMethod(method: string): void {
    if (!this.workflowState) {
      throw new Error('Workflow not initialized');
    }

    const workflow = salesWorkflows[this.workflowState.context.saleType];

    if (!workflow.allowedPaymentMethods.includes(method)) {
      throw new Error(`Payment method ${method} not allowed for ${this.workflowState.context.saleType}`);
    }

    this.workflowState.paymentMethod = method;
  }

  /**
   * Record payment
   */
  setAmountPaid(amount: number): void {
    if (!this.workflowState) {
      throw new Error('Workflow not initialized');
    }

    this.workflowState.amountPaid = amount;
  }

  /**
   * Validate workflow before completion
   */
  validate(): { valid: boolean; errors: string[] } {
    if (!this.workflowState) {
      return { valid: false, errors: ['Workflow not initialized'] };
    }

    const errors: string[] = [];
    const workflow = salesWorkflows[this.workflowState.context.saleType];

    // Validate cart has items
    if (this.workflowState.cartItems.length === 0) {
      errors.push('Cart is empty');
    }

    // Validate customer for workflows that require it
    if (workflow.requiresCustomer && !this.workflowState.context.customerId) {
      errors.push(`Customer required for ${this.workflowState.context.saleType}`);
    }

    // Validate minimum order value
    if (workflow.minOrderValue && this.workflowState.totalAmount < workflow.minOrderValue) {
      errors.push(`Minimum order value is ${workflow.minOrderValue}`);
    }

    // Validate payment
    if (this.workflowState.amountPaid < this.workflowState.totalAmount) {
      errors.push('Insufficient payment amount');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Complete the sale and create transaction
   */
  async completeSale(notes?: string): Promise<Transaction> {
    const validation = this.validate();

    if (!validation.valid) {
      throw new Error(`Sale validation failed: ${validation.errors.join(', ')}`);
    }

    if (!this.workflowState) {
      throw new Error('Workflow not initialized');
    }

    const changeAmount = this.workflowState.amountPaid - this.workflowState.totalAmount;

    const transaction: Transaction = {
      id: generateId(),
      sale_type: this.workflowState.context.saleType,
      cashier_id: this.workflowState.context.cashierId,
      branch_id: this.workflowState.context.branchId,
      shift_id: this.workflowState.context.shiftId,
      customer_id: this.workflowState.context.customerId,
      total_amount: this.workflowState.totalAmount,
      amount_paid: this.workflowState.amountPaid,
      change_amount: changeAmount,
      payment_method: this.workflowState.paymentMethod,
      discount_amount: this.workflowState.discount,
      discount_reason: this.workflowState.discountReason,
      tax_amount: this.workflowState.taxAmount,
      status: 'completed',
      notes,
      receipt_number: this.generateReceiptNumber(),
      created_at: new Date().toISOString(),
      sync_status: 'pending',
      items: this.workflowState.cartItems,
    };

    // Save transaction
    await transactionRepository.create(transaction);

    // Reset workflow
    this.workflowState = null;

    return transaction;
  }

  /**
   * Get current workflow state
   */
  getState(): SalesWorkflowState | null {
    return this.workflowState;
  }

  /**
   * Clear workflow
   */
  clearWorkflow(): void {
    this.workflowState = null;
  }

  /**
   * Generate receipt number
   */
  private generateReceiptNumber(): string {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-6);
    return `RCP-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${timestamp}`;
  }
}

export const salesService = new SalesService();
