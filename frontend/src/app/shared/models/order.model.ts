export interface Order {
  _id: string;
  orderNumber: string;
  userId: string | User;
  items: OrderItem[];
  status: OrderStatus;
  statusHistory?: StatusHistory[];
  deliveryMethod: 'pickup' | 'delivery';
  deliveryAddress?: Address;
  pickupInfo?: {
    shopId: string;
    scheduledTime?: string;
  };
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  total: number;
  promotionCode?: string;
  payment: PaymentInfo;
  notes?: {
    customer?: string;
    internal?: string;
  };
  rating?: {
    score: number;
    comment?: string;
    ratedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  _id: string;
  productId: string | Product;
  shopId: string | Shop;
  name: string;
  image?: string;
  variation?: {
    variationId?: string;
    optionId?: string;
    variationName?: string;
    optionValue?: string;
  };
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface StatusHistory {
  status: OrderStatus;
  changedBy?: string;
  note?: string;
  timestamp: string;
}

export interface PaymentInfo {
  method: 'card' | 'cash' | 'paypal';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  paidAt?: string;
  cardLast4?: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface Product {
  _id: string;
  name: string;
  images?: string[];
}

export interface Shop {
  _id: string;
  name: string;
  logo?: string;
}

export interface Address {
  label?: string;
  street: string;
  city: string;
  zipCode: string;
  country?: string;
  phone?: string;
  instructions?: string;
}

export interface Cart {
  _id: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount?: number;
  deliveryFee?: number;
  total?: number;
  promotionCode?: string;
}

export interface CartItem {
  _id: string;
  productId: string;
  product?: Product;
  shopId: string | Shop;
  variation?: Record<string, string>;
  quantity: number;
  unitPrice: number;
  total?: number;
}

export interface Promotion {
  _id: string;
  shopId: string;
  code: string;
  name?: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
