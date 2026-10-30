import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { formatPrice } from '../constants';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onUpdateStage?: (orderId: string, nextStage: OrderStatus) => void;
}

const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  order,
  onUpdateStage
}) => {
  const [driverProgress, setDriverProgress] = useState<number>(68);
  const [isSimulating, setIsSimulating] = useState(false);
  const [driverPingSent, setDriverPingSent] = useState(false);

  useEffect(() => {
    if (order?.trackingInfo?.progressPercent !== undefined) {
      setDriverProgress(order.trackingInfo.progressPercent);
    } else if (order?.status === 'Delivered') {
      setDriverProgress(100);
    } else if (order?.status === 'Out for Delivery') {
      setDriverProgress(68);
    } else if (order?.status === 'Picking Items') {
      setDriverProgress(35);
    } else {
      setDriverProgress(10);
    }
  }, [order]);

  // Dynamic simulation of driver moving along the route (pure progress updates)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setDriverProgress(prev => {
        const next = prev + 3;
        return next >= 100 ? 100 : next;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Complete simulation and update parent stage outside the state updater
  useEffect(() => {
    if (isSimulating && driverProgress >= 100) {
      setIsSimulating(false);
      if (order && onUpdateStage && order.status !== 'Delivered') {
        onUpdateStage(order.id, 'Delivered');
      }
    }
  }, [driverProgress, isSimulating, order, onUpdateStage]);

  if (!isOpen || !order) return null;

  // Stages
  const getStageStep = (status: OrderStatus): number => {
    switch (status) {
      case 'Confirmed':
      case 'Order Confirmed':
      case 'Pending':
        return 1;
      case 'Packing':
      case 'Picking Items':
        return 2;
      case 'Out for Delivery':
        return 3;
      case 'Delivered':
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = getStageStep(order.status);

  const handleNextStage = () => {
    if (!onUpdateStage) return;
    const stages: OrderStatus[] = ['Order Confirmed', 'Picking Items', 'Out for Delivery', 'Delivered'];
    const nextIdx = currentStep % 4;
    const nextStage = stages[nextIdx];
    onUpdateStage(order.id, nextStage);
  };

  // Mini-map coordinates calculation for driver along curved path:
  // Path starts at Store Hub (x: 50, y: 150), bends through Brass Junction (x: 220, y: 100), ends at Destination (x: 390, y: 60)
  const t = Math.min(100, Math.max(0, driverProgress)) / 100;
  // Quadratic bezier interpolation: P(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
  const p0 = { x: 50, y: 150 };
  const p1 = { x: 220, y: 90 };
  const p2 = { x: 390, y: 55 };

  const driverX = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
  const driverY = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Professional Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity animate-fadeIn" 
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl border border-slate-200/80 overflow-hidden z-10 flex flex-col max-h-[92vh] animate-scaleUp">
        
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-forest-700 text-warm-300 flex items-center justify-center text-lg font-bold shadow-md">
              <i className="fa-solid fa-location-crosshairs"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">Live Courier & Order Tracking</h2>
                <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  GPS Active
                </span>
              </div>
              <p className="text-xs text-slate-400">Order #{order.id} • Aba City Express Delivery</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Close tracking modal"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1 hide-scrollbar">
          
          {/* Top Status & Estimated Arrival Banner */}
          <div className="bg-gradient-to-r from-forest-900 via-forest-800 to-slate-900 text-white p-5 rounded-3xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-warm-300 bg-white/10 px-2.5 py-1 rounded-md">
                Current Delivery Stage
              </span>
              <h3 className="text-xl sm:text-2xl font-black mt-1.5 flex items-center gap-2">
                <span>{order.status}</span>
                {order.status === 'Out for Delivery' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                )}
              </h3>
              <p className="text-xs text-forest-200 mt-0.5">
                {order.status === 'Delivered' 
                  ? 'Your groceries have arrived safely at your doorstep in Aba.'
                  : order.status === 'Out for Delivery' 
                  ? 'Courier is en route along Aba-Owerri Road with temperature control.'
                  : order.status === 'Picking Items'
                  ? 'Store clerk is handpicking fresh produce and checking weight.'
                  : 'Order received and confirmed at Aba Central Distribution Hub.'}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 text-right w-full sm:w-auto">
              <span className="text-[10px] text-warm-300 font-bold uppercase tracking-wider block">
                Estimated Arrival
              </span>
              <span className="text-xl sm:text-2xl font-black text-white">
                {order.status === 'Delivered' ? 'Completed' : order.estimatedArrival || '~15 Mins'}
              </span>
              <span className="text-[10px] text-forest-200 block">
                Aba Traffic: Clear Flow
              </span>
            </div>
          </div>

          {/* 4 REAL-TIME STAGES STEPPER */}
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80">
            <div className="relative">
              {/* Progress Line */}
              <div className="hidden sm:block absolute top-5 left-10 right-10 h-1 bg-slate-200 -z-0">
                <div 
                  className="h-full bg-forest-700 transition-all duration-700 rounded-full"
                  style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10 text-center">
                
                {/* 1. Confirmed */}
                <div className="flex flex-col items-center space-y-1.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-xs ${
                    currentStep >= 1 ? 'bg-forest-700 text-white' : 'bg-white text-slate-400 border border-slate-200'
                  }`}>
                    <i className="fa-solid fa-receipt"></i>
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${currentStep >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
                      Order Confirmed
                    </p>
                    <span className="text-[10px] text-forest-700 font-semibold block">10:15 AM</span>
                  </div>
                </div>

                {/* 2. Picking Items */}
                <div className="flex flex-col items-center space-y-1.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-xs ${
                    currentStep >= 2 ? 'bg-forest-700 text-white ring-2 ring-forest-200' : 'bg-white text-slate-400 border border-slate-200'
                  }`}>
                    <i className={`fa-solid fa-basket-shopping ${currentStep === 2 ? 'animate-bounce' : ''}`}></i>
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${currentStep >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
                      Picking Items
                    </p>
                    <span className="text-[10px] text-forest-700 font-semibold block">
                      {currentStep >= 2 ? '10:28 AM' : 'Waiting'}
                    </span>
                  </div>
                </div>

                {/* 3. Out for Delivery */}
                <div className="flex flex-col items-center space-y-1.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-xs ${
                    currentStep >= 3 ? 'bg-forest-700 text-white ring-2 ring-forest-200' : 'bg-white text-slate-400 border border-slate-200'
                  }`}>
                    <i className={`fa-solid fa-motorcycle ${currentStep === 3 ? 'animate-pulse' : ''}`}></i>
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${currentStep >= 3 ? 'text-slate-900' : 'text-slate-400'}`}>
                      Out for Delivery
                    </p>
                    <span className="text-[10px] text-forest-700 font-semibold block">
                      {currentStep >= 3 ? '10:45 AM' : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* 4. Delivered */}
                <div className="flex flex-col items-center space-y-1.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-xs ${
                    currentStep >= 4 ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400 border border-slate-200'
                  }`}>
                    <i className="fa-solid fa-house-circle-check"></i>
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${currentStep >= 4 ? 'text-slate-900' : 'text-slate-400'}`}>
                      Delivered
                    </p>
                    <span className="text-[10px] text-emerald-700 font-semibold block">
                      {currentStep >= 4 ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* VECTOR MINI-MAP GRAPHIC (Express Route & Driver Live Progress) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <i className="fa-solid fa-map text-forest-700"></i>
                <span>Live Courier Mini-Map Graphic (Express Delivery Corridor)</span>
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                {driverProgress < 100 ? `${Math.round(driverProgress)}% of route covered` : 'Arrived at Destination'}
              </span>
            </div>

            {/* SVG Urban Grid & Delivery Route */}
            <div className="relative w-full h-52 sm:h-64 rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-inner select-none">
              
              {/* Map Canvas */}
              <svg className="w-full h-full" viewBox="0 0 450 200" preserveAspectRatio="none">
                <defs>
                  {/* Grid pattern */}
                  <pattern id="corridorGrid" width="25" height="25" patternUnits="userSpaceOnUse">
                    <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                  </pattern>

                  {/* Route Gradient */}
                  <linearGradient id="routeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2D6A4F" />
                    <stop offset="50%" stopColor="#4ade80" />
                    <stop offset="100%" stopColor="#D4A373" />
                  </linearGradient>

                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Background grid */}
                <rect width="100%" height="100%" fill="#0f172a" />
                <rect width="100%" height="100%" fill="url(#corridorGrid)" opacity="0.6" />

                {/* Secondary Street Arteries */}
                <line x1="0" y1="180" x2="450" y2="180" stroke="#1e293b" strokeWidth="4" />
                <line x1="0" y1="70" x2="450" y2="120" stroke="#1e293b" strokeWidth="3" />
                <line x1="120" y1="0" x2="160" y2="200" stroke="#1e293b" strokeWidth="4" />
                <line x1="300" y1="0" x2="330" y2="200" stroke="#1e293b" strokeWidth="3" />
                <line x1="220" y1="0" x2="220" y2="200" stroke="#334155" strokeWidth="6" strokeDasharray="3 3" />

                {/* Street Labels */}
                <text x="15" y="193" fill="#64748b" fontSize="8" fontWeight="bold">AIRPORT EXPRESSWAY</text>
                <text x="180" y="25" fill="#64748b" fontSize="8" fontWeight="bold">CENTRAL DISTRIBUTION PARK</text>
                <text x="270" y="190" fill="#64748b" fontSize="8" fontWeight="bold">COMMERCIAL AVENUE</text>
                <text x="320" y="25" fill="#64748b" fontSize="8" fontWeight="bold">RESIDENTIAL CORRIDOR</text>

                {/* Planned Active Delivery Route */}
                <path 
                  d="M 50 150 Q 220 90 390 55" 
                  fill="none" 
                  stroke="#334155" 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                />
                
                {/* Active Traveled Path */}
                <path 
                  d="M 50 150 Q 220 90 390 55" 
                  fill="none" 
                  stroke="url(#routeGrad)" 
                  strokeWidth="6" 
                  strokeLinecap="round"
                  filter="url(#glow)"
                  strokeDasharray="400"
                  strokeDashoffset={400 - (driverProgress / 100) * 400}
                />

                {/* Origin Hub (Nuelixx Central Hub) */}
                <circle cx="50" cy="150" r="10" fill="#2D6A4F" stroke="#ffffff" strokeWidth="2" />
                <circle cx="50" cy="150" r="18" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.6" />

                {/* Destination Pin (Customer Location) */}
                <circle cx="390" cy="55" r="10" fill="#dc2626" stroke="#ffffff" strokeWidth="2" />
                <circle cx="390" cy="55" r="20" fill="none" stroke="#f87171" strokeWidth="1" strokeDasharray="2 2" className="animate-spin" />
              </svg>

              {/* Start Hub Label Overlay */}
              <div className="absolute left-3 bottom-4 bg-slate-900/90 text-white px-2.5 py-1 rounded-xl border border-slate-700 text-[10px] flex items-center gap-1.5 shadow">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Hub: Nuelixx Central Center</span>
              </div>

              {/* Destination Label Overlay */}
              <div className="absolute right-3 top-3 bg-slate-900/90 text-white px-2.5 py-1 rounded-xl border border-slate-700 text-[10px] flex items-center gap-1.5 shadow">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>Dest: {order.deliveryAddress.area}{order.deliveryAddress.state ? `, ${order.deliveryAddress.state}` : ''}</span>
              </div>

              {/* LIVE DRIVER VEHICLE ICON (Positioned along the path) */}
              <div 
                className="absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ 
                  left: `${(driverX / 450) * 100}%`, 
                  top: `${(driverY / 200) * 100}%` 
                }}
              >
                {/* Radar pulse */}
                <span className="absolute -inset-3 rounded-full bg-warm-400/30 animate-ping"></span>
                <div className="relative w-8 h-8 rounded-full bg-warm-400 text-slate-950 flex items-center justify-center text-xs font-black shadow-lg border-2 border-white">
                  <i className="fa-solid fa-motorcycle"></i>
                </div>
              </div>

              {/* Live HUD Floating Bar */}
              <div className="absolute left-1/2 -translate-x-1/2 top-3 bg-slate-900/85 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-700/80 text-[10px] text-white flex items-center gap-3 shadow-lg">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <i className="fa-solid fa-gauge-high"></i> 32 km/h
                </span>
                <span>•</span>
                <span className="text-slate-300">
                  {driverProgress < 100 ? `${(order.trackingInfo?.distanceKm || 1.8).toFixed(1)} km to doorstep` : 'Arrived'}
                </span>
                <span>•</span>
                <span className="text-warm-300 font-bold truncate max-w-[140px]">
                  {order.trackingInfo?.currentRoad || 'Aba-Owerri Rd'}
                </span>
              </div>

            </div>

            {/* Simulation Controller Bar */}
            <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
              <span className="text-slate-600 text-[11px] font-medium">
                Simulation Mode: Test live driver progress & order stages
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSimulating(!isSimulating)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors shadow-2xs flex items-center gap-1.5 ${
                    isSimulating ? 'bg-amber-500 text-white' : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300'
                  }`}
                >
                  <i className={`fa-solid ${isSimulating ? 'fa-pause' : 'fa-play'} text-[10px]`}></i>
                  <span>{isSimulating ? 'Pause Driver' : 'Simulate Driver Ride'}</span>
                </button>

                <button
                  onClick={handleNextStage}
                  className="px-3 py-1.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl font-bold text-xs transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-forward-step text-[10px]"></i>
                  <span>Advance Stage</span>
                </button>
              </div>
            </div>
          </div>

          {/* Assigned Driver & Delivery Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            {/* Courier Dispatcher Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <i className="fa-solid fa-id-card text-forest-700"></i>
                  <span>Assigned Express Dispatch Courier</span>
                </h4>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  ★ 4.9 (580+ Trips)
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-forest-700 text-white flex items-center justify-center text-lg font-bold shadow-sm">
                  <i className="fa-solid fa-user-astronaut"></i>
                </div>
                <div>
                  <h5 className="font-black text-slate-900 text-sm">
                    {order.trackingInfo?.riderName || 'Kelechi Nnamdi'}
                  </h5>
                  <p className="text-slate-500 text-[11px]">
                    Vehicle: {order.trackingInfo?.riderVehicle || 'Express Courier (LAG-819-NX)'}
                  </p>
                  <span className="text-forest-700 font-bold text-[11px] block mt-0.5">
                    {order.trackingInfo?.riderPhone || '+234 812 901 3456'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <a 
                  href={`tel:${order.trackingInfo?.riderPhone || '+2348129013456'}`}
                  className="flex-1 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-center text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <i className="fa-solid fa-phone text-xs"></i>
                  <span>Call Driver</span>
                </a>
                <button 
                  onClick={() => {
                    setDriverPingSent(true);
                    setTimeout(() => setDriverPingSent(false), 3000);
                  }}
                  className={`px-4 py-2 border rounded-xl text-xs font-bold transition-colors ${
                    driverPingSent 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title="Ping driver via SMS"
                >
                  <i className={`fa-solid ${driverPingSent ? 'fa-check' : 'fa-comment-dots'}`}></i>
                </button>
              </div>
              {driverPingSent && (
                <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 animate-fadeIn">
                  <i className="fa-solid fa-circle-check"></i>
                  <span>SMS ping sent to dispatch rider ({order.trackingInfo?.riderPhone || '+234 812 901 3456'})</span>
                </p>
              )}
            </div>

            {/* Delivery Destination Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <i className="fa-solid fa-location-dot text-forest-700"></i>
                <span>Nationwide Delivery Destination</span>
              </h4>

              <div className="space-y-1 text-slate-600 text-[11px]">
                <p><strong>Recipient:</strong> {order.deliveryAddress.fullName} ({order.deliveryAddress.phone})</p>
                <p><strong>Street:</strong> {order.deliveryAddress.street}</p>
                <p><strong>Landmark:</strong> {order.deliveryAddress.landmark}</p>
                <p><strong>Location:</strong> <span className="text-forest-700 font-bold">{order.deliveryAddress.area}{order.deliveryAddress.state ? `, ${order.deliveryAddress.state} State` : ''}</span></p>
                <p><strong>Delivery Slot:</strong> {order.deliverySlot}</p>
              </div>
            </div>

          </div>

          {/* Grocery Items List in this Order */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-900">
                Package Contents ({order.items.length} Fresh Items)
              </span>
              <span className="font-black text-forest-700">
                Total: {formatPrice(order.total)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1 hide-scrollbar">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400">Qty: {item.quantity} • {formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500 text-[11px]">
            Nuelixx Customer Care: <strong>0803 456 7890</strong> (Toll-Free Nationwide)
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors shadow-xs"
          >
            Close Tracking
          </button>
        </div>

      </div>
    </div>
  );
};

export default OrderTrackingModal;
