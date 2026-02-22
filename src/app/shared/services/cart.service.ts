import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { Cart, CartItem } from '@shared/models/order.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly apiUrl = `${environment.apiUrl}/client/cart`;

  private cartSignal = signal<Cart | null>(null);
  private isLoadingSignal = signal<boolean>(false);

  cart = computed(() => this.cartSignal());
  isLoading = computed(() => this.isLoadingSignal());
  itemCount = computed(() => this.cartSignal()?.itemCount ?? 0);
  subtotal = computed(() => this.cartSignal()?.subtotal ?? 0);

  constructor(private http: HttpClient) {}

  // Load cart from server
  loadCart(): Observable<{ success: boolean; data: { cart: Cart } }> {
    this.isLoadingSignal.set(true);

    return this.http.get<any>(this.apiUrl).pipe(
      tap({
        next: (response) => {
          if (response.success) {
            this.cartSignal.set(response.data.cart);
          }
          this.isLoadingSignal.set(false);
        },
        error: () => {
          this.isLoadingSignal.set(false);
        }
      })
    );
  }

  // Add item to cart
  addToCart(productId: string, quantity = 1, variation?: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, {
      productId,
      quantity,
      variation
    }).pipe(
      tap(response => {
        if (response.success) {
          this.loadCart().subscribe();
        }
      })
    );
  }

  // Update cart item quantity
  updateItem(itemId: string, quantity: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${itemId}`, { quantity }).pipe(
      tap(response => {
        if (response.success) {
          this.loadCart().subscribe();
        }
      })
    );
  }

  // Remove item from cart
  removeItem(itemId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${itemId}`).pipe(
      tap(response => {
        if (response.success) {
          this.loadCart().subscribe();
        }
      })
    );
  }

  // Clear cart
  clearCart(): Observable<any> {
    return this.http.delete<any>(this.apiUrl).pipe(
      tap(response => {
        if (response.success) {
          this.cartSignal.set(null);
        }
      })
    );
  }

  // Apply promo code
  applyPromoCode(code: string, shopId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/promo`, { code, shopId }).pipe(
      tap(response => {
        if (response.success) {
          this.loadCart().subscribe();
        }
      })
    );
  }

  // Reset cart state (used after logout)
  resetCart(): void {
    this.cartSignal.set(null);
  }
}
