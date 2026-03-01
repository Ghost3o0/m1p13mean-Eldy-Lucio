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
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],})
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


