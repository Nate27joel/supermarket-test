import { UserProfile, AdminProfile } from '../types';

export interface UserSignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
  street?: string;
  landmark?: string;
  area?: string;
}

export interface AuthResponse<T> {
  success: boolean;
  message: string;
  token?: string;
  user?: T;
  admin?: T;
}

const TOKEN_KEY = 'palmgrove_auth_token';
const ROLE_KEY = 'palmgrove_auth_role';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string, role: 'customer' | 'admin') => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ROLE_KEY, role);
  },
  getRole: () => localStorage.getItem(ROLE_KEY) as 'customer' | 'admin' | null,
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
  }
};

export async function loginCustomer(email: string, password: string): Promise<AuthResponse<UserProfile>> {
  try {
    const res = await fetch('/api/auth/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success && data.token) {
      authStorage.setToken(data.token, 'customer');
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Network error connecting to PalmGrove Aba auth server.'
    };
  }
}

export async function signupCustomer(signupData: UserSignupData): Promise<AuthResponse<UserProfile>> {
  try {
    const res = await fetch('/api/auth/user/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupData)
    });
    const data = await res.json();
    if (data.success && data.token) {
      authStorage.setToken(data.token, 'customer');
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Network error connecting to PalmGrove Aba auth server.'
    };
  }
}

export async function loginAdminStaff(email: string, password: string, securityPin?: string): Promise<AuthResponse<AdminProfile>> {
  try {
    const res = await fetch('/api/auth/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, securityPin })
    });
    const data = await res.json();
    if (data.success && data.token) {
      authStorage.setToken(data.token, 'admin');
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Network error connecting to PalmGrove Staff terminal.'
    };
  }
}

export async function verifyActiveSession(): Promise<{ authenticated: boolean; role?: 'customer' | 'admin'; user?: UserProfile; admin?: AdminProfile }> {
  const token = authStorage.getToken();
  if (!token) return { authenticated: false };

  try {
    const res = await fetch('/api/auth/verify', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch {
    return { authenticated: false };
  }
}

export async function logoutSession(): Promise<void> {
  const token = authStorage.getToken();
  try {
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    authStorage.clear();
  }
}
