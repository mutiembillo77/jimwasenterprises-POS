import { useState, useEffect, useMemo } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { getAllProducts, getAllCustomers } from '../../lib/db';
import { salesService, SalesContext } from '../../lib/services/SalesService';
import { SalesCart } from '../../components/SalesCart';
import { PaymentForm } from '../../components/PaymentForm';
import type { Product, Customer } from '../../lib/types';
import { useAuth } from '../../context/AuthContext';

export function RetailWorkflow() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showPayment, setShowPayment] = useState(false);
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
    if (!user) return;

    const context: SalesContext = {
      saleType: 'retail',
      cashierId: user.id,
      shiftId: undefined, // Would be set from shift context
      branchId: undefined,
    };

    salesService.initializeWorkflow(context);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode?.includes(searchTerm)
    );
  }, [products, searchTerm]);

  const workflowState = salesService.getState();

  const handleAddProduct = (product: Product) => {
    if (!workflowState || product.stock <= 0) {
      setError('Product out of stock');
      return;
    }

    salesService.addToCart(product, 1, product.price);
    setSuccess(`Added ${product.name} to cart`);
    setTimeout(() => setSuccess(''), 2000);
  };

  const handlePaymentComplete = async (method: string, amount: number, notes?: string) => {
    setIsProcessing(true);
    setError('');

    try {
      salesService.setPaymentMethod(method);
      salesService.setAmountPaid(amount);

      const transaction = await salesService.completeSale(notes);

      setSuccess(`Sale completed! Receipt: ${transaction.receipt_number}`);
      setShowPayment(false);
      setSelectedCustomer(null);
      setSearchTerm('');

      // Reload data
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
        <h1 className="text-2xl font-bold text-white">Retail Sales</h1>
        <p className="text-slate-400 text-sm">Over-the-counter sales</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-w-0 overflow-hidden">
        {/* Products Section */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-700">
          {/* Search */}
          <div className="p-4 border-b border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-500" size={20} />
              <input
                type="text"
                placeholder="Search products by name, SKU, or barcode..."
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

          {success && (
            <div className="mx-4 mt-4 p-3 bg-emerald-900/50 border border-emerald-700 rounded-lg text-emerald-300">
              {success}
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredProducts.length === 0 ? (
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
                      <p className="font-bold text-emerald-400">{product.price.toLocaleString()}</p>
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
              <div className="flex-1 overflow-y-auto p-4">
                {workflowState && (
                  <SalesCart
                    items={workflowState.cartItems}
                    discount={workflowState.discount}
                    taxAmount={workflowState.taxAmount}
                    totalAmount={workflowState.totalAmount}
                    onUpdateQuantity={(itemId, qty) => salesService.updateCartItem(itemId, qty)}
                    onRemoveItem={(itemId) => salesService.removeFromCart(itemId)}
                    saleType="retail"
                    showTax={true}
                  />
                )}
              </div>

              {/* Checkout Button */}
              <div className="p-4 border-t border-slate-700 space-y-3">
                <button
                  onClick={() => setShowPayment(true)}
                  disabled={!workflowState || workflowState.cartItems.length === 0}
                  className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 font-medium"
                >
                  Proceed to Payment
                </button>
                <button
                  onClick={() => {
                    salesService.clearWorkflow();
                    initializeWorkflow();
                  }}
                  className="w-full py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
                >
                  Clear Cart
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              {workflowState && (
                <PaymentForm
                  totalAmount={workflowState.totalAmount}
                  allowedMethods={['cash', 'card', 'mpesa']}
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
