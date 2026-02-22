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
  template: `
    @if (isLoading()) {
      <app-loading message="Chargement de la commande..." fullscreen></app-loading>
    }

    @if (!isLoading() && order()) {
      <div class="order-detail-container">
        <!-- Header -->
        <div class="order-header">
          <a routerLink="/shop-manager/orders" class="back-link">
            <mat-icon>arrow_back</mat-icon>
            Retour aux commandes
          </a>
          <div class="header-content">
            <div class="order-info">
              <h1>Commande #{{ order()!.orderNumber }}</h1>
              <span class="order-date">{{ order()!.createdAt | date:'dd MMMM yyyy à HH:mm' }}</span>
            </div>
            <mat-chip [class]="'status-' + order()!.status">
              {{ getStatusLabel(order()!.status) }}
            </mat-chip>
          </div>
        </div>

        <div class="order-content">
          <div class="main-column">
            <!-- Status Update -->
            <mat-card class="status-card">
              <mat-card-header>
                <mat-card-title>Mettre à jour le statut</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="status-actions">
                  @switch (order()!.status) {
                    @case ('pending') {
                      <button mat-raised-button color="primary" (click)="updateStatus('confirmed')" [disabled]="isUpdating()">
                        <mat-icon>check</mat-icon>
                        Confirmer la commande
                      </button>
                      <button mat-stroked-button color="warn" (click)="updateStatus('cancelled')" [disabled]="isUpdating()">
                        <mat-icon>cancel</mat-icon>
                        Annuler
                      </button>
                    }
                    @case ('confirmed') {
                      <button mat-raised-button color="primary" (click)="updateStatus('preparing')" [disabled]="isUpdating()">
                        <mat-icon>inventory_2</mat-icon>
                        Commencer la préparation
                      </button>
                      <button mat-stroked-button color="warn" (click)="updateStatus('cancelled')" [disabled]="isUpdating()">
                        <mat-icon>cancel</mat-icon>
                        Annuler
                      </button>
                    }
                    @case ('preparing') {
                      @if (order()!.deliveryMethod === 'pickup') {
                        <button mat-raised-button color="primary" (click)="updateStatus('ready')" [disabled]="isUpdating()">
                          <mat-icon>store</mat-icon>
                          Marquer comme prête
                        </button>
                      } @else {
                        <button mat-raised-button color="primary" (click)="updateStatus('shipped')" [disabled]="isUpdating()">
                          <mat-icon>local_shipping</mat-icon>
                          Expédier
                        </button>
                      }
                    }
                    @case ('ready') {
                      <button mat-raised-button color="primary" (click)="updateStatus('delivered')" [disabled]="isUpdating()">
                        <mat-icon>done_all</mat-icon>
                        Marquer comme récupérée
                      </button>
                    }
                    @case ('shipped') {
                      <button mat-raised-button color="primary" (click)="updateStatus('delivered')" [disabled]="isUpdating()">
                        <mat-icon>done_all</mat-icon>
                        Marquer comme livrée
                      </button>
                    }
                    @default {
                      <p class="completed-message">
                        @if (order()!.status === 'delivered') {
                          <mat-icon>check_circle</mat-icon>
                          Cette commande a été livrée avec succès.
                        } @else if (order()!.status === 'cancelled') {
                          <mat-icon>cancel</mat-icon>
                          Cette commande a été annulée.
                        }
                      </p>
                    }
                  }
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Order Items -->
            <mat-card>
              <mat-card-header>
                <mat-card-title>Articles ({{ order()!.items.length }})</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                @for (item of order()!.items; track item._id) {
                  <div class="order-item">
                    <img [src]="item.image || '/assets/placeholder.png'" [alt]="item.name">
                    <div class="item-details">
                      <span class="item-name">{{ item.name }}</span>
                      @if (item.variation?.optionValue) {
                        <span class="item-variation">{{ item.variation!.variationName }}: {{ item.variation!.optionValue }}</span>
                      }
                      <span class="item-price">{{ item.unitPrice | ariary }} × {{ item.quantity }}</span>
                    </div>
                    <div class="item-total">
                      {{ item.total | ariary }}
                    </div>
                  </div>
                }
              </mat-card-content>
            </mat-card>

            <!-- Internal Notes -->
            <mat-card>
              <mat-card-header>
                <mat-card-title>Notes internes</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <mat-form-field appearance="outline" class="full-width">
                  <textarea matInput [(ngModel)]="internalNote" rows="3" placeholder="Ajouter une note interne..."></textarea>
                </mat-form-field>
                <button mat-stroked-button (click)="saveNote()" [disabled]="!internalNote || isSavingNote()">
                  @if (isSavingNote()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    Enregistrer la note
                  }
                </button>

                @if (order()!.notes?.internal) {
                  <div class="saved-note">
                    <strong>Note :</strong>
                    {{ order()!.notes!.internal }}
                  </div>
                }
              </mat-card-content>
            </mat-card>
          </div>

          <div class="side-column">
            <!-- Customer Info -->
            <mat-card>
              <mat-card-header>
                <mat-icon mat-card-avatar>person</mat-icon>
                <mat-card-title>Client</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p class="customer-name">{{ getCustomerName() }}</p>
                <p class="customer-email">
                  <mat-icon>email</mat-icon>
                  {{ getCustomerEmail() }}
                </p>
                @if (getCustomerPhone()) {
                  <p class="customer-phone">
                    <mat-icon>phone</mat-icon>
                    {{ getCustomerPhone() }}
                  </p>
                }
              </mat-card-content>
            </mat-card>

            <!-- Delivery Info -->
            <mat-card>
              <mat-card-header>
                <mat-icon mat-card-avatar>{{ order()!.deliveryMethod === 'delivery' ? 'local_shipping' : 'store' }}</mat-icon>
                <mat-card-title>{{ order()!.deliveryMethod === 'delivery' ? 'Livraison' : 'Retrait' }}</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                @if (order()!.deliveryMethod === 'delivery' && order()!.deliveryAddress) {
                  <p>
                    {{ order()!.deliveryAddress!.street }}<br>
                    {{ order()!.deliveryAddress!.zipCode }} {{ order()!.deliveryAddress!.city }}
                  </p>
                  @if (order()!.deliveryAddress!.phone) {
                    <p>
                      <mat-icon>phone</mat-icon>
                      {{ order()!.deliveryAddress!.phone }}
                    </p>
                  }
                  @if (order()!.deliveryAddress!.instructions) {
                    <p class="instructions">
                      <mat-icon>info</mat-icon>
                      {{ order()!.deliveryAddress!.instructions }}
                    </p>
                  }
                } @else {
                  <p>Retrait en boutique</p>
                }
              </mat-card-content>
            </mat-card>

            <!-- Customer Notes -->
            @if (order()!.notes?.customer) {
              <mat-card>
                <mat-card-header>
                  <mat-icon mat-card-avatar>note</mat-icon>
                  <mat-card-title>Note du client</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <p>{{ order()!.notes!.customer }}</p>
                </mat-card-content>
              </mat-card>
            }

            <!-- Order Summary -->
            <mat-card>
              <mat-card-header>
                <mat-card-title>Récapitulatif</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="summary-row">
                  <span>Sous-total</span>
                  <span>{{ order()!.subtotal | ariary }}</span>
                </div>
                @if (order()!.discount > 0) {
                  <div class="summary-row discount">
                    <span>Réduction</span>
                    <span>-{{ order()!.discount | ariary }}</span>
                  </div>
                }
                <div class="summary-row">
                  <span>Livraison</span>
                  <span>{{ order()!.deliveryFee | ariary }}</span>
                </div>
                <mat-divider></mat-divider>
                <div class="summary-row total">
                  <span>Total</span>
                  <span>{{ order()!.total | ariary }}</span>
                </div>

                <div class="payment-info">
                  <mat-chip [class]="'payment-' + order()!.payment.status">
                    {{ getPaymentStatusLabel(order()!.payment.status) }}
                  </mat-chip>
                  <span class="payment-method">{{ getPaymentMethodLabel(order()!.payment.method) }}</span>
                </div>

                @if (order()!.deliveryMethod === 'pickup' && order()!.payment.status === 'pending') {
                  <div class="pickup-payment-action">
                    <button mat-raised-button color="primary" (click)="confirmPickupPayment()" [disabled]="isConfirmingPayment()">
                      @if (isConfirmingPayment()) {
                        <mat-spinner diameter="20"></mat-spinner>
                      } @else {
                        <mat-icon>payments</mat-icon>
                        Confirmer le paiement
                      }
                    </button>
                    <p class="payment-note">Le client paiera lors du retrait en boutique</p>
                  </div>
                }
              </mat-card-content>
            </mat-card>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .order-detail-container {
      padding: 24px;
    }

    .order-header {
      margin-bottom: 24px;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--primary);
      text-decoration: none;
      margin-bottom: 8px;

      &:hover {
        text-decoration: underline;
      }
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      h1 {
        font-size: 1.75rem;
        margin: 0 0 4px;
      }

      .order-date {
        color: var(--text-secondary);
      }
    }

    .order-content {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 24px;
      align-items: start;
    }

    .main-column,
    .side-column {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    mat-card {
      padding: 16px;
    }

    mat-card-header {
      margin-bottom: 16px;
    }

    .status-actions {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .completed-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: var(--bg-secondary);
      border-radius: 8px;
      margin: 0;
    }

    .order-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-color);

      &:last-child {
        border-bottom: none;
      }

      img {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 8px;
      }

      .item-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;

        .item-name {
          font-weight: 500;
        }

        .item-variation,
        .item-price {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
      }

      .item-total {
        font-weight: 600;
      }
    }

    .full-width {
      width: 100%;
    }

    .saved-note {
      margin-top: 16px;
      padding: 12px;
      background: var(--warning-light);
      border-radius: 8px;
    }

    .customer-name {
      font-weight: 500;
      margin-bottom: 8px;
    }

    .customer-email,
    .customer-phone {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-secondary);
      margin: 4px 0;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .instructions {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: var(--warning-light);
      padding: 8px;
      border-radius: 4px;
      margin-top: 8px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--warning);
      }
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;

      &.discount {
        color: var(--success);
      }

      &.total {
        font-size: 1.25rem;
        font-weight: 600;
        padding-top: 16px;
      }
    }

    .payment-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);

      .payment-method {
        color: var(--text-secondary);
      }
    }

    .pickup-payment-action {
      margin-top: 16px;
      padding: 16px;
      background: var(--warning-light);
      border-radius: 8px;
      text-align: center;

      button {
        width: 100%;
        margin-bottom: 8px;
      }

      .payment-note {
        margin: 0;
        font-size: 0.85rem;
        color: var(--warning);
      }
    }

    mat-chip {
      &.status-pending { background: var(--warning-light) !important; color: var(--warning) !important; }
      &.status-confirmed { background: var(--primary-50) !important; color: var(--primary) !important; }
      &.status-preparing { background: var(--primary-50) !important; color: var(--primary) !important; }
      &.status-ready { background: var(--success-light) !important; color: var(--success) !important; }
      &.status-shipped { background: var(--success-light) !important; color: var(--success) !important; }
      &.status-delivered { background: var(--success-light) !important; color: var(--success) !important; }
      &.status-cancelled { background: var(--error-light) !important; color: var(--error) !important; }
      &.payment-completed { background: var(--success-light) !important; color: var(--success) !important; }
      &.payment-pending { background: var(--warning-light) !important; color: var(--warning) !important; }
      &.payment-failed { background: var(--error-light) !important; color: var(--error) !important; }
    }

    @media (max-width: 768px) {
      .order-content {
        grid-template-columns: 1fr;
      }
    }
  `]
})
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
