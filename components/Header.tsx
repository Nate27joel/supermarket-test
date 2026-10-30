import React, { useState, useRef, useEffect } from 'react';
import { Product, View, Order, UserProfile, ActiveAccountRole } from '../types';
import { formatPrice, DELIVERY_HUBS, CATEGORIES, NIGERIA_STATES } from '../constants';
import { AuthMode } from './AuthModal';

interface HeaderProps {
  cartCount: number;
  cartTotal: number;
  onCartClick: () => void;
  onHomeClick: () => void;
  onCatalogClick: (category?: string) => void;
  onAccountClick: () => void;
  onRecipesClick: () => void;
  onQuickTrackClick: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  selectedBranch: string;
  onSelectBranch: (branchId: string) => void;
  currentView: View;
  availableProducts: Product[];
  onSelectProduct: (product: Product) => void;
  activeOrders?: Order[];
  onOpenAuth: (mode?: AuthMode) => void;
  activeAccount: ActiveAccountRole;
  user: UserProfile | null;
  isLoggedIn: boolean;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
  cartCount,
  cartTotal,
  onCartClick,
  onHomeClick,
  onCatalogClick,
  onAccountClick,
  onRecipesClick,
  onQuickTrackClick,
  onSearch,
  searchQuery,
  selectedBranch,
  onSelectBranch,
  currentView,
  availableProducts,
  onSelectProduct,
  activeOrders = [],
  onOpenAuth,
  user,
  isLoggedIn,
  onLogout
}) => {
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const locationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setIsLocationDropdownOpen(false);
      }
      if (
        searchRef.current && !searchRef.current.contains(event.target as Node) &&
        mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)
      ) {
        setIsAutocompleteOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentHub = DELIVERY_HUBS.find(b => b.id === selectedBranch) || DELIVERY_HUBS[0];

  const matchingSuggestions = searchQuery.trim().length > 1
    ? availableProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const hasActiveDelivery = activeOrders.some(o => o.status !== 'Delivered');

  return (
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-neutral-800 text-slate-100 shadow-xl shadow-black/40 w-full overflow-hidden">
      
      {/* Top Announcement Bar: Responsive, no horizontal overflow */}
      <div className="bg-[#080b09] text-white text-[10px] sm:text-xs py-1.5 px-3 sm:px-6 border-b border-neutral-850 w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-hidden">
          
          {/* Left: Express delivery badge & nationwide notice */}
          <div className="flex items-center gap-2 min-w-0 overflow-hidden">
            <span className="bg-forest-700 text-white text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider flex-shrink-0 shadow-xs">
              Nationwide Express
            </span>
            <p className="text-slate-300 font-medium truncate text-[11px] sm:text-xs">
              ⚡ Supplying Fresh Groceries & Drinks to Any State in Nigeria • Free delivery over ₦25,000
            </p>
          </div>

          {/* Right: Quick Track & Support */}
          <div className="flex items-center gap-3 ml-auto flex-shrink-0 text-xs">
            <button
              onClick={onQuickTrackClick}
              className="flex items-center gap-1.5 text-warm-300 hover:text-white font-bold transition-colors text-[11px]"
              title="Track order in real-time"
            >
              <i className="fa-solid fa-location-crosshairs text-xs"></i>
              <span className="hidden xs:inline">Track Order</span>
              {hasActiveDelivery && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              )}
            </button>

            <span className="text-neutral-700 hidden sm:inline">|</span>

            <a 
              href="tel:+2348034567890" 
              className="hidden md:flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-[11px]"
            >
              <i className="fa-solid fa-headset text-forest-400"></i>
              <span>0803 456 7890</span>
            </a>
          </div>

        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-14 sm:h-18 lg:h-20 gap-2 sm:gap-4">
          
          {/* Left: Hamburger Button (mobile/tablet) + Nuelixx Logo */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-neutral-900 rounded-xl transition-colors flex items-center justify-center flex-shrink-0"
              aria-label="Open menu"
            >
              <i className="fa-solid fa-bars-staggered text-base sm:text-lg"></i>
            </button>

            {/* Nuelixx Logo */}
            <div 
              className="flex items-center cursor-pointer select-none group flex-shrink-0" 
              onClick={onHomeClick}
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-forest-600 to-forest-800 rounded-xl sm:rounded-2xl flex items-center justify-center mr-2 shadow-md shadow-forest-950/40 group-hover:scale-105 transition-transform border border-forest-500/40">
                <i className="fa-solid fa-leaf text-white text-base sm:text-lg"></i>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
                    Nueli<span className="text-forest-400">xx</span>
                  </span>
                  <span className="hidden sm:inline-block text-[9px] font-bold uppercase bg-forest-900/80 text-forest-300 border border-forest-700 px-1.5 py-0.5 rounded">
                    Supermarket
                  </span>
                </div>
                <p className="hidden md:block text-[10px] text-slate-400 font-semibold tracking-wide">
                  Fresh Groceries • Nationwide Supply
                </p>
              </div>
            </div>
          </div>

          {/* Center (Desktop Only `hidden lg:flex`): State Hub Selector + Search Bar */}
          <div className="hidden lg:flex items-center gap-3 flex-1 max-w-2xl mx-4">
            
            {/* Nationwide State Selector */}
            <div className="relative flex-shrink-0" ref={locationRef}>
              <button
                onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-forest-600 rounded-2xl text-left transition-colors whitespace-nowrap text-xs"
              >
                <i className="fa-solid fa-location-dot text-forest-400 text-xs"></i>
                <div className="leading-tight">
                  <p className="text-slate-400 text-[9px] font-bold uppercase">Deliver to:</p>
                  <p className="font-black text-white truncate max-w-[120px]">
                    {currentHub.state}
                  </p>
                </div>
                <i className="fa-solid fa-chevron-down text-slate-500 text-[9px]"></i>
              </button>

              {isLocationDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-neutral-950 rounded-2xl shadow-2xl border border-neutral-800 p-2 z-50 animate-scaleUp">
                  <div className="px-3 py-2 border-b border-neutral-850">
                    <p className="text-xs font-black text-white">Select Delivery State / Hub</p>
                    <p className="text-[10px] text-slate-400">Nuelixx supplies all 36 Nigerian States & FCT</p>
                  </div>
                  <div className="space-y-1 mt-1 max-h-60 overflow-y-auto hide-scrollbar">
                    {DELIVERY_HUBS.map(hub => (
                      <button
                        key={hub.id}
                        onClick={() => {
                          onSelectBranch(hub.id);
                          setIsLocationDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl text-xs transition-colors flex items-center justify-between ${
                          selectedBranch === hub.id 
                            ? 'bg-forest-900/60 text-forest-200 font-bold border border-forest-700' 
                            : 'hover:bg-neutral-900 text-slate-300'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-white truncate">{hub.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{hub.address}</p>
                        </div>
                        <span className="text-[9px] text-emerald-400 font-bold whitespace-nowrap">~{hub.deliveryMin}m</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Search Bar */}
            <div className="flex-1 relative" ref={searchRef}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <i className="fa-solid fa-magnifying-glass text-xs"></i>
                </div>
                <input
                  type="text"
                  placeholder="Search yams, plantain, rice, drinks, malt, detergent..."
                  className="block w-full pl-9 pr-9 py-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 focus:border-forest-500 focus:bg-neutral-950 rounded-2xl text-xs text-white placeholder-slate-500 transition-all focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => {
                    onSearch(e.target.value);
                    setIsAutocompleteOpen(true);
                  }}
                  onFocus={() => setIsAutocompleteOpen(true)}
                />
                {searchQuery && (
                  <button 
                    onClick={() => onSearch('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    <i className="fa-solid fa-xmark text-xs"></i>
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {isAutocompleteOpen && matchingSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-950 rounded-2xl shadow-2xl border border-neutral-800 overflow-hidden z-50">
                  <div className="p-2 border-b border-neutral-850 bg-neutral-900 flex justify-between items-center text-[10px] text-slate-400">
                    <span>Matching Items in Stock</span>
                    <span className="text-forest-400 font-bold">Click to view</span>
                  </div>
                  <div className="divide-y divide-neutral-850">
                    {matchingSuggestions.map(item => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onSelectProduct(item);
                          setIsAutocompleteOpen(false);
                        }}
                        className="flex items-center gap-3 p-2.5 hover:bg-neutral-900 cursor-pointer transition-colors"
                      >
                        <img src={item.image} alt={item.name} className="w-9 h-9 object-cover rounded-lg border border-neutral-800" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-400">{item.brand} • {item.unit}</p>
                        </div>
                        <span className="text-xs font-black text-forest-400 font-mono">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Action Icons: Compact & Responsive */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            
            {/* Catalog Link */}
            <button 
              onClick={() => onCatalogClick()}
              className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                currentView === 'catalog' 
                  ? 'bg-forest-700 text-white' 
                  : 'text-slate-300 hover:bg-neutral-900 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-list-ul"></i>
              <span className="hidden lg:inline">All Aisles</span>
            </button>

            {/* AI Recipes Button */}
            <button 
              onClick={onRecipesClick}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-neutral-900 hover:text-forest-400 transition-colors"
              title="AI Recipe Ideas"
            >
              <i className="fa-solid fa-wand-magic-sparkles text-warm-400"></i>
              <span>Recipes</span>
            </button>

            {/* Customer Account Button & Dropdown */}
            <div className="relative flex-shrink-0" ref={accountRef}>
              <button 
                onClick={() => {
                  if (isLoggedIn) {
                    setIsAccountMenuOpen(!isAccountMenuOpen);
                  } else {
                    onOpenAuth('customer-login');
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                  currentView === 'account'
                    ? 'bg-forest-700 text-white border-forest-600'
                    : 'bg-neutral-900 text-slate-200 border-neutral-800 hover:border-neutral-700 hover:text-white'
                }`}
                title="Customer Account"
              >
                <i className="fa-solid fa-user text-forest-400 text-xs sm:text-sm"></i>
                <span className="hidden sm:inline truncate max-w-[85px]">
                  {isLoggedIn && user ? user.name.split(' ')[0] : 'Sign In'}
                </span>
                {isLoggedIn && (
                  <i className="fa-solid fa-chevron-down text-[8px] text-slate-400 hidden sm:inline"></i>
                )}
              </button>

              {/* Customer Account Dropdown Menu */}
              {isAccountMenuOpen && isLoggedIn && (
                <div className="absolute right-0 mt-2 w-60 bg-neutral-950 rounded-2xl shadow-2xl border border-neutral-800 p-2 z-50 animate-scaleUp text-xs space-y-1">
                  <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800/80 mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-forest-700 text-white flex items-center justify-center font-bold text-xs">
                        <i className="fa-solid fa-user"></i>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white truncate">{user?.name || 'Customer'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      onAccountClick();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-neutral-900 transition-colors flex items-center gap-2"
                  >
                    <i className="fa-solid fa-box-open text-forest-400"></i>
                    <span>My Orders & Addresses</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      onQuickTrackClick();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-neutral-900 transition-colors flex items-center gap-2"
                  >
                    <i className="fa-solid fa-location-crosshairs text-warm-400"></i>
                    <span>Track Active Order</span>
                  </button>

                  <div className="pt-1 border-t border-neutral-850">
                    <button
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/30 transition-colors flex items-center gap-2 font-medium"
                    >
                      <i className="fa-solid fa-arrow-right-from-bracket text-rose-400"></i>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Shopping Cart Button: Clean, never pushes mobile screen */}
            <button 
              onClick={onCartClick}
              className="relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 sm:py-2.5 bg-forest-700 hover:bg-forest-600 text-white rounded-xl sm:rounded-2xl transition-all shadow-md active:scale-95 border border-forest-600/40 flex-shrink-0"
              aria-label="Open basket"
            >
              <i className="fa-solid fa-basket-shopping text-sm sm:text-base"></i>
              <span className="hidden sm:inline text-xs font-black font-mono">
                {cartTotal > 0 ? formatPrice(cartTotal) : 'Basket'}
              </span>
              
              {cartCount > 0 && (
                <span className="bg-warm-400 text-slate-950 text-[10px] font-black h-4.5 min-w-[18px] sm:h-5 sm:min-w-[20px] px-1 flex items-center justify-center rounded-full border border-black shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

          </div>
        </div>

        {/* Dedicated Mobile & Tablet Search Bar Row (`lg:hidden`): Guarantees 0 horizontal overflow */}
        <div className="pb-2.5 pt-0.5 lg:hidden w-full" ref={mobileSearchRef}>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <i className="fa-solid fa-magnifying-glass text-xs"></i>
            </div>
            <input
              type="text"
              placeholder="Search yams, rice, drinks, malt, detergent..."
              className="block w-full pl-9 pr-9 py-2 bg-neutral-900 border border-neutral-800 focus:border-forest-500 rounded-xl text-xs text-white placeholder-slate-500 transition-all focus:outline-none"
              value={searchQuery}
              onChange={(e) => {
                onSearch(e.target.value);
                setIsAutocompleteOpen(true);
              }}
              onFocus={() => setIsAutocompleteOpen(true)}
            />
            {searchQuery && (
              <button 
                onClick={() => onSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            )}

            {/* Mobile Autocomplete Dropdown */}
            {isAutocompleteOpen && matchingSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-neutral-950 rounded-2xl shadow-2xl border border-neutral-800 overflow-hidden z-50">
                <div className="p-2 border-b border-neutral-850 bg-neutral-900 flex justify-between items-center text-[10px] text-slate-400">
                  <span>Matching Items in Stock</span>
                  <span className="text-forest-400 font-bold">Tap to view</span>
                </div>
                <div className="divide-y divide-neutral-850 max-h-56 overflow-y-auto">
                  {matchingSuggestions.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelectProduct(item);
                        setIsAutocompleteOpen(false);
                      }}
                      className="flex items-center gap-2.5 p-2.5 hover:bg-neutral-900 cursor-pointer transition-colors"
                    >
                      <img src={item.image} alt={item.name} className="w-8 h-8 object-cover rounded-lg border border-neutral-800" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400">{item.brand} • {item.unit}</p>
                      </div>
                      <span className="text-xs font-black text-forest-400 font-mono whitespace-nowrap">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ================= TABLET & MOBILE MENU-BAR DRAWER ================= */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fadeIn"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Slide-out Menu Panel */}
          <div className="fixed inset-y-0 left-0 w-full max-w-xs sm:max-w-sm bg-[#080b09] border-r border-neutral-800 shadow-2xl z-10 flex flex-col justify-between text-slate-100 animate-fadeIn">
            
            {/* Top Brand & Close Bar */}
            <div className="p-4 bg-black border-b border-neutral-800 flex items-center justify-between">
              <div 
                className="flex items-center gap-2.5 cursor-pointer" 
                onClick={() => {
                  onHomeClick();
                  setIsMobileMenuOpen(false);
                }}
              >
                <div className="w-9 h-9 bg-forest-700 rounded-xl flex items-center justify-center shadow-sm">
                  <i className="fa-solid fa-leaf text-white text-base"></i>
                </div>
                <div>
                  <span className="text-lg font-black text-white tracking-tight font-display">
                    Nueli<span className="text-forest-400">xx</span>
                  </span>
                  <span className="ml-1.5 text-[9px] font-bold uppercase bg-forest-900 text-forest-300 px-1 py-0.5 rounded border border-forest-700">
                    Nationwide
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Close menu"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Scrollable Navigation Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 hide-scrollbar">
              
              {/* Delivery State Selector In Menu */}
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <i className="fa-solid fa-location-dot text-forest-400"></i>
                  <span>Delivery Destination (Any State)</span>
                </span>
                <select
                  value={selectedBranch}
                  onChange={(e) => onSelectBranch(e.target.value)}
                  className="w-full px-2.5 py-2 bg-black border border-neutral-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-forest-500"
                >
                  {DELIVERY_HUBS.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} (~{b.deliveryMin} mins)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500">
                  Supplies dispatched to Lagos, Abuja, Rivers, and all 36 States.
                </p>
              </div>

              {/* Main Quick Links */}
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-2 mb-1">
                  Nuelixx Groceries
                </p>

                <button
                  onClick={() => {
                    onHomeClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    currentView === 'home' ? 'bg-forest-700 text-white' : 'text-slate-300 hover:bg-neutral-900 hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-house text-sm w-4 text-center"></i>
                  <span>Home & Specials</span>
                </button>

                <button
                  onClick={() => {
                    onCatalogClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    currentView === 'catalog' ? 'bg-forest-700 text-white' : 'text-slate-300 hover:bg-neutral-900 hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-cubes text-sm w-4 text-center"></i>
                  <span>All Products Catalog</span>
                </button>

                <button
                  onClick={() => {
                    onRecipesClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-neutral-900 hover:text-white transition-colors"
                >
                  <i className="fa-solid fa-wand-magic-sparkles text-warm-400 text-sm w-4 text-center"></i>
                  <span>AI Grocery Recipes</span>
                </button>

                <button
                  onClick={() => {
                    onQuickTrackClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-neutral-900 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <i className="fa-solid fa-location-crosshairs text-warm-400 text-sm w-4 text-center"></i>
                    <span>Track Order Progress</span>
                  </div>
                  {hasActiveDelivery && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  )}
                </button>
              </div>

              {/* Browse by Aisles / Categories */}
              <div className="space-y-1 pt-2 border-t border-neutral-850">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-2 mb-1">
                  Supermarket Aisles
                </p>

                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      onCatalogClick(cat.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-neutral-900 hover:text-white transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center text-forest-400 group-hover:scale-110 transition-transform">
                        <i className={`fa-solid ${cat.icon} text-xs`}></i>
                      </span>
                      <span>{cat.name}</span>
                    </div>
                    {cat.id === 'beverages' && (
                      <span className="text-[9px] font-black uppercase bg-cyan-900/60 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-700">
                        Top Brands
                      </span>
                    )}
                  </button>
                ))}
              </div>

            </div>

            {/* Bottom Account Card in Mobile Drawer */}
            <div className="p-4 bg-black border-t border-neutral-800 space-y-3">
              {isLoggedIn && user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 bg-neutral-900 p-2.5 rounded-xl border border-neutral-800">
                    <div className="w-8 h-8 rounded-lg bg-forest-700 text-white flex items-center justify-center font-bold text-xs">
                      <i className="fa-solid fa-user"></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white text-xs truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onAccountClick();
                      }}
                      className="px-3 py-2 bg-neutral-900 hover:bg-neutral-850 text-slate-200 rounded-xl text-xs font-bold transition-colors text-center border border-neutral-800"
                    >
                      My Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onLogout();
                      }}
                      className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl text-xs font-bold transition-colors text-center border border-rose-900/40"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuth('customer-login');
                  }}
                  className="w-full py-3 bg-forest-700 hover:bg-forest-600 text-white rounded-xl text-xs font-bold transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-arrow-right-to-bracket"></i>
                  <span>Sign In / Create Account</span>
                </button>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Nationwide Support:</span>
                <a href="tel:+2348034567890" className="text-forest-400 font-bold hover:underline">
                  0803 456 7890
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

    </header>
  );
};

export default Header;
