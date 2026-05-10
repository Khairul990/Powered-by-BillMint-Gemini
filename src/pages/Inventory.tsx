import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowRight,
  TrendingUp,
  Box,
  Save,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { Product } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const Inventory = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    category: ''
  });

  useEffect(() => {
    if (!user) return;
    return firestoreService.getCollectionListener<Product>(
      'products',
      [{ field: 'userId', operator: '==', value: user.uid }],
      setProducts
    );
  }, [user]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingProduct) {
        await firestoreService.setDocument('products', editingProduct.id, {
          ...formData,
          updatedAt: Date.now()
        });
      } else {
        await firestoreService.addDocument('products', {
          ...formData,
          userId: user.uid,
          createdAt: Date.now()
        });
      }
      resetForm();
    } catch (err) {
      console.error("Failed to save product:", err);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', price: 0, category: '' });
    setIsAddingMode(false);
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category || ''
    });
    setIsAddingMode(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        // We'll use a transaction or simple delete if we don't have dependencies
        // For now, simple delete
        const { doc, deleteDoc } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        await deleteDoc(doc(db, 'products', id));
      } catch (err) {
        console.error("Failed to delete product:", err);
      }
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Package className="text-emerald-500" size={36} />
            Products & Inventory
          </h1>
          <p className="text-slate-500 font-medium mt-2">Manage your catalog for faster invoicing.</p>
        </div>
        <button 
          onClick={() => setIsAddingMode(true)}
          className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
        >
          <Plus size={20} /> Add Product
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
            <Box size={28} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Products</p>
            <p className="text-3xl font-black text-slate-900">{products.length}</p>
          </div>
        </div>
        <div className="bg-emerald-500 p-6 rounded-3xl text-white shadow-xl shadow-emerald-500/20 flex items-center gap-5">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-xs font-black text-emerald-100 uppercase tracking-widest">Max Value</p>
            <p className="text-3xl font-black">{formatCurrency(Math.max(0, ...products.map(p => p.price)))}</p>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl shadow-slate-900/20 flex items-center gap-5">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400">
                <Package size={28} />
            </div>
            <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Growth</p>
                <p className="text-3xl font-black">+12.5%</p>
            </div>
        </div>
      </div>

      {/* Search & List */}
      <div className="space-y-6">
        <div className="relative group max-w-xl">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search products by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold transition-all shadow-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredProducts.map((product) => (
              <motion.div 
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all group border-b-4 border-b-transparent hover:border-b-emerald-400"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                    <Package size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEdit(product)}
                      className="p-2.5 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-xl font-black text-slate-800 mb-1 leading-tight">{product.name}</h3>
                {product.category && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{product.category}</span>
                )}
                
                <div className="mt-8 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Standard Rate</p>
                    <p className="text-2xl font-black text-emerald-600 tracking-tight">{formatCurrency(product.price)}</p>
                  </div>
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6 shadow-sm">
                <Package size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-800">No products found</h3>
            <p className="text-slate-500 font-medium max-w-xs mx-auto mt-3">Start by adding your services or goods to your catalog.</p>
            <button 
              onClick={() => setIsAddingMode(true)}
              className="mt-8 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 mx-auto hover:bg-slate-800 transition-all"
            >
              Add Your First Product
            </button>
          </div>
        )}
      </div>

      {/* Modal for Add/Edit */}
      <AnimatePresence>
        {isAddingMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 md:p-10"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                  <p className="text-slate-400 text-sm font-medium mt-1">Fill in the details below</p>
                </div>
                <button 
                  onClick={resetForm}
                  className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Product Name</p>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Graphic Design"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-bold transition-all shadow-inner"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Price / Rate</p>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                        <input 
                            type="number" 
                            required
                            value={formData.price || ''}
                            onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                            placeholder="0.00"
                            className="w-full pl-8 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-bold transition-all shadow-inner"
                        />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Category</p>
                    <input 
                      type="text" 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      placeholder="e.g. Services"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-bold transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Save size={20} />
                    {editingProduct ? 'Update Product' : 'Save Product'}
                  </button>
                  <button 
                    type="button"
                    onClick={resetForm}
                    className="w-full py-4 mt-3 bg-white text-slate-400 rounded-2xl font-bold text-sm hover:text-slate-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inventory;
