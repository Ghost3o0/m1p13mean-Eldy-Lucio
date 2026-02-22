import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '@env/environment';

export interface StockItem {
  productId: string;
  productName: string;
  productImage: string | null;
  sku: string;
  variationId?: string;
  variationName?: string;
  optionId?: string;
  optionValue?: string;
  stock: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  isActive: boolean;
}

export interface StockMovement {
  _id: string;
  productId: any;
  variationId?: string;
  optionId?: string;
  type: 'in' | 'out' | 'adjustment' | 'return' | 'order' | 'initial';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  note?: string;
  createdAt: string;
}

export interface StockSettings {
  lowStockThreshold: number;
  enableLowStockAlerts: boolean;
  trackMovements: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  apiUrl = `${environment.apiUrl}/shop/stock`;

  isLoading = signal(false);
  stockItems = signal<StockItem[]>([]);
  lowStockItems = signal<any[]>([]);
  movements = signal<StockMovement[]>([]);
  stockSettings = signal<StockSettings | null>(null);

  constructor(private http: HttpClient) {}

  getProductsWithStock(options: { page?: number; limit?: number; filter?: string; search?: string } = {}) {
    let params = new HttpParams();
    if (options.page) params = params.set('page', options.page.toString());
    if (options.limit) params = params.set('limit', options.limit.toString());
    if (options.filter) params = params.set('filter', options.filter);
    if (options.search) params = params.set('search', options.search);

    this.isLoading.set(true);

    return this.http.get(`${this.apiUrl}/products`, { params }).pipe(
      tap({
        next: (response: any) => {
          if (response.success) {
            this.stockItems.set(response.data.stockItems);
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      })
    );
  }

  getProductMovements(productId: string, options: { page?: number; limit?: number; variationId?: string; optionId?: string; startDate?: string; endDate?: string } = {}) {
    let params = new HttpParams();
    if (options.page) params = params.set('page', options.page.toString());
    if (options.limit) params = params.set('limit', options.limit.toString());
    if (options.variationId) params = params.set('variationId', options.variationId);
    if (options.optionId) params = params.set('optionId', options.optionId);
    if (options.startDate) params = params.set('startDate', options.startDate);
    if (options.endDate) params = params.set('endDate', options.endDate);

    return this.http.get<any>(`${this.apiUrl}/products/${productId}/movements`, { params }).pipe(
      tap((response) => {
        if (response.success) {
          this.movements.set(response.data.movements);
        }
      })
    );
  }

  makeAdjustment(productId: string, data: { newStock: number; reason: string; note?: string; variationId?: string; optionId?: string }) {
    return this.http.post<any>(`${this.apiUrl}/products/${productId}/adjustment`, data);
  }

  getLowStockProducts() {
    return this.http.get<any>(`${this.apiUrl}/low-stock`).pipe(
      tap((response) => {
        if (response.success) {
          this.lowStockItems.set(response.data.items);
        }
      })
    );
  }

  getAllMovements(options: { page?: number; limit?: number; type?: string; startDate?: string; endDate?: string } = {}) {
    let params = new HttpParams();
    if (options.page) params = params.set('page', options.page.toString());
    if (options.limit) params = params.set('limit', options.limit.toString());
    if (options.type) params = params.set('type', options.type);
    if (options.startDate) params = params.set('startDate', options.startDate);
    if (options.endDate) params = params.set('endDate', options.endDate);

    return this.http.get<any>(`${this.apiUrl}/movements`, { params });
  }

  bulkUpdateStock(updates: any[], reason: string | null = null, note: string | null = null) {
    return this.http.post<any>(`${this.apiUrl}/bulk-update`, { updates, reason, note });
  }

  getStockSettings() {
    return this.http.get<any>(`${this.apiUrl}/settings`).pipe(
      tap((response) => {
        if (response.success) {
          this.stockSettings.set(response.data.stockSettings);
        }
      })
    );
  }

  updateStockSettings(settings: Partial<StockSettings>) {
    return this.http.put<any>(`${this.apiUrl}/settings`, settings).pipe(
      tap((response) => {
        if (response.success) {
          this.stockSettings.set(response.data.stockSettings);
        }
      })
    );
  }

  exportMovementsCSV(movements: StockMovement[]) {
    const headers = ['Date', 'Produit', 'Type', 'Quantité', 'Stock avant', 'Stock après', 'Raison', 'Note'];
    const rows = movements.map(m => [
      new Date(m.createdAt).toLocaleString('fr-FR'),
      m.productId?.name || 'N/A',
      this.getMovementTypeLabel(m.type),
      m.quantity > 0 ? `+${m.quantity}` : m.quantity.toString(),
      m.previousStock.toString(),
      m.newStock.toString(),
      m.reason || '',
      m.note || ''
    ]);

    const csv = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mouvements-stock-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  getMovementTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'in': 'Entrée',
      'out': 'Sortie',
      'adjustment': 'Ajustement',
      'return': 'Retour',
      'order': 'Commande',
      'initial': 'Stock initial'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'in_stock': 'En stock',
      'low_stock': 'Stock faible',
      'out_of_stock': 'Rupture'
    };
    return labels[status] || status;
  }
}
