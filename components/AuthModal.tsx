import React, { useState } from 'react';
import { UserProfile } from '../types';
import { loginCustomer, signupCustomer, UserSignupData } from '../services/authService';
import { DELIVERY_HUBS } from '../constants';

export type AuthMode = 'customer-login' | 'customer-signup';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onLoginSuccess: (user: UserProfile, role: 'user') => void;
  currentUser?: UserProfile | null;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'customer-login',
  onLoginSuccess,
  currentUser,
  onLogout
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Customer Login Form
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');

  // Customer Sign Up Form
  const [signupForm, setSignupForm] = useState<UserSignupData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    street: '',
    landmark: '',
    area: 'Lagos & South-West Distribution Hub'
  });

  // Reset errors when mode changes
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  if (!isOpen) return null;

  // Handle Customer Login
  const handleCustomerLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    const result = await loginCustomer(customerEmail, customerPassword);
    setLoading(false);

    if (result.success && result.user) {
      setSuccessMessage(result.message);
      setTimeout(() => {
        onLoginSuccess(result.user!, 'user');
        onClose();
      }, 700);
    } else {
      setErrorMessage(result.message || 'Login failed. Please verify your credentials.');
    }
  };

  // Handle Customer Sign Up
  const handleCustomerSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!signupForm.name || !signupForm.email || !signupForm.password) {
      setErrorMessage('Please fill in your name, email, and password.');
      return;
    }

    setLoading(true);
    const result = await signupCustomer(signupForm);
    setLoading(false);

    if (result.success && result.user) {
      setSuccessMessage(result.message);
      setTimeout(() => {
        onLoginSuccess(result.user!, 'user');
        onClose();
      }, 700);
    } else {
      setErrorMessage(result.message || 'Could not create account. Please check inputs.');
    }
  };

  // Quick autofills for demonstration & testing
  const autofillDemoCustomer = () => {
    setCustomerEmail('amaka.obi@nuelixx.ng');
    setCustomerPassword('password123');
    setErrorMessage(null);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-x-hidden overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Dark Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-fadeIn" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-[#0d120f] w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-neutral-800 text-slate-100 overflow-hidden z-10 flex flex-col max-h-[92vh] animate-scaleUp">
        
        {/* Top Header */}
        <div className="p-6 bg-black border-b border-neutral-800/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold shadow-md bg-forest-700 text-white">
              <i className="fa-solid fa-user-lock"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Nuelixx Customer Account
                </h2>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider border bg-forest-600/20 text-forest-300 border-forest-500/30">
                  Nationwide Shopper
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Fast checkout, live order tracking & loyalty points across Nigeria
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-neutral-800"
            aria-label="Close auth modal"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Customer Tabs (Sign In vs Sign Up) */}
        <div className="grid grid-cols-2 bg-neutral-950 border-b border-neutral-800 text-xs font-bold p-1.5 gap-1.5">
          <button
            onClick={() => switchMode('customer-login')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mode === 'customer-login'
                ? 'bg-forest-700 text-white shadow-sm font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-900'
            }`}
          >
            <i className="fa-solid fa-right-to-bracket text-[11px]"></i>
            <span>Sign In to Account</span>
          </button>

          <button
            onClick={() => switchMode('customer-signup')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mode === 'customer-signup'
                ? 'bg-forest-700 text-white shadow-sm font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-900'
            }`}
          >
            <i className="fa-solid fa-user-plus text-[11px]"></i>
            <span>Create New Account</span>
          </button>
        </div>

        {/* Modal Scrollable Form Area */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-5 flex-1 hide-scrollbar">
          
          {/* Feedback alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-center gap-2.5 animate-shake">
              <i className="fa-solid fa-circle-exclamation text-rose-400 text-sm"></i>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2.5 animate-fadeIn">
              <i className="fa-solid fa-circle-check text-emerald-400 text-sm"></i>
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: CUSTOMER LOGIN */}
          {mode === 'customer-login' && (
            <form onSubmit={handleCustomerLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <i className="fa-solid fa-envelope text-xs"></i>
                  </span>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="amaka.obi@nuelixx.ng"
                    className="w-full pl-10 pr-3 py-3 bg-neutral-900 border border-neutral-800 focus:border-forest-500 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-300 block">
                    Password
                  </label>
                  <span className="text-[11px] text-forest-400 hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <i className="fa-solid fa-lock text-xs"></i>
                  </span>
                  <input
                    type="password"
                    required
                    value={customerPassword}
                    onChange={(e) => setCustomerPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-3 py-3 bg-neutral-900 border border-neutral-800 focus:border-forest-500 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Fast 1-Click Demo Credentials */}
              <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-forest-400 animate-pulse"></span>
                  <span className="text-slate-400 text-[11px]">Demo Shopper:</span>
                </div>
                <button
                  type="button"
                  onClick={autofillDemoCustomer}
                  className="px-2.5 py-1 bg-forest-900/60 hover:bg-forest-800 text-forest-300 border border-forest-700/60 rounded-lg text-[10px] font-bold transition-colors"
                >
                  Autofill Amaka Obi
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-forest-700 hover:bg-forest-600 disabled:opacity-50 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-forest-950/40 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-circle-notch animate-spin text-sm"></i>
                    <span>Verifying Customer Account...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-arrow-right-to-bracket text-xs"></i>
                    <span>Sign In to Supermarket</span>
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-400 pt-2">
                New to Nuelixx Supermarket?{' '}
                <button 
                  type="button" 
                  onClick={() => switchMode('customer-signup')}
                  className="text-forest-400 font-bold hover:underline"
                >
                  Create an account
                </button>
              </p>
            </form>
          )}

          {/* TAB 2: CUSTOMER SIGN UP */}
          {mode === 'customer-signup' && (
            <form onSubmit={handleCustomerSignupSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={signupForm.name}
                    onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                    placeholder="e.g. Chioma Nwosu"
                    className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-700/80 focus:border-forest-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    Phone Number (Delivery Contact) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={signupForm.phone}
                    onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                    placeholder="+234 803 000 0000"
                    className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-700/80 focus:border-forest-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    placeholder="chioma@example.com"
                    className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-700/80 focus:border-forest-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-700/80 focus:border-forest-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Delivery Hub Area */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Nearest Fulfillment Center / Delivery Region
                </label>
                <select
                  value={signupForm.area}
                  onChange={(e) => setSignupForm({ ...signupForm, area: e.target.value })}
                  className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-700/80 focus:border-forest-500 rounded-xl text-xs text-white focus:outline-none"
                >
                  {DELIVERY_HUBS.map(b => (
                    <option key={b.id} value={b.name}>{b.name} (~{b.deliveryMin} mins)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    Street Address (Optional)
                  </label>
                  <input
                    type="text"
                    value={signupForm.street}
                    onChange={(e) => setSignupForm({ ...signupForm, street: e.target.value })}
                    placeholder="14 Victoria Island Boulevard"
                    className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-700/80 focus:border-forest-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    Prominent Landmark
                  </label>
                  <input
                    type="text"
                    value={signupForm.landmark}
                    onChange={(e) => setSignupForm({ ...signupForm, landmark: e.target.value })}
                    placeholder="Near Mega Plaza"
                    className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-700/80 focus:border-forest-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-forest-700 hover:bg-forest-600 disabled:opacity-50 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-forest-950/40 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-circle-notch animate-spin text-sm"></i>
                    <span>Registering Customer Account...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-user-check text-xs"></i>
                    <span>Create Customer Account (+200 Welcome Points)</span>
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-400 pt-2">
                Already registered?{' '}
                <button 
                  type="button" 
                  onClick={() => switchMode('customer-login')}
                  className="text-forest-400 font-bold hover:underline"
                >
                  Sign in instead
                </button>
              </p>
            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-black border-t border-neutral-800 text-xs flex justify-between items-center text-slate-400">
          <span className="text-[11px]">
            Nuelixx Customer Security & Express Delivery
          </span>
          {currentUser && (
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="text-rose-400 hover:text-rose-300 text-xs font-bold hover:underline flex items-center gap-1"
            >
              <i className="fa-solid fa-arrow-right-from-bracket text-[10px]"></i>
              <span>Sign Out</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default AuthModal;
