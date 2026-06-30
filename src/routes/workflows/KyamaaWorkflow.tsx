import { useState, useEffect, useMemo } from 'react';
import { Search, AlertCircle, Hand } from 'lucide-react';
import { getAllProducts, getAllCustomers } from '../../lib/db';
import { salesService, SalesContext } from '../../lib/services/SalesService';
import { SalesCart } from '../../components/SalesCart';
import type { Product, Customer } from '../../lib/types';
import { useAuth } from '../../context/AuthContext';

export function KyamaaWorkflow() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
    if (selectedCustomer) {
      initializeWorkflow();
    }
  }, [selectedCustomer]);

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
      saleType: 'kyamaa',
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

  const handleCompleteCredit = async () => {
    if (!workflowState) {
      setError('No sale in progress');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // For Kyamaa (credit sales), no payment is collected
      salesService.setPaymentMethod('credit');
      salesService.setAmountPaid(0); // No payment for credit sales

      const transaction = await salesService.completeSale(approvalNotes);

      setSuccess(`Credit sale recorded! Receipt: ${transaction.receipt_number}`);
      setSelectedCustomer(null);
      setApprovalNotes('');
      setSearchTerm('');
      setCustomerSearch('');

      await loadData();

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
          <Hand size={28} className="text-purple-400" />
          Kyamaa (Credit Sales)
        </h1>
        <p className="text-slate-400 text-sm">Record on-credit sales for trusted customers</p>
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
                      <p className="font-bold text-purple-400">{product.price.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">Stock: {product.stock}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Cart and Submit Section */}
        <div className="w-96 flex flex-col border-l border-slate-700 bg-slate-900 overflow-hidden">
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
                  saleType="kyamaa"
                  showTax={false}
                />

                {/* Approval Notes */}
                <div className="bg-slate-700 rounded p-3 space-y-2">
                  <label className="block text-sm text-slate-400">Approval Notes</label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:border-purple-500 resize-none text-sm"
                    placeholder="Add approval notes..."
                    rows={3}
                  />
                </div>
              </>
            )}

            {success && (
              <div className="p-3 bg-emerald-900/50 border border-emerald-700 rounded-lg text-emerald-300 text-sm">
                {success}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="p-4 border-t border-slate-700 space-y-3">
            <button
              onClick={handleCompleteCredit}
              disabled={!workflowState || workflowState.cartItems.length === 0 || isProcessing}
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 font-medium"
            >
              {isProcessing ? 'Recording...' : 'Record Credit Sale'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
