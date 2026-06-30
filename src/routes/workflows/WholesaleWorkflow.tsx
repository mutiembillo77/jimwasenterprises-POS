import { useState, useEffect, useMemo } from 'react';
import { Search, AlertCircle, Users } from 'lucide-react';
import { getAllProducts, getAllCustomers } from '../../lib/db';
import { salesService, SalesContext } from '../../lib/services/SalesService';
import { SalesCart } from '../../components/SalesCart';
import { PaymentForm } from '../../components/PaymentForm';
import type { Product, Customer } from '../../lib/types';
import { useAuth } from '../../context/AuthContext';

export function WholesaleWorkflow() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [discount, setDiscount] = useState(5); // Default 5% wholesale discount
  const [discountReason, setDiscountReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
    initializeWorkflow();
  }, []);

  const loadData = async () => {
    try {
      const prods = await getAllProducts();
      const custs = await getAllCustomers();
      setProducts(prods.filter((p) => p.is_active));
      setCustomers(custs);
    } catch (err) {
      setError('Failed to load data');
    }
  };

  const initializeWorkflow = () => {
    if (!user || !selectedCustomer) return;

    const context: SalesContext = {
      saleType: 'wholesale',
      cashierId: user.id,
      shiftId: undefined,
      branchId: undefined,
      customerId: selectedCustomer.id,
      customer: selectedCustomer,
    };

    salesService.initializeWorkflow(context);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone?.includes(customerSearch)
    );
  }, [customers, customerSearch]);

  const workflowState = salesService.getState();

  const handleAddProduct = (product: Product) => {
    if (!selectedCustomer) {
      setError('Please select a customer first');
      return;
    }

    if (!workflowState || product.stock <= 0) {
      setError('Product out of stock');
      return;
    }

    salesService.addToCart(product, 1, product.price);
    setSuccess(`Added ${product.name} to cart`);
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleApplyDiscount = () => {
    if (workflowState) {
      const discountAmount = (workflowState.totalAmount * discount) / 100;
      salesService.applyDiscount(discountAmount, discountReason || `${discount}% wholesale discount`);
      setSuccess('Discount applied');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  const handlePaymentComplete = async (method: string, amount: number, notes?: string) => {
    setIsProcessing(true);
    setError('');

    try {
      salesService.setPaymentMethod(method);
      salesService.setAmountPaid(amount);

      const transaction = await salesService.completeSale(notes);

      setSuccess(`Wholesale sale completed! Receipt: ${transaction.receipt_number}`);
      setShowPayment(false);
      setSelectedCustomer(null);
      setSearchTerm('');
      setCustomerSearch('');

      await loadData();
      initializeWorkflow();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sale failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users size={28} className="text-amber-400" />
          Wholesale Sales
        </h1>
        <p className="text-slate-400 text-sm">Bulk sales with special pricing</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-w-0 overflow-hidden">
        {/* Products Section */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-700">
          {/* Customer Selection */}
          {!selectedCustomer && (
            <div className="p-4 border-b border-slate-700 bg-slate-800/50">
              <p className="text-sm text-slate-400 mb-2">Select Customer (Required)</p>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-500" size={20} />
                <input
                  type="text"
                  placeholder="Search by customer name or phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              {customerSearch && (
                <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                  {filteredCustomers.map((cust) => (
                    <button
                      key={cust.id}
                      onClick={() => {
                        setSelectedCustomer(cust);
                        setCustomerSearch('');
                        initializeWorkflow();
                      }}
                      className="w-full p-2 text-left bg-slate-700 hover:bg-slate-600 rounded text-white text-sm"
                    >
                      {cust.name} - {cust.phone}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search Products */}
          <div className="p-4 border-b border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-500" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mx-4 mt-4 flex items-center gap-2 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {!selectedCustomer ? (
              <div className="text-center py-8 text-slate-400">Select a customer to start</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No products found</div>
            ) : (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleAddProduct(product)}
                  disabled={product.stock <= 0}
                  className={`w-full p-4 rounded-lg text-left transition ${
                    product.stock <= 0
                      ? 'bg-slate-700 opacity-50 cursor-not-allowed'
                      : 'bg-slate-700 hover:bg-slate-600 cursor-pointer'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-white">{product.name}</p>
                      <p className="text-sm text-slate-400">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-400">{product.price.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">Stock: {product.stock}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Cart and Payment Section */}
        <div className="w-96 flex flex-col border-l border-slate-700 bg-slate-900 overflow-hidden">
          {!showPayment ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedCustomer && (
                  <div className="bg-slate-700 rounded p-3">
                    <p className="text-xs text-slate-400">Customer</p>
                    <p className="font-medium text-white">{selectedCustomer.name}</p>
                  </div>
                )}

                {workflowState && (
                  <>
                    <SalesCart
                      items={workflowState.cartItems}
                      discount={workflowState.discount}
                      taxAmount={workflowState.taxAmount}
                      totalAmount={workflowState.totalAmount}
                      onUpdateQuantity={(itemId, qty) => salesService.updateCartItem(itemId, qty)}
                      onRemoveItem={(itemId) => salesService.removeFromCart(itemId)}
                      saleType="wholesale"
                      showTax={false}
                    />

                    {/* Discount Section */}
                    <div className="bg-slate-700 rounded p-3 space-y-2">
                      <label className="block text-sm text-slate-400">Discount %</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={discount}
                          onChange={(e) => setDiscount(Number(e.target.value))}
                          className="flex-1 px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:border-amber-500"
                          min="0"
                          max="100"
                        />
                        <button
                          onClick={handleApplyDiscount}
                          className="px-3 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Checkout Button */}
              <div className="p-4 border-t border-slate-700 space-y-3">
                <button
                  onClick={() => setShowPayment(true)}
                  disabled={!workflowState || workflowState.cartItems.length === 0}
                  className="w-full py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50 font-medium"
                >
                  Proceed to Payment
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              {workflowState && (
                <PaymentForm
                  totalAmount={workflowState.totalAmount}
                  allowedMethods={['cash', 'card', 'mpesa', 'bank_transfer', 'cheque']}
                  onPaymentComplete={handlePaymentComplete}
                  onCancel={() => setShowPayment(false)}
                  isProcessing={isProcessing}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
