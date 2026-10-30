export type Currency = 'NGN'; // Strictly Nigerian Naira only

export interface Nutrients {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
}

export interface Review {
  id: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  comment: string;
  verifiedPurchase: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number; // Base price in NGN
  originalPrice?: number; // Strikethrough price if discounted
  category: string;
  subcategory?: string;
  unit: string;
  image: string;
  additionalImages?: string[];
  description: string;
  brand: string;
  rating: number;
  reviewCount: number;
  stock: number;
  isOrganic?: boolean;
  isLocalFarm?: boolean;
  isHalal?: boolean;
  dietaryTags?: string[];
  nutrients?: Nutrients;
  storageInstructions?: string;
  reviews?: Review[];
}

export interface CartItem extends Product {
  quantity: number;
  selectedUnit?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  image?: string;
}

export interface Address {
  id: string;
  title: string;
  fullName: string;
  street: string;
  landmark: string;
  area: string;
  state?: string;
  phone: string;
  isDefault?: boolean;
}

export type OrderStatus = 'Order Confirmed' | 'Picking Items' | 'Out for Delivery' | 'Delivered' | 'Pending' | 'Confirmed' | 'Packing' | 'Cancelled';

export type OrderFilterStatus = 'all' | 'in-progress' | 'completed' | 'cancelled';

export interface SmsNotification {
  id: string;
  orderId: string;
  recipientPhone: string;
  recipientName: string;
  status: OrderStatus;
  message: string;
  timestamp: string;
  carrier: string;
}

export interface OrderTrackingInfo {
  currentStage: 'Order Confirmed' | 'Picking Items' | 'Out for Delivery' | 'Delivered';
  stageTimestamps?: {
    confirmedAt?: string;
    pickingAt?: string;
    dispatchedAt?: string;
    deliveredAt?: string;
  };
  riderName?: string;
  riderPhone?: string;
  riderVehicle?: string;
  riderRating?: number;
  estimatedMinutes?: number;
  progressPercent?: number; // 0 - 100 for mini-map path
  currentRoad?: string;
  distanceKm?: number;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountCode?: string;
  deliveryFee: number;
  tax: number;
  total: number;
  currency: Currency;
  status: OrderStatus;
  deliverySlot: string;
  deliveryAddress: {
    fullName: string;
    street: string;
    landmark: string;
    area: string;
    state?: string;
    phone: string;
  };
  paymentMethod: 'card' | 'transfer' | 'cod';
  estimatedArrival?: string;
  trackingInfo?: OrderTrackingInfo;
}

export interface UserProfile {
  id: string;
  role: 'customer';
  name: string;
  email: string;
  phone: string;
  addresses: Address[];
  palmPoints: number;
  savedItemIds: string[];
}

export interface AdminProfile {
  id: string;
  role: 'admin';
  name: string;
  email: string;
  phone: string;
  title: string;
  assignedBranch: string;
  permissions: string[];
}

export type ActiveAccountRole = 'user' | 'admin';

export type View = 'home' | 'catalog' | 'checkout' | 'account' | 'admin';

export interface FilterState {
  category: string | null;
  searchQuery: string;
  minPrice: number;
  maxPrice: number;
  selectedBrands: string[];
  selectedDietary: string[];
  inStockOnly: boolean;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'popular';
}
