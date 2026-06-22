import { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  AlertTriangle,
  Plus,
  Search,
  ArrowUpDown,
  History,
  Box,
  X,
  Save,
} from 'lucide-react';
import { getAllProducts } from '../lib/db';
import type { Product, StockMovement, StockAdjustment } from '../lib/types';
import { supabase } from '../lib/sync';

type TabType = 'overview' | 'adjustments' | 'deliveries' | 'movements';

export function InventoryPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentData, setAdjustmentData] = useState({
    newStock: 0,
    reason: '',
    note: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const productData = await getAllProducts();
    setProducts(productData);

    const { data: movements } = await supabase
      .from('stock_movements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    setStockMovements(movements || []);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(
    (p) => p.stock > 0 && p.stock <= (p.low_stock_alert || 5)
  );
  const outOfStockProducts = products.filter((p) => p.stock === 0);
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.stock * (p.cost || p.price),
    0
  );

  const handleAdjustment = async () => {
    if (!selectedProduct) return;

    const previousStock = selectedProduct.stock;
    const qtyDelta = adjustmentData.newStock - previousStock;

    const movement: StockMovement = {
      id: crypto.randomUUID(),
      product_id: selectedProduct.id,
      qty_delta: qtyDelta,
      reason: 'adjustment',
      note: adjustmentData.note || adjustmentData.reason,
      balance_after: adjustmentData.newStock,
      reference_type: 'adjustment',
      created_at: new Date().toISOString(),
      created_by: 'user',
      sync_status: 'pending',
      local_id: crypto.randomUUID(),
    };

    const { error: movementError } = await supabase
      .from('stock_movements')
      .insert([movement]);

    if (movementError) {
      console.error('Error creating stock movement:', movementError);
      return;
    }

    const { error: productError } = await supabase
      .from('products')
      .update({ stock: adjustmentData.newStock, updated_at: new Date().toISOString() })
      .eq('id', selectedProduct.id);

    if (productError) {
      console.error('Error updating product stock:', productError);
      return;
    }

    setShowAdjustmentModal(false);
    setSelectedProduct(null);
    setAdjustmentData({ newStock: 0, reason: '', note: '' });
    loadData();
  };

  const openAdjustmentModal = (product: Product) => {
    setSelectedProduct(product);
    setAdjustmentData({
      newStock: product.stock,
      reason: '',
      note: '',
    });
    setShowAdjustmentModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 bg-slate-800 rounded-lg p-1">
        {(['overview', 'adjustments', 'deliveries', 'movements'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition capitalize ${
              activeTab === tab
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                  <Box size={20} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{products.length}</p>
                  <p className="text-sm text-slate-400">Total Products</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Package size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    KES {totalInventoryValue.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-400">Inventory Value</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-600/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={20} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{lowStockProducts.length}</p>
                  <p className="text-sm text-slate-400">Low Stock Alert</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
                  <Package size={20} className="text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{outOfStockProducts.length}</p>
                  <p className="text-sm text-slate-400">Out of Stock</p>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
            <div className="bg-slate-800 rounded-xl p-4">
              <h3 className="font-medium text-white mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-400" />
                Inventory Alerts
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {lowStockProducts.length > 0 && (
                  <div className="bg-slate-700 rounded-lg p-4">
                    <p className="text-sm text-amber-400 mb-2">
                      Low Stock ({'<'}= {products[0]?.low_stock_alert || 5})
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {lowStockProducts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-white">{p.name}</span>
                          <span className="text-amber-400">{p.stock} left</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {outOfStockProducts.length > 0 && (
                  <div className="bg-slate-700 rounded-lg p-4">
                    <p className="text-sm text-red-400 mb-2">Out of Stock</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {outOfStockProducts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-white">{p.name}</span>
                          <span className="text-red-400">Out of stock</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product List */}
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-white">Stock Levels</h3>
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
                    <th className="pb-2">Product</th>
                    <th className="pb-2">SKU</th>
                    <th className="pb-2 text-right">Stock</th>
                    <th className="pb-2 text-right">Value</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-700/50">
                      <td className="py-3 text-white">{product.name}</td>
                      <td className="py-3 text-slate-400">{product.sku || '-'}</td>
                      <td className="py-3 text-right">
                        <span
                          className={`font-medium ${
                            product.stock === 0
                              ? 'text-red-400'
                              : product.stock <= (product.low_stock_alert || 5)
                              ? 'text-amber-400'
                              : 'text-white'
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-400">
                        KES {(product.stock * (product.cost || product.price)).toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => openAdjustmentModal(product)}
                          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm text-slate-300"
                        >
                          <ArrowUpDown size={14} className="inline mr-1" />
                          Adjust
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Adjustments Tab */}
      {activeTab === 'adjustments' && (
        <div className="bg-slate-800 rounded-xl p-4">
          <h3 className="font-medium text-white mb-4">Stock Adjustments</h3>
          <p className="text-slate-400 text-center py-8">
            Manual stock adjustments will appear here. Use the Adjust button in the
            Overview tab to make adjustments.
          </p>
        </div>
      )}

      {/* Deliveries Tab */}
      {activeTab === 'deliveries' && (
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-white">Deliveries</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white text-sm font-medium transition">
              <Plus size={18} />
              New Delivery
            </button>
          </div>
          <p className="text-slate-400 text-center py-8">
            Delivery receiving will be available here. Track incoming stock from
            suppliers.
          </p>
        </div>
      )}

      {/* Movements Tab */}
      {activeTab === 'movements' && (
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-white flex items-center gap-2">
              <History size={18} className="text-emerald-400" />
              Stock Movement History
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Product ID</th>
                  <th className="pb-2 text-right">Qty Change</th>
                  <th className="pb-2 text-right">Balance</th>
                  <th className="pb-2">Reason</th>
                  <th className="pb-2">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {stockMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-slate-700/50">
                    <td className="py-3 text-sm text-slate-400">
                      {new Date(movement.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 text-slate-400 font-mono text-xs">
                      {movement.product_id.slice(0, 8)}...
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`font-medium ${
                          movement.qty_delta > 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {movement.qty_delta > 0 ? '+' : ''}
                        {movement.qty_delta}
                      </span>
                    </td>
                    <td className="py-3 text-right text-white">
                      {movement.balance_after}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                        {movement.reason}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-slate-400 max-w-xs truncate">
                      {movement.note || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {stockMovements.length === 0 && (
            <p className="text-center text-slate-400 py-8">
              No stock movements recorded yet
            </p>
          )}
        </div>
      )}

      {/* Adjustment Modal */}
      {showAdjustmentModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Adjust Stock</h3>
              <button
                onClick={() => setShowAdjustmentModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-700 rounded-lg p-3">
                <p className="text-sm text-slate-400">Product</p>
                <p className="text-white font-medium">{selectedProduct.name}</p>
                <p className="text-sm text-slate-400">
                  Current Stock: <span className="text-white">{selectedProduct.stock}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">New Stock Level</label>
                <input
                  type="number"
                  value={adjustmentData.newStock}
                  onChange={(e) =>
                    setAdjustmentData({ ...adjustmentData, newStock: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Change:{' '}
                  <span
                    className={
                      adjustmentData.newStock - selectedProduct.stock > 0
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }
                  >
                    {adjustmentData.newStock - selectedProduct.stock > 0 ? '+' : ''}
                    {adjustmentData.newStock - selectedProduct.stock}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Reason</label>
                <select
                  value={adjustmentData.reason}
                  onChange={(e) =>
                    setAdjustmentData({ ...adjustmentData, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select reason...</option>
                  <option value="Stock count correction">Stock count correction</option>
                  <option value="Damaged goods">Damaged goods</option>
                  <option value="Theft/loss">Theft/loss</option>
                  <option value="Return to supplier">Return to supplier</option>
                  <option value="Found stock">Found stock</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Note (optional)</label>
                <textarea
                  value={adjustmentData.note}
                  onChange={(e) =>
                    setAdjustmentData({ ...adjustmentData, note: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Additional details..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAdjustmentModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjustment}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Save Adjustment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
