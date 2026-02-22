import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';
import { OrderService } from '@shared/services/order.service';
import { Order, OrderStatus } from '@shared/models/order.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    AriaryPipe,
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatStepperModule,
    LoadingComponent,
    AriaryPipe
  ],
  template: `
    @if (isLoading()) {
      <app-loading message="Chargement de la commande..." fullscreen></app-loading>
    }

    @if (!isLoading() && order()) {
      <div class="order-detail-container container">
        <!-- Header -->
        <div class="order-header">
          <a routerLink="/orders" class="back-link">
            <mat-icon>arrow_back</mat-icon>
            Retour aux commandes
          </a>
          <div class="header-content">
            <div class="order-info">
              <h1>Commande #{{ order()!.orderNumber }}</h1>
              <span class="order-date">Passée le {{ order()!.createdAt | date:'dd MMMM yyyy à HH:mm' }}</span>
            </div>
            <mat-chip [class]="'status-' + order()!.status">
              {{ getStatusLabel(order()!.status) }}
            </mat-chip>
          </div>
        </div>

        @if (showSuccessMessage) {
          <div class="success-message">
            <mat-icon>check_circle</mat-icon>
            <span>Votre commande a été passée avec succès!</span>
          </div>
        }

        <!-- Order Progress -->
        @if (!isCancelled()) {
          <mat-card class="progress-card">
            <mat-card-content>
              <div class="progress-steps">
                @for (step of progressSteps; track step.status) {
                  <div class="step" [class.active]="isStepActive(step.status)" [class.completed]="isStepCompleted(step.status)">
                    <div class="step-icon">
                      <mat-icon>{{ step.icon }}</mat-icon>
                    </div>
                    <span class="step-label">{{ step.label }}</span>
                    @if (getStepDate(step.status)) {
                      <span class="step-date">{{ getStepDate(step.status) | date:'dd/MM HH:mm' }}</span>
                    }
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        }

        <div class="order-content">
          <!-- Items -->
          <div class="main-content">
            <mat-card class="items-card">
              <mat-card-header>
                <mat-card-title>Articles commandés</mat-card-title>
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
                      <span class="item-shop">
                        <mat-icon>store</mat-icon>
                        {{ getShopName(item.shopId) }}
                      </span>
                    </div>
                    <div class="item-qty">x{{ item.quantity }}</div>
                    <div class="item-price">{{ item.total | ariary }}</div>
                  </div>
                }
              </mat-card-content>
            </mat-card>

            <!-- Delivery Info -->
            <mat-card class="delivery-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>{{ order()!.deliveryMethod === 'delivery' ? 'local_shipping' : 'store' }}</mat-icon>
                <mat-card-title>{{ order()!.deliveryMethod === 'delivery' ? 'Livraison' : 'Retrait en boutique' }}</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                @if (order()!.deliveryMethod === 'delivery' && order()!.deliveryAddress) {
                  <p>
                    <strong>{{ order()!.deliveryAddress!.label || 'Adresse de livraison' }}</strong><br>
                    {{ order()!.deliveryAddress!.street }}<br>
                    {{ order()!.deliveryAddress!.zipCode }} {{ order()!.deliveryAddress!.city }}
                    @if (order()!.deliveryAddress!.phone) {
                      <br>Tél: {{ order()!.deliveryAddress!.phone }}
                    }
                    @if (order()!.deliveryAddress!.instructions) {
                      <br><em>{{ order()!.deliveryAddress!.instructions }}</em>
                    }
                  </p>
                } @else {
                  <p>Vous pouvez récupérer votre commande en boutique une fois qu'elle sera prête.</p>
                }
              </mat-card-content>
            </mat-card>

            <!-- Payment Info -->
            <mat-card class="payment-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>payment</mat-icon>
                <mat-card-title>Paiement</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="payment-info">
                  <span class="payment-method">
                    @switch (order()!.payment.method) {
                      @case ('card') {
                        <mat-icon>credit_card</mat-icon>
                        Carte bancaire
                        @if (order()!.payment.cardLast4) {
                          (**** {{ order()!.payment.cardLast4 }})
                        }
                      }
                      @case ('paypal') {
                        <mat-icon>account_balance_wallet</mat-icon>
                        PayPal
                      }
                      @case ('cash') {
                        <mat-icon>payments</mat-icon>
                        Espèces
                      }
                    }
                  </span>
                  <mat-chip [class]="'payment-' + order()!.payment.status">
                    {{ getPaymentStatusLabel(order()!.payment.status) }}
                  </mat-chip>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Notes -->
            @if (order()!.notes?.customer) {
              <mat-card class="notes-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>note</mat-icon>
                  <mat-card-title>Notes</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <p>{{ order()!.notes!.customer }}</p>
                </mat-card-content>
              </mat-card>
            }

            <!-- Actions -->
            <div class="order-actions">
              <button mat-raised-button color="primary" (click)="downloadInvoice()">
                <mat-icon>receipt</mat-icon>
                Télécharger la facture
              </button>
              @if (canCancel()) {
                <button mat-stroked-button color="warn" (click)="cancelOrder()">
                  <mat-icon>cancel</mat-icon>
                  Annuler la commande
                </button>
              }
              <button mat-stroked-button (click)="contactSupport()">
                <mat-icon>support_agent</mat-icon>
                Contacter le support
              </button>
              @if (order()!.status === 'delivered' && !order()!.rating) {
                <button mat-raised-button color="accent">
                  <mat-icon>star</mat-icon>
                  Laisser un avis
                </button>
              }
            </div>
          </div>

          <!-- Summary Sidebar -->
          <div class="order-summary">
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
                @if (order()!.serviceFee > 0) {
                  <div class="summary-row">
                    <span>Frais de service</span>
                    <span>{{ order()!.serviceFee | ariary }}</span>
                  </div>
                }
                <mat-divider></mat-divider>
                <div class="summary-row total">
                  <span>Total</span>
                  <span>{{ order()!.total | ariary }}</span>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Help -->
            <mat-card class="help-card">
              <mat-card-content>
                <h4>Besoin d'aide ?</h4>
                <p>Notre équipe est disponible pour répondre à vos questions.</p>
                <a routerLink="/tickets/new" [queryParams]="{orderId: order()!._id}" mat-stroked-button>
                  <mat-icon>help</mat-icon>
                  Créer un ticket
                </a>
              </mat-card-content>
            </mat-card>
          </div>
        </div>
      </div>
    }

    @if (!isLoading() && !order()) {
      <div class="not-found container">
        <mat-icon>error_outline</mat-icon>
        <h2>Commande non trouvée</h2>
        <p>Cette commande n'existe pas ou vous n'avez pas les droits pour la consulter.</p>
        <a routerLink="/orders" mat-raised-button color="primary">
          Voir mes commandes
        </a>
      </div>
    }
  `,
  styles: [`
    .order-detail-container {
      padding: 24px 16px;
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
      margin-bottom: 16px;

      &:hover {
        text-decoration: underline;
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .order-info {
      h1 {
        font-size: 1.75rem;
        margin: 0 0 4px;
      }

      .order-date {
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
        background: var(--secondary-light) !important;
        color: var(--secondary) !important;
      }
      &.status-ready {
        background: var(--success-light) !important;
        color: var(--success) !important;
      }
      &.status-shipped {
        background: var(--accent-light) !important;
        color: var(--accent) !important;
      }
      &.status-delivered {
        background: var(--success-light) !important;
        color: var(--success) !important;
      }
      &.status-cancelled, &.status-refunded {
        background: var(--error-light) !important;
        color: var(--error) !important;
      }
      &.payment-completed {
        background: var(--success-light) !important;
        color: var(--success) !important;
      }
      &.payment-pending, &.payment-processing {
        background: var(--warning-light) !important;
        color: var(--warning) !important;
      }
      &.payment-failed, &.payment-refunded {
        background: var(--error-light) !important;
        color: var(--error) !important;
      }
    }

    .success-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: var(--success-light);
      color: var(--success);
      border-radius: 8px;
      margin-bottom: 24px;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .progress-card {
      margin-bottom: 24px;
    }

    .progress-steps {
      display: flex;
      justify-content: space-between;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      flex: 1;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        top: 20px;
        left: 50%;
        width: 100%;
        height: 2px;
        background: #e0e0e0;
        z-index: 0;
      }

      &:last-child::after {
        display: none;
      }

      &.completed::after {
        background: #4caf50;
      }

      .step-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #e0e0e0;
        z-index: 1;

        mat-icon {
          color: #999;
        }
      }

      &.active .step-icon,
      &.completed .step-icon {
        background: #4caf50;

        mat-icon {
          color: white;
        }
      }

      .step-label {
        font-size: 0.85rem;
        text-align: center;
      }

      .step-date {
        font-size: 0.75rem;
        color: #666;
      }

      &.active .step-label {
        font-weight: 600;
      }
    }

    .order-content {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 24px;
      align-items: start;
    }

    .main-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    mat-card {
      padding: 16px;
    }

    mat-card-header {
      margin-bottom: 16px;
    }

    .order-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid #eee;

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
        gap: 4px;

        .item-name {
          font-weight: 500;
        }

        .item-variation {
          font-size: 0.85rem;
          color: #666;
        }

        .item-shop {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.85rem;
          color: #3f51b5;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
      }

      .item-qty {
        color: #666;
      }

      .item-price {
        font-weight: 500;
        min-width: 80px;
        text-align: right;
      }
    }

    .payment-info {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .payment-method {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    .order-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .order-summary {
      position: sticky;
      top: 88px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;

      &.discount {
        color: #4caf50;
      }

      &.total {
        font-size: 1.25rem;
        font-weight: 600;
        padding-top: 16px;
      }
    }

    .help-card {
      h4 {
        margin: 0 0 8px;
      }

      p {
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 16px;
      }
    }

    .not-found {
      text-align: center;
      padding: 80px 24px;

      mat-icon {
        font-size: 80px;
        width: 80px;
        height: 80px;
        color: #ccc;
      }

      h2 {
        margin: 16px 0 8px;
      }

      p {
        color: #666;
        margin-bottom: 24px;
      }
    }

    @media (max-width: 768px) {
      .order-content {
        grid-template-columns: 1fr;
      }

      .order-summary {
        position: static;
      }

      .progress-steps {
        flex-direction: column;
        gap: 16px;
      }

      .step::after {
        display: none;
      }
    }
  `]
})
export class OrderDetailComponent implements OnInit {
  order = signal<Order | null>(null);
  isLoading = signal(true);
  showSuccessMessage = false;

  progressSteps = [
    { status: 'pending', label: 'Commande reçue', icon: 'receipt' },
    { status: 'confirmed', label: 'Confirmée', icon: 'check_circle' },
    { status: 'preparing', label: 'En préparation', icon: 'inventory_2' },
    { status: 'shipped', label: 'Expédiée', icon: 'local_shipping' },
    { status: 'delivered', label: 'Livrée', icon: 'done_all' }
  ];

  private statusOrder: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered'];

  constructor(
    private orderService: OrderService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const orderId = params['id'];
      if (orderId) {
        this.loadOrder(orderId);
      }
    });

    this.route.queryParams.subscribe(params => {
      this.showSuccessMessage = params['success'] === 'true';
    });
  }

  loadOrder(id: string): void {
    this.isLoading.set(true);

    this.orderService.getOrder(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.order.set(response.data.order);

          // Adjust progress steps for pickup orders
          if (response.data.order.deliveryMethod === 'pickup') {
            this.progressSteps = [
              { status: 'pending', label: 'Commande reçue', icon: 'receipt' },
              { status: 'confirmed', label: 'Confirmée', icon: 'check_circle' },
              { status: 'preparing', label: 'En préparation', icon: 'inventory_2' },
              { status: 'ready', label: 'Prête', icon: 'store' },
              { status: 'delivered', label: 'Récupérée', icon: 'done_all' }
            ];
          }
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
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

  getPaymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      processing: 'En cours',
      completed: 'Payé',
      failed: 'Échoué',
      refunded: 'Remboursé'
    };
    return labels[status] || status;
  }

  isCancelled(): boolean {
    const o = this.order();
    return o ? ['cancelled', 'refunded'].includes(o.status) : false;
  }

  isStepActive(stepStatus: string): boolean {
    const o = this.order();
    return o?.status === stepStatus;
  }

  isStepCompleted(stepStatus: string): boolean {
    const o = this.order();
    if (!o) return false;

    const currentIndex = this.statusOrder.indexOf(o.status);
    const stepIndex = this.statusOrder.indexOf(stepStatus as OrderStatus);

    return stepIndex < currentIndex;
  }

  getStepDate(stepStatus: string): string | null {
    const o = this.order();
    if (!o || !o.statusHistory) return null;

    const history = o.statusHistory.find(h => h.status === stepStatus);
    return history?.timestamp || null;
  }

  getShopName(shopId: string | any): string {
    if (typeof shopId === 'object' && shopId?.name) {
      return shopId.name;
    }
    return 'Boutique';
  }

  canCancel(): boolean {
    const o = this.order();
    return o ? ['pending', 'confirmed'].includes(o.status) : false;
  }

  cancelOrder(): void {
    const o = this.order();
    if (!o) return;

    if (confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      this.orderService.cancelOrder(o._id).subscribe({
        next: () => {
          this.loadOrder(o._id);
        }
      });
    }
  }

  contactSupport(): void {
    // Navigate to support ticket creation
  }

  downloadInvoice(): void {
    const o = this.order();
    if (!o) return;

    // Open invoice in new window for printing/saving
    this.orderService.getInvoice(o._id).subscribe({
      next: (html) => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
        }
      },
      error: () => {
        alert('Erreur lors de la génération de la facture');
      }
    });
  }
}
