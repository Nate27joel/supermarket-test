import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import ProductCatalog from './components/ProductCatalog';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import AccountDashboard from './components/AccountDashboard';
import AdminDashboard from './components/AdminDashboard';
import RecipeModal from './components/RecipeModal';
import OrderTrackingModal from './components/OrderTrackingModal';
import SmsNotificationToast from './components/SmsNotificationToast';
import AuthModal, { AuthMode } from './components/AuthModal';
import { generateOrderSms } from './services/smsNotificationService';
import { verifyActiveSession, logoutSession } from './services/authService';
import { Product, CartItem, Currency, View, Order, UserProfile, AdminProfile, ActiveAccountRole, SmsNotification } from './types';
import { 
  CATEGORIES, 
  PRODUCTS as INITIAL_PRODUCTS, 
  SAMPLE_USER, 
  SAMPLE_ADMIN,
  SAMPLE_ORDERS, 
  PROMO_CODES, 
  formatPrice,
  DELIVERY_HUBS 
} from './constants';
import { getRecipeSuggestions } from './services/geminiService';

const App: React.FC = () => {
  // Storefront products & cart
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('nuelixx_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('nuelixx_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('nuelixx_orders');
    return saved ? JSON.parse(saved) : SAMPLE_ORDERS;
  });

  // User and Admin state
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('palmgrove_user');
    return saved ? JSON.parse(saved) : SAMPLE_USER;
  });

  const [admin, setAdmin] = useState<AdminProfile>(() => {
    const saved = localStorage.getItem('palmgrove_admin');
    return saved ? JSON.parse(saved) : SAMPLE_ADMIN;
  });

  // Admin authentication is completely separated from customer account
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('palmgrove_admin_auth') === 'true';
  });

  const [activeAccount, setActiveAccount] = useState<ActiveAccountRole>('user');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);

  // Authentication Modal state (strictly Customer Login & Signup)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<AuthMode>('customer-login');

  // View state & hash route sync (#/admin or #/admin-dashboard)
  const [currentView, setCurrentView] = useState<View>(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hash;
      if (h === '#/admin' || h === '#admin' || h === '#/admin-dashboard' || h === '#admin-dashboard') {
        return 'admin';
      }
    }
    return 'home';
  });

  // Currency strictly NAIRA (₦)
  const currency: Currency = 'NGN';
  const [selectedBranch, setSelectedBranch] = useState<string>('aba-owerri');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Global Order Tracking Modal
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<Order | null>(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  // Promo code (Nuelixx launch discount)
  const [appliedPromo, setAppliedPromo] = useState<string | null>('NUELIXX10');

  // Global Simulated SMS Toast notifications
  const [globalSms, setGlobalSms] = useState<SmsNotification[]>([]);

  // AI Recipe states
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [suggestedRecipes, setSuggestedRecipes] = useState<any[]>([]);
  const [isRecipesLoading, setIsRecipesLoading] = useState(false);

  // Home Featured Filter Tab
  const [homeTab, setHomeTab] = useState<'all' | 'deals' | 'farm' | 'pantry'>('all');

  // Hydrate products catalog from backend on mount
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
          localStorage.setItem('palmgrove_products', JSON.stringify(data.products));
        }
      })
      .catch(err => console.log('Loaded local products catalog:', err));
  }, []);

  // Verify backend session on startup
  useEffect(() => {
    verifyActiveSession().then((session) => {
      if (session.authenticated) {
        if (session.role === 'customer' && session.user) {
          setIsLoggedIn(true);
          setUser(session.user);
          setActiveAccount('user');
        } else if (session.role === 'admin' && session.admin) {
          setIsAdminAuthenticated(true);
          setAdmin(session.admin);
        }
      }
    });
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('palmgrove_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('palmgrove_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('palmgrove_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('palmgrove_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('palmgrove_admin', JSON.stringify(admin));
  }, [admin]);

  // Synchronize hash routing for separate Admin Dashboard (#/admin or #/admin-dashboard)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#/admin' || hash === '#admin' || hash === '#/admin-dashboard' || hash === '#admin-dashboard') {
        setCurrentView('admin');
      } else if (currentView === 'admin' && (hash === '' || hash === '#/' || hash === '#')) {
        setCurrentView('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentView]);

  const handleOpenAdmin = () => {
    window.location.hash = '#/admin';
    setCurrentView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExitAdmin = () => {
    window.location.hash = '#/';
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (mode: AuthMode = 'customer-login') => {
    setAuthInitialMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleCustomerLoginSuccess = (newUser: UserProfile) => {
    setUser(newUser);
    setActiveAccount('user');
    setIsLoggedIn(true);
    // Trigger simulated welcome SMS
    const welcomeSms: SmsNotification = {
      id: `sms-login-${Date.now()}`,
      orderId: 'PG-ACCOUNT',
      recipientPhone: newUser.phone,
      recipientName: newUser.name,
      status: 'Order Confirmed',
      message: `PalmGrove Aba: Welcome, ${newUser.name}! Your account is connected. Free delivery on orders above ₦25,000 across Aba Hubs.`,
      timestamp: 'Just Now',
      carrier: 'MTN Nigeria (Shortcode PG-ABA)'
    };
    setGlobalSms(prev => [welcomeSms, ...prev]);
  };

  const handleAdminLoginSuccess = (newAdmin: AdminProfile) => {
    setAdmin(newAdmin);
    setIsAdminAuthenticated(true);
    localStorage.setItem('palmgrove_admin_auth', 'true');
    setCurrentView('admin');
    window.location.hash = '#/admin';
    // Trigger simulated admin SMS
    const adminSms: SmsNotification = {
      id: `sms-adm-${Date.now()}`,
      orderId: 'STAFF-TERMINAL',
      recipientPhone: newAdmin.phone,
      recipientName: newAdmin.name,
      status: 'Order Confirmed',
      message: `PalmGrove Operations: Staff terminal session initiated for ${newAdmin.name} (${newAdmin.title}). Inventory permissions active.`,
      timestamp: 'Just Now',
      carrier: 'Airtel NG (Shortcode PG-STAFF)'
    };
    setGlobalSms(prev => [adminSms, ...prev]);
  };

  const handleAdminLogout = async () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('palmgrove_admin_auth');
    await logoutSession();
    setCurrentView('home');
    window.location.hash = '#/';
  };

  const handleLogout = async () => {
    await logoutSession();
    setIsLoggedIn(false);
    setActiveAccount('user');
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts(prev => {
      const updated = [newProduct, ...prev.filter(p => p.id !== newProduct.id)];
      localStorage.setItem('palmgrove_products', JSON.stringify(updated));
      return updated;
    });
  };

  const handleOpenQuickTrack = () => {
    const active = orders.find(o => o.status !== 'Delivered') || orders[0];
    if (active) {
      setSelectedTrackingOrder(active);
      setIsTrackingModalOpen(true);
    } else {
      setCurrentView('account');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    const promo = PROMO_CODES[appliedPromo];
    if (!promo) return 0;
    if (promo.discountPercent) {
      return Math.round((subtotal * promo.discountPercent) / 100);
    }
    if (promo.fixedDiscountNgn) {
      return Math.min(subtotal, promo.fixedDiscountNgn);
    }
    return 0;
  }, [subtotal, appliedPromo]);

  const FREE_DELIVERY_THRESHOLD = 25000;
  const STANDARD_DELIVERY_FEE = 1500;
  const hasFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD || (appliedPromo && PROMO_CODES[appliedPromo]?.freeDelivery);
  const deliveryFee = cart.length === 0 ? 0 : (hasFreeDelivery ? 0 : STANDARD_DELIVERY_FEE);
  
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const estimatedTax = cart.length === 0 ? 0 : Math.round(taxableAmount * 0.075); // 7.5% VAT
  const checkoutTotal = cart.length === 0 ? 0 : Math.max(0, taxableAmount + deliveryFee + estimatedTax);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Cart Actions
  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const addMultipleToCart = (itemsToAdd: Product[]) => {
    setCart(prev => {
      let nextCart = [...prev];
      itemsToAdd.forEach(product => {
        const existingIdx = nextCart.findIndex(item => item.id === product.id);
        if (existingIdx > -1) {
          nextCart[existingIdx] = { ...nextCart[existingIdx], quantity: nextCart[existingIdx].quantity + 1 };
        } else {
          nextCart.push({ ...product, quantity: 1 });
        }
      });
      return nextCart;
    });
    setIsCartOpen(true);
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleApplyPromo = (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (PROMO_CODES[normalized]) {
      setAppliedPromo(normalized);
      return { success: true, message: `Coupon ${normalized} applied successfully! ${PROMO_CODES[normalized].label}` };
    }
    return { success: false, message: 'Invalid promo code. Try ABA10, FREEDEL, or FRESH500.' };
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
  };

  // Product View
  const handleViewProduct = (product: Product) => {
    setSelectedProductForDetail(product);
    setIsDetailModalOpen(true);
  };

  // Wishlist toggle
  const handleToggleSave = (productId: string) => {
    setUser(prev => {
      const exists = prev.savedItemIds.includes(productId);
      const updated = exists 
        ? prev.savedItemIds.filter(id => id !== productId)
        : [...prev.savedItemIds, productId];
      return { ...prev, savedItemIds: updated };
    });
  };

  // Reorder from Account
  const handleReorder = (items: CartItem[]) => {
    setCart(prev => {
      const nextCart = [...prev];
      items.forEach(newItem => {
        const existingIndex = nextCart.findIndex(i => i.id === newItem.id);
        if (existingIndex > -1) {
          nextCart[existingIndex].quantity += newItem.quantity;
        } else {
          nextCart.push({ ...newItem });
        }
      });
      return nextCart;
    });
    setIsCartOpen(true);
  };

  // Admin Actions
  const handleUpdateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    if (selectedTrackingOrder && selectedTrackingOrder.id === orderId) {
      setSelectedTrackingOrder(prev => prev ? { ...prev, status } : null);
    }
    const target = orders.find(o => o.id === orderId);
    if (target) {
      const sms = generateOrderSms(target, status);
      setGlobalSms(prev => [sms, ...prev]);
    }
  };

  // AI Recipes
  const handleTrySmartRecipes = async () => {
    setIsRecipeModalOpen(true);
    setIsRecipesLoading(true);
    const contextIngredients = cart.length > 0 
      ? cart.map(i => i.name) 
      : ['White Yam', 'Roma Tomatoes', 'Plantain', 'Farm Chicken'];
      
    try {
      const recipes = await getRecipeSuggestions(contextIngredients);
      setSuggestedRecipes(recipes);
    } catch (error) {
      console.error("Recipe suggestions error", error);
    } finally {
      setIsRecipesLoading(false);
    }
  };

  // Home Featured Products Filter
  const homeFeaturedProducts = useMemo(() => {
    if (homeTab === 'deals') {
      return products.filter(p => p.originalPrice && p.originalPrice > p.price);
    }
    if (homeTab === 'farm') {
      return products.filter(p => p.isLocalFarm);
    }
    if (homeTab === 'pantry') {
      return products.filter(p => p.category === 'pantry');
    }
    return products.slice(0, 8);
  }, [products, homeTab]);

  // Main application content
  const appContent = (
    <div className="min-h-screen flex flex-col bg-black text-slate-100 pb-20 sm:pb-0 font-sans selection:bg-forest-600 selection:text-white relative">
      
      {/* Header with Aba Branch selector, Search, Mobile Menu Drawer, and Customer Account */}
      <Header 
        cartCount={cartCount}
        cartTotal={checkoutTotal}
        onCartClick={() => setIsCartOpen(true)}
        onHomeClick={() => {
          setCurrentView('home');
          setActiveCategory(null);
          setSearchQuery('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onCatalogClick={(catId?: string) => {
          setCurrentView('catalog');
          setActiveCategory(catId || null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onAccountClick={() => {
          setCurrentView('account');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onRecipesClick={handleTrySmartRecipes}
        onQuickTrackClick={handleOpenQuickTrack}
        onSearch={(query) => {
          setSearchQuery(query);
          if (query.trim().length > 0 && currentView !== 'catalog') {
            setCurrentView('catalog');
          }
        }}
        searchQuery={searchQuery}
        selectedBranch={selectedBranch}
        onSelectBranch={setSelectedBranch}
        currentView={currentView}
        availableProducts={products}
        onSelectProduct={handleViewProduct}
        activeOrders={orders}
        onOpenAuth={handleOpenAuth}
        activeAccount={activeAccount}
        user={user}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />

      {/* Main Content Router */}
      <main className="flex-1">
        
        {/* VIEW 1: HOMEPAGE */}
        {currentView === 'home' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-12">
            
            {/* Hero Banner Section (Deep Black & Forest Green with glowing accents) */}
            <section className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-neutral-950 via-[#0a140f] to-black min-h-[360px] sm:min-h-[460px] flex items-center px-6 sm:px-14 shadow-2xl border border-neutral-800 group">
              <img 
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1400&auto=format&fit=crop&q=80" 
                className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-1000" 
                alt="PalmGrove Supermarket Fresh Produce Aba"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>

              <div className="relative z-10 max-w-xl text-white space-y-4 sm:space-y-6">
                <div className="inline-flex items-center gap-2 bg-warm-400 text-slate-950 text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                  <i className="fa-solid fa-bolt text-xs"></i>
                  <span>Nationwide Express Grocery Supply</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight font-display tracking-tight">
                  Farm-Fresh <br/>
                  <span className="text-warm-300">Groceries & Drinks.</span>
                </h1>

                <p className="text-slate-300 text-sm sm:text-lg font-medium leading-relaxed">
                  Pristine white yams, plantains, Mama Gold rice, beverages, dairy, and household essentials. Fast doorstep delivery available for supply to any state in Nigeria.
                </p>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
                  <button 
                    onClick={() => {
                      setCurrentView('catalog');
                      setActiveCategory(null);
                    }}
                    className="px-7 sm:px-8 py-4 bg-forest-700 hover:bg-forest-600 text-white rounded-2xl font-black text-sm sm:text-base transition-all duration-200 shadow-xl shadow-forest-950/40 active:scale-95 flex items-center gap-2 border border-forest-600/40"
                  >
                    <span>Shop All Groceries</span>
                    <i className="fa-solid fa-arrow-right text-xs"></i>
                  </button>

                  <button 
                    onClick={handleTrySmartRecipes}
                    className="px-6 py-4 bg-neutral-900/80 hover:bg-neutral-800 text-white border border-neutral-700 rounded-2xl font-bold text-sm sm:text-base backdrop-blur-md transition-all flex items-center gap-2"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles text-warm-300"></i>
                    <span>AI Recipe Ideas</span>
                  </button>
                </div>

                {/* Delivery Badges */}
                <div className="flex items-center gap-4 pt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <i className="fa-solid fa-truck-fast text-warm-400"></i> Under 45 Mins
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <i className="fa-solid fa-shield-halved text-warm-400"></i> Quality Guaranteed
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <i className="fa-solid fa-money-bill-wave text-warm-400"></i> Pay on Delivery
                  </span>
                </div>
              </div>
            </section>

            {/* Category Quick-Navigation Grid */}
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">Explore Supermarket Aisles</h2>
                  <p className="text-xs sm:text-sm text-slate-400">Pick an aisle to discover local harvests and imported pantry favorites in Aba.</p>
                </div>
                <button 
                  onClick={() => {
                    setCurrentView('catalog');
                    setActiveCategory(null);
                  }}
                  className="text-xs sm:text-sm font-bold text-forest-400 hover:text-forest-300 flex items-center gap-1"
                >
                  <span>View All Items</span>
                  <i className="fa-solid fa-chevron-right text-[10px]"></i>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
                {CATEGORIES.map((cat) => {
                  const count = products.filter(p => p.category === cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setActiveCategory(cat.id);
                        setCurrentView('catalog');
                      }}
                      className="group p-4 bg-[#111613] rounded-3xl border border-neutral-800 hover:border-forest-600/70 hover:shadow-xl hover:shadow-black/60 cursor-pointer transition-all duration-300 flex flex-col items-center text-center space-y-2 select-none"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-neutral-900 text-forest-400 group-hover:bg-forest-700 group-hover:text-white transition-all flex items-center justify-center text-xl shadow-xs border border-neutral-800">
                        <i className={`fa-solid ${cat.icon}`}></i>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white group-hover:text-forest-400 transition-colors line-clamp-1">
                          {cat.name}
                        </h3>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {count} items
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Featured / Best-Selling Products Carousel & Tabs */}
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-red-950/80 text-red-400 border border-red-800 px-2 py-0.5 rounded">
                      Top Picks
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white">Featured & Best-Sellers</h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400">Most purchased daily staples in Aba households this week.</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-neutral-950 border border-neutral-800 p-1 rounded-2xl text-xs font-bold">
                  <button 
                    onClick={() => setHomeTab('all')}
                    className={`px-3.5 py-1.5 rounded-xl transition-all ${homeTab === 'all' ? 'bg-forest-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    All Popular
                  </button>
                  <button 
                    onClick={() => setHomeTab('deals')}
                    className={`px-3.5 py-1.5 rounded-xl transition-all ${homeTab === 'deals' ? 'bg-forest-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    Special Deals
                  </button>
                  <button 
                    onClick={() => setHomeTab('farm')}
                    className={`px-3.5 py-1.5 rounded-xl transition-all ${homeTab === 'farm' ? 'bg-forest-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    Abia Farm Direct
                  </button>
                  <button 
                    onClick={() => setHomeTab('pantry')}
                    className={`px-3.5 py-1.5 rounded-xl transition-all ${homeTab === 'pantry' ? 'bg-forest-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    Pantry Staples
                  </button>
                </div>
              </div>

              {/* Grid of Product Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {homeFeaturedProducts.map(product => {
                  const cartItem = cart.find(i => i.id === product.id);
                  const isSaved = user.savedItemIds.includes(product.id);

                  return (
                    <ProductCard 
                      key={product.id}
                      product={product}
                      onAddToCart={addToCart}
                      onUpdateQuantity={updateCartQuantity}
                      cartQuantity={cartItem?.quantity || 0}
                      onViewDetails={handleViewProduct}
                      currency={currency}
                      isSaved={isSaved}
                      onToggleSave={handleToggleSave}
                    />
                  );
                })}
              </div>
            </section>

            {/* AI Recipe Kitchen Teaser Banner */}
            <section className="bg-gradient-to-r from-forest-950 via-[#0d1e15] to-neutral-950 border border-forest-900/60 rounded-[2.5rem] p-8 sm:p-12 text-white relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block">
                <img 
                  src="https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop&q=80" 
                  className="w-full h-full object-cover opacity-15 group-hover:opacity-25 transition-opacity" 
                  alt="Delicious cooking ingredients" 
                />
              </div>
              <div className="relative z-10 max-w-xl space-y-4">
                <div className="flex items-center space-x-2 text-xs font-bold text-warm-300">
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  <span className="uppercase tracking-widest">Smart Meal Kitchen</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black leading-tight text-white">
                  Don't know what to cook tonight?
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Our chef automatically suggests mouth-watering Nigerian meals using items in your basket, and loads all missing ingredients with 1 click.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button 
                    onClick={handleTrySmartRecipes}
                    className="px-6 py-3.5 bg-warm-400 hover:bg-warm-500 text-slate-950 rounded-2xl font-black text-sm transition-all shadow-md active:scale-95"
                  >
                    Try AI Recipe Suggestions
                  </button>
                  <button 
                    onClick={() => {
                      setCurrentView('catalog');
                      setActiveCategory('produce');
                    }}
                    className="px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl font-bold text-sm border border-neutral-700 transition-all"
                  >
                    Browse Fresh Produce
                  </button>
                </div>
              </div>
            </section>

            {/* Customer Trust Badges */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 py-4">
              <div className="p-6 bg-[#111613] rounded-3xl border border-neutral-800 space-y-2 text-center shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-forest-900/60 text-forest-400 flex items-center justify-center mx-auto text-xl border border-forest-800/60">
                  <i className="fa-solid fa-seedling"></i>
                </div>
                <h3 className="font-bold text-sm text-white">Farm-to-Door Fresh</h3>
                <p className="text-xs text-slate-400">Harvested fresh daily from certified farms and trusted national producers.</p>
              </div>

              <div className="p-6 bg-[#111613] rounded-3xl border border-neutral-800 space-y-2 text-center shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-forest-900/60 text-forest-400 flex items-center justify-center mx-auto text-xl border border-forest-800/60">
                  <i className="fa-solid fa-stopwatch"></i>
                </div>
                <h3 className="font-bold text-sm text-white">Nationwide Express</h3>
                <p className="text-xs text-slate-400">Rapid same-day dispatch to all 36 States and Abuja FCT.</p>
              </div>

              <div className="p-6 bg-[#111613] rounded-3xl border border-neutral-800 space-y-2 text-center shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-forest-900/60 text-forest-400 flex items-center justify-center mx-auto text-xl border border-forest-800/60">
                  <i className="fa-solid fa-award"></i>
                </div>
                <h3 className="font-bold text-sm text-white">Freshness Guaranteed</h3>
                <p className="text-xs text-slate-400">If any item doesn't meet your standard, we replace or refund instantly.</p>
              </div>

              <div className="p-6 bg-[#111613] rounded-3xl border border-neutral-800 space-y-2 text-center shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-forest-900/60 text-forest-400 flex items-center justify-center mx-auto text-xl border border-forest-800/60">
                  <i className="fa-solid fa-credit-card"></i>
                </div>
                <h3 className="font-bold text-sm text-white">Flexible Payments (₦)</h3>
                <p className="text-xs text-slate-400">Pay securely in Naira via Debit Card, Bank Transfer, or Cash on Delivery.</p>
              </div>
            </section>

            {/* Customer Reviews & Quotes */}
            <section className="space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <span className="text-xs font-bold text-forest-400 uppercase tracking-widest bg-forest-950 border border-forest-800 px-3 py-1 rounded-full">
                  Loved Across Nigeria
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">What Our Shoppers Say</h2>
                <p className="text-xs sm:text-sm text-slate-400">Real feedback from local families, merchants, and busy professionals across Nigeria.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#111613] p-6 rounded-3xl border border-neutral-800 shadow-xs space-y-3">
                  <div className="flex text-amber-400 text-xs">
                    <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                    "I ordered yams, fresh tomatoes, and Guinness Malta around 10 AM. By 10:45 AM the courier was already at my gate! Everything was crisp and fresh."
                  </p>
                  <div className="flex items-center gap-3 pt-2 border-t border-neutral-800">
                    <div className="w-9 h-9 rounded-full bg-forest-900 text-forest-300 font-bold flex items-center justify-center text-xs border border-forest-700">
                      CU
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Chidinma U.</p>
                      <p className="text-[10px] text-slate-500">Lagos Resident • Verified Buyer</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111613] p-6 rounded-3xl border border-neutral-800 shadow-xs space-y-3">
                  <div className="flex text-amber-400 text-xs">
                    <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                    "The yam was immaculate and dry — no spongy spots! Having real-time driver tracking on the map gave us complete peace of mind."
                  </p>
                  <div className="flex items-center gap-3 pt-2 border-t border-neutral-800">
                    <div className="w-9 h-9 rounded-full bg-forest-900 text-forest-300 font-bold flex items-center justify-center text-xs border border-forest-700">
                      EO
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Engr. Emeka Okoro</p>
                      <p className="text-[10px] text-slate-500">Abuja FCT • Verified Buyer</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111613] p-6 rounded-3xl border border-neutral-800 shadow-xs space-y-3">
                  <div className="flex text-amber-400 text-xs">
                    <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                    "I love the one-click reorder feature! Every two weeks I just reorder my regular Mama Gold rice, Golden Penny pasta, and Titus sardines in seconds."
                  </p>
                  <div className="flex items-center gap-3 pt-2 border-t border-neutral-800">
                    <div className="w-9 h-9 rounded-full bg-forest-900 text-forest-300 font-bold flex items-center justify-center text-xs border border-forest-700">
                      AO
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Amaka Obi</p>
                      <p className="text-[10px] text-slate-500">Port Harcourt • Frequent Shopper</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* VIEW 2: PRODUCT CATALOG PAGE */}
        {currentView === 'catalog' && (
          <ProductCatalog 
            products={products}
            categories={CATEGORIES}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            currency={currency}
            onAddToCart={addToCart}
            onUpdateQuantity={updateCartQuantity}
            cart={cart}
            onViewDetails={handleViewProduct}
            savedItemIds={user.savedItemIds}
            onToggleSave={handleToggleSave}
            initialSearchQuery={searchQuery}
          />
        )}

        {/* VIEW 3: USER & ADMIN ACCOUNT DASHBOARD */}
        {currentView === 'account' && (
          <AccountDashboard 
            user={user}
            admin={admin}
            activeAccount={activeAccount}
            onSwitchAccount={setActiveAccount}
            orders={orders}
            onReorder={handleReorder}
            savedProducts={products.filter(p => user.savedItemIds.includes(p.id))}
            onAddToCart={addToCart}
            onUpdateAddresses={(newAddresses) => setUser(prev => ({ ...prev, addresses: newAddresses }))}
            onClose={() => setCurrentView('home')}
            onUpdateOrderStage={handleUpdateOrderStatus}
            onNavigateToAdmin={handleOpenAdmin}
          />
        )}

        {/* VIEW 4: ADMIN / STORE MANAGER DASHBOARD (#/admin or #/admin-dashboard) */}
        {currentView === 'admin' && (
          <AdminDashboard 
            products={products}
            orders={orders}
            onUpdateProduct={handleUpdateProduct}
            onAddProduct={handleAddProduct}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            currency={currency}
            onExitAdmin={handleExitAdmin}
            isAdminAuthenticated={isAdminAuthenticated}
            adminProfile={admin}
            onAdminLoginSuccess={handleAdminLoginSuccess}
            onAdminLogout={handleAdminLogout}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-neutral-950 text-white border-t border-neutral-850 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-forest-700 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow border border-forest-600/40">
                <i className="fa-solid fa-leaf"></i>
              </div>
              <div>
                <span className="text-xl font-black text-white font-display">Nuelixx</span>
                <span className="text-[10px] block text-forest-400 font-semibold uppercase">Supermarket • Nationwide</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nigeria’s premier online supermarket. Supplying households with farm-fresh produce, branded drinks, beverages, staple grains, dairy, and household essentials nationwide across all 36 states and Abuja FCT.
            </p>
            <div className="flex gap-3 text-xs text-slate-400">
              <span className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center hover:bg-neutral-800 hover:text-white cursor-pointer"><i className="fa-brands fa-whatsapp text-sm"></i></span>
              <span className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center hover:bg-neutral-800 hover:text-white cursor-pointer"><i className="fa-brands fa-facebook-f text-sm"></i></span>
              <span className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center hover:bg-neutral-800 hover:text-white cursor-pointer"><i className="fa-brands fa-instagram text-sm"></i></span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-warm-300 mb-4">Supermarket Aisles</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              {CATEGORIES.slice(0, 6).map(cat => (
                <li key={cat.id}>
                  <button 
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setCurrentView('catalog');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>{cat.name}</span>
                    {cat.id === 'beverages' && (
                      <span className="text-[8px] px-1 py-0.2 rounded bg-cyan-900 text-cyan-300 font-black uppercase">Top Brands</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-warm-300 mb-4">Nationwide Fulfillment Hubs</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              {DELIVERY_HUBS.map(branch => (
                <li key={branch.id} className="flex items-start gap-2">
                  <i className="fa-solid fa-location-dot text-forest-400 mt-1 text-[10px]"></i>
                  <div>
                    <span className="font-bold text-white block">{branch.name.split(' (')[0]}</span>
                    <span className="text-[10px] text-slate-500">{branch.address}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-warm-300">Customer Support & Orders</h4>
            <p className="text-xs text-slate-400">Need help placing a family bulk order or inquiring about fresh harvests?</p>
            <div className="space-y-2 text-xs text-slate-300">
              <p className="flex items-center gap-2">
                <i className="fa-solid fa-phone text-forest-400"></i>
                <span className="font-bold text-white">0803 456 7890 / 0812 345 6789</span>
              </p>
              <p className="flex items-center gap-2">
                <i className="fa-solid fa-envelope text-forest-400"></i>
                <span>orders@nuelixx.ng</span>
              </p>
              <p className="flex items-center gap-2">
                <i className="fa-solid fa-clock text-forest-400"></i>
                <span>Mon - Sun: 7:30 AM – 9:00 PM</span>
              </p>
            </div>
            
            {/* Separate staff portal link */}
            <div className="pt-2 flex flex-col gap-1.5">
              <button 
                onClick={handleOpenAdmin}
                className="inline-flex items-center gap-1.5 text-[11px] text-amber-400 hover:text-amber-300 transition-colors font-bold text-left"
              >
                <i className="fa-solid fa-shield-halved text-[10px]"></i>
                <span>Staff & Store Manager Portal (Nationwide Hubs)</span>
              </button>
              <button 
                onClick={() => handleOpenAuth('customer-login')}
                className="inline-flex items-center gap-1.5 text-[11px] text-forest-400 hover:text-forest-300 transition-colors text-left"
              >
                <i className="fa-solid fa-user-plus text-[10px]"></i>
                <span>Customer Sign In / Sign Up</span>
              </button>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-neutral-850 text-center sm:flex sm:justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} PalmGrove Supermarket. Serving Aba, Abia State, Nigeria.</p>
          <p className="mt-2 sm:mt-0 text-slate-400">Farm-to-Door Freshness Guaranteed • All prices in Nigerian Naira (₦)</p>
        </div>
      </footer>

      {/* Mobile Sticky Bottom Bar for quick phone access */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md border-t border-neutral-800 flex justify-around items-center h-16 px-2 z-[90] shadow-2xl">
        <button 
          onClick={() => {
            setCurrentView('home');
            setActiveCategory(null);
          }}
          className={`flex flex-col items-center justify-center space-y-1 flex-1 ${currentView === 'home' ? 'text-forest-400 font-bold' : 'text-slate-400'}`}
        >
          <i className="fa-solid fa-house text-base"></i>
          <span className="text-[10px]">Home</span>
        </button>

        <button 
          onClick={() => {
            setCurrentView('catalog');
            setActiveCategory(null);
          }}
          className={`flex flex-col items-center justify-center space-y-1 flex-1 ${currentView === 'catalog' ? 'text-forest-400 font-bold' : 'text-slate-400'}`}
        >
          <i className="fa-solid fa-list-ul text-base"></i>
          <span className="text-[10px]">Catalog</span>
        </button>

        <button 
          onClick={handleOpenQuickTrack}
          className="flex flex-col items-center justify-center space-y-1 flex-1 text-slate-400 hover:text-warm-300"
        >
          <i className="fa-solid fa-location-crosshairs text-base text-forest-400"></i>
          <span className="text-[10px]">Track</span>
        </button>

        <button 
          onClick={() => setCurrentView('account')}
          className={`flex flex-col items-center justify-center space-y-1 flex-1 ${currentView === 'account' ? 'text-forest-400 font-bold' : 'text-slate-400'}`}
        >
          <i className="fa-solid fa-user text-base"></i>
          <span className="text-[10px]">Account</span>
        </button>

        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative flex flex-col items-center justify-center space-y-1 flex-1 text-slate-400"
        >
          <div className="relative">
            <i className="fa-solid fa-basket-shopping text-base text-forest-400"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-warm-400 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-black">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">Basket</span>
        </button>
      </nav>

      {/* Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={updateCartQuantity}
        onRemove={removeFromCart}
        currency={currency}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
        appliedPromo={appliedPromo}
        onApplyPromo={handleApplyPromo}
        onRemovePromo={handleRemovePromo}
        discountAmount={discountAmount}
      />

      {/* Checkout Modal */}
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        subtotal={subtotal}
        discount={discountAmount}
        discountCode={appliedPromo || undefined}
        deliveryFee={deliveryFee}
        tax={estimatedTax}
        total={checkoutTotal}
        currency={currency}
        user={user}
        selectedBranch={selectedBranch}
        onCompleteOrder={(newOrder) => {
          setOrders(prev => [newOrder, ...prev]);
        }}
        onClearCart={clearCart}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal 
        product={selectedProductForDetail}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedProductForDetail(null);
        }}
        onAddToCart={addToCart}
        currency={currency}
        allProducts={products}
        onOpenProduct={(prod) => setSelectedProductForDetail(prod)}
      />

      {/* AI Recipe Kitchen Modal */}
      <RecipeModal 
        isOpen={isRecipeModalOpen}
        onClose={() => setIsRecipeModalOpen(false)}
        recipes={suggestedRecipes}
        availableProducts={products}
        onAddProducts={addMultipleToCart}
        isLoading={isRecipesLoading}
        currency={currency}
      />

      {/* Global Interactive Order Tracking Modal with Aba Mini-Map */}
      <OrderTrackingModal 
        isOpen={isTrackingModalOpen}
        onClose={() => {
          setIsTrackingModalOpen(false);
          setSelectedTrackingOrder(null);
        }}
        order={selectedTrackingOrder}
        onUpdateStage={handleUpdateOrderStatus}
      />

      {/* Customer-only Authentication Modal (Sign in / Sign up) */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authInitialMode}
        onLoginSuccess={handleCustomerLoginSuccess}
        currentUser={user}
        onLogout={handleLogout}
      />

      {/* Global Simulated SMS Notification Toast */}
      <SmsNotificationToast 
        notifications={globalSms}
        onDismiss={(id) => setGlobalSms(prev => prev.filter(s => s.id !== id))}
        onClearAll={() => setGlobalSms([])}
      />

    </div>
  );

  return appContent;
};

export default App;
