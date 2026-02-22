import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';

export interface PosProduct {
  productId: string;
  variationId: string | null;
  optionId: string | null;
  name: string;
  variantName: string | null;
  image: string | null;
  price: number;
  stock: number;
  sku: string | null;
  barcode: string | null;
}

export interface PosCartItem extends PosProduct {
  quantity: number;
}

export interface PosOrder {
  _id: string;
  orderNumber: string;
  items: any[];
  subtotal: number;
  total: number;
  payment: {
    method: string;
    status: string;
    paidAt: string;
  };
  posData: {
    cashierName: string;
    customerName: string;
    customerPhone: string | null;
    cashReceived: number | null;
    changeGiven: number;
  };
  createdAt: string;
}

export interface PosSummary {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  totalItems: number;
  paymentBreakdown: {
    cash: number;
    card: number;
  };
  averageOrderValue: number;
}

@Injectable({
  providedIn: 'root'
})
export class PosService {
  private apiUrl = `${environment.apiUrl}/shop/pos`;

  isLoading = signal(false);
  products = signal<PosProduct[]>([]);
  cart = signal<PosCartItem[]>([]);
  orders = signal<PosOrder[]>([]);
  summary = signal<PosSummary | null>(null);
  lastOrder = signal<PosOrder | null>(null);

  constructor(private http: HttpClient) {}

  searchProducts(search?: string, barcode?: string): Observable<any> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (barcode) params = params.set('barcode', barcode);

    this.isLoading.set(true);

    return this.http.get<any>(`${this.apiUrl}/products`, { params }).pipe(
      tap({
        next: (response) => {
          if (response.success) {
            this.products.set(response.data.products);
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      })
    );
  }

  addToCart(product: PosProduct): void {
    const currentCart = this.cart();
    const existingIndex = currentCart.findIndex(
      item => item.productId === product.productId &&
              item.variationId === product.variationId &&
              item.optionId === product.optionId
    );

    if (existingIndex >= 0) {
      // Increment quantity
      const updatedCart = [...currentCart];
      if (updatedCart[existingIndex].quantity < product.stock) {
        updatedCart[existingIndex].quantity++;
        this.cart.set(updatedCart);
      }
    } else {
      // Add new item
      this.cart.set([...currentCart, { ...product, quantity: 1 }]);
    }
  }

  updateCartItemQuantity(index: number, quantity: number): void {
    const currentCart = this.cart();
    if (index >= 0 && index < currentCart.length) {
      const updatedCart = [...currentCart];
      if (quantity <= 0) {
        updatedCart.splice(index, 1);
      } else if (quantity <= updatedCart[index].stock) {
        updatedCart[index].quantity = quantity;
      }
      this.cart.set(updatedCart);
    }
  }

  removeFromCart(index: number): void {
    const currentCart = this.cart();
    const updatedCart = [...currentCart];
    updatedCart.splice(index, 1);
    this.cart.set(updatedCart);
  }

  clearCart(): void {
    this.cart.set([]);
  }

  getCartTotal(): number {
    return this.cart().reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getCartItemCount(): number {
    return this.cart().reduce((count, item) => count + item.quantity, 0);
  }

  createOrder(data: {
    paymentMethod: 'cash' | 'card';
    customerName?: string;
    customerPhone?: string;
    cashReceived?: number;
    notes?: string;
  }): Observable<any> {
    const items = this.cart().map(item => ({
      productId: item.productId,
      variationId: item.variationId,
      optionId: item.optionId,
      quantity: item.quantity
    }));

    return this.http.post<any>(`${this.apiUrl}/orders`, {
      items,
      ...data
    }).pipe(
      tap((response) => {
        if (response.success) {
          this.lastOrder.set(response.data.order);
          this.clearCart();
        }
      })
    );
  }

  getOrders(options: { page?: number; limit?: number; startDate?: string; endDate?: string } = {}): Observable<any> {
    let params = new HttpParams();
    if (options.page) params = params.set('page', options.page.toString());
    if (options.limit) params = params.set('limit', options.limit.toString());
    if (options.startDate) params = params.set('startDate', options.startDate);
    if (options.endDate) params = params.set('endDate', options.endDate);

    return this.http.get<any>(`${this.apiUrl}/orders`, { params }).pipe(
      tap((response) => {
        if (response.success) {
          this.orders.set(response.data.orders);
        }
      })
    );
  }

  getOrder(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/orders/${id}`);
  }

  getDailySummary(date?: string): Observable<any> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);

    return this.http.get<any>(`${this.apiUrl}/summary`, { params }).pipe(
      tap((response) => {
        if (response.success) {
          this.summary.set(response.data.summary);
        }
      })
    );
  }

  formatPrice(price: number): string {
    return Math.round(price).toLocaleString('fr-FR') + ' Ar';
  }
}
