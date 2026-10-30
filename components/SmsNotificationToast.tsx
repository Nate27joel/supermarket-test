import React, { useEffect, useState } from 'react';
import { SmsNotification } from '../types';

interface SmsNotificationToastProps {
  notifications: SmsNotification[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}

export const SmsNotificationToast: React.FC<SmsNotificationToastProps> = ({
  notifications,
  onDismiss,
  onClearAll
}) => {
  if (notifications.length === 0) return null;

  return (
    <aside 
      aria-label="SMS Notifications" 
      aria-live="polite"
      className="fixed top-4 sm:top-6 right-3 sm:right-6 z-[200] flex flex-col gap-3 max-w-sm sm:max-w-md w-[calc(100vw-1.5rem)] sm:w-full pointer-events-none"
    >
      {notifications.map((notif, index) => (
        <SmsToastItem 
          key={notif.id} 
          notification={notif} 
          index={index}
          onDismiss={() => onDismiss(notif.id)} 
        />
      ))}
      
      {notifications.length > 2 && (
        <div className="flex justify-end pointer-events-auto">
          <button
            onClick={onClearAll}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-900 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200 shadow-sm"
          >
            Clear All Alerts ({notifications.length})
          </button>
        </div>
      )}
    </aside>
  );
};

interface SmsToastItemProps {
  notification: SmsNotification;
  index: number;
  onDismiss: () => void;
}

const SmsToastItem: React.FC<SmsToastItemProps> = ({
  notification,
  onDismiss
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = 6500;

    // Auto-dismiss cleanly via setTimeout outside of render and state updaters
    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, duration);

    // Progress bar animation updates strictly local progress
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;
    const progressTimer = setInterval(() => {
      setProgress(prev => Math.max(0, prev - step));
    }, intervalTime);

    return () => {
      clearTimeout(dismissTimer);
      clearInterval(progressTimer);
    };
  }, [onDismiss]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-500 text-white';
      case 'Out for Delivery':
        return 'bg-blue-600 text-white';
      case 'Picking Items':
        return 'bg-amber-500 text-slate-950';
      case 'Cancelled':
        return 'bg-rose-500 text-white';
      default:
        return 'bg-forest-700 text-white';
    }
  };

  return (
    <div 
      className="pointer-events-auto bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-slate-700/80 p-4 backdrop-blur-lg transition-all duration-300 animate-slideDown overflow-hidden relative"
      role="alert"
    >
      {/* Auto-dismiss progress line */}
      <div 
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-forest-500 via-emerald-400 to-warm-400 transition-all duration-75"
        style={{ width: `${progress}%` }}
      />

      {/* Header with Carrier / SMS Gateway Tag & Status Badge */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-forest-600/30 border border-forest-500/40 text-emerald-400 flex items-center justify-center text-sm shadow-xs">
            <i className="fa-solid fa-comment-sms animate-pulse"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wide text-white uppercase">
                Order SMS Sent
              </span>
              <span className={`text-[9px] font-black px-2 py-0.2 rounded uppercase tracking-wider ${getStatusColor(notification.status)}`}>
                {notification.status}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
              <span>{notification.carrier}</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-0.5">
                <i className="fa-solid fa-check-double text-[9px]"></i> Sent via Gateway
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Dismiss notification"
        >
          <i className="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>

      {/* Recipient Phone & Timestamp */}
      <div className="bg-slate-800/80 rounded-xl p-2.5 mb-2.5 border border-slate-700/60 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-300">
          <i className="fa-solid fa-mobile-screen text-xs text-warm-400"></i>
          <span className="text-slate-400">To:</span>
          <span className="font-mono font-bold text-white">{notification.recipientPhone}</span>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">{notification.timestamp}</span>
      </div>

      {/* SMS Body Bubble */}
      <div className="bg-slate-950/90 rounded-xl p-3 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans relative">
        <p className="line-clamp-4">{notification.message}</p>
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400">
          <span className="font-mono font-bold text-warm-300">Order #{notification.orderId}</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <i className="fa-solid fa-circle-check text-[9px]"></i> SMS Delivered to Handset
          </span>
        </div>
      </div>
    </div>
  );
};

export default SmsNotificationToast;
