import React, { useState, useMemo } from 'react';
import { Product, Category, Currency, CartItem } from '../types';
import ProductCard from './ProductCard';

interface ProductCatalogProps {
  products: Product[];
  categories: Category[];
  activeCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  currency: Currency;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  cart: CartItem[];
  onViewDetails: (product: Product) => void;
  savedItemIds: string[];
  onToggleSave: (productId: string) => void;
  initialSearchQuery?: string;
}

const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  categories,
  activeCategory,
  onSelectCategory,
  currency,
  onAddToCart,
  onUpdateQuantity,
  cart,
  onViewDetails,
  savedItemIds,
  onToggleSave,
  initialSearchQuery = ''
}) => {
  const [search, setSearch] = useState(initialSearchQuery);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<number>(35000); // Max NGN 35,000
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Available unique brands & dietary tags
  const allBrands = useMemo(() => Array.from(new Set(products.map(p => p.brand))).filter(Boolean), [products]);
  const allDietaryTags = ['Local Farm Fresh', 'Organic', 'Halal', 'Gluten Free'];

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const toggleDietary = (tag: string) => {
    setSelectedDietary(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const resetFilters = () => {
    onSelectCategory(null);
    setSearch('');
    setSelectedBrands([]);
    setSelectedDietary([]);
    setInStockOnly(false);
    setPriceRange(35000);
    setSortBy('featured');
  };

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      // Category
      if (activeCategory && p.category !== activeCategory) return false;
      
      // Search
      if (search) {
        const q = search.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchBrand = p.brand.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchDesc) return false;
      }

      // Max price
      if (p.price > priceRange) return false;

      // Brand
      if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) return false;

      // Dietary tags
      if (selectedDietary.length > 0) {
        const hasMatchingTag = selectedDietary.some(tag => 
          p.dietaryTags?.includes(tag) || (tag === 'Organic' && p.isOrganic) || (tag === 'Local Farm Fresh' && p.isLocalFarm) || (tag === 'Halal' && p.isHalal)
        );
        if (!hasMatchingTag) return false;
      }

      // In stock
      if (inStockOnly && p.stock <= 0) return false;

      return true;
    });

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [products, activeCategory, search, priceRange, selectedBrands, selectedDietary, inStockOnly, sortBy]);

  const activeFiltersCount = (activeCategory ? 1 : 0) + 
    selectedBrands.length + 
    selectedDietary.length + 
    (inStockOnly ? 1 : 0) + 
    (search ? 1 : 0) + 
    (priceRange < 35000 ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-slate-100">
      
      {/* Breadcrumb & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <button onClick={() => onSelectCategory(null)} className="hover:text-forest-400">Home</button>
            <span>/</span>
            <span className="text-white font-bold">Catalog</span>
            {activeCategory && (
              <>
                <span>/</span>
                <span className="text-forest-400 font-bold capitalize">
                  {categories.find(c => c.id === activeCategory)?.name || activeCategory}
                </span>
              </>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white font-display tracking-tight">
            {activeCategory 
              ? categories.find(c => c.id === activeCategory)?.name 
              : 'All Supermarket Groceries'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Fresh farm harvest, drinks & beverages, pantry bulk packs, and daily household essentials delivered nationwide to any state across Nigeria.
          </p>
        </div>

        {/* Sort & Mobile Filter Toggle */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className="md:hidden flex items-center gap-2 px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-bold text-white"
          >
            <i className="fa-solid fa-sliders text-forest-400"></i>
            <span>Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-forest-600"
            >
              <option value="featured">Featured / Best Deals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Layout: Sidebar Filter + Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Left Filter Sidebar */}
        <aside className={`${isMobileFiltersOpen ? 'block' : 'hidden'} md:block col-span-1 space-y-6 bg-neutral-950 md:bg-transparent p-5 md:p-0 rounded-3xl border md:border-none border-neutral-800 shadow-sm md:shadow-none`}>
          
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <i className="fa-solid fa-filter text-forest-400"></i>
              Filters
            </h2>
            {activeFiltersCount > 0 && (
              <button 
                onClick={resetFilters}
                className="text-xs text-forest-400 font-bold hover:underline"
              >
                Clear all ({activeFiltersCount})
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Aisles & Categories</h3>
            <div className="space-y-1">
              <button
                onClick={() => onSelectCategory(null)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex justify-between items-center transition-colors ${!activeCategory ? 'bg-forest-700 text-white' : 'text-slate-300 hover:bg-neutral-900'}`}
              >
                <span>All Products</span>
                <span className="text-[10px] opacity-80">{products.length}</span>
              </button>
              {categories.map(cat => {
                const count = products.filter(p => p.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex justify-between items-center transition-colors ${activeCategory === cat.id ? 'bg-forest-700 text-white' : 'text-slate-300 hover:bg-neutral-900'}`}
                  >
                    <span className="flex items-center gap-2">
                      <i className={`fa-solid ${cat.icon} text-xs w-4`}></i>
                      <span>{cat.name}</span>
                    </span>
                    <span className="text-[10px] opacity-80">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-3 pt-4 border-t border-neutral-800">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Max Price</h3>
              <span className="text-xs font-black text-forest-400 font-mono">
                ₦{priceRange.toLocaleString()}
              </span>
            </div>
            <input 
              type="range" 
              min={1500} 
              max={35000} 
              step={500}
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-forest-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>₦1,500</span>
              <span>₦35,000+</span>
            </div>
          </div>

          {/* In-Stock Toggle */}
          <div className="pt-4 border-t border-neutral-800">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold text-slate-300">In-Stock Items Only</span>
              <input 
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 accent-forest-600 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Dietary & Origin Tags */}
          <div className="space-y-2 pt-4 border-t border-neutral-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Dietary & Origin</h3>
            <div className="space-y-1.5">
              {allDietaryTags.map(tag => (
                <label key={tag} className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer hover:text-forest-400">
                  <input 
                    type="checkbox"
                    checked={selectedDietary.includes(tag)}
                    onChange={() => toggleDietary(tag)}
                    className="w-4 h-4 accent-forest-600 rounded cursor-pointer"
                  />
                  <span>{tag}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Brands Filter */}
          <div className="space-y-2 pt-4 border-t border-neutral-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Brands</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 hide-scrollbar">
              {allBrands.map(brand => (
                <label key={brand} className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer hover:text-forest-400">
                  <input 
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="w-4 h-4 accent-forest-600 rounded cursor-pointer"
                  />
                  <span className="truncate">{brand}</span>
                </label>
              ))}
            </div>
          </div>

        </aside>

        {/* Right Product Grid */}
        <main className="col-span-1 md:col-span-3 space-y-6">
          
          {/* Active Filter Pills */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-neutral-900 border border-neutral-800 rounded-2xl text-xs">
              <span className="text-slate-400 font-medium">Active:</span>
              {activeCategory && (
                <span className="bg-neutral-950 border border-neutral-700 px-2.5 py-1 rounded-lg font-bold text-slate-200 flex items-center gap-1.5">
                  Aisle: {categories.find(c => c.id === activeCategory)?.name}
                  <button onClick={() => onSelectCategory(null)} className="text-slate-400 hover:text-red-400">×</button>
                </span>
              )}
              {selectedBrands.map(b => (
                <span key={b} className="bg-neutral-950 border border-neutral-700 px-2.5 py-1 rounded-lg font-bold text-slate-200 flex items-center gap-1.5">
                  Brand: {b}
                  <button onClick={() => toggleBrand(b)} className="text-slate-400 hover:text-red-400">×</button>
                </span>
              ))}
              {selectedDietary.map(d => (
                <span key={d} className="bg-neutral-950 border border-neutral-700 px-2.5 py-1 rounded-lg font-bold text-slate-200 flex items-center gap-1.5">
                  {d}
                  <button onClick={() => toggleDietary(d)} className="text-slate-400 hover:text-red-400">×</button>
                </span>
              ))}
              {inStockOnly && (
                <span className="bg-neutral-950 border border-neutral-700 px-2.5 py-1 rounded-lg font-bold text-slate-200 flex items-center gap-1.5">
                  In Stock Only
                  <button onClick={() => setInStockOnly(false)} className="text-slate-400 hover:text-red-400">×</button>
                </span>
              )}
              <button 
                onClick={resetFilters} 
                className="text-forest-400 font-bold ml-auto hover:underline text-xs"
              >
                Reset All
              </button>
            </div>
          )}

          {/* Results Summary */}
          <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
            <span>Showing <strong className="text-white">{filteredProducts.length}</strong> items available for nationwide delivery</span>
          </div>

          {/* Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.map(product => {
                const cartItem = cart.find(i => i.id === product.id);
                const cartQty = cartItem ? cartItem.quantity : 0;
                const isSaved = savedItemIds.includes(product.id);

                return (
                  <ProductCard 
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                    onUpdateQuantity={onUpdateQuantity}
                    cartQuantity={cartQty}
                    onViewDetails={onViewDetails}
                    currency={currency}
                    isSaved={isSaved}
                    onToggleSave={onToggleSave}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-neutral-950 rounded-3xl border border-dashed border-neutral-800 space-y-4">
              <div className="w-16 h-16 bg-neutral-900 text-slate-500 rounded-full flex items-center justify-center mx-auto">
                <i className="fa-solid fa-magnifying-glass text-2xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">No matching groceries found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Try adjusting your price range, clearing brand filters, or exploring other aisles.
                </p>
              </div>
              <button 
                onClick={resetFilters}
                className="px-6 py-2.5 bg-forest-700 text-white rounded-xl text-xs font-bold hover:bg-forest-600 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          )}

        </main>
      </div>

    </div>
  );
};

export default ProductCatalog;
