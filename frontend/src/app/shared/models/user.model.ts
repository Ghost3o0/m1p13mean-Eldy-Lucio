export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'shop' | 'client';
  phone?: string;
  avatar?: string;
  addresses?: Address[];
  favorites?: string[];
  shopId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  _id?: string;
  label: string;
  street: string;
  city: string;
  zipCode: string;
  country?: string;
  isDefault: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    shop?: Shop;
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

export interface Shop {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  logo?: string;
  banner?: string;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  rating?: {
    average: number;
    count: number;
  };
}
