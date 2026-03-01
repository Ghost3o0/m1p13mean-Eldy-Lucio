export interface Product {
  _id: string;
  shopId: string | Shop;
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  images: string[];
  categories: (string | Category)[];
  basePrice: number;
  compareAtPrice?: number;
  variations?: Variation[];
  stock: number;
  sku?: string;
  isActive: boolean;
  isFeatured: boolean;
  tags?: string[];
  rating?: {
    average: number;
    count: number;
  };
  salesCount?: number;
  viewCount?: number;
  createdAt: string;
}

export interface Variation {
  _id: string;
  name: string;
  options: VariationOption[];
}

export interface VariationOption {
  _id: string;
  value: string;
  priceModifier: number;
  stock: number;
  sku?: string;
  image?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  children?: Category[];
  isActive: boolean;
  isFeatured?: boolean;
}

export interface Shop {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  logo?: string;
  banner?: string;
  ownerId?: string;
  category?: string | Category;
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  address?: {
    location?: string;
    floor?: string;
  };
  hours?: ShopHours[];
  commission?: number;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  rating?: {
    average: number;
    count: number;
  };
  stats?: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
  };
  isFeatured?: boolean;
  createdAt: string;
}

export interface ShopHours {
  day: number;
  open: string;
  close: string;
  isClosed: boolean;
}

export interface ProductsResponse {
  success: boolean;
  data: {
    products: Product[];
    pagination: Pagination;
  };
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
