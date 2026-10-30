import React, { useState, useMemo } from 'react';
import { UserProfile, AdminProfile, Order, Product, CartItem, Address, OrderStatus, ActiveAccountRole, OrderFilterStatus, SmsNotification } from '../types';
import { formatPrice } from '../constants';
import OrderTrackingModal from './OrderTrackingModal';
import SmsNotificationToast from './SmsNotificationToast';
import { generateOrderSms } from '../services/smsNotificationService';

interface AccountDashboardProps {
  user: UserProfile;
  admin: AdminProfile;
  activeAccount: ActiveAccountRole;
  onSwitchAccount: (role: ActiveAccountRole) => void;
  orders: Order[];
  onReorder: (items: CartItem[]) => void;
  savedProducts: Product[];
  onAddToCart: (product: Product) => void;
  onUpdateAddresses: (addresses: Address[]) => void;
  onClose: () => void;
  onUpdateOrderStage?: (orderId: string, newStage: OrderStatus) => void;
  onNavigateToAdmin?: () => void;
}

const AccountDashboard: React.FC<AccountDashboardProps> = ({
  user,
  admin,
  activeAccount,
  onSwitchAccount,
  orders,
  onReorder,
  savedProducts,
  onAddToCart,
  onUpdateAddresses,
  onClose,
  onUpdateOrderStage,
  onNavigateToAdmin
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'saved' | 'account-info'>('orders');
  
  // Track Order Modal state
  const [trackingModalOrder, setTrackingModalOrder] = useState<Order | null>(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  // Order Filtering & Search states
  const [orderFilter, setOrderFilter] = useState<OrderFilterStatus>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Simulated SMS Notifications Service states
  const [smsNotifications, setSmsNotifications] = useState<SmsNotification[]>([]);
  const [smsLog, setSmsLog] = useState<SmsNotification[]>(() => {
    const saved = localStorage.getItem('nuelixx_sms_log');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback below
      }
    }
    return [
      {
        id: 'sms-init-1',
        orderId: 'NX-84920',
        recipientPhone: user.phone,
        recipientName: user.name,
        status: 'Out for Delivery',
        message: `Nuelixx Supermarket: DISPATCHED! Dispatch courier Kelechi Nnamdi (Plate: LAG-819-NX) is on the road heading to your delivery address. Estimated arrival: ~12 mins. Courier Tel: +234 812 901 3456`,
        timestamp: 'Today, 10:45 AM',
        carrier: 'MTN Nigeria (Gateway 30891)'
      },
      {
        id: 'sms-init-2',
        orderId: 'NX-91204',
        recipientPhone: user.phone,
        recipientName: user.name,
        status: 'Picking Items',
        message: `Nuelixx Supermarket: Order #NX-91204 is now being PICKED FRESH from cold storage shelves at our central fulfillment hub. Produce quality inspected. Estimated delivery: ~35 mins.`,
        timestamp: 'Today, 11:35 AM',
        carrier: 'Airtel NG (Shortcode NUELIXX-NG)'
      }
    ];
  });
  const [isSmsLogModalOpen, setIsSmsLogModalOpen] = useState(false);

  // Address form states
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [newArea, setNewArea] = useState('Victoria Island / Ikoyi');
  const [newPhone, setNewPhone] = useState(user.phone);
  const [reorderFeedback, setReorderFeedback] = useState<string | null>(null);

  // Trigger SMS helper function
  const triggerOrderSms = (order: Order, newStatus: OrderStatus) => {
    const newSms = generateOrderSms(order, newStatus);
    setSmsNotifications(prev => [newSms, ...prev]);
    setSmsLog(prev => {
      const updated = [newSms, ...prev];
      localStorage.setItem('nuelixx_sms_log', JSON.stringify(updated));
      return updated;
    });
  };

  // Status update wrapper that notifies user via simulated SMS
  const handleUpdateOrderStageWithSms = (orderId: string, newStage: OrderStatus) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (targetOrder) {
      triggerOrderSms(targetOrder, newStage);
      // If modal is open for this order, update local modal state as well
      if (trackingModalOrder && trackingModalOrder.id === orderId) {
        setTrackingModalOrder({ ...trackingModalOrder, status: newStage });
      }
    }
    if (onUpdateOrderStage) {
      onUpdateOrderStage(orderId, newStage);
    }
  };

  const handleDismissSms = (id: string) => {
    setSmsNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAllSms = () => {
    setSmsNotifications([]);
  };

  const handleOpenTracking = (order: Order) => {
    setTrackingModalOrder(order);
    setIsTrackingModalOpen(true);
  };

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreet || !newLandmark) return;

    const newAddr: Address = {
      id: `addr-${Date.now()}`,
      title: newTitle || 'Residential Address',
      fullName: user.name,
      street: newStreet,
      landmark: newLandmark,
      area: newArea,
      phone: newPhone,
      isDefault: false
    };

    onUpdateAddresses([...user.addresses, newAddr]);
    setIsAddingAddress(false);
    setNewStreet('');
    setNewLandmark('');
    setNewTitle('');
  };

  const handleRemoveAddress = (addrId: string) => {
    if (user.addresses.length <= 1) return;
    onUpdateAddresses(user.addresses.filter(a => a.id !== addrId));
  };

  const handleTriggerReorder = (order: Order) => {
    onReorder(order.items);
    setReorderFeedback(`Added ${order.items.length} fresh items from Order #${order.id} to your basket!`);
    setTimeout(() => setReorderFeedback(null), 3000);
  };

  const orderCounts = useMemo(() => {
    return {
      all: orders.length,
      inProgress: orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length,
      completed: orders.filter(o => o.status === 'Delivered').length,
      cancelled: orders.filter(o => o.status === 'Cancelled').length
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (orderFilter === 'in-progress') {
      result = result.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
    } else if (orderFilter === 'completed') {
      result = result.filter(o => o.status === 'Delivered');
    } else if (orderFilter === 'cancelled') {
      result = result.filter(o => o.status === 'Cancelled');
    }

    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase().trim();
      result = result.filter(o => 
        o.id.toLowerCase().includes(q) ||
        o.deliveryAddress.street.toLowerCase().includes(q) ||
        o.deliveryAddress.area.toLowerCase().includes(q) ||
        o.deliveryAddress.landmark.toLowerCase().includes(q) ||
        o.items.some(item => item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q))
      );
    }

    return result;
  }, [orders, orderFilter, orderSearchQuery]);

  const activeOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn relative">
      
      {/* Floating Real-Time Simulated SMS Notification Toasts */}
      <SmsNotificationToast 
        notifications={smsNotifications}
        onDismiss={handleDismissSms}
        onClearAll={handleClearAllSms}
      />

      {/* Top Banner with Account Info & Role Switcher */}
      <div className="bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl border border-slate-800">
        
        {/* Profile Details */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-forest-700 border-2 border-forest-500/40 flex items-center justify-center text-2xl font-black text-warm-300 shadow">
            {activeAccount === 'admin' 
              ? admin.name.split(' ').map(n => n[0]).join('')
              : user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black">
                {activeAccount === 'admin' ? admin.name : user.name}
              </h1>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                activeAccount === 'admin' 
                  ? 'bg-amber-400 text-slate-950 font-bold' 
                  : 'bg-forest-600 text-white font-bold'
              }`}>
                {activeAccount === 'admin' ? 'Store Manager (Admin)' : 'Verified Customer'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {activeAccount === 'admin' ? admin.email : user.email} • {activeAccount === 'admin' ? admin.phone : user.phone}
            </p>
          </div>
        </div>

        {/* Account Switcher & Loyalty Card */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          
          {/* Switch Account Control */}
          <div className="bg-slate-800 p-1.5 rounded-2xl flex border border-slate-700">
            <button
              onClick={() => onSwitchAccount('user')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeAccount === 'user' ? 'bg-forest-700 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-user"></i>
              <span>Customer</span>
            </button>
            <button
              onClick={() => onSwitchAccount('admin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeAccount === 'admin' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-shield-halved"></i>
              <span>Admin</span>
            </button>
          </div>

          {/* Reward Points or Admin Portal Button */}
          {activeAccount === 'user' ? (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warm-400 text-slate-950 flex items-center justify-center text-lg font-bold">
                <i className="fa-solid fa-gem"></i>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                  Nuelixx Points
                </span>
                <span className="text-lg font-black text-white">{user.palmPoints} Pts</span>
              </div>
            </div>
          ) : (
            <button
              onClick={onNavigateToAdmin}
              className="px-5 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-2xl text-xs font-black transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-gauge-high"></i>
              <span>Open Admin Dashboard</span>
            </button>
          )}

        </div>
      </div>

      {reorderFeedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs font-bold animate-fadeIn">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
            <span>{reorderFeedback}</span>
          </div>
          <button onClick={() => setReorderFeedback(null)} className="text-emerald-700">✕</button>
        </div>
      )}

      {/* Active Orders Quick Alert Banner with 'Track Order' Button */}
      {activeOrders.length > 0 && (
        <div className="p-5 bg-gradient-to-r from-forest-50 via-emerald-50 to-warm-50 border border-forest-200 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-forest-700 text-white flex items-center justify-center text-lg shadow-sm">
              <i className="fa-solid fa-truck-fast"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900">
                  Active Delivery in Progress (Order #{activeOrders[0].id})
                </h3>
                <span className="bg-forest-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {activeOrders[0].status}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Destination: {activeOrders[0].deliveryAddress.area}{activeOrders[0].deliveryAddress.state ? `, ${activeOrders[0].deliveryAddress.state}` : ''} • {activeOrders[0].estimatedArrival || '~15 Mins'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleOpenTracking(activeOrders[0])}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
            >
              <i className="fa-solid fa-location-crosshairs text-xs"></i>
              <span>Track Order & View Live Map</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 sm:gap-8 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors relative whitespace-nowrap ${activeTab === 'orders' ? 'text-forest-700 border-b-2 border-forest-700' : 'text-slate-400 hover:text-slate-700'}`}
        >
          <i className="fa-solid fa-box"></i>
          <span>Order History ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors relative whitespace-nowrap ${activeTab === 'addresses' ? 'text-forest-700 border-b-2 border-forest-700' : 'text-slate-400 hover:text-slate-700'}`}
        >
          <i className="fa-solid fa-location-dot"></i>
          <span>Saved Delivery Addresses ({user.addresses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors relative whitespace-nowrap ${activeTab === 'saved' ? 'text-forest-700 border-b-2 border-forest-700' : 'text-slate-400 hover:text-slate-700'}`}
        >
          <i className="fa-solid fa-heart"></i>
          <span>Saved Groceries ({savedProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('account-info')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors relative whitespace-nowrap ${activeTab === 'account-info' ? 'text-forest-700 border-b-2 border-forest-700' : 'text-slate-400 hover:text-slate-700'}`}
        >
          <i className="fa-solid fa-user-gear"></i>
          <span>Account Settings ({activeAccount === 'admin' ? 'Admin' : 'User'})</span>
        </button>
      </div>

      {/* TAB 1: ORDER HISTORY WITH FILTERING SYSTEM & SIMULATED SMS SERVICE */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          
          {/* Header & SMS Service Info Banner */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Your Supermarket Orders</h2>
                <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md flex items-center gap-1">
                  <i className="fa-solid fa-tower-broadcast text-[9px] animate-pulse"></i>
                  SMS Alerts Active
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Track delivery status, filter by order stage, and receive instant SMS notifications to <strong>{user.phone}</strong>.
              </p>
            </div>

            {/* SMS Service Buttons */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setIsSmsLogModalOpen(true)}
                className="flex-1 md:flex-none px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                title="View simulated SMS message history"
              >
                <i className="fa-solid fa-inbox text-forest-700"></i>
                <span>SMS Inbox Log ({smsLog.length})</span>
              </button>

              <button
                onClick={() => {
                  const target = orders[0];
                  if (target) {
                    triggerOrderSms(target, target.status);
                  }
                }}
                className="flex-1 md:flex-none px-3.5 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                title="Send test SMS dispatch update"
              >
                <i className="fa-solid fa-paper-plane text-xs"></i>
                <span>Test SMS Notification</span>
              </button>
            </div>
          </div>

          {/* FILTERING SYSTEM CONTROLS BAR */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              
              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto hide-scrollbar pb-1 md:pb-0">
                
                {/* 1. All Orders */}
                <button
                  onClick={() => setOrderFilter('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    orderFilter === 'all' 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <i className="fa-solid fa-list-ul text-xs"></i>
                  <span>All Orders</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                    orderFilter === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-600'
                  }`}>
                    {orderCounts.all}
                  </span>
                </button>

                {/* 2. In Progress */}
                <button
                  onClick={() => setOrderFilter('in-progress')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    orderFilter === 'in-progress' 
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-100' 
                      : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                  }`}
                >
                  <i className="fa-solid fa-truck-fast text-xs"></i>
                  <span>In Progress</span>
                  {orderCounts.inProgress > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  )}
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                    orderFilter === 'in-progress' ? 'bg-blue-700 text-white' : 'bg-blue-200 text-blue-900'
                  }`}>
                    {orderCounts.inProgress}
                  </span>
                </button>

                {/* 3. Completed / Delivered */}
                <button
                  onClick={() => setOrderFilter('completed')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    orderFilter === 'completed' 
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-100' 
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <i className="fa-solid fa-circle-check text-xs"></i>
                  <span>Completed</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                    orderFilter === 'completed' ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-900'
                  }`}>
                    {orderCounts.completed}
                  </span>
                </button>

                {/* 4. Cancelled */}
                <button
                  onClick={() => setOrderFilter('cancelled')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    orderFilter === 'cancelled' 
                      ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-100' 
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                  }`}
                >
                  <i className="fa-solid fa-ban text-xs"></i>
                  <span>Cancelled</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                    orderFilter === 'cancelled' ? 'bg-rose-700 text-white' : 'bg-rose-200 text-rose-900'
                  }`}>
                    {orderCounts.cancelled}
                  </span>
                </button>

              </div>

              {/* Search Filter Input */}
              <div className="relative flex-1 max-w-md">
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input 
                  type="text"
                  placeholder="Search by Order #ID (e.g. 84920) or grocery..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-forest-700 focus:bg-white"
                />
                {orderSearchQuery && (
                  <button 
                    onClick={() => setOrderSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

            </div>

            {/* Filter active status indicator */}
            <div className="flex justify-between items-center text-xs text-slate-500 pt-1 border-t border-slate-100">
              <span>
                Showing <strong>{filteredOrders.length}</strong> of {orders.length} total orders
                {orderFilter !== 'all' && <span className="font-semibold text-forest-700"> (Filtered by {orderFilter.toUpperCase()})</span>}
                {orderSearchQuery && <span className="font-semibold text-slate-800"> (Matching "{orderSearchQuery}")</span>}
              </span>

              {(orderFilter !== 'all' || orderSearchQuery) && (
                <button
                  onClick={() => {
                    setOrderFilter('all');
                    setOrderSearchQuery('');
                  }}
                  className="text-xs font-bold text-forest-700 hover:text-forest-800 underline"
                >
                  Reset Filters
                </button>
              )}
            </div>

          </div>

          {/* ORDERS LIST */}
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              /* Empty State when no orders match filter */
              <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl">
                  <i className="fa-solid fa-box-open"></i>
                </div>
                <h3 className="text-base font-bold text-slate-900">No Orders Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {orderFilter !== 'all' 
                    ? `You currently do not have any orders with status "${orderFilter}". Try changing your filter or search query.` 
                    : `No orders matched your search "${orderSearchQuery}".`}
                </p>
                <button
                  onClick={() => {
                    setOrderFilter('all');
                    setOrderSearchQuery('');
                  }}
                  className="px-5 py-2.5 bg-forest-700 text-white rounded-xl text-xs font-bold hover:bg-forest-800 transition-colors shadow-xs"
                >
                  View All Orders
                </button>
              </div>
            ) : (
              filteredOrders.map(order => {
                const isActive = order.status !== 'Delivered' && order.status !== 'Cancelled';
                const isCancelled = order.status === 'Cancelled';

                const getStatusBadgeClass = (status: OrderStatus) => {
                  switch (status) {
                    case 'Delivered':
                      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
                    case 'Out for Delivery':
                      return 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse';
                    case 'Picking Items':
                    case 'Packing':
                      return 'bg-amber-100 text-amber-800 border-amber-200';
                    case 'Cancelled':
                      return 'bg-rose-100 text-rose-800 border-rose-200';
                    default:
                      return 'bg-purple-100 text-purple-800 border-purple-200';
                  }
                };

                return (
                  <div 
                    key={order.id} 
                    className={`bg-white rounded-3xl border p-5 sm:p-6 shadow-xs space-y-4 transition-all ${
                      isActive 
                        ? 'border-forest-300 ring-1 ring-forest-100' 
                        : isCancelled 
                        ? 'border-rose-200 bg-rose-50/20' 
                        : 'border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    {/* Order Top Bar */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 pb-4 border-b border-slate-100">
                      
                      {/* Left: ID, Date, Status Badge */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-sm font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
                          #{order.id}
                        </span>
                        <span className="text-xs text-slate-400">{order.date}</span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </div>

                      {/* Right: Actions (Track Order, Reorder, and Simulated SMS Stage Changer) */}
                      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                        
                        {/* Interactive Status Selector with Simulated SMS Dispatch */}
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-xl text-xs">
                          <i className="fa-solid fa-comment-sms text-forest-700 text-xs"></i>
                          <span className="text-[10px] font-bold text-slate-500 hidden sm:inline">Status & SMS:</span>
                          <select 
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStageWithSms(order.id, e.target.value as OrderStatus)}
                            className="bg-transparent text-[11px] font-bold text-slate-800 focus:outline-none cursor-pointer"
                            title="Select a status to simulate stage update and send SMS to user's phone"
                          >
                            <option value="Order Confirmed">Order Confirmed</option>
                            <option value="Picking Items">Picking Items</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>

                        {/* Test Send SMS Alert for this specific order */}
                        <button
                          onClick={() => triggerOrderSms(order, order.status)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                          title="Simulate SMS notification for this order"
                        >
                          <i className="fa-solid fa-mobile-screen text-[11px] text-forest-700"></i>
                          <span className="text-[10px] hidden sm:inline">Send SMS</span>
                        </button>

                        {/* PROMINENT 'TRACK ORDER' BUTTON */}
                        {!isCancelled && (
                          <button
                            onClick={() => handleOpenTracking(order)}
                            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                              isActive 
                                ? 'bg-forest-700 hover:bg-forest-800 text-white shadow-sm ring-2 ring-forest-100' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            }`}
                          >
                            <i className="fa-solid fa-location-crosshairs text-xs"></i>
                            <span>Track Order</span>
                            {isActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1"></span>}
                          </button>
                        )}

                        {/* Reorder Button */}
                        <button
                          onClick={() => handleTriggerReorder(order)}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-forest-50 text-forest-700 border border-forest-200 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                        >
                          <i className="fa-solid fa-arrow-rotate-right text-xs"></i>
                          <span>Reorder</span>
                        </button>

                      </div>

                    </div>

                    {/* Cancelled Notice if applicable */}
                    {isCancelled && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <i className="fa-solid fa-circle-exclamation text-rose-600"></i>
                          <span>This order was cancelled. Pre-authorisation was refunded to customer. SMS notification delivered.</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase bg-rose-200/80 px-2 py-0.5 rounded text-rose-900">
                          Reversed
                        </span>
                      </div>
                    )}

                    {/* Items in order */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50/70 rounded-xl border border-slate-100">
                          <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-500">Qty: {item.quantity} • {formatPrice(item.price * item.quantity)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Footer */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-location-dot text-forest-700"></i>
                        <span>Delivered to: {order.deliveryAddress.street}, {order.deliveryAddress.area}, Aba</span>
                      </div>
                      <div className="font-bold text-slate-900 text-sm">
                        Total {isCancelled ? 'Cancelled' : 'Paid'}: <span className={isCancelled ? "text-slate-500 line-through" : "text-forest-700 font-black"}>{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SAVED ABA DELIVERY ADDRESSES */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Saved Aba Delivery Addresses</h2>
              <p className="text-xs text-slate-500">Speed up checkout for home, office, and family deliveries in Aba.</p>
            </div>
            <button
              onClick={() => setIsAddingAddress(true)}
              className="px-4 py-2 bg-forest-700 text-white rounded-xl text-xs font-bold hover:bg-forest-800 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <i className="fa-solid fa-plus text-[10px]"></i>
              <span>Add New Address</span>
            </button>
          </div>

          {/* Add Address Form Modal / Inline */}
          {isAddingAddress && (
            <form onSubmit={handleAddNewAddress} className="p-6 bg-forest-50/50 border border-forest-200 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-slate-900">New Aba Delivery Location</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Address Label</label>
                  <input 
                    type="text" 
                    placeholder="e.g. My Shop, Family House"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Aba District / Area</label>
                  <select 
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Aba-Owerri Road">Aba-Owerri Road</option>
                    <option value="Brass Junction">Brass Junction</option>
                    <option value="Faulks Road / Ariaria">Faulks Road / Ariaria</option>
                    <option value="Ogbor Hill">Ogbor Hill</option>
                    <option value="Osisioma Flyover">Osisioma Flyover</option>
                    <option value="Azikiwe Road">Azikiwe Road</option>
                    <option value="Factory Road">Factory Road</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Street Address</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 14 Brass Street"
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Aba Landmark</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Near Abia State Poly, Opposite Ariaria Gate"
                    value={newLandmark}
                    onChange={(e) => setNewLandmark(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsAddingAddress(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-forest-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Save Address
                </button>
              </div>
            </form>
          )}

          {/* Addresses Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {user.addresses.map(addr => (
              <div key={addr.id} className="p-5 bg-white rounded-2xl border border-slate-200/80 space-y-2 relative shadow-xs">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <i className="fa-solid fa-house-chimney text-forest-700"></i>
                    {addr.title}
                  </span>
                  {addr.isDefault && (
                    <span className="text-[10px] bg-forest-50 text-forest-700 font-bold px-2 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium">{addr.street}</p>
                <p className="text-[11px] text-slate-400">Landmark: {addr.landmark}</p>
                <p className="text-[11px] text-forest-700 font-semibold">{addr.area}, Aba</p>

                {user.addresses.length > 1 && (
                  <button 
                    onClick={() => handleRemoveAddress(addr.id)}
                    className="text-[11px] text-red-500 hover:underline pt-2 inline-block"
                  >
                    Delete Address
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SAVED WISHLIST */}
      {activeTab === 'saved' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Saved Groceries</h2>
            <p className="text-xs text-slate-500">Quickly add regular Aba household favorites to your current basket.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {savedProducts.map(p => (
              <div key={p.id} className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3 flex flex-col justify-between shadow-xs">
                <div>
                  <img src={p.image} alt={p.name} className="w-full aspect-square object-cover rounded-xl mb-2" />
                  <p className="text-xs font-bold text-slate-900 line-clamp-1">{p.name}</p>
                  <p className="text-[10px] text-slate-400">{p.unit}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs font-black text-forest-700">{formatPrice(p.price)}</span>
                  <button 
                    onClick={() => onAddToCart(p)}
                    className="px-3 py-1.5 bg-forest-700 text-white rounded-lg text-xs font-bold hover:bg-forest-800 shadow-2xs"
                  >
                    + Basket
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ACCOUNT DETAILS & ADMIN ROUTE LINK */}
      {activeTab === 'account-info' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Account Credentials & Access Roles</h2>
            <p className="text-xs text-slate-500">Manage credentials for both the Customer and Store Manager Admin accounts.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Customer Account Details Card */}
            <div className={`p-6 rounded-3xl border transition-all ${
              activeAccount === 'user' ? 'bg-white border-forest-300 shadow-md ring-1 ring-forest-100' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-forest-700 bg-forest-50 px-3 py-1 rounded-full">
                  Customer Account
                </span>
                {activeAccount === 'user' && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    Active Session
                  </span>
                )}
              </div>
              <h3 className="text-base font-black text-slate-900">{user.name}</h3>
              <p className="text-xs text-slate-500">{user.email}</p>
              <p className="text-xs text-slate-500">{user.phone}</p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                <span>Loyalty Balance: <strong>{user.palmPoints} PalmPoints</strong></span>
                <button
                  onClick={() => onSwitchAccount('user')}
                  className="px-3 py-1 bg-forest-700 text-white rounded-lg text-xs font-bold hover:bg-forest-800"
                >
                  Switch to Customer
                </button>
              </div>
            </div>

            {/* Admin Account Details Card */}
            <div className={`p-6 rounded-3xl border transition-all ${
              activeAccount === 'admin' ? 'bg-white border-amber-300 shadow-md ring-1 ring-amber-100' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-3 py-1 rounded-full">
                  Admin / Store Manager Account
                </span>
                {activeAccount === 'admin' && (
                  <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded">
                    Active Session
                  </span>
                )}
              </div>
              <h3 className="text-base font-black text-slate-900">{admin.name}</h3>
              <p className="text-xs text-slate-600 font-medium">{admin.title} • {admin.assignedBranch}</p>
              <p className="text-xs text-slate-400">{admin.email} • {admin.phone}</p>
              
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                <span className="text-slate-500 text-[11px]">
                  Hidden Route: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold">#/admin-dashboard</code>
                </span>
                <button
                  onClick={onNavigateToAdmin}
                  className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-black shadow-xs"
                >
                  Go to Admin Route →
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TRACK ORDER MODAL POPUP */}
      <OrderTrackingModal 
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        order={trackingModalOrder}
        onUpdateStage={handleUpdateOrderStageWithSms}
      />

      {/* SIMULATED SMS HANDSET INBOX MODAL */}
      {isSmsLogModalOpen && (
        <div 
          className="fixed inset-0 z-[160] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSmsLogModalOpen(false)}
          />

          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] animate-scaleUp border border-slate-200">
            
            {/* Handset Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-forest-600 text-white flex items-center justify-center text-lg shadow-sm">
                  <i className="fa-solid fa-mobile-screen"></i>
                </div>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <span>Simulated SMS Handset</span>
                    <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                      Live Gateways
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Recipient: <strong className="text-warm-300 font-mono">{user.phone}</strong> ({user.name})
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setIsSmsLogModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Handset SMS Thread Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50 hide-scrollbar">
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200/60 px-3 py-1 rounded-full">
                  SMS Message History ({smsLog.length})
                </span>
              </div>

              {smsLog.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <i className="fa-solid fa-comment-slash text-3xl"></i>
                  <p className="text-xs">No SMS notifications sent yet.</p>
                </div>
              ) : (
                smsLog.map((sms) => (
                  <div key={sms.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 text-xs">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700">
                        <i className="fa-solid fa-shield-halved text-forest-700"></i>
                        <span>Sender: Nuelixx Supermarket</span>
                        <span>•</span>
                        <span className="font-mono text-forest-700">Order #{sms.orderId}</span>
                      </div>
                      <span>{sms.timestamp}</span>
                    </div>

                    <p className="text-slate-800 leading-relaxed font-sans text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {sms.message}
                    </p>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                      <span>{sms.carrier}</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <i className="fa-solid fa-circle-check text-[10px]"></i>
                        <span>Handset Received</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() => {
                  setSmsLog([]);
                  localStorage.removeItem('nuelixx_sms_log');
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
              >
                Clear SMS History
              </button>

              <button
                onClick={() => setIsSmsLogModalOpen(false)}
                className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Close Handset
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AccountDashboard;
