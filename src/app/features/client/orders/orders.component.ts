import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { OrderService } from '@shared/services/order.service';
import { Order, OrderStatus, Pagination } from '@shared/models/order.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    AriaryPipe,
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatPaginatorModule,
    LoadingComponent,
    AriaryPipe
  ],
  template: `
    <div class="orders-container container">
      <h1>Mes commandes</h1>

      <mat-tab-group (selectedTabChange)="onTabChange($event.index)">
        <mat-tab label="Toutes"></mat-tab>
        <mat-tab label="En cours"></mat-tab>
        <mat-tab label="Terminées"></mat-tab>
        <mat-tab label="Annulées"></mat-tab>
      </mat-tab-group>

      @if (isLoading()) {
        <app-loading message="Chargement des commandes..."></app-loading>
      }

      @if (!isLoading()) {
        @if (orders().length === 0) {
          <div class="empty-orders">
            <mat-icon>receipt_long</mat-icon>
            <h2>Aucune commande</h2>
            <p>Vous n'avez pas encore passé de commande.</p>
            <a routerLink="/catalog" mat-raised-button color="primary">
              Explorer le catalogue
            </a>
          </div>
        } @else {
          <div class="orders-list">
            @for (order of orders(); track order._id) {
              <mat-card class="order-card" [routerLink]="['/orders', order._id]">
                <div class="order-header">
                  <div class="order-info">
                    <span class="order-number">Commande #{{ order.orderNumber }}</span>
                    <span class="order-date">{{ order.createdAt | date:'dd/MM/yyyy à HH:mm' }}</span>
                  </div>
                  <mat-chip [class]="'status-' + order.status">
                    {{ getStatusLabel(order.status) }}
                  </mat-chip>
                </div>

                <div class="order-items">
                  @for (item of order.items.slice(0, 3); track item._id) {
                    <div class="order-item">
                      <img [src]="item.image || '/assets/placeholder.png'" [alt]="item.name">
                      <div class="item-info">
                        <span class="item-name">{{ item.name }}</span>
                        <span class="item-qty">Qté: {{ item.quantity }}</span>
                      </div>
                    </div>
                  }
                  @if (order.items.length > 3) {
                    <div class="more-items">
                      +{{ order.items.length - 3 }} autres articles
                    </div>
                  }
                </div>

                <div class="order-footer">
                  <div class="delivery-info">
                    <mat-icon>{{ order.deliveryMethod === 'delivery' ? 'local_shipping' : 'store' }}</mat-icon>
                    <span>{{ order.deliveryMethod === 'delivery' ? 'Livraison' : 'Retrait en boutique' }}</span>
                  </div>
                  <div class="order-total">
                    <span>Total:</span>
                    <strong>{{ order.total | ariary }}</strong>
                  </div>
                </div>

                @if (canCancel(order)) {
                  <div class="order-actions">
                    <button mat-stroked-button color="warn" (click)="cancelOrder($event, order)">
                      Annuler la commande
                    </button>
                  </div>
                }

                @if (canRate(order)) {
                  <div class="order-actions">
                    <button mat-stroked-button color="primary" (click)="rateOrder($event, order)">
                      <mat-icon>star</mat-icon>
                      Laisser un avis
                    </button>
                  </div>
                }
              </mat-card>
            }
          </div>

          @if (pagination() && pagination()!.totalPages > 1) {
            <mat-paginator
              [length]="pagination()!.total"
              [pageSize]="pagination()!.limit"
              [pageIndex]="pagination()!.page - 1"
              [pageSizeOptions]="[10, 20, 50]"
              (page)="onPageChange($event)"
              showFirstLastButtons>
            </mat-paginator>
          }
        }
      }
    </div>
  `,
  styles: [`
    .orders-container {
      padding: 24px 16px;
      min-height: calc(100vh - 64px - 200px);
    }

    h1 {
      font-size: 2rem;
      margin-bottom: 24px;
    }

    mat-tab-group {
      margin-bottom: 24px;
    }

    .empty-orders {
      text-align: center;
      padding: 80px 24px;
      background: var(--bg-primary);
      border-radius: 8px;

      mat-icon {
        font-size: 80px;
        width: 80px;
        height: 80px;
        color: var(--gray-300);
      }

      h2 {
        margin: 16px 0 8px;
      }

      p {
        color: var(--text-secondary);
        margin-bottom: 24px;
      }
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .order-card {
      cursor: pointer;
      transition: box-shadow 0.2s;
      padding: 16px;

      &:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .order-info {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .order-number {
        font-weight: 600;
        font-size: 1.1rem;
      }

      .order-date {
        color: var(--text-secondary);
        font-size: 0.9rem;
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

      &.status-cancelled,
      &.status-refunded {
        background: var(--error-light) !important;
        color: var(--error) !important;
      }
    }

    .order-items {
      display: flex;
      gap: 12px;
      padding: 16px 0;
      border-top: 1px solid var(--border-color);
      border-bottom: 1px solid var(--border-color);
      overflow-x: auto;
    }

    .order-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      min-width: 80px;

      img {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 8px;
      }

      .item-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;

        .item-name {
          font-size: 0.8rem;
          max-width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .item-qty {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
      }
    }

    .more-items {
      display: flex;
      align-items: center;
      padding: 0 16px;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .order-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
    }

    .delivery-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-secondary);

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .order-total {
      display: flex;
      align-items: center;
      gap: 8px;

      span {
        color: var(--text-secondary);
      }

      strong {
        font-size: 1.1rem;
        color: var(--primary);
      }
    }

    .order-actions {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
    }

    mat-paginator {
      margin-top: 24px;
      background: var(--bg-primary);
      border-radius: 4px;
    }

    @media (max-width: 768px) {
      h1 {
        font-size: 1.5rem;
      }

      .order-header {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
      }

      .order-footer {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
      }

      .order-actions {
        width: 100%;

        button {
          width: 100%;
        }
      }
    }

    @media (max-width: 480px) {
      .orders-container {
        padding: 16px 12px;
      }

      h1 {
        font-size: 1.25rem;
        margin-bottom: 16px;
      }

      .empty-orders {
        padding: 48px 16px;

        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
        }

        h2 {
          font-size: 1.25rem;
        }
      }

      .order-card {
        padding: 12px;
      }

      .order-info {
        .order-number {
          font-size: 1rem;
        }

        .order-date {
          font-size: 0.8rem;
        }
      }

      .order-item {
        min-width: 60px;

        img {
          width: 50px;
          height: 50px;
        }

        .item-info {
          .item-name {
            font-size: 0.75rem;
            max-width: 60px;
          }

          .item-qty {
            font-size: 0.7rem;
          }
        }
      }

      .delivery-info {
        font-size: 0.85rem;
      }

      .order-total {
        span {
          font-size: 0.85rem;
        }

        strong {
          font-size: 1rem;
        }
      }
    }
  `]
})
export class OrdersComponent implements OnInit {
  orders = signal<Order[]>([]);
  pagination = signal<Pagination | null>(null);
  isLoading = signal(true);
  currentTab = 0;

  private statusFilters: (string | undefined)[] = [
    undefined, // All
    'pending,confirmed,preparing,ready,shipped', // In progress
    'delivered', // Completed
    'cancelled,refunded' // Cancelled
  ];

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(page = 1): void {
    this.isLoading.set(true);

    const statusFilter = this.statusFilters[this.currentTab];

    this.orderService.getOrders({ status: statusFilter, page, limit: 10 }).subscribe({
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

  onTabChange(index: number): void {
    this.currentTab = index;
    this.loadOrders();
  }

  onPageChange(event: PageEvent): void {
    this.loadOrders(event.pageIndex + 1);
  }

  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      preparing: 'En préparation',
      ready: 'Prête',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
      refunded: 'Remboursée'
    };
    return labels[status] || status;
  }

  canCancel(order: Order): boolean {
    return ['pending', 'confirmed'].includes(order.status);
  }

  canRate(order: Order): boolean {
    return order.status === 'delivered' && !order.rating;
  }

  cancelOrder(event: Event, order: Order): void {
    event.stopPropagation();
    event.preventDefault();

    if (confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      this.orderService.cancelOrder(order._id).subscribe({
        next: () => {
          this.loadOrders();
        }
      });
    }
  }

  rateOrder(event: Event, order: Order): void {
    event.stopPropagation();
    event.preventDefault();
    // Navigate to rating dialog/page
  }
}
