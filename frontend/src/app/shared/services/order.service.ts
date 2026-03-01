import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Order, Pagination } from '@shared/models/order.model';

export interface CheckoutData {
  deliveryMethod: 'pickup' | 'delivery';
  deliveryAddress?: {
    street: string;
    city: string;
    zipCode: string;
    country?: string;
    phone?: string;
    instructions?: string;
  };
  pickupShopId?: string;
  paymentMethod: 'card' | 'cash' | 'paypal';
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}/client`;

  constructor(private http: HttpClient) {}

  // Checkout
  checkout(data: CheckoutData): Observable<{
    success: boolean;
    message: string;
    data: {
      order: {
        _id: string;
        orderNumber: string;
        total: number;
        status: string;
        paymentStatus: string;
      }
    }
  }> {
    return this.http.post<any>(`${this.apiUrl}/checkout`, data);
  }

  // Get orders
  getOrders(filters: { status?: string; page?: number; limit?: number } = {}): Observable<{
    success: boolean;
    data: {
      orders: Order[];
      pagination: Pagination;
    }
  }> {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<any>(`${this.apiUrl}/orders`, { params });
  }

  // Get single order
  getOrder(id: string): Observable<{ success: boolean; data: { order: Order } }> {
    return this.http.get<any>(`${this.apiUrl}/orders/${id}`);
  }

  // Cancel order
  cancelOrder(id: string, reason?: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/orders/${id}/cancel`, { reason });
  }

  // Rate order
  rateOrder(id: string, score: number, comment?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/orders/${id}/rate`, { score, comment });
  }

  // Get invoice HTML
  getInvoice(id: string): Observable<string> {
    return this.http.get(`${environment.apiUrl}/orders/${id}/invoice`, { responseType: 'text' });
  }

  // Generate invoice
  generateInvoice(id: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/orders/${id}/invoice/generate`, {});
  }
}
