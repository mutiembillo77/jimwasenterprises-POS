import { useState, useEffect, useMemo } from 'react';
import { Package, Search, Plus, Edit2, AlertCircle, Check, Trash2 } from 'lucide-react';
import { getAllProducts, saveProduct } from '../lib/db';
import type { Product } from '../lib/types';

export function StockManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByLow, setFilterByLow] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    stock: '',
    reorder_level: '',
    category: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const prods = await getAllProducts();
      setProducts(prods);
    } catch (err) {
      setError('Failed to load products');
    }
  };

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterByLow) {
      filtered = filtered.filter((p) => p.stock <= p.reorder_level);
    }

    return filtered.sort((a, b) => {
      // Sort by stock level (low stock first)
      const aLowStock = a.stock <= a.reorder_level ? 1 : 0;
      const bLowStock = b.stock <= b.reorder_level ? 1 : 0;
      return bLowStock - aLowStock;
    });
  }, [products, searchTerm, filterByLow]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!formData.name || !formData.price || !formData.stock || !formData.reorder_level) {
        setError('Please fill in all required fields');
        return;
      }

      const newProduct: Product = {
        id: selectedProduct?.id || `prod-${Date.now()}`,
        name: formData.name,
        sku: formData.sku || `SKU-${Date.now()}`,
        price: Number(formData.price),
        stock: Number(formData.stock),
        reorder_level: Number(formData.reorder_level),
        category: formData.category,
        tax_category: 'standard',
        is_active: true,
        created_at: selectedProduct?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await saveProduct(newProduct);

      if (selectedProduct) {
        setProducts(products.map((p) => (p.id === selectedProduct.id ? newProduct : p)));
        setSuccess('Product updated successfully');
      } else {
        setProducts([...products, newProduct]);
        setSuccess('Product added successfully');
      }

      resetForm();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      reorder_level: product.reorder_level.toString(),
      category: product.category || '',
    });
    setShowAddProduct(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      price: '',
      stock: '',
      reorder_level: '',
      category: '',
    });
    setSelectedProduct(null);
    setShowAddProduct(false);
  };

  const getStockStatus = (stock: number, reorderLevel: number) => {
    if (stock <= 0) return { label: 'Out of Stock', color: 'text-red-400', bgColor: 'bg-red-900/30' };
    if (stock <= reorderLevel) return { label: 'Low Stock', color: 'text-amber-400', bgColor: 'bg-amber-900/30' };
    return { label: 'In Stock', color: 'text-emerald-400', bgColor: 'bg-emerald-900/30' };
  };

  return (
    <div className="h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Package size={32} className="text-amber-400" />
              Stock Management
            </h1>
            <p className="text-slate-400 text-sm mt-2">Track inventory levels and manage stock</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddProduct(!showAddProduct);
            }}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition flex items-center gap-2"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-slate-400 text-xs uppercase mb-1">Total Products</p>
            <p className="text-2xl font-bold text-white">{products.length}</p>
          </div>
          <div className="bg-emerald-900/30 rounded-lg p-3 border border-emerald-700">
            <p className="text-emerald-400 text-xs uppercase mb-1">In Stock</p>
            <p className="text-2xl font-bold text-emerald-400">
              {products.filter((p) => p.stock > p.reorder_level).length}
            </p>
          </div>
          <div className="bg-amber-900/30 rounded-lg p-3 border border-amber-700">
            <p className="text-amber-400 text-xs uppercase mb-1">Low Stock</p>
            <p className="text-2xl font-bold text-amber-400">
              {products.filter((p) => p.stock <= p.reorder_level && p.stock > 0).length}
            </p>
          </div>
          <div className="bg-red-900/30 rounded-lg p-3 border border-red-700">
            <p className="text-red-400 text-xs uppercase mb-1">Out of Stock</p>
            <p className="text-2xl font-bold text-red-400">{products.filter((p) => p.stock <= 0).length}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Add/Edit Product Form */}
          {showAddProduct && (
            <div className="bg-slate-800 rounded-lg p-6 border border-amber-700">
              <h2 className="text-xl font-bold text-white mb-4">
                {selectedProduct ? 'Edit Product' : 'Add Product'}
              </h2>

              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Product Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-amber-500 focus:outline-none"
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">SKU</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-amber-500 focus:outline-none"
                      placeholder="Auto-generated if empty"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-amber-500 focus:outline-none"
                      placeholder="Product category"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Price *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-amber-500 focus:outline-none"
                      placeholder="Enter price"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Current Stock *</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-amber-500 focus:outline-none"
                      placeholder="Current stock quantity"
                      min="0"
                      step="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Reorder Level *</label>
                    <input
                      type="number"
                      value={formData.reorder_level}
                      onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-amber-500 focus:outline-none"
                      placeholder="Alert when stock falls below"
                      min="0"
                      step="1"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50 font-medium"
                  >
                    {isLoading ? 'Saving...' : selectedProduct ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
              <AlertCircle size={24} />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-4 bg-emerald-900/50 border border-emerald-700 rounded-lg text-emerald-300">
              <Check size={24} />
              {success}
            </div>
          )}

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-slate-500" size={20} />
              <input
                type="text"
                placeholder="Search by product name, SKU, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => setFilterByLow(!filterByLow)}
              className={`px-6 py-3 rounded-lg transition font-medium ${
                filterByLow
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              Low Stock Only
            </button>
          </div>

          {/* Products Table */}
          <div className="bg-slate-800 rounded-lg overflow-hidden">
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-400">No products found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700 border-b border-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Product</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">SKU</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Category</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">Price</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">Stock</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">Reorder Level</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">Status</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {filteredProducts.map((product) => {
                      const status = getStockStatus(product.stock, product.reorder_level);
                      return (
                        <tr key={product.id} className="hover:bg-slate-700/50 transition">
                          <td className="px-4 py-3 text-white font-medium">{product.name}</td>
                          <td className="px-4 py-3 text-slate-400 text-sm">{product.sku}</td>
                          <td className="px-4 py-3 text-slate-400 text-sm">{product.category}</td>
                          <td className="px-4 py-3 text-right text-white font-medium">
                            {product.price.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-1 bg-slate-700 rounded text-white font-medium text-sm">
                              {product.stock}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-400">{product.reorder_level}</td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${status.bgColor} ${status.color}`}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
                            >
                              <Edit2 size={16} />
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
