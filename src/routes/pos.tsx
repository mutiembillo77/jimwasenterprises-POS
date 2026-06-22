import { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, Trash2, Search, User, ShoppingCart, Banknote, CreditCard, Smartphone, X, Package, Archive, ArchiveRestore } from 'lucide-react';
import { generateId, saveProduct, getAllProducts, getAllCustomers, saveCustomer, saveTransaction, saveLoyaltyTransaction } from '../lib/db';
import { syncInsertTransaction, syncInsertCustomer, syncUpdateCustomer, syncInsertLoyaltyTransaction, syncInsertProduct } from '../lib/sync';
import type { Product, Customer, CartItem } from '../lib/types';

const LOYALTY_POINTS_PER_SHILLING = 100;

export function POSTerminal() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', category: '' });
  const [parkedSales, setParkedSales] = useState<Array<{id: string; cart: CartItem[]; customer: Customer | null; timestamp: string}>>([]);
  const [showParkedSales, setShowParkedSales] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const prods = await getAllProducts();
    const custs = await getAllCustomers();
    setProducts(prods.filter(p => p.is_active));
    setCustomers(custs);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone?.includes(customerSearch)
    );
  }, [customers, customerSearch]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const change = useMemo(() => {
    const paid = parseFloat(amountPaid) || 0;
    return Math.max(0, paid - cartTotal);
  }, [amountPaid, cartTotal]);

  const loyaltyPointsToEarn = useMemo(() => {
    if (!selectedCustomer) return 0;
    return Math.floor(cartTotal / LOYALTY_POINTS_PER_SHILLING);
  }, [cartTotal, selectedCustomer]);

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.product_id === product.id);
      if (existing) {
        return prevCart.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unit_price }
            : item
        );
      }

      return [...prevCart, {
        id: generateId(),
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        subtotal: product.price,
      }];
    });
  };

  const updateCartItem = (itemId: string, delta: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id !== itemId) return item;
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty, subtotal: newQty * item.unit_price };
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setAmountPaid('');
    setShowCheckout(false);
  };

  const parkSale = () => {
    if (cart.length === 0) return;
    const parkedSale = {
      id: generateId(),
      cart: [...cart],
      customer: selectedCustomer,
      timestamp: new Date().toISOString(),
    };
    setParkedSales(prev => [...prev, parkedSale]);
    clearCart();
  };

  const resumeSale = (parkedId: string) => {
    const sale = parkedSales.find(s => s.id === parkedId);
    if (!sale) return;
    setCart(sale.cart);
    setSelectedCustomer(sale.customer);
    setParkedSales(prev => prev.filter(s => s.id !== parkedId));
    setShowParkedSales(false);
  };

  const deleteParkedSale = (parkedId: string) => {
    setParkedSales(prev => prev.filter(s => s.id !== parkedId));
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) return;

    const product: Product = {
      id: generateId(),
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      cost: 0,
      stock: parseInt(newProduct.stock) || 0,
      category: newProduct.category,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    await saveProduct(product);
    syncInsertProduct(product);
    setProducts(prev => [...prev, product]);
    setNewProduct({ name: '', price: '', stock: '', category: '' });
    setShowAddProduct(false);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name) return;

    const customer: Customer = {
      id: generateId(),
      name: newCustomer.name,
      phone: newCustomer.phone,
      email: newCustomer.email,
      loyalty_points: 0,
      total_spent: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    await saveCustomer(customer);
    syncInsertCustomer(customer);
    setCustomers(prev => [...prev, customer]);
    setSelectedCustomer(customer);
    setNewCustomer({ name: '', phone: '', email: '' });
    setShowNewCustomer(false);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const paid = parseFloat(amountPaid) || cartTotal;
    const now = new Date().toISOString();

    const transaction = {
      id: generateId(),
      customer_id: selectedCustomer?.id,
      total_amount: cartTotal,
      amount_paid: paid,
      change_amount: change,
      payment_method: paymentMethod,
      status: 'completed',
      created_at: now,
      sync_status: 'pending' as const,
      items: cart.map(item => ({
        id: generateId(),
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      })),
    };

    await saveTransaction(transaction);
    syncInsertTransaction(transaction, transaction.items);

    // Update customer loyalty
    if (selectedCustomer && loyaltyPointsToEarn > 0) {
      const updatedCustomer = {
        ...selectedCustomer,
        loyalty_points: selectedCustomer.loyalty_points + loyaltyPointsToEarn,
        total_spent: selectedCustomer.total_spent + cartTotal,
        updated_at: now,
        sync_status: 'pending' as const,
      };

      await saveCustomer(updatedCustomer);
      syncUpdateCustomer(updatedCustomer);

      const loyaltyTx = {
        id: generateId(),
        customer_id: selectedCustomer.id,
        points: loyaltyPointsToEarn,
        transaction_type: 'earned' as const,
        source: 'purchase',
        reference_id: transaction.id,
        created_at: now,
        sync_status: 'pending' as const,
      };

      await saveLoyaltyTransaction(loyaltyTx);
      syncInsertLoyaltyTransaction(loyaltyTx);
    }

    // Update product stock
    for (const item of cart) {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        const updated = {
          ...product,
          stock: Math.max(0, product.stock - item.quantity),
          updated_at: now,
          sync_status: 'pending' as const,
        };
        await saveProduct(updated);
      }
    }

    clearCart();
    loadData();
    alert('Transaction completed successfully!');
  };

  return (
    <div className="grid grid-cols-3 gap-6 h-full">
      {/* Product Grid */}
      <div className="col-span-2 bg-slate-800 rounded-xl overflow-hidden flex flex-col min-h-0">
        {/* Search and Products */}
        <div className="flex-shrink-0 p-4 border-b border-slate-700">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => setShowAddProduct(true)}
              className="px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
            >
              <Plus size={20} />
              Add Product
            </button>
          </div>
        </div>

        {/* Products Grid - Only scrollable section */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <div className="grid grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className={`bg-slate-700 rounded-lg p-4 text-left transition ${
                  product.stock > 0
                    ? 'hover:bg-slate-600 hover:ring-2 hover:ring-emerald-500'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-white">{product.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${
                    product.stock > 10 ? 'bg-emerald-600/20 text-emerald-400' :
                    product.stock > 0 ? 'bg-amber-600/20 text-amber-400' :
                    'bg-red-600/20 text-red-400'
                  }`}>
                    {product.stock} in stock
                  </span>
                </div>
                <p className="text-2xl font-bold text-emerald-400">
                  KES {product.price.toLocaleString()}
                </p>
                {product.category && (
                  <p className="text-xs text-slate-400 mt-2">{product.category}</p>
                )}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p>No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart - Fixed height with internal scroll for items */}
      <div className="bg-slate-800 rounded-xl overflow-hidden flex flex-col min-h-0">
        {/* Cart Header */}
        <div className="flex-shrink-0 p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} className="text-emerald-400" />
              <span className="font-medium text-white">Cart</span>
              <span className="text-slate-400">({cart.length})</span>
            </div>
            <div className="flex items-center gap-2">
              {parkedSales.length > 0 && (
                <button
                  onClick={() => setShowParkedSales(true)}
                  className="relative p-2 text-amber-400 hover:bg-slate-700 rounded-lg transition"
                  title={`${parkedSales.length} parked sale(s)`}
                >
                  <Archive size={18} />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                    {parkedSales.length}
                  </span>
                </button>
              )}
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-slate-400 hover:text-red-400 transition"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cart Items - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {cart.map((item) => (
            <div key={item.id} className="bg-slate-700 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <span className="text-white font-medium">{item.product_name}</span>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-slate-400 hover:text-red-400"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateCartItem(item.id, -1)}
                    className="w-8 h-8 bg-slate-600 rounded flex items-center justify-center hover:bg-slate-500 text-white"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-white w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateCartItem(item.id, 1)}
                    className="w-8 h-8 bg-slate-600 rounded flex items-center justify-center hover:bg-slate-500 text-white"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <span className="text-emerald-400 font-medium">
                  KES {item.subtotal.toLocaleString()}
                </span>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <ShoppingCart size={32} className="mx-auto mb-2 opacity-50" />
              <p>Cart is empty</p>
            </div>
          )}
        </div>

        {/* Customer Selection */}
        <div className="flex-shrink-0 p-4 border-t border-slate-700">
          {selectedCustomer ? (
            <div className="flex items-center justify-between bg-slate-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <User size={18} className="text-emerald-400" />
                <div>
                  <p className="text-white font-medium">{selectedCustomer.name}</p>
                  <p className="text-xs text-slate-400">
                    {selectedCustomer.loyalty_points} points
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-red-400"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search customer..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 text-sm"
                />
              </div>
              {customerSearch && (
                <div className="bg-slate-700 rounded-lg max-h-40 overflow-auto">
                  {filteredCustomers.slice(0, 5).map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setCustomerSearch('');
                      }}
                      className="w-full p-2 text-left hover:bg-slate-600 flex items-center gap-2"
                    >
                      <User size={16} className="text-slate-400" />
                      <div>
                        <p className="text-white text-sm">{customer.name}</p>
                        <p className="text-xs text-slate-400">{customer.phone}</p>
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => setShowNewCustomer(true)}
                    className="w-full p-2 text-left hover:bg-slate-600 text-emerald-400 text-sm flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add new customer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Total and Checkout */}
        <div className="flex-shrink-0 p-4 border-t border-slate-700 space-y-4">
          <div className="flex justify-between text-lg">
            <span className="text-slate-400">Total</span>
            <span className="text-white font-bold">KES {cartTotal.toLocaleString()}</span>
          </div>

          {selectedCustomer && loyaltyPointsToEarn > 0 && (
            <div className="text-sm text-emerald-400 flex items-center gap-2">
              <span>+{loyaltyPointsToEarn} loyalty points</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={parkSale}
              disabled={cart.length === 0}
              className="py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Archive size={18} />
              Park Sale
            </button>
            <button
              onClick={() => setShowCheckout(true)}
              disabled={cart.length === 0}
              className="py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Checkout</h3>
              <button onClick={() => setShowCheckout(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Payment Method */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cash', icon: Banknote, label: 'Cash' },
                    { id: 'card', icon: CreditCard, label: 'Card' },
                    { id: 'mobile', icon: Smartphone, label: 'Mobile' },
                  ].map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setPaymentMethod(id as 'cash' | 'card' | 'mobile')}
                      className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition ${
                        paymentMethod === id
                          ? 'border-emerald-500 bg-emerald-600/20'
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <Icon size={24} className={paymentMethod === id ? 'text-emerald-400' : 'text-slate-400'} />
                      <span className={`text-sm ${paymentMethod === id ? 'text-white' : 'text-slate-400'}`}>
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Paid */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">Amount Paid</label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder={cartTotal.toString()}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none text-lg"
                />
              </div>

              {/* Summary */}
              <div className="bg-slate-700 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Total</span>
                  <span>KES {cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Paid</span>
                  <span>KES {(parseFloat(amountPaid) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-slate-600 pt-2">
                  <span className="text-white">Change</span>
                  <span className="text-emerald-400">KES {change.toLocaleString()}</span>
                </div>
              </div>

              {/* Complete Button */}
              <button
                onClick={handleCheckout}
                className="w-full py-4 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition"
              >
                Complete Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Customer Modal */}
      {showNewCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">New Customer</h3>
              <button onClick={() => setShowNewCustomer(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">Name *</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-2">Phone</label>
                <input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-2">Email</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleCreateCustomer}
                disabled={!newCustomer.name}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
              >
                Create Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add Product</h3>
              <button onClick={() => setShowAddProduct(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">Name *</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-2">Price (KES) *</label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Stock</label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Category</label>
                  <input
                    type="text"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleAddProduct}
                disabled={!newProduct.name || !newProduct.price}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parked Sales Modal */}
      {showParkedSales && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Parked Sales</h3>
              <button onClick={() => setShowParkedSales(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {parkedSales.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Archive size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No parked sales</p>
                </div>
              ) : (
                parkedSales.map((sale) => {
                  const saleTotal = sale.cart.reduce((sum, item) => sum + item.subtotal, 0);
                  return (
                    <div key={sale.id} className="bg-slate-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-white font-medium">
                            {sale.cart.length} item{sale.cart.length !== 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(sale.timestamp).toLocaleString()}
                          </p>
                          {sale.customer && (
                            <p className="text-xs text-emerald-400 mt-1">
                              Customer: {sale.customer.name}
                            </p>
                          )}
                        </div>
                        <p className="text-lg font-bold text-emerald-400">
                          KES {saleTotal.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => resumeSale(sale.id)}
                          className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                        >
                          <ArchiveRestore size={16} />
                          Resume
                        </button>
                        <button
                          onClick={() => deleteParkedSale(sale.id)}
                          className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
