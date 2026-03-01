import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Order, OrderStatus } from '@shared/models/order.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';

@Component({
  selector: 'app-shop-order-detail',
  standalone: true,
  imports: [
    AriaryPipe,
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    LoadingComponent,
    AriaryPipe
  ],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],})
export class ShopOrderDetailComponent implements OnInit {
  order = signal<Order | null>(null);
  isLoading = signal(true);
  isUpdating = signal(false);
  isSavingNote = signal(false);
  isConfirmingPayment = signal(false);
  internalNote = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadOrder(params['id']);
      }
    });
  }

  loadOrder(id: string): void {
    this.isLoading.set(true);

    this.http.get<any>(`${environment.apiUrl}/shop/orders/${id}`).subscribe({
      next: (response) => {
        if (response.success) {
          this.order.set(response.data.order);
          this.internalNote = response.data.order.notes?.internal || '';
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  getCustomerName(): string {
    const user = this.order()?.userId;
    if (typeof user === 'object' && user) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Client';
    }
    return 'Client';
  }

  getCustomerEmail(): string {
    const user = this.order()?.userId;
    if (typeof user === 'object' && user) {
      return user.email || '';
    }
    return '';
  }

  getCustomerPhone(): string {
    const user = this.order()?.userId;
    if (typeof user === 'object' && user) {
      return (user as any).phone || '';
    }
    return '';
  }

  getStatusLabel(status: OrderStatus): string {
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

  getPaymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      completed: 'Payé',
      failed: 'Échoué',
      refunded: 'Remboursé'
    };
    return labels[status] || status;
  }

  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      card: 'Carte bancaire',
      paypal: 'PayPal',
      cash: 'Espèces'
    };
    return labels[method] || method;
  }

  updateStatus(newStatus: OrderStatus): void {
    const order = this.order();
    if (!order) return;

    this.isUpdating.set(true);

    this.http.put<any>(`${environment.apiUrl}/shop/orders/${order._id}/status`, {
      status: newStatus
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.order.update(o => o ? { ...o, status: newStatus } : null);
        }
        this.isUpdating.set(false);
      },
      error: () => {
        this.isUpdating.set(false);
      }
    });
  }

  saveNote(): void {
    const order = this.order();
    if (!order || !this.internalNote) return;

    this.isSavingNote.set(true);

    this.http.put<any>(`${environment.apiUrl}/shop/orders/${order._id}/note`, {
      note: this.internalNote
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.order.update(o => o ? {
            ...o,
            notes: { ...o.notes, internal: this.internalNote }
          } : null);
        }
        this.isSavingNote.set(false);
      },
      error: () => {
        this.isSavingNote.set(false);
      }
    });
  }

  confirmPickupPayment(): void {
    const order = this.order();
    if (!order) return;

    this.isConfirmingPayment.set(true);

    this.http.put<any>(`${environment.apiUrl}/shop/orders/${order._id}/confirm-payment`, {
      paymentMethod: 'cash'
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.order.update(o => o ? {
            ...o,
            payment: { ...o.payment, status: 'completed' },
            status: response.data.order.status
          } : null);
        }
        this.isConfirmingPayment.set(false);
      },
      error: () => {
        this.isConfirmingPayment.set(false);
      }
    });
  }
}


