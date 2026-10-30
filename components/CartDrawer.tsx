import React, { useState } from 'react';
import { CartItem, Currency } from '../types';
import { formatPrice } from '../constants';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  currency: Currency;
  onProceedToCheckout: () => void;
  appliedPromo?: string | null;
  onApplyPromo?: (code: string) => { success: boolean; message: string };
  onRemovePromo?: () => void;
  discountAmount?: number;
}

const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemove,
  currency,
  onProceedToCheckout,
  appliedPromo,
  onApplyPromo,
  onRemovePromo,
  discountAmount = 0
}) => {
  const [promoInput, setPromoInput] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Calculations
  const FREE_DELIVERY_THRESHOLD = 25000; // ₦25,000 in NGN
  const STANDARD_DELIVERY_FEE = 1500; // ₦1,500 in NGN
  const VAT_RATE = 0.075; // 7.5% Nigerian standard VAT

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // Delivery calculation: free if above threshold or promo offers free delivery
  const isFreeDeliveryEligible = subtotal >= FREE_DELIVERY_THRESHOLD || appliedPromo === 'FREEDEL';
  const deliveryFee = items.length === 0 ? 0 : (isFreeDeliveryEligible ? 0 : STANDARD_DELIVERY_FEE);

  // Estimated tax calculation
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const estimatedTax = items.length === 0 ? 0 : Math.round(taxableAmount * VAT_RATE);

  // Final checkout total
  const checkoutTotal = items.length === 0 ? 0 : Math.max(0, taxableAmount + deliveryFee + estimatedTax);

  const amountNeededForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const deliveryProgressPercent = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  const handleApplyPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    if (onApplyPromo) {
      const res = onApplyPromo(promoInput.trim().toUpperCase());
      setPromoFeedback({
        message: res.message,
        type: res.success ? 'success' : 'error'
      });
      if (res.success) {
        setPromoInput('');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-fadeIn" 
        onClick={onClose}
      />
      
      <div className="absolute inset-y-0 right-0 w-full max-w-md bg-[#0c100e] text-slate-100 shadow-2xl flex flex-col z-10 border-l border-neutral-800">
        
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-800 flex items-center justify-between bg-black">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-forest-700 text-white flex items-center justify-center font-bold shadow-sm">
              <i className="fa-solid fa-basket-shopping text-lg"></i>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Your Grocery Basket</h2>
              <p className="text-xs text-slate-400 font-medium">
                {items.length} {items.length === 1 ? 'item' : 'items'} ready for Aba delivery
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-neutral-900 rounded-xl transition-colors border border-neutral-800"
            aria-label="Close cart drawer"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Free Delivery Goal Banner */}
        {items.length > 0 && (
          <div className="bg-forest-950/70 border-b border-forest-900 px-5 py-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-forest-200 flex items-center gap-1.5">
                <i className="fa-solid fa-truck-fast text-forest-400"></i>
                {isFreeDeliveryEligible ? 'Free Same-Day Delivery Unlocked!' : 'Free Delivery to Aba'}
              </span>
              <span className="font-bold text-forest-400">
                {isFreeDeliveryEligible ? '100%' : `${Math.round(deliveryProgressPercent)}%`}
              </span>
            </div>
            <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-forest-900">
              <div 
                className="h-full bg-forest-500 transition-all duration-500 rounded-full" 
                style={{ width: `${deliveryProgressPercent}%` }}
              />
            </div>
            {!isFreeDeliveryEligible && (
              <p className="text-[11px] text-forest-300 mt-1.5">
                Add <span className="font-bold text-white font-mono">{formatPrice(amountNeededForFreeDelivery)}</span> more to qualify for <span className="font-bold text-white">FREE Delivery</span> in Aba!
              </p>
            )}
          </div>
        )}

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 hide-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
              <div className="w-20 h-20 bg-neutral-900 border border-neutral-800 text-forest-400 rounded-3xl flex items-center justify-center shadow-inner">
                <i className="fa-solid fa-cart-shopping text-3xl"></i>
              </div>
              <div className="max-w-xs">
                <h3 className="text-lg font-bold text-white">Your basket is empty</h3>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">
                  Discover fresh produce, local yams, daily dairy, and pantry staples in our Aba store.
                </p>
              </div>
              <button 
                onClick={onClose}
                className="px-6 py-3 bg-forest-700 text-white rounded-xl font-bold text-sm hover:bg-forest-600 transition-all shadow-md active:scale-95"
              >
                Start Shopping Now
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div 
                key={item.id} 
                className="flex gap-3.5 p-3.5 bg-neutral-950 hover:bg-neutral-900/90 rounded-2xl border border-neutral-800/80 transition-colors"
              >
                <div className="w-18 h-18 sm:w-20 sm:h-20 bg-neutral-900 rounded-xl overflow-hidden flex-shrink-0 border border-neutral-800 p-1">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-sm font-bold text-white line-clamp-1">{item.name}</h4>
                      <button 
                        onClick={() => onRemove(item.id)}
                        className="text-slate-400 hover:text-red-400 p-1 transition-colors"
                        title="Remove item"
                      >
                        <i className="fa-regular fa-trash-can text-xs"></i>
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatPrice(item.price, currency)} • {item.unit}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800">
                    {/* Stepper */}
                    <div className="flex items-center bg-neutral-900 border border-neutral-700 rounded-lg p-0.5 shadow-2xs">
                      <button 
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                        title="Decrease quantity"
                      >
                        <i className="fa-solid fa-minus text-[10px]"></i>
                      </button>
                      <span className="text-xs font-bold w-7 text-center text-white">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                        title="Increase quantity"
                      >
                        <i className="fa-solid fa-plus text-[10px]"></i>
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-white font-mono">
                        {formatPrice(item.price * item.quantity, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Subtotal, Tax, Delivery Fee & Checkout Total */}
        {items.length > 0 && (
          <div className="p-5 sm:p-6 border-t border-neutral-800 bg-black space-y-4 shadow-2xl">
            
            {/* Promo Code Input */}
            <div className="space-y-1.5">
              {!appliedPromo ? (
                <form onSubmit={handleApplyPromoCode} className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      placeholder="Promo code (e.g. ABA10)"
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value);
                        if (promoFeedback) setPromoFeedback(null);
                      }}
                      className="w-full px-3.5 py-2 text-xs uppercase bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder-slate-500 focus:border-forest-500 focus:outline-none"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-neutral-800 hover:bg-forest-700 text-white rounded-xl text-xs font-bold transition-colors border border-neutral-700"
                  >
                    Apply
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between bg-forest-950/80 border border-forest-800 px-3 py-2 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5 text-forest-300 font-bold">
                    <i className="fa-solid fa-tag"></i>
                    <span>Code Applied: {appliedPromo}</span>
                  </div>
                  <button 
                    onClick={onRemovePromo} 
                    className="text-red-400 hover:underline text-[11px] font-bold"
                  >
                    Remove
                  </button>
                </div>
              )}

              {promoFeedback && (
                <p className={`text-[11px] font-medium ${promoFeedback.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {promoFeedback.message}
                </p>
              )}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span>Try codes:</span>
                <button 
                  type="button" 
                  onClick={() => onApplyPromo && onApplyPromo('ABA10')}
                  className="font-bold text-forest-400 hover:underline"
                >
                  ABA10
                </button>
                <span>•</span>
                <button 
                  type="button" 
                  onClick={() => onApplyPromo && onApplyPromo('FREEDEL')}
                  className="font-bold text-forest-400 hover:underline"
                >
                  FREEDEL
                </button>
              </div>
            </div>

            {/* Price Breakdown Calculation */}
            <div className="space-y-2 pt-2 border-t border-neutral-800 text-xs">
              {/* Subtotal */}
              <div className="flex justify-between text-slate-300">
                <span>Subtotal</span>
                <span className="font-semibold text-white font-mono">{formatPrice(subtotal)}</span>
              </div>

              {/* Discount if applicable */}
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span className="flex items-center gap-1">
                    <i className="fa-solid fa-gift text-[10px]"></i> Discount
                  </span>
                  <span className="font-mono">-{formatPrice(discountAmount)}</span>
                </div>
              )}

              {/* Estimated Delivery Fee */}
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1">
                  Estimated Delivery Fee
                  <span 
                    title="Standard express delivery across Aba and environs"
                    className="text-slate-500 cursor-help"
                  >
                    <i className="fa-solid fa-circle-question text-[10px]"></i>
                  </span>
                </span>
                <span className={deliveryFee === 0 ? "text-forest-400 font-bold" : "font-semibold text-white font-mono"}>
                  {deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}
                </span>
              </div>

              {/* Estimated Tax (VAT) */}
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1">
                  Estimated Tax (7.5% VAT)
                  <span 
                    title="Standard Statutory Value Added Tax on supermarket goods"
                    className="text-slate-500 cursor-help"
                  >
                    <i className="fa-solid fa-circle-question text-[10px]"></i>
                  </span>
                </span>
                <span className="font-semibold text-white font-mono">{formatPrice(estimatedTax)}</span>
              </div>

              {/* Final Checkout Total */}
              <div className="flex justify-between items-baseline pt-3 border-t border-neutral-800">
                <div>
                  <span className="text-base font-bold text-white">Checkout Total</span>
                  <p className="text-[10px] text-slate-400">Includes VAT & Delivery in Aba</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-forest-400 font-mono">
                    {formatPrice(checkoutTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <button 
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
              className="w-full py-4 bg-forest-700 text-white rounded-2xl font-bold text-sm sm:text-base hover:bg-forest-600 transition-all shadow-xl shadow-forest-950/40 active:scale-98 flex items-center justify-center gap-2 border border-forest-600/40"
            >
              <i className="fa-solid fa-lock text-xs"></i>
              <span>Proceed to Checkout</span>
              <i className="fa-solid fa-arrow-right text-xs"></i>
            </button>

            <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <i className="fa-solid fa-shield-halved text-emerald-400"></i> Safe & Secure Pay
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <i className="fa-solid fa-clock text-emerald-400"></i> Under 35-Min Aba Delivery
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
