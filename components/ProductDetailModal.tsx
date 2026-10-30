import React, { useState } from 'react';
import { Product, Currency } from '../types';
import { formatPrice } from '../constants';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  currency: Currency;
  allProducts: Product[];
  onOpenProduct: (product: Product) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  currency,
  allProducts,
  onOpenProduct
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'nutrition' | 'reviews'>('details');
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [localReviews, setLocalReviews] = useState<any[]>([]);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  if (!isOpen || !product) return null;

  const images = product.additionalImages && product.additionalImages.length > 0 
    ? product.additionalImages 
    : [product.image];

  const currentImage = images[activeImageIndex] || product.image;

  // Frequently bought together items (pick 2 complementary items from same or pantry category)
  const relatedProducts = allProducts
    .filter(p => p.id !== product.id && (p.category === product.category || p.category === 'pantry'))
    .slice(0, 2);

  const handleAddBundle = () => {
    onAddToCart(product, quantity);
    relatedProducts.forEach(rp => onAddToCart(rp, 1));
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;

    const newRev = {
      id: `user-rev-${Date.now()}`,
      author: newReviewAuthor.trim() || 'Valued Owerri Shopper',
      location: 'Owerri, Imo State',
      rating: newReviewRating,
      date: 'Just now',
      comment: newReviewText.trim(),
      verifiedPurchase: true
    };

    setLocalReviews([newRev, ...localReviews]);
    setNewReviewText('');
    setNewReviewAuthor('');
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 4000);
  };

  const combinedReviews = [...localReviews, ...(product.reviews || [])];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative bg-white w-full max-w-4xl max-h-[92vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden z-10 animate-scaleUp">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-forest-700 uppercase bg-forest-50 px-2.5 py-1 rounded-lg">
              {product.category}
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-500 font-semibold">{product.brand}</span>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="Close modal"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-8 hide-scrollbar">
          
          {/* Main Info Section (Image Gallery + Details) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Left: Image Gallery */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 relative group">
                <img 
                  src={currentImage} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                {product.isLocalFarm && (
                  <span className="absolute top-4 left-4 bg-forest-700 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">
                    Imo Farm Direct
                  </span>
                )}
              </div>

              {/* Thumbnails if multiple images exist */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${activeImageIndex === idx ? 'border-forest-700 ring-2 ring-forest-100' : 'border-gray-200 opacity-60 hover:opacity-100'}`}
                    >
                      <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Details & Buying Controls */}
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-amber-400 text-xs">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className={`fa-solid fa-star ${i < Math.floor(product.rating) ? 'text-amber-400' : 'text-gray-200'}`}></i>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-gray-700">{product.rating.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">({product.reviewCount} customer reviews)</span>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug">
                  {product.name}
                </h1>
                
                <p className="text-xs font-medium text-forest-700 mt-1">
                  Sold by: <span className="underline">{product.brand}</span> • Freshness Guaranteed
                </p>
              </div>

              {/* Price Block */}
              <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-forest-700">
                      {formatPrice(product.price * quantity, currency)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatPrice(product.originalPrice * quantity, currency)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Unit: {product.unit} {quantity > 1 ? `(Qty: ${quantity})` : ''}
                  </p>
                </div>

                {/* Stock Status Badge */}
                <div className="text-right">
                  {product.stock > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      In Stock ({product.stock} available)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Dietary Tags */}
              {product.dietaryTags && product.dietaryTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {product.dietaryTags.map((tag, i) => (
                    <span key={i} className="text-[11px] font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">
                      ✓ {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Quantity Selector & Add to Cart */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <div className="flex items-center bg-gray-100 rounded-2xl p-1 w-full sm:w-auto justify-between sm:justify-start">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-gray-700 hover:text-forest-700 shadow-sm font-bold text-sm"
                    disabled={quantity <= 1}
                  >
                    <i className="fa-solid fa-minus"></i>
                  </button>
                  <span className="px-5 font-black text-gray-900 text-base">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-gray-700 hover:text-forest-700 shadow-sm font-bold text-sm"
                    disabled={quantity >= product.stock}
                  >
                    <i className="fa-solid fa-plus"></i>
                  </button>
                </div>

                <button 
                  onClick={() => {
                    onAddToCart(product, quantity);
                    onClose();
                  }}
                  disabled={product.stock <= 0}
                  className="flex-1 py-3.5 px-6 bg-forest-700 hover:bg-forest-800 text-white rounded-2xl font-bold text-sm sm:text-base transition-all shadow-lg shadow-forest-900/15 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fa-solid fa-cart-plus"></i>
                  <span>Add to Basket • {formatPrice(product.price * quantity, currency)}</span>
                </button>
              </div>

              {/* Trust Callouts */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-truck-fast text-forest-700 text-sm"></i>
                  <span>Same-day delivery in Owerri</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-award text-forest-700 text-sm"></i>
                  <span>100% Quality Guaranteed</span>
                </div>
              </div>

            </div>
          </div>

          {/* Tabs for Details, Storage, Nutrition & Reviews */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex border-b border-gray-200 gap-6">
              <button 
                onClick={() => setActiveTab('details')}
                className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'details' ? 'text-forest-700 border-b-2 border-forest-700' : 'text-gray-400 hover:text-gray-700'}`}
              >
                Description & Storage
              </button>
              <button 
                onClick={() => setActiveTab('nutrition')}
                className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'nutrition' ? 'text-forest-700 border-b-2 border-forest-700' : 'text-gray-400 hover:text-gray-700'}`}
              >
                Nutritional Facts
              </button>
              <button 
                onClick={() => setActiveTab('reviews')}
                className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'reviews' ? 'text-forest-700 border-b-2 border-forest-700' : 'text-gray-400 hover:text-gray-700'}`}
              >
                Customer Reviews ({combinedReviews.length})
              </button>
            </div>

            {/* Tab 1: Description & Storage */}
            {activeTab === 'details' && (
              <div className="py-5 space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>{product.description}</p>
                {product.storageInstructions && (
                  <div className="p-4 bg-amber-50/70 border border-amber-200/60 rounded-2xl">
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <i className="fa-solid fa-temperature-arrow-down text-amber-700"></i>
                      Storage & Care Guide
                    </h4>
                    <p className="text-xs text-amber-800">{product.storageInstructions}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Nutrition */}
            {activeTab === 'nutrition' && (
              <div className="py-5">
                {product.nutrients ? (
                  <div className="max-w-md bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                      Nutritional Value (Approx. Per Serving)
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-gray-100">
                        <span className="text-gray-400 block text-[10px] uppercase">Calories</span>
                        <span className="text-base font-bold text-gray-900">{product.nutrients.calories} kcal</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-gray-100">
                        <span className="text-gray-400 block text-[10px] uppercase">Protein</span>
                        <span className="text-base font-bold text-gray-900">{product.nutrients.protein}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-gray-100">
                        <span className="text-gray-400 block text-[10px] uppercase">Carbohydrates</span>
                        <span className="text-base font-bold text-gray-900">{product.nutrients.carbs}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-gray-100">
                        <span className="text-gray-400 block text-[10px] uppercase">Healthy Fat</span>
                        <span className="text-base font-bold text-gray-900">{product.nutrients.fat}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 py-4">Standard household product; nutritional panel not applicable.</p>
                )}
              </div>
            )}

            {/* Tab 3: Reviews */}
            {activeTab === 'reviews' && (
              <div className="py-5 space-y-6">
                {/* Write Review Form */}
                <form onSubmit={handleReviewSubmit} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Leave a Customer Review</h4>
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="Your Name (e.g. Chinedu in New Owerri)"
                      value={newReviewAuthor}
                      onChange={(e) => setNewReviewAuthor(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-forest-700"
                    />
                    <select
                      value={newReviewRating}
                      onChange={(e) => setNewReviewRating(Number(e.target.value))}
                      className="px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                      <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                      <option value={3}>⭐⭐⭐ (3 Stars)</option>
                    </select>
                  </div>
                  <textarea 
                    rows={2}
                    placeholder="Share your experience with the freshness, quality, and delivery..."
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-forest-700"
                  />
                  <div className="flex justify-between items-center">
                    {reviewSubmitted && (
                      <span className="text-xs text-emerald-600 font-bold">✓ Thank you for your review!</span>
                    )}
                    <button 
                      type="submit" 
                      className="ml-auto px-4 py-2 bg-forest-700 text-white rounded-xl text-xs font-bold hover:bg-forest-800 transition-colors"
                    >
                      Submit Review
                    </button>
                  </div>
                </form>

                {/* Reviews List */}
                <div className="space-y-3">
                  {combinedReviews.map((rev, idx) => (
                    <div key={idx} className="p-4 bg-white rounded-2xl border border-gray-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900">{rev.author}</span>
                          <span className="text-[10px] text-gray-400">• {rev.location}</span>
                          {rev.verifiedPurchase && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                              ✓ Verified Buyer
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">{rev.date}</span>
                      </div>
                      <div className="flex text-amber-400 text-xs">
                        {[...Array(rev.rating)].map((_, i) => (
                          <i key={i} className="fa-solid fa-star"></i>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Frequently Bought Together Bundle */}
          {relatedProducts.length > 0 && (
            <div className="p-6 bg-forest-50/50 border border-forest-100 rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Frequently Bought Together</h3>
                  <p className="text-xs text-gray-500">Popular bundle pairing from our Owerri customers</p>
                </div>
                <button 
                  onClick={handleAddBundle}
                  className="px-4 py-2 bg-forest-700 text-white rounded-xl text-xs font-bold hover:bg-forest-800 transition-colors shadow-xs"
                >
                  Add Bundle to Basket
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedProducts.map(rp => (
                  <div 
                    key={rp.id}
                    onClick={() => onOpenProduct(rp)}
                    className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-forest-100 hover:border-forest-300 cursor-pointer transition-colors"
                  >
                    <img src={rp.image} alt={rp.name} className="w-12 h-12 object-cover rounded-xl" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{rp.name}</p>
                      <p className="text-[11px] font-black text-forest-700">{formatPrice(rp.price, currency)}</p>
                    </div>
                    <i className="fa-solid fa-chevron-right text-xs text-gray-300 mr-2"></i>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
