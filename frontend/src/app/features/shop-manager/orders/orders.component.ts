import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Order, OrderStatus } from '@shared/models/order.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';
import { ExportService, ExportColumn } from '@shared/services/export.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-shop-orders',
  standalone: true,
  imports: [
    AriaryPipe,
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatTooltipModule,
    LoadingComponent,
    AriaryPipe
  ],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],})
export class ShopOrdersComponent implements OnInit {
  orders = signal<Order[]>([]);
  pagination = signal<any>(null);
  isLoading = signal(true);

  pendingCount = signal(0);
  preparingCount = signal(0);
  readyCount = signal(0);

  displayedColumns = ['orderNumber', 'customer', 'items', 'total', 'status', 'date', 'actions'];

  // Filters
  searchQuery = '';
  selectedStatus: string | null = null;
  startDate: Date | null = null;
  endDate: Date | null = null;

  constructor(
    private http: HttpClient,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadStats();
  }

  loadStats(): void {
    this.http.get<any>(`${environment.apiUrl}/shop/orders/stats`).subscribe({
      next: (response) => {
        if (response.success) {
          this.pendingCount.set(response.data.pending || 0);
          this.preparingCount.set(response.data.preparing || 0);
          this.readyCount.set(response.data.ready || 0);
        }
      }
    });
  }

  loadOrders(page = 1): void {
    this.isLoading.set(true);

    const params: any = { page, limit: 20 };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedStatus) params.status = this.selectedStatus;
    if (this.startDate) params.startDate = this.startDate.toISOString();
    if (this.endDate) params.endDate = this.endDate.toISOString();

    this.http.get<any>(`${environment.apiUrl}/shop/orders`, { params }).subscribe({
      next: (response) => {
        if (response.success) {
          this.orders.set(response.data.orders);
          this.pagination.set(response.data.pagination);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  applyFilters(): void {
    this.loadOrders();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = null;
    this.startDate = null;
    this.endDate = null;
    this.loadOrders();
  }

  onPageChange(event: PageEvent): void {
    this.loadOrders(event.pageIndex + 1);
  }

  getCustomerName(user: any): string {
    if (typeof user === 'object' && user) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Client';
    }
    return 'Client';
  }

  getCustomerEmail(user: any): string {
    if (typeof user === 'object' && user?.email) {
      return user.email;
    }
    return '';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      preparing: 'En préparation',
      ready: 'Prête',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée'
    };
    return labels[status] || status;
  }

  updateStatus(order: Order, newStatus: string): void {
    this.http.put<any>(`${environment.apiUrl}/shop/orders/${order._id}/status`, {
      status: newStatus
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.orders.update(orders =>
            orders.map(o => o._id === order._id ? { ...o, status: newStatus as OrderStatus } : o)
          );
          this.loadStats();
        }
      }
    });
  }

  confirmPickupPayment(order: Order): void {
    this.http.put<any>(`${environment.apiUrl}/shop/orders/${order._id}/confirm-payment`, {
      paymentMethod: 'cash'
    }).subscribe({
      next: (response) => {
        if (response.success) {
          // Update the order in the list
          this.orders.update(orders =>
            orders.map(o => o._id === order._id ? {
              ...o,
              payment: { ...o.payment, status: 'completed' },
              status: response.data.order.status
            } : o)
          );
          this.loadStats();
        }
      }
    });
  }

  // ========== EXPORT METHODS ==========

  private getExportColumns(): ExportColumn[] {
    return [
      { key: 'orderNumber', header: 'N° Commande' },
      {
        key: 'userId',
        header: 'Client',
        format: (user) => this.getCustomerName(user)
      },
      {
        key: 'items',
        header: 'Articles',
        format: (items) => items?.length || 0
      },
      {
        key: 'total',
        header: 'Total (Ar)',
        format: (val) => this.exportService.formatPrice(val)
      },
      {
        key: 'status',
        header: 'Statut',
        format: (val) => this.getStatusLabel(val)
      },
      {
        key: 'deliveryMethod',
        header: 'Livraison',
        format: (val) => val === 'pickup' ? 'Retrait' : 'Livraison'
      },
      {
        key: 'createdAt',
        header: 'Date',
        format: (val) => this.exportService.formatDateTime(val)
      }
    ];
  }

  exportToExcel(): void {
    const columns = this.getExportColumns();
    const filename = `commandes_${new Date().toISOString().split('T')[0]}`;
    this.exportService.exportToExcel(this.orders(), columns, filename);
  }

  exportToPDF(): void {
    const columns = this.getExportColumns();
    const tableHTML = this.exportService.generateTableHTML(this.orders(), columns);

    const statsHTML = this.exportService.generateStatsHTML([
      { label: 'En attente', value: this.pendingCount() },
      { label: 'En préparation', value: this.preparingCount() },
      { label: 'Prêtes', value: this.readyCount() },
      { label: 'Total commandes', value: this.orders().length }
    ]);

    const content = statsHTML + tableHTML;
    this.exportService.exportToPDF('Rapport des Commandes', content, 'commandes');
  }
}


