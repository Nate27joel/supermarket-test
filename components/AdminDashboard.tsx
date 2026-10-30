import React, { useState } from 'react';
import { Product, Order, Currency, OrderStatus, AdminProfile } from '../types';
import { formatPrice, CATEGORIES, POPULAR_BEVERAGE_BRANDS } from '../constants';
import { loginAdminStaff } from '../services/authService';

interface AdminDashboardProps {
  products: Product[];
  orders: Order[];
  onUpdateProduct: (updated: Product) => void;
  onAddProduct: (newProduct: Product) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  currency: Currency;
  onExitAdmin: () => void;
  isAdminAuthenticated: boolean;
  adminProfile: AdminProfile | null;
  onAdminLoginSuccess: (admin: AdminProfile) => void;
  onAdminLogout: () => void;
}

const SAMPLE_PRESET_IMAGES = [
  { label: 'Beverages / Drinks', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80' },
  { label: 'Orange Juice / Soft Drink', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80' },
  { label: 'Sparkling Soda / Cola', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80' },
  { label: 'Bottled Spring Water', url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80' },
  { label: 'Farm Produce / Yams / Roots', url: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&auto=format&fit=crop&q=80' },
  { label: 'Fresh Tomatoes & Peppers', url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80' },
  { label: 'Pantry Rice & Grains', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80' },
  { label: 'Cooking Oil & Liquids', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80' },
  { label: 'Dairy, Eggs & Milk', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80' },
  { label: 'Poultry & Fresh Meats', url: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&auto=format&fit=crop&q=80' },
  { label: 'Household & Cleaning', url: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?w=600&auto=format&fit=crop&q=80' },
  { label: 'In-Store Bakery', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80' }
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  orders,
  onUpdateProduct,
  onAddProduct,
  onUpdateOrderStatus,
  currency,
  onExitAdmin,
  isAdminAuthenticated,
  adminProfile,
  onAdminLoginSuccess,
  onAdminLogout
}) => {
  // Navigation & Form State
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Configurable inventory threshold for restocking prioritization
  const [restockThreshold, setRestockThreshold] = useState<number>(10);
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'restock-needed' | 'out-of-stock'>('all');
  const [restockSuccessMessage, setRestockSuccessMessage] = useState<string | null>(null);

  // Add Product Modal State
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [addProductError, setAddProductError] = useState<string | null>(null);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    category: 'beverages',
    subcategory: 'Carbonated Soft Drinks',
    brand: 'Guinness Nigeria',
    price: 3500,
    originalPrice: 4000,
    unit: 'Pack of 6 Cans (330ml)',
    stock: 50,
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
    dietaryTags: 'Chilled, Cold Refreshment, Best Seller',
    description: 'Refreshing high-grade beverage stocked fresh at our national distribution hub. Guaranteed authentic quality.',
    isOrganic: false,
    isLocalFarm: false
  });

  // Dedicated Admin Login Form State (When not authenticated)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  // Handle Isolated Admin Login
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);
    setAdminLoginLoading(true);

    const result = await loginAdminStaff(adminEmail, adminPassword, adminPin);
    setAdminLoginLoading(false);

    if (result.success && result.admin) {
      onAdminLoginSuccess(result.admin);
    } else {
      setAdminLoginError(result.message || 'Staff authentication failed. Check credentials.');
    }
  };

  const handleAutofillDirector = () => {
    setAdminEmail('kalu.ikpe@nuelixx.ng');
    setAdminPassword('adminNuelixx2026!');
    setAdminPin('2026');
    setAdminLoginError(null);
  };

  // Metrics
  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
  const productsBelowThreshold = products.filter(p => p.stock <= restockThreshold);
  const outOfStockCount = products.filter(p => p.stock <= 0).length;
  const criticalStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;

  const handleStartEdit = (p: Product) => {
    setEditingProductId(p.id);
    setEditPrice(p.price);
    setEditStock(p.stock);
  };

  const handleSaveEdit = async (product: Product) => {
    const updated = {
      ...product,
      price: Math.max(100, editPrice),
      stock: Math.max(0, editStock)
    };

    onUpdateProduct(updated);
    setEditingProductId(null);

    // Sync to backend PUT /api/products/:id
    try {
      await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: updated.price, stock: updated.stock })
      });
    } catch (e) {
      console.warn('Backend sync warning:', e);
    }

    setRestockSuccessMessage(`Updated "${product.name}" price to ₦${updated.price.toLocaleString()} and stock to ${updated.stock} units.`);
    setTimeout(() => setRestockSuccessMessage(null), 3000);
  };

  const handleQuickRestock = async (product: Product, quantityToAdd: number) => {
    const updatedStock = product.stock + quantityToAdd;
    const updated = { ...product, stock: updatedStock };
    onUpdateProduct(updated);

    try {
      await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: updatedStock })
      });
    } catch (e) {
      console.warn('Backend sync warning:', e);
    }

    setRestockSuccessMessage(`Restocked +${quantityToAdd} units of "${product.name}". New Stock: ${updatedStock}`);
    setTimeout(() => setRestockSuccessMessage(null), 3000);
  };

  const handleRestockAllLowItems = () => {
    productsBelowThreshold.forEach(p => {
      onUpdateProduct({
        ...p,
        stock: p.stock + 25
      });
    });
    setRestockSuccessMessage(`Replenished +25 units for all ${productsBelowThreshold.length} low-stock items!`);
    setTimeout(() => setRestockSuccessMessage(null), 3500);
  };

  const handleToggleStockStatus = (product: Product) => {
    const newStock = product.stock > 0 ? 0 : 25;
    onUpdateProduct({
      ...product,
      stock: newStock
    });
  };

  // Add Product Submit to Backend POST /api/products
  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddProductError(null);

    if (!newProductForm.name || !newProductForm.price) {
      setAddProductError('Please provide product name and price.');
      return;
    }

    setIsSubmittingProduct(true);

    const payload = {
      name: newProductForm.name.trim(),
      category: newProductForm.category,
      subcategory: newProductForm.subcategory.trim(),
      brand: newProductForm.brand.trim(),
      price: Number(newProductForm.price),
      originalPrice: newProductForm.originalPrice ? Number(newProductForm.originalPrice) : undefined,
      unit: newProductForm.unit.trim(),
      stock: Number(newProductForm.stock),
      image: newProductForm.image.trim(),
      description: newProductForm.description.trim(),
      dietaryTags: newProductForm.dietaryTags.split(',').map(s => s.trim()).filter(Boolean),
      isOrganic: newProductForm.isOrganic,
      isLocalFarm: newProductForm.isLocalFarm
    };

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success && data.product) {
        onAddProduct(data.product);
        setIsAddProductModalOpen(false);
        setRestockSuccessMessage(`Product "${data.product.name}" created and synced with Storefront!`);
        setTimeout(() => setRestockSuccessMessage(null), 4000);
      } else {
        // Fallback local create if backend error
        const localProduct: Product = {
          id: `prod-${Date.now()}`,
          ...payload,
          rating: 5.0,
          reviewCount: 0
        };
        onAddProduct(localProduct);
        setIsAddProductModalOpen(false);
        setRestockSuccessMessage(`Product "${localProduct.name}" added to inventory.`);
        setTimeout(() => setRestockSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      // Fallback local create
      const localProduct: Product = {
        id: `prod-${Date.now()}`,
        ...payload,
        rating: 5.0,
        reviewCount: 0
      };
      onAddProduct(localProduct);
      setIsAddProductModalOpen(false);
      setRestockSuccessMessage(`Product "${localProduct.name}" added to inventory.`);
      setTimeout(() => setRestockSuccessMessage(null), 3000);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // 1. IF ADMIN IS NOT AUTHENTICATED: RENDER DEDICATED SEPARATE ADMIN LOGIN SCREEN
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative animate-fadeIn selection:bg-amber-500 selection:text-black">
        
        {/* Glow ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-[#0a0d0b] border border-amber-900/40 rounded-[2.5rem] p-7 sm:p-9 shadow-2xl relative z-10 space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-amber-500/15 border border-amber-500/40 text-amber-400 rounded-3xl flex items-center justify-center mx-auto text-2xl shadow-lg">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full">
                Internal Security Terminal
              </span>
              <h1 className="text-2xl font-black text-white mt-1.5 font-display tracking-tight">
                Store Operations Portal
              </h1>
              <p className="text-xs text-slate-400">
                Nuelixx Supermarket • Nationwide Store Control
              </p>
            </div>
          </div>

          {adminLoginError && (
            <div className="p-3.5 bg-rose-950/70 border border-rose-800 text-rose-200 text-xs rounded-2xl flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation text-rose-400"></i>
              <span>{adminLoginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-amber-200 block">
                Official Staff Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <i className="fa-solid fa-id-badge text-xs"></i>
                </span>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="kalu.ikpe@nuelixx.ng"
                  className="w-full pl-10 pr-3 py-3 bg-neutral-900 border border-amber-900/50 focus:border-amber-400 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-amber-200 block">
                Security Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <i className="fa-solid fa-lock text-xs"></i>
                </span>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3 py-3 bg-neutral-900 border border-amber-900/50 focus:border-amber-400 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-amber-200 block">
                Security PIN (Optional)
              </label>
              <input
                type="password"
                maxLength={6}
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="2026"
                className="w-full px-3.5 py-3 bg-neutral-900 border border-amber-900/50 focus:border-amber-400 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors font-mono"
              />
            </div>

            {/* Quick 1-Click Autofill */}
            <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Store Operations Director:</span>
              <button
                type="button"
                onClick={handleAutofillDirector}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-black transition-colors"
              >
                Autofill Kalu Ikpe
              </button>
            </div>

            <button
              type="submit"
              disabled={adminLoginLoading}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2"
            >
              {adminLoginLoading ? (
                <>
                  <i className="fa-solid fa-circle-notch animate-spin text-sm"></i>
                  <span>Verifying Staff Clearance...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-right-to-bracket text-xs"></i>
                  <span>Unlock Admin Dashboard</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-neutral-850 flex justify-between items-center text-xs text-slate-400">
            <button
              onClick={onExitAdmin}
              className="hover:text-white transition-colors flex items-center gap-1.5 text-slate-300 font-bold"
            >
              <i className="fa-solid fa-arrow-left text-[10px]"></i>
              <span>Back to Storefront</span>
            </button>
            <span className="text-[10px] text-neutral-600">Route: #/admin</span>
          </div>

        </div>
      </div>
    );
  }

  // Filtered products list
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;

    if (inventoryFilter === 'restock-needed') {
      return p.stock <= restockThreshold;
    }
    if (inventoryFilter === 'out-of-stock') {
      return p.stock <= 0;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn text-slate-100">
      
      {/* Top Banner with Store Manager Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 text-white p-6 rounded-3xl shadow-xl border border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-forest-700 flex items-center justify-center text-xl text-warm-300 shadow-md">
            <i className="fa-solid fa-store"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-display">Store Manager Console</h1>
            </div>
            <p className="text-xs text-gray-400">
              {adminProfile ? `${adminProfile.name} • ${adminProfile.title}` : 'Nuelixx Supermarket National Store Operations'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add Product Button */}
          <button
            onClick={() => setIsAddProductModalOpen(true)}
            className="px-4 py-2.5 bg-forest-600 hover:bg-forest-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 active:scale-95"
          >
            <i className="fa-solid fa-circle-plus text-sm"></i>
            <span>Add New Product</span>
          </button>

          <button 
            onClick={onExitAdmin}
            className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 border border-neutral-700"
          >
            <i className="fa-solid fa-store"></i>
            <span>Storefront</span>
          </button>

          <button
            onClick={onAdminLogout}
            className="px-3 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Sign out of Admin Terminal"
          >
            <i className="fa-solid fa-arrow-right-from-bracket text-xs"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {restockSuccessMessage && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-700 rounded-2xl flex items-center justify-between text-emerald-200 text-xs font-bold animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <i className="fa-solid fa-circle-check text-emerald-400 text-sm"></i>
            <span>{restockSuccessMessage}</span>
          </div>
          <button onClick={() => setRestockSuccessMessage(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900/90 p-5 rounded-2xl border border-neutral-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Revenue</span>
          <span className="text-xl sm:text-2xl font-black text-forest-400">{formatPrice(totalRevenue, currency)}</span>
          <span className="text-[11px] text-emerald-400 font-semibold block">⚡ Nationwide Sales</span>
        </div>

        <div className="bg-neutral-900/90 p-5 rounded-2xl border border-neutral-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Customer Orders</span>
          <span className="text-xl sm:text-2xl font-black text-white">{orders.length} Active</span>
          <span className="text-[11px] text-blue-400 font-semibold block">Dispatched nationwide</span>
        </div>

        {/* Highlighted Low Stock KPI */}
        <div 
          onClick={() => {
            setActiveTab('inventory');
            setInventoryFilter('restock-needed');
          }}
          className="bg-neutral-900/90 p-5 rounded-2xl border-2 border-amber-500/60 shadow-xs space-y-1 cursor-pointer hover:bg-neutral-850 transition-colors"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              Restock Priority (≤{restockThreshold})
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          </div>
          <span className="text-xl sm:text-2xl font-black text-amber-400">
            {productsBelowThreshold.length} Products
          </span>
          <span className="text-[11px] text-amber-300 font-bold block flex items-center gap-1">
            <i className="fa-solid fa-arrow-down-short-wide text-xs"></i>
            <span>Click to triage restocks</span>
          </span>
        </div>

        <div 
          onClick={() => {
            setActiveTab('inventory');
            setInventoryFilter('out-of-stock');
          }}
          className="bg-neutral-900/90 p-5 rounded-2xl border border-neutral-800 shadow-xs space-y-1 cursor-pointer hover:bg-neutral-850 transition-colors"
        >
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Out of Stock</span>
          <span className="text-xl sm:text-2xl font-black text-red-400">{outOfStockCount} Items</span>
          <span className="text-[11px] text-red-400 font-semibold block">Needs immediate purchase</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 gap-6">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors relative ${activeTab === 'inventory' ? 'text-forest-400 border-b-2 border-forest-500' : 'text-gray-400 hover:text-white'}`}
        >
          <i className="fa-solid fa-boxes-stacked"></i>
          <span>Inventory & Restock Prioritization ({products.length})</span>
          {productsBelowThreshold.length > 0 && (
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {productsBelowThreshold.length} Low
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors relative ${activeTab === 'orders' ? 'text-forest-400 border-b-2 border-forest-500' : 'text-gray-400 hover:text-white'}`}
        >
          <i className="fa-solid fa-clipboard-list"></i>
          <span>Incoming Customer Orders ({orders.length})</span>
        </button>
      </div>

      {/* TAB 1: INVENTORY & RESTOCK PRIORITIZATION TABLE */}
      {activeTab === 'inventory' && (
        <div className="space-y-5">
          
          {/* Priority Alert Banner if items are below threshold */}
          {productsBelowThreshold.length > 0 && (
            <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/40 via-neutral-900 to-amber-950/40 border border-amber-500/40 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center text-lg font-black shadow-sm">
                  <i className="fa-solid fa-bell animate-bounce"></i>
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-200">
                    Restock Action Priority: {productsBelowThreshold.length} items below safety threshold ({restockThreshold} units)
                  </h3>
                  <p className="text-xs text-amber-400/80">
                    Includes {criticalStockCount} items at critical level (≤5 units) and {outOfStockCount} completely sold out.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleRestockAllLowItems}
                  className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <i className="fa-solid fa-boxes-packing"></i>
                  <span>Restock All Low Items (+25 Units)</span>
                </button>
              </div>
            </div>
          )}

          {/* Controls: Search, Restock Filter Tabs, and Threshold Selector */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-neutral-900/90 p-4 rounded-2xl border border-neutral-800 shadow-2xs">
            
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <button
                onClick={() => setInventoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition-all ${inventoryFilter === 'all' ? 'bg-forest-700 text-white shadow-xs' : 'bg-neutral-800 text-gray-300 hover:bg-neutral-750'}`}
              >
                All Products ({products.length})
              </button>

              <button
                onClick={() => setInventoryFilter('restock-needed')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${inventoryFilter === 'restock-needed' ? 'bg-amber-500 text-slate-950 shadow-xs font-black' : 'bg-amber-950/40 text-amber-300 hover:bg-amber-950/70 border border-amber-900/50'}`}
              >
                <i className="fa-solid fa-triangle-exclamation text-xs"></i>
                <span>Restock Priority ({productsBelowThreshold.length})</span>
              </button>

              <button
                onClick={() => setInventoryFilter('out-of-stock')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${inventoryFilter === 'out-of-stock' ? 'bg-red-600 text-white shadow-xs font-black' : 'bg-red-950/40 text-red-300 hover:bg-red-950/70 border border-red-900/50'}`}
              >
                <span>Sold Out ({outOfStockCount})</span>
              </button>
            </div>

            {/* Threshold Selector & Search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
              
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-gray-400 whitespace-nowrap">Restock Alert Threshold:</span>
                <select
                  value={restockThreshold}
                  onChange={(e) => setRestockThreshold(Number(e.target.value))}
                  className="px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded-xl font-bold text-white focus:outline-none focus:border-forest-500"
                >
                  <option value={5}>≤ 5 units (Critical Only)</option>
                  <option value={10}>≤ 10 units (Recommended)</option>
                  <option value={15}>≤ 15 units (Early Warning)</option>
                  <option value={20}>≤ 20 units (Conservative)</option>
                </select>
              </div>

              {/* Search Bar */}
              <input 
                type="text" 
                placeholder="Search inventory, brands, drinks..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded-xl text-xs w-full sm:w-56 text-white focus:outline-none focus:border-forest-500"
              />
            </div>

          </div>

          {/* Products Table with Visual Restock Badges */}
          <div className="bg-neutral-900/90 rounded-3xl border border-neutral-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 border-b border-neutral-800 text-gray-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Product Details</th>
                    <th className="p-4">Aisle / Brand</th>
                    <th className="p-4">Price (NGN)</th>
                    <th className="p-4">Stock Level</th>
                    <th className="p-4">Restock Priority Badge</th>
                    <th className="p-4">Quick Replenish</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filteredProducts.map(product => {
                    const isEditing = editingProductId === product.id;
                    const isBelowThreshold = product.stock <= restockThreshold;
                    const isCritical = product.stock > 0 && product.stock <= 5;
                    const isSoldOut = product.stock <= 0;

                    return (
                      <tr 
                        key={product.id} 
                        className={`transition-colors ${
                          isSoldOut 
                            ? 'bg-red-950/20 hover:bg-red-950/30' 
                            : isCritical 
                            ? 'bg-amber-950/20 hover:bg-amber-950/30' 
                            : 'hover:bg-neutral-800/40'
                        }`}
                      >
                        {/* 1. Product Details */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={product.image} alt={product.name} className="w-11 h-11 object-cover rounded-xl border border-neutral-700 shadow-2xs" />
                            <div>
                              <p className="font-bold text-white line-clamp-1">{product.name}</p>
                              <p className="text-[10px] text-gray-400">{product.unit}</p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Category & Brand */}
                        <td className="p-4">
                          <span className="font-bold text-white block capitalize">{product.category}</span>
                          <span className="text-[10px] text-forest-400 font-semibold">{product.brand}</span>
                        </td>

                        {/* 3. Price */}
                        <td className="p-4">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(Number(e.target.value))}
                              className="w-24 px-2 py-1 bg-black border border-forest-500 rounded-lg text-white font-mono text-xs"
                            />
                          ) : (
                            <span className="font-mono font-black text-forest-400">
                              {formatPrice(product.price, currency)}
                            </span>
                          )}
                        </td>

                        {/* 4. Stock Level */}
                        <td className="p-4">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editStock}
                              onChange={(e) => setEditStock(Number(e.target.value))}
                              className="w-20 px-2 py-1 bg-black border border-forest-500 rounded-lg text-white font-mono text-xs"
                            />
                          ) : (
                            <span className="font-bold text-white">
                              {product.stock} units
                            </span>
                          )}
                        </td>

                        {/* 5. Restock Priority Badge */}
                        <td className="p-4">
                          {isSoldOut ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-red-950 text-red-300 border border-red-700">
                              <i className="fa-solid fa-circle-xmark"></i>
                              <span>Sold Out</span>
                            </span>
                          ) : isCritical ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-950 text-amber-300 border border-amber-600 animate-pulse">
                              <i className="fa-solid fa-triangle-exclamation"></i>
                              <span>Critical (≤5)</span>
                            </span>
                          ) : isBelowThreshold ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-900/40 text-amber-200 border border-amber-800">
                              <i className="fa-solid fa-boxes-packing"></i>
                              <span>Restock Soon</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                              <i className="fa-solid fa-check"></i>
                              <span>Adequate</span>
                            </span>
                          )}
                        </td>

                        {/* 6. Quick Replenish Buttons */}
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleQuickRestock(product, 10)}
                              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-slate-200 rounded-lg text-[10px] font-bold transition-colors"
                              title="Add 10 units"
                            >
                              +10
                            </button>
                            <button
                              onClick={() => handleQuickRestock(product, 25)}
                              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-slate-200 rounded-lg text-[10px] font-bold transition-colors"
                              title="Add 25 units"
                            >
                              +25
                            </button>
                            <button
                              onClick={() => handleToggleStockStatus(product)}
                              className={`p-1 rounded-lg text-[10px] font-bold transition-colors ${
                                product.stock > 0 ? 'text-gray-400 hover:text-red-400' : 'text-emerald-400 hover:text-emerald-300'
                              }`}
                              title={product.stock > 0 ? 'Mark Sold Out' : 'Restore Stock'}
                            >
                              <i className={`fa-solid ${product.stock > 0 ? 'fa-ban' : 'fa-rotate-left'}`}></i>
                            </button>
                          </div>
                        </td>

                        {/* 7. Action Edit/Save */}
                        <td className="p-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleSaveEdit(product)}
                                className="px-3 py-1 bg-forest-600 hover:bg-forest-500 text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingProductId(null)}
                                className="px-2 py-1 bg-neutral-800 text-gray-400 hover:text-white rounded-lg text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(product)}
                              className="px-3 py-1 bg-neutral-800 hover:bg-neutral-750 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-between">
            <span className="text-xs text-slate-300 font-bold">
              Dispatch & Order Stage Transitions ({orders.length} orders nationwide)
            </span>
            <span className="text-xs text-forest-400 font-bold">
              Changes trigger real-time driver progress & SMS notices
            </span>
          </div>

          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-neutral-900/90 p-5 rounded-3xl border border-neutral-800 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-black text-white bg-black px-3 py-1 rounded-xl border border-neutral-800">
                      #{order.id}
                    </span>
                    <span className="text-xs text-gray-400">{order.date}</span>
                    <span className="text-xs font-bold text-slate-200">
                      Customer: {order.deliveryAddress.fullName} ({order.deliveryAddress.phone})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-medium">Update Status:</span>
                    <select
                      value={order.status}
                      onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as any)}
                      className="px-3 py-1.5 bg-black border border-neutral-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-forest-500"
                    >
                      <option value="Order Confirmed">Order Confirmed</option>
                      <option value="Picking Items">Picking Items (In-Store)</option>
                      <option value="Out for Delivery">Out for Delivery (Rider Dispatched)</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Items & Address Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Order Items</p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-black/60 p-2 rounded-xl border border-neutral-800/80">
                          <span className="font-medium text-slate-300">{item.name} × {item.quantity}</span>
                          <span className="font-bold text-white">{formatPrice(item.price * item.quantity, currency)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-black/60 p-4 rounded-2xl border border-neutral-800/80 space-y-1.5">
                    <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Delivery Instructions</p>
                    <p><strong className="text-slate-300">Destination:</strong> {order.deliveryAddress.area}, {order.deliveryAddress.state || 'Nigeria'}</p>
                    <p><strong className="text-slate-300">Address:</strong> {order.deliveryAddress.street}</p>
                    <p><strong className="text-slate-300">Landmark:</strong> {order.deliveryAddress.landmark}</p>
                    <p><strong className="text-slate-300">Time Slot:</strong> {order.deliverySlot}</p>
                    <p className="pt-2 border-t border-neutral-800 text-sm font-bold text-forest-400">
                      Total: {formatPrice(order.total, currency)} ({order.paymentMethod.toUpperCase()})
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD NEW PRODUCT ================= */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAddProductModalOpen(false)} />

          <div className="relative bg-[#0d120f] w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-neutral-800 text-slate-100 overflow-hidden z-10 flex flex-col max-h-[92vh] animate-scaleUp">
            
            {/* Modal Header */}
            <div className="p-6 bg-black border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-forest-700 text-white flex items-center justify-center text-lg font-bold">
                  <i className="fa-solid fa-plus"></i>
                </div>
                <div>
                  <h2 className="text-lg font-black text-white font-display">Add New Supermarket Product</h2>
                  <p className="text-xs text-slate-400">Syncs immediately with backend API (/api/products) and storefront</p>
                </div>
              </div>

              <button 
                onClick={() => setIsAddProductModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateProductSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 hide-scrollbar text-xs">
              
              {addProductError && (
                <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-200 rounded-xl">
                  {addProductError}
                </div>
              )}

              {/* Product Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Malta Guinness Classic Can (Pack of 6)"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-forest-500"
                />
              </div>

              {/* Aisle & Subcategory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Aisle / Category *</label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-forest-500"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Subcategory / Shelf</label>
                  <input
                    type="text"
                    placeholder="e.g. Carbonated Drinks, Tubers, Juices"
                    value={newProductForm.subcategory}
                    onChange={(e) => setNewProductForm({ ...newProductForm, subcategory: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-forest-500"
                  />
                </div>
              </div>

              {/* Brand & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-300 block">Brand *</label>
                    <span className="text-[10px] text-gray-500">Nigerian & Global</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Guinness Nigeria, Chi Limited, Rite Foods"
                    value={newProductForm.brand}
                    onChange={(e) => setNewProductForm({ ...newProductForm, brand: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-forest-500"
                  />
                  {/* Quick popular drink brand buttons */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {POPULAR_BEVERAGE_BRANDS.slice(0, 5).map(b => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setNewProductForm({ ...newProductForm, brand: b })}
                        className="text-[9px] px-1.5 py-0.5 bg-neutral-800 text-slate-300 rounded hover:bg-neutral-700"
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Unit / Pack Size *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1 Litre Bottle, Pack of 12, 1kg"
                    value={newProductForm.unit}
                    onChange={(e) => setNewProductForm({ ...newProductForm, unit: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-forest-500"
                  />
                </div>
              </div>

              {/* Price & Original Price & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Selling Price (₦) *</label>
                  <input
                    type="number"
                    required
                    min={50}
                    value={newProductForm.price}
                    onChange={(e) => setNewProductForm({ ...newProductForm, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-forest-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Original Price (₦, Optional)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 4000 (shows strike-through)"
                    value={newProductForm.originalPrice || ''}
                    onChange={(e) => setNewProductForm({ ...newProductForm, originalPrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-forest-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Initial Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newProductForm.stock}
                    onChange={(e) => setNewProductForm({ ...newProductForm, stock: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-forest-500 font-mono"
                  />
                </div>
              </div>

              {/* Image URL & Presets */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">Product Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newProductForm.image}
                  onChange={(e) => setNewProductForm({ ...newProductForm, image: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-forest-500"
                />
                
                {/* Preset image suggestions */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-gray-500 py-0.5">Quick Presets:</span>
                  {SAMPLE_PRESET_IMAGES.slice(0, 6).map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setNewProductForm({ ...newProductForm, image: p.url })}
                      className="text-[10px] px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-slate-300 rounded-lg transition-colors border border-neutral-700"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Description & Tasting Notes</label>
                <textarea
                  rows={2}
                  value={newProductForm.description}
                  onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-forest-500"
                />
              </div>

              {/* Tags & Flags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Dietary & Highlight Tags (Comma separated)</label>
                  <input
                    type="text"
                    value={newProductForm.dietaryTags}
                    onChange={(e) => setNewProductForm({ ...newProductForm, dietaryTags: e.target.value })}
                    placeholder="Chilled, Vitamin C, Real Fruit"
                    className="w-full px-3.5 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-forest-500"
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newProductForm.isOrganic}
                      onChange={(e) => setNewProductForm({ ...newProductForm, isOrganic: e.target.checked })}
                      className="w-4 h-4 rounded text-forest-600 bg-neutral-900 border-neutral-700"
                    />
                    <span className="text-slate-300 font-bold">Organic</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newProductForm.isLocalFarm}
                      onChange={(e) => setNewProductForm({ ...newProductForm, isLocalFarm: e.target.checked })}
                      className="w-4 h-4 rounded text-forest-600 bg-neutral-900 border-neutral-700"
                    />
                    <span className="text-slate-300 font-bold">Locally Farmed Direct</span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="w-full py-3.5 bg-forest-600 hover:bg-forest-500 disabled:opacity-50 text-white font-bold rounded-2xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {isSubmittingProduct ? (
                    <>
                      <i className="fa-solid fa-circle-notch animate-spin"></i>
                      <span>Adding to Store Inventory...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check"></i>
                      <span>Confirm & Publish Product to Store</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
