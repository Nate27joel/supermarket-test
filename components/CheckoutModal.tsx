import React, { useState } from 'react';
import { CartItem, Currency, Order, UserProfile } from '../types';
import { formatPrice, NIGERIA_STATES } from '../constants';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountCode?: string;
  deliveryFee: number;
  tax: number;
  total: number;
  currency: Currency;
  user: UserProfile;
  selectedBranch: string;
  onCompleteOrder: (order: Order) => void;
  onClearCart: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  discount,
  discountCode,
  deliveryFee,
  tax,
  total,
  currency,
  user,
  onCompleteOrder,
  onClearCart
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  
  // Step 1: Customer Info
  const [fullName, setFullName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);

  // Step 2: Address with State selection (Available to all 36 States + FCT)
  const defaultAddr = user.addresses[0];
  const [selectedState, setSelectedState] = useState(defaultAddr?.state || 'Lagos');
  const [street, setStreet] = useState(defaultAddr?.street || '14 Victoria Island Boulevard');
  const [landmark, setLandmark] = useState(defaultAddr?.landmark || 'Opposite Mega Plaza');
  const [area, setArea] = useState(defaultAddr?.area || 'Victoria Island / Ikoyi');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Step 3: Time Slot
  const [deliverySlot, setDeliverySlot] = useState('Morning (8:00 AM - 12:00 PM)');

  // Step 4: Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer' | 'cod'>('card');
  const [cardNumber, setCardNumber] = useState('5399 •••• •••• 8291');
  const [cardExpiry, setCardExpiry] = useState('11/28');
  const [cardCvv, setCardCvv] = useState('312');
  const [isProcessing, setIsProcessing] = useState(false);

  // Step 5: Created Order
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const deliverySlots = [
    { id: 'express', label: '⚡ Priority Express (Under 45 Mins)', note: 'Immediate dispatch by express courier rider', tag: 'Fastest' },
    { id: 'morning', label: 'Morning Slot (8:00 AM - 12:00 PM)', note: 'Best for breakfast and daily meal prep', tag: 'Popular' },
    { id: 'afternoon', label: 'Afternoon Slot (12:00 PM - 4:00 PM)', note: 'Fresh midday cold harvests', tag: 'Available' },
    { id: 'evening', label: 'Evening Slot (4:00 PM - 8:00 PM)', note: 'Convenient after-work delivery', tag: 'Convenient' }
  ];

  const handlePlaceOrder = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const orderId = `NX-${Math.floor(10000 + Math.random() * 90000)}`;
      const newOrder: Order = {
        id: orderId,
        date: 'Today, Just now',
        items: [...items],
        subtotal,
        discount,
        discountCode,
        deliveryFee,
        tax,
        total,
        currency,
        status: 'Order Confirmed',
        deliverySlot,
        deliveryAddress: {
          fullName,
          street,
          landmark,
          area,
          state: selectedState,
          phone
        },
        paymentMethod,
        estimatedArrival: '35 - 45 minutes',
        trackingInfo: {
          currentStage: 'Order Confirmed',
          stageTimestamps: {
            confirmedAt: 'Just now'
          },
          riderName: 'Chinedu Ebere',
          riderPhone: '+234 812 901 3456',
          riderVehicle: 'Express Dispatch Courier (Plate: LAG-428-NX)',
          estimatedMinutes: 40,
          progressPercent: 15,
          currentRoad: `${selectedState} Central Express Corridor`,
          riderRating: 4.9
        }
      };

      setCreatedOrder(newOrder);
      onCompleteOrder(newOrder);
      onClearCart();
      setIsProcessing(false);
      setStep(5);
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
        onClick={() => step !== 5 && onClose()}
      />

      <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-forest-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <i className="fa-solid fa-lock text-warm-300"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {step === 5 ? 'Order Placed Successfully!' : 'Express Supermarket Checkout'}
              </h2>
              <p className="text-xs text-forest-200">
                {step === 5 ? 'Thank you for shopping with Nuelixx Supermarket' : `Step ${step} of 4 • Nationwide Fresh Delivery`}
              </p>
            </div>
          </div>
          {step !== 5 && (
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          )}
        </div>

        {/* Progress Bar (Steps 1-4) */}
        {step < 5 && (
          <div className="bg-gray-100 h-1.5 w-full flex">
            <div 
              className="bg-forest-600 transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        )}

        {/* Step Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 hide-scrollbar">
          
          {/* STEP 1: Contact Details */}
          {step === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">1. Customer Contact Details</h3>
                  <p className="text-xs text-gray-500">We will send your order updates & SMS tracking here.</p>
                </div>
                <span className="text-[10px] bg-forest-50 text-forest-700 font-bold px-2 py-1 rounded">
                  Autofilled for Amaka Obi
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-700 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number (For Rider SMS/Call)</label>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-700 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Email Address (For Receipt)</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-700 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={!fullName || !phone}
                className="w-full mt-6 py-3.5 bg-forest-700 text-white rounded-xl font-bold text-sm hover:bg-forest-800 transition-colors shadow-md disabled:opacity-50"
              >
                Continue to Delivery Address →
              </button>
            </div>
          )}

          {/* STEP 2: Delivery Address (Nationwide - Any State in Nigeria) */}
          {step === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h3 className="text-base font-bold text-gray-900">2. Nationwide Delivery Destination</h3>
                <p className="text-xs text-gray-500">Nuelixx delivers to all 36 States + FCT Abuja. Enter your location details below.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">State in Nigeria *</label>
                    <select 
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-700 focus:bg-white font-medium"
                    >
                      {NIGERIA_STATES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">City / Town / Area *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Ikeja, Wuse II, GRA, Port Harcourt"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-700 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Street Address / House Number *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 14 Adeola Odeku Street, Flat 4B"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-700 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nearest Landmark / Building *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Opposite Central Mall, Beside Zenith Bank"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-700 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Delivery Instructions (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Call when outside gate, leave with security, ring bell"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-700 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setStep(1)}
                  className="px-5 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Back
                </button>
                <button 
                  onClick={() => setStep(3)}
                  disabled={!street || !landmark}
                  className="flex-1 py-3.5 bg-forest-700 text-white rounded-xl font-bold text-sm hover:bg-forest-800 transition-colors shadow-md disabled:opacity-50"
                >
                  Continue to Delivery Time Slot →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Delivery Time-slot Selector */}
          {step === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h3 className="text-base font-bold text-gray-900">3. Select Delivery Time Slot</h3>
                <p className="text-xs text-gray-500">Pick when you want our temperature-controlled dispatch to arrive.</p>
              </div>

              <div className="space-y-3">
                {deliverySlots.map(slot => (
                  <label
                    key={slot.id}
                    className={`flex items-start justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${deliverySlot.includes(slot.label.split(' (')[0]) ? 'border-forest-700 bg-forest-50/50 shadow-xs' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-start gap-3">
                      <input 
                        type="radio" 
                        name="slot" 
                        checked={deliverySlot.includes(slot.label.split(' (')[0])}
                        onChange={() => setDeliverySlot(slot.label)}
                        className="mt-1 accent-forest-700"
                      />
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{slot.label}</p>
                        <p className="text-xs text-gray-500">{slot.note}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {slot.tag}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setStep(2)}
                  className="px-5 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Back
                </button>
                <button 
                  onClick={() => setStep(4)}
                  className="flex-1 py-3.5 bg-forest-700 text-white rounded-xl font-bold text-sm hover:bg-forest-800 transition-colors shadow-md"
                >
                  Continue to Payment →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Payment Method */}
          {step === 4 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h3 className="text-base font-bold text-gray-900">4. Payment Method & Review</h3>
                <p className="text-xs text-gray-500">Select your preferred Nigerian or international payment option.</p>
              </div>

              {/* Payment Tabs */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-2xl border text-center transition-all ${paymentMethod === 'card' ? 'border-forest-700 bg-forest-50 text-forest-900 font-bold ring-1 ring-forest-700' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                >
                  <i className="fa-solid fa-credit-card text-lg block mb-1"></i>
                  <span className="text-xs">Debit / Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`p-3 rounded-2xl border text-center transition-all ${paymentMethod === 'transfer' ? 'border-forest-700 bg-forest-50 text-forest-900 font-bold ring-1 ring-forest-700' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                >
                  <i className="fa-solid fa-building-columns text-lg block mb-1"></i>
                  <span className="text-xs">Bank Transfer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-3 rounded-2xl border text-center transition-all ${paymentMethod === 'cod' ? 'border-forest-700 bg-forest-50 text-forest-900 font-bold ring-1 ring-forest-700' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                >
                  <i className="fa-solid fa-hand-holding-dollar text-lg block mb-1"></i>
                  <span className="text-xs">Cash / POS</span>
                </button>
              </div>

              {/* Card Inputs Simulation */}
              {paymentMethod === 'card' && (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3 text-xs">
                  <div className="flex justify-between items-center text-gray-500">
                    <span className="font-bold text-gray-700">Enter Card Information</span>
                    <div className="flex gap-2 text-base">
                      <i className="fa-brands fa-cc-visa text-blue-800"></i>
                      <i className="fa-brands fa-cc-mastercard text-red-600"></i>
                      <span className="font-bold text-[10px] bg-green-100 text-green-800 px-1 rounded">Verve</span>
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-600 mb-1">Card Number</label>
                    <input 
                      type="text" 
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-mono text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-gray-600 mb-1">Expiry Date</label>
                      <input 
                        type="text" 
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-600 mb-1">CVV / CVC</label>
                      <input 
                        type="password" 
                        value={cardCvv}
                        maxLength={3}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Transfer Details Simulation */}
              {paymentMethod === 'transfer' && (
                <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <i className="fa-solid fa-qrcode"></i>
                    <span>PalmGrove Instant Virtual Account</span>
                  </div>
                  <p className="text-amber-800 text-[11px]">
                    Transfer exact order amount to the automated dedicated account below. Payment confirms in ~20 seconds:
                  </p>
                  <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1">
                    <p className="text-gray-400 text-[10px] uppercase font-bold">Bank Name</p>
                    <p className="font-bold text-gray-900 text-sm">Zenith Bank Plc / Moniepoint</p>
                    <p className="text-gray-400 text-[10px] uppercase font-bold pt-1">Account Number</p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-base font-black text-forest-700 tracking-wider">1029 3847 56</span>
                      <span className="text-[10px] text-gray-400">PalmGrove Aba Store</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Cash on Delivery Note */}
              {paymentMethod === 'cod' && (
                <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <i className="fa-solid fa-truck-ramp-box"></i>
                    Pay when rider arrives in Aba
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    Our dispatch rider carries a portable wireless POS terminal for card tap/chip or accepts cash. Please have exact change if paying cash.
                  </p>
                </div>
              )}

              {/* Order Final Summary Box */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Items Total ({items.length} items)</span>
                  <span>{formatPrice(subtotal, currency)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Promo Discount ({discountCode})</span>
                    <span>-{formatPrice(discount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery to {area}</span>
                  <span className={deliveryFee === 0 ? "text-forest-700 font-bold" : ""}>
                    {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Estimated Tax (7.5% VAT)</span>
                  <span>{formatPrice(tax, currency)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-200">
                  <span>Final Total</span>
                  <span className="text-forest-700">{formatPrice(total, currency)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setStep(3)}
                  disabled={isProcessing}
                  className="px-5 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Back
                </button>
                <button 
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="flex-1 py-4 bg-forest-700 text-white rounded-2xl font-bold text-sm sm:text-base hover:bg-forest-800 transition-all shadow-xl shadow-forest-900/15 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Securing Your Groceries...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check"></i>
                      <span>Authorize & Place Order ({formatPrice(total, currency)})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Order Placed Success Confirmation */}
          {step === 5 && createdOrder && (
            <div className="text-center space-y-6 py-4 animate-scaleUp">
              <div className="w-18 h-18 bg-emerald-100 text-forest-700 rounded-full flex items-center justify-center mx-auto shadow-md">
                <i className="fa-solid fa-check text-3xl"></i>
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-widest text-forest-700 bg-forest-50 px-3 py-1 rounded-full">
                  Order #{createdOrder.id}
                </span>
                <h3 className="text-2xl font-black text-gray-900 mt-2">
                  Thank You, {fullName.split(' ')[0]}!
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  Your grocery order has been transmitted to our <strong>{selectedState} ({area})</strong> dispatch fulfillment team.
                </p>
              </div>

              {/* Live Tracking Visual */}
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 text-left space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-700">Estimated Delivery:</span>
                  <span className="font-black text-forest-700">⚡ ~45 Minutes</span>
                </div>

                {/* Tracking Milestones */}
                <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                  <div className="space-y-1">
                    <div className="w-8 h-8 rounded-full bg-forest-700 text-white flex items-center justify-center mx-auto">
                      <i className="fa-solid fa-check"></i>
                    </div>
                    <span className="font-bold text-forest-800">Received</span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-8 h-8 rounded-full bg-forest-700 text-white flex items-center justify-center mx-auto animate-pulse">
                      <i className="fa-solid fa-box"></i>
                    </div>
                    <span className="font-bold text-forest-800">Packing</span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center mx-auto">
                      <i className="fa-solid fa-motorcycle"></i>
                    </div>
                    <span className="font-medium text-gray-400">On the Way</span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center mx-auto">
                      <i className="fa-solid fa-house"></i>
                    </div>
                    <span className="font-medium text-gray-400">Delivered</span>
                  </div>
                </div>

                <div className="text-[11px] text-gray-600 border-t border-gray-200 pt-3 space-y-1">
                  <p><strong>Delivering to:</strong> {street}, {landmark}, {area}, {selectedState} State</p>
                  <p><strong>Recipient:</strong> {fullName} ({phone})</p>
                  <p><strong>Payment Method:</strong> {paymentMethod.toUpperCase()} • {formatPrice(total, currency)}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3.5 bg-forest-700 text-white rounded-xl font-bold text-sm hover:bg-forest-800 transition-colors shadow-md"
                >
                  Continue Shopping Fresh
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
