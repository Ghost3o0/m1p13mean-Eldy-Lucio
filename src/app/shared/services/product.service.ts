import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Product, Category, Shop, ProductsResponse, Pagination } from '@shared/models/product.model';

export interface ProductFilters {
  search?: string;
  category?: string;
  shop?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'popular' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  // Get products with filters
  getProducts(filters: ProductFilters = {}): Observable<ProductsResponse> {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<ProductsResponse>(this.apiUrl, { params });
  }

  // Get single product
  getProduct(id: string): Observable<{ success: boolean; data: { product: Product; relatedProducts: Product[] } }> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Get product by slug
  getProductBySlug(slug: string): Observable<{ success: boolean; data: { product: Product } }> {
    return this.http.get<any>(`${this.apiUrl}/slug/${slug}`);
  }

  // Search products
  searchProducts(query: string, page = 1, limit = 20): Observable<ProductsResponse> {
    const params = new HttpParams()
      .set('q', query)
      .set('page', String(page))
      .set('limit', String(limit));

    return this.http.get<ProductsResponse>(`${this.apiUrl}/search`, { params });
  }

  // Get featured products
  getFeaturedProducts(limit = 12): Observable<{ success: boolean; data: { products: Product[] } }> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<any>(`${this.apiUrl}/featured`, { params });
  }

  // Get popular products
  getPopularProducts(limit = 12): Observable<{ success: boolean; data: { products: Product[] } }> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<any>(`${this.apiUrl}/popular`, { params });
  }

  // Get new products
  getNewProducts(limit = 12): Observable<{ success: boolean; data: { products: Product[] } }> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<any>(`${this.apiUrl}/new`, { params });
  }

  // Get categories
  getCategories(tree = false, featured = false): Observable<{ success: boolean; data: { categories: Category[] } }> {
    let params = new HttpParams();
    if (tree) params = params.set('tree', 'true');
    if (featured) params = params.set('featured', 'true');

    return this.http.get<any>(`${this.apiUrl}/categories`, { params });
  }

  // Get category by slug
  getCategory(slug: string): Observable<{ success: boolean; data: { category: Category; path: Category[]; children: Category[] } }> {
    return this.http.get<any>(`${this.apiUrl}/categories/${slug}`);
  }

  // Get shops
  getShops(filters: { category?: string; search?: string; featured?: boolean; page?: number; limit?: number } = {}): Observable<{ success: boolean; data: { shops: Shop[]; pagination: Pagination } }> {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<any>(`${this.apiUrl}/shops`, { params });
  }

  // Get shop by ID or slug
  getShop(identifier: string, page = 1, limit = 20): Observable<{ success: boolean; data: { shop: Shop; products: Product[]; pagination: Pagination } }> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));

    return this.http.get<any>(`${this.apiUrl}/shops/${identifier}`, { params });
  }
}
