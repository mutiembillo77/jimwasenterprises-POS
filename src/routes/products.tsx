import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit2, Package, AlertTriangle, X } from 'lucide-react';
import { getAllProducts, saveProduct, generateId } from '../lib/db';
import { syncInsertProduct, syncUpdateProduct } from '../lib/sync';
import type { Product } from '../lib/types';

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    price: '',
    cost: '',
    stock: '',
    category: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await getAllProducts();
    setProducts(data);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock <= 10 && p.stock > 0);
  }, [products]);

  const outOfStockProducts = useMemo(() => {
    return products.filter(p => p.stock === 0);
  }, [products]);

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) return;

    const product: Product = {
      id: generateId(),
      name: newProduct.name,
      sku: newProduct.sku || undefined,
      price: parseFloat(newProduct.price),
      cost: parseFloat(newProduct.cost) || 0,
      stock: parseInt(newProduct.stock) || 0,
      category: newProduct.category || undefined,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    await saveProduct(product);
    syncInsertProduct(product);
    setNewProduct({ name: '', sku: '', price: '', cost: '', stock: '', category: '' });
    setShowAddModal(false);
    loadProducts();
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    const updated = {
      ...editingProduct,
      updated_at: new Date().toISOString(),
      sync_status: 'pending' as const,
    };

    await saveProduct(updated);
    syncUpdateProduct(updated);
    setEditingProduct(null);
    loadProducts();
  };

  const handleToggleActive = async (product: Product) => {
    const updated = {
      ...product,
      is_active: !product.is_active,
      updated_at: new Date().toISOString(),
      sync_status: 'pending' as const,
    };

    await saveProduct(updated);
    syncUpdateProduct(updated);
    loadProducts();
  };

  const totalValue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.stock * p.cost, 0);
  }, [products]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
              <Package size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{products.length}</p>
              <p className="text-sm text-slate-400">Total Products</p>
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
              <p className="text-sm text-slate-400">Low Stock</p>
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
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Package size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">KES {totalValue.toLocaleString()}</p>
              <p className="text-sm text-slate-400">Inventory Value</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Add */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-amber-400" size={20} />
            <h3 className="font-medium text-amber-400">Low Stock Alert</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.map((p) => (
              <span key={p.id} className="px-3 py-1 bg-amber-600/20 rounded-full text-sm text-amber-400">
                {p.name} ({p.stock} left)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Categories:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSearchTerm(cat)}
              className="px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-300 hover:bg-slate-600 transition"
            >
              {cat}
            </button>
          ))}
          <button
            onClick={() => setSearchTerm('')}
            className="px-3 py-1 text-sm text-slate-400 hover:text-white transition"
          >
            Clear
          </button>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-slate-800 rounded-xl overflow-hidden flex flex-col min-h-0 flex-1">
        <div className="overflow-y-auto flex-1">
          <table className="w-full">
          <thead className="bg-slate-700">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Product</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">SKU</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Category</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Price</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Cost</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Stock</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredProducts.map((product) => (
              <tr key={product.id} className={`hover:bg-slate-700/50 ${!product.is_active ? 'opacity-50' : ''}`}>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-700 rounded flex items-center justify-center">
                      <Package size={20} className="text-slate-400" />
                    </div>
                    <span className="text-white font-medium">{product.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-400">{product.sku || '-'}</td>
                <td className="py-3 px-4 text-slate-400">{product.category || '-'}</td>
                <td className="py-3 px-4 text-right font-medium text-emerald-400">
                  KES {product.price.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right text-slate-400">
                  KES {product.cost.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    product.stock === 0
                      ? 'bg-red-600/20 text-red-400'
                      : product.stock <= 10
                      ? 'bg-amber-600/20 text-amber-400'
                      : 'bg-emerald-600/20 text-emerald-400'
                  }`}>
                    {product.stock}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleToggleActive(product)}
                      className={`p-2 rounded transition ${
                        product.is_active
                          ? 'text-emerald-400 hover:bg-slate-600'
                          : 'text-red-400 hover:bg-slate-600'
                      }`}
                      title={product.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <Package size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Package size={48} className="mx-auto mb-4 opacity-50" />
            <p>No products found</p>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add Product</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
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
                <label className="text-sm text-slate-400 block mb-2">SKU</label>
                <input
                  type="text"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Price (KES) *</label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Cost (KES)</label>
                  <input
                    type="number"
                    value={newProduct.cost}
                    onChange={(e) => setNewProduct({ ...newProduct, cost: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Initial Stock</label>
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

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Edit Product</h3>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">Name *</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-2">SKU</label>
                <input
                  type="text"
                  value={editingProduct.sku || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Price (KES) *</label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Cost (KES)</label>
                  <input
                    type="number"
                    value={editingProduct.cost}
                    onChange={(e) => setEditingProduct({ ...editingProduct, cost: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Stock</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Category</label>
                  <input
                    type="text"
                    value={editingProduct.category || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleUpdateProduct}
                disabled={!editingProduct.name}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
              >
                Update Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
