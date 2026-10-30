import React from 'react';
import { Product, Currency } from '../types';
import { formatPrice } from '../constants';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity?: (productId: string, delta: number) => void;
  cartQuantity?: number;
  onViewDetails: (product: Product) => void;
  currency: Currency;
  isSaved?: boolean;
  onToggleSave?: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart, 
  onUpdateQuantity,
  cartQuantity = 0,
  onViewDetails,
  currency,
  isSaved = false,
  onToggleSave
}) => {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount && product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  return (
    <div className="group bg-[#111613] rounded-3xl overflow-hidden border border-neutral-800 hover:border-forest-600/70 hover:shadow-xl hover:shadow-black/60 transition-all duration-300 flex flex-col h-full relative text-slate-100">
      
      {/* Top Image & Floating Badges */}
      <div 
        className="relative aspect-square cursor-pointer overflow-hidden bg-neutral-950"
        onClick={() => onViewDetails(product)}
      >
        <img 
          src={product.image} 
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" 
        />

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
            Save {discountPercent}%
          </div>
        )}

        {/* Farm Fresh or Organic Tag */}
        {product.isLocalFarm && !hasDiscount && (
          <div className="absolute top-3 left-3 bg-forest-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm border border-forest-600/40">
            Imo Farm Direct
          </div>
        )}

        {/* Wishlist Button */}
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleSave) onToggleSave(product.id);
          }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm backdrop-blur-md border ${
            isSaved 
              ? 'bg-red-950/80 text-red-400 border-red-800' 
              : 'bg-black/60 hover:bg-black text-slate-400 hover:text-red-400 border-neutral-700/60'
          }`}
          aria-label="Save to favorites"
        >
          <i className={`fa-${isSaved ? 'solid' : 'regular'} fa-heart text-xs`}></i>
        </button>

        {/* Stock Badge Overlay if Out of Stock */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-neutral-900 border border-neutral-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider shadow">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-[#111613]">
        <div>
          {/* Brand & Stock Status */}
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="font-semibold text-forest-400 tracking-wide uppercase truncate max-w-[130px]">
              {product.brand}
            </span>
            {isOutOfStock ? (
              <span className="text-red-400 font-bold text-[10px]">Sold Out</span>
            ) : isLowStock ? (
              <span className="text-amber-400 font-bold text-[10px] bg-amber-950/50 border border-amber-800/60 px-1.5 py-0.5 rounded">
                Only {product.stock} left!
              </span>
            ) : (
              <span className="text-emerald-400 font-medium text-[10px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                In Stock
              </span>
            )}
          </div>

          {/* Product Name */}
          <h3 
            className="text-sm sm:text-base font-bold text-white line-clamp-2 group-hover:text-forest-400 transition-colors cursor-pointer leading-snug"
            title={product.name}
            onClick={() => onViewDetails(product)}
          >
            {product.name}
          </h3>

          {/* Unit / Weight Label */}
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Unit: {product.unit}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <div className="flex text-amber-400 text-[11px]">
              <i className="fa-solid fa-star"></i>
            </div>
            <span className="font-bold text-slate-200 text-xs">{product.rating.toFixed(1)}</span>
            <span className="text-slate-500 text-[11px]">({product.reviewCount})</span>
          </div>
        </div>

        {/* Price & Add to Cart Controls */}
        <div className="pt-3 mt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black text-white font-mono">
                {formatPrice(product.price, currency)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-slate-500 line-through font-mono">
                  {formatPrice(product.originalPrice!, currency)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-forest-400/90 block">Aba Hub Fresh</span>
          </div>

          {/* Cart Quantity Adjuster or Add Button */}
          {cartQuantity > 0 ? (
            <div className="flex items-center bg-neutral-900 border border-neutral-700/80 rounded-2xl p-1 shadow-sm">
              <button
                type="button"
                onClick={() => onUpdateQuantity && onUpdateQuantity(product.id, -1)}
                className="w-7 h-7 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-slate-200 flex items-center justify-center transition-colors"
                aria-label="Decrease quantity"
              >
                <i className="fa-solid fa-minus text-[10px]"></i>
              </button>
              <span className="w-8 text-center text-xs font-black text-white font-mono">
                {cartQuantity}
              </span>
              <button
                type="button"
                disabled={isOutOfStock || cartQuantity >= product.stock}
                onClick={() => onUpdateQuantity && onUpdateQuantity(product.id, 1)}
                className="w-7 h-7 rounded-xl bg-forest-700 hover:bg-forest-600 disabled:opacity-40 text-white flex items-center justify-center transition-colors"
                aria-label="Increase quantity"
              >
                <i className="fa-solid fa-plus text-[10px]"></i>
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => onAddToCart(product)}
              className="px-3.5 py-2 sm:py-2.5 bg-forest-700 hover:bg-forest-600 disabled:bg-neutral-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-forest-950/40 active:scale-95 flex items-center gap-1.5 border border-forest-600/30"
              aria-label={`Add ${product.name} to cart`}
            >
              <i className="fa-solid fa-cart-plus text-xs"></i>
              <span className="hidden sm:inline">Add</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default ProductCard;
