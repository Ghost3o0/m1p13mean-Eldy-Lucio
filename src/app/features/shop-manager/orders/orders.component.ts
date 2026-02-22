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
  template: `
    <div class="orders-container">
      <div class="orders-header">
        <div class="header-left">
          <h1>Commandes</h1>
          <div class="export-buttons">
            <button mat-stroked-button (click)="exportToExcel()" matTooltip="Exporter en Excel">
              <mat-icon>table_chart</mat-icon>
              Excel
            </button>
            <button mat-stroked-button (click)="exportToPDF()" matTooltip="Exporter en PDF">
              <mat-icon>picture_as_pdf</mat-icon>
              PDF
            </button>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat">
            <span class="stat-value">{{ pendingCount() }}</span>
            <span class="stat-label">En attente</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ preparingCount() }}</span>
            <span class="stat-label">En préparation</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ readyCount() }}</span>
            <span class="stat-label">Prêtes</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Rechercher</mat-label>
              <input matInput [(ngModel)]="searchQuery" (keyup.enter)="applyFilters()" placeholder="N° commande, client...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Statut</mat-label>
              <mat-select [(ngModel)]="selectedStatus" (selectionChange)="applyFilters()">
                <mat-option [value]="null">Tous</mat-option>
                <mat-option value="pending">En attente</mat-option>
                <mat-option value="confirmed">Confirmées</mat-option>
                <mat-option value="preparing">En préparation</mat-option>
                <mat-option value="ready">Prêtes</mat-option>
                <mat-option value="shipped">Expédiées</mat-option>
                <mat-option value="delivered">Livrées</mat-option>
                <mat-option value="cancelled">Annulées</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Date de début</mat-label>
              <input matInput [matDatepicker]="startPicker" [(ngModel)]="startDate" (dateChange)="applyFilters()">
              <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Date de fin</mat-label>
              <input matInput [matDatepicker]="endPicker" [(ngModel)]="endDate" (dateChange)="applyFilters()">
              <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>

            <button mat-icon-button (click)="clearFilters()">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      @if (isLoading()) {
        <app-loading message="Chargement des commandes..."></app-loading>
      }

      @if (!isLoading()) {
        <mat-card class="table-card">
          <table mat-table [dataSource]="orders()">
            <!-- Order Number -->
            <ng-container matColumnDef="orderNumber">
              <th mat-header-cell *matHeaderCellDef>N° Commande</th>
              <td mat-cell *matCellDef="let order">
                <a [routerLink]="['/shop-manager/orders', order._id]" class="order-link">
                  {{ order.orderNumber }}
                </a>
              </td>
            </ng-container>

            <!-- Customer -->
            <ng-container matColumnDef="customer">
              <th mat-header-cell *matHeaderCellDef>Client</th>
              <td mat-cell *matCellDef="let order">
                <div class="customer-info">
                  <span class="customer-name">{{ getCustomerName(order.userId) }}</span>
                  <span class="customer-email">{{ getCustomerEmail(order.userId) }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Items -->
            <ng-container matColumnDef="items">
              <th mat-header-cell *matHeaderCellDef>Articles</th>
              <td mat-cell *matCellDef="let order">
                {{ order.items.length }} article(s)
              </td>
            </ng-container>

            <!-- Total -->
            <ng-container matColumnDef="total">
              <th mat-header-cell *matHeaderCellDef>Total</th>
              <td mat-cell *matCellDef="let order">
                <strong>{{ order.total | ariary }}</strong>
              </td>
            </ng-container>

            <!-- Status -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let order">
                <div class="status-cell">
                  <mat-chip [class]="'status-' + order.status">
                    {{ getStatusLabel(order.status) }}
                  </mat-chip>
                  @if (order.deliveryMethod === 'pickup' && order.payment?.status === 'pending') {
                    <mat-chip class="payment-pending">
                      <mat-icon>schedule</mat-icon>
                      Paiement en attente
                    </mat-chip>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Date -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let order">
                {{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}
              </td>
            </ng-container>

            <!-- Actions -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let order">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <a mat-menu-item [routerLink]="['/shop-manager/orders', order._id]">
                    <mat-icon>visibility</mat-icon>
                    <span>Voir les détails</span>
                  </a>
                  @if (order.status === 'pending') {
                    <button mat-menu-item (click)="updateStatus(order, 'confirmed')">
                      <mat-icon>check</mat-icon>
                      <span>Confirmer</span>
                    </button>
                  }
                  @if (order.status === 'confirmed') {
                    <button mat-menu-item (click)="updateStatus(order, 'preparing')">
                      <mat-icon>inventory_2</mat-icon>
                      <span>Mettre en préparation</span>
                    </button>
                  }
                  @if (order.status === 'preparing') {
                    <button mat-menu-item (click)="updateStatus(order, order.deliveryMethod === 'pickup' ? 'ready' : 'shipped')">
                      <mat-icon>{{ order.deliveryMethod === 'pickup' ? 'store' : 'local_shipping' }}</mat-icon>
                      <span>{{ order.deliveryMethod === 'pickup' ? 'Marquer prête' : 'Expédier' }}</span>
                    </button>
                  }
                  @if (order.deliveryMethod === 'pickup' && order.payment?.status === 'pending') {
                    <button mat-menu-item (click)="confirmPickupPayment(order)" class="confirm-payment-action">
                      <mat-icon>payments</mat-icon>
                      <span>Confirmer le paiement</span>
                    </button>
                  }
                  @if (['pending', 'confirmed'].includes(order.status)) {
                    <mat-divider></mat-divider>
                    <button mat-menu-item (click)="updateStatus(order, 'cancelled')" class="cancel-action">
                      <mat-icon color="warn">cancel</mat-icon>
                      <span>Annuler</span>
                    </button>
                  }
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="order-row"></tr>
          </table>

          @if (orders().length === 0) {
            <div class="empty-state">
              <mat-icon>receipt_long</mat-icon>
              <h3>Aucune commande</h3>
              <p>Vous n'avez pas encore de commandes correspondant à ces critères.</p>
            </div>
          }

          <mat-paginator
            [length]="pagination()?.total || 0"
            [pageSize]="pagination()?.limit || 20"
            [pageIndex]="(pagination()?.page || 1) - 1"
            [pageSizeOptions]="[10, 20, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .orders-container {
      padding: 24px;
    }

    .orders-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;

      .header-left {
        display: flex;
        align-items: center;
        gap: 24px;
      }

      h1 {
        font-size: 2rem;
        margin: 0;
      }

      .export-buttons {
        display: flex;
        gap: 8px;

        button {
          mat-icon {
            margin-right: 4px;
          }
        }
      }

      .header-stats {
        display: flex;
        gap: 32px;

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;

          .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--primary);
          }

          .stat-label {
            font-size: 0.85rem;
            color: var(--text-secondary);
          }
        }
      }
    }

    .filters-card {
      margin-bottom: 24px;
    }

    .filters-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      flex-wrap: wrap;

      .search-field {
        flex: 1;
        min-width: 250px;
      }
    }

    .table-card {
      overflow: hidden;
    }

    table {
      width: 100%;
    }

    .order-link {
      font-weight: 500;
      color: var(--primary);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .customer-info {
      display: flex;
      flex-direction: column;

      .customer-name {
        font-weight: 500;
      }

      .customer-email {
        font-size: 0.85rem;
        color: var(--text-secondary);
      }
    }

    mat-chip {
      &.status-pending {
        background: var(--warning-light) !important;
        color: var(--warning) !important;
      }
      &.status-confirmed {
        background: var(--primary-50) !important;
        color: var(--primary) !important;
      }
      &.status-preparing {
        background: var(--error-light) !important;
        color: var(--error) !important;
      }
      &.status-ready {
        background: var(--success-light) !important;
        color: var(--success) !important;
      }
      &.status-shipped {
        background: var(--success-light) !important;
        color: var(--success) !important;
      }
      &.status-delivered {
        background: var(--success-light) !important;
        color: var(--success) !important;
      }
      &.status-cancelled {
        background: var(--error-light) !important;
        color: var(--error) !important;
      }
    }

    .order-row {
      cursor: pointer;

      &:hover {
        background: var(--bg-secondary);
      }
    }

    .cancel-action {
      color: var(--error);
    }

    .confirm-payment-action {
      color: var(--success);
    }

    .status-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .payment-pending {
      background: var(--warning-light) !important;
      color: var(--warning) !important;
      font-size: 0.75rem !important;
      height: 24px !important;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
        margin-right: 4px;
      }
    }

    .empty-state {
      text-align: center;
      padding: 64px 24px;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: var(--gray-300);
      }

      h3 {
        margin: 16px 0 8px;
      }

      p {
        color: var(--text-secondary);
      }
    }

    mat-paginator {
      border-top: 1px solid var(--border-color);
    }

    @media (max-width: 768px) {
      .orders-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;

        h1 {
          font-size: 1.5rem;
        }

        .header-stats {
          width: 100%;
          justify-content: space-between;

          .stat .stat-value {
            font-size: 1.25rem;
          }
        }
      }

      .filters-row {
        flex-direction: column;

        .search-field,
        mat-form-field {
          width: 100%;
          min-width: auto;
        }
      }

      .table-card {
        overflow-x: auto;
      }
    }

    @media (max-width: 480px) {
      .orders-container {
        padding: 16px 12px;
      }

      .orders-header {
        h1 {
          font-size: 1.25rem;
        }

        .header-stats {
          gap: 16px;

          .stat {
            .stat-value {
              font-size: 1.1rem;
            }

            .stat-label {
              font-size: 0.75rem;
            }
          }
        }
      }

      .filters-card mat-card-content {
        padding: 12px;
      }

      .customer-info {
        .customer-name {
          font-size: 0.9rem;
        }

        .customer-email {
          font-size: 0.8rem;
        }
      }

      .empty-state {
        padding: 40px 16px;

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
        }

        h3 {
          font-size: 1.1rem;
        }
      }
    }
  `]
})
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
