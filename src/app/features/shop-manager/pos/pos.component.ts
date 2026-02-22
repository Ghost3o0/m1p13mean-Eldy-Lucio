import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PosService, PosProduct, PosCartItem, PosOrder } from '@shared/services/pos.service';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';
import { environment } from '@env/environment';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatDividerModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTooltipModule,
    MatBadgeModule,
    MatSnackBarModule,
    AriaryPipe
  ],
  template: `
    <div class="pos-container">
      <!-- Header -->
      <div class="pos-header">
        <div class="header-left">
          <h1>
            <mat-icon>point_of_sale</mat-icon>
            Caisse
          </h1>
          <span class="date">{{ currentDate | date:'EEEE d MMMM yyyy' }}</span>
        </div>
        <div class="header-right">
          @if (posService.summary()) {
            <div class="daily-stats">
              <span class="stat">
                <mat-icon>receipt</mat-icon>
                {{ posService.summary()?.totalOrders }} ventes
              </span>
              <span class="stat revenue">
                <mat-icon>euro</mat-icon>
                {{ posService.summary()?.totalRevenue | ariary }}
              </span>
            </div>
          }
          <button mat-stroked-button (click)="showHistory = true">
            <mat-icon>history</mat-icon>
            Historique
          </button>
        </div>
      </div>

      <div class="pos-content">
        <!-- Products Section -->
        <div class="products-section">
          <!-- Search -->
          <div class="search-box">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Rechercher un produit</mat-label>
              <input matInput
                     [(ngModel)]="searchTerm"
                     (keyup.enter)="searchProducts()"
                     placeholder="Nom, SKU ou code-barres">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
            <button mat-raised-button color="primary" (click)="searchProducts()">
              Rechercher
            </button>
          </div>

          <!-- Products Grid -->
          <div class="products-grid">
            @if (posService.isLoading()) {
              <div class="loading">
                <mat-spinner diameter="40"></mat-spinner>
                <span>Chargement...</span>
              </div>
            } @else if (posService.products().length === 0) {
              <div class="empty-products">
                <mat-icon>inventory_2</mat-icon>
                <p>Recherchez un produit pour commencer</p>
              </div>
            } @else {
              @for (product of posService.products(); track product.productId + product.optionId) {
                <mat-card class="product-card"
                          [class.out-of-stock]="product.stock <= 0"
                          (click)="product.stock > 0 && addToCart(product)">
                  <div class="product-image">
                    @if (product.image) {
                      <img [src]="getImageUrl(product.image)" [alt]="product.name">
                    } @else {
                      <mat-icon>image</mat-icon>
                    }
                    @if (product.stock <= 0) {
                      <div class="stock-overlay">Rupture</div>
                    } @else if (product.stock <= 5) {
                      <div class="stock-badge">{{ product.stock }}</div>
                    }
                  </div>
                  <div class="product-info">
                    <span class="product-name">{{ product.name }}</span>
                    @if (product.variantName) {
                      <span class="variant">{{ product.variantName }}</span>
                    }
                    <span class="price">{{ product.price | ariary }}</span>
                  </div>
                </mat-card>
              }
            }
          </div>
        </div>

        <!-- Cart Section -->
        <div class="cart-section">
          <div class="cart-header">
            <h2>
              <mat-icon [matBadge]="posService.getCartItemCount()" matBadgeColor="accent">shopping_cart</mat-icon>
              Panier
            </h2>
            @if (posService.cart().length > 0) {
              <button mat-icon-button color="warn" (click)="clearCart()" matTooltip="Vider le panier">
                <mat-icon>delete_sweep</mat-icon>
              </button>
            }
          </div>

          <div class="cart-items">
            @if (posService.cart().length === 0) {
              <div class="empty-cart">
                <mat-icon>remove_shopping_cart</mat-icon>
                <p>Panier vide</p>
              </div>
            } @else {
              @for (item of posService.cart(); track $index) {
                <div class="cart-item">
                  <div class="item-info">
                    <span class="item-name">{{ item.name }}</span>
                    @if (item.variantName) {
                      <span class="item-variant">{{ item.variantName }}</span>
                    }
                    <span class="item-price">{{ item.price | ariary }}</span>
                  </div>
                  <div class="item-quantity">
                    <button mat-icon-button (click)="updateQuantity($index, item.quantity - 1)">
                      <mat-icon>remove</mat-icon>
                    </button>
                    <span class="qty">{{ item.quantity }}</span>
                    <button mat-icon-button
                            (click)="updateQuantity($index, item.quantity + 1)"
                            [disabled]="item.quantity >= item.stock">
                      <mat-icon>add</mat-icon>
                    </button>
                  </div>
                  <div class="item-total">
                    {{ item.price * item.quantity | ariary }}
                  </div>
                  <button mat-icon-button color="warn" (click)="removeItem($index)">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              }
            }
          </div>

          @if (posService.cart().length > 0) {
            <mat-divider></mat-divider>

            <div class="cart-summary">
              <div class="total-row">
                <span>Total</span>
                <span class="total-amount">{{ posService.getCartTotal() | ariary }}</span>
              </div>
            </div>

            <div class="payment-section">
              <h3>Mode de paiement</h3>
              <div class="payment-buttons">
                <button mat-raised-button
                        class="payment-btn cash"
                        [class.selected]="selectedPayment === 'cash'"
                        (click)="selectPayment('cash')">
                  <mat-icon>payments</mat-icon>
                  Espèces
                </button>
                <button mat-raised-button
                        class="payment-btn card"
                        [class.selected]="selectedPayment === 'card'"
                        (click)="selectPayment('card')">
                  <mat-icon>credit_card</mat-icon>
                  Carte
                </button>
              </div>

              @if (selectedPayment === 'cash') {
                <div class="cash-section">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Montant reçu (€)</mat-label>
                    <input matInput type="number" [(ngModel)]="cashReceived" min="0" step="0.01">
                  </mat-form-field>
                  @if (cashReceived && cashReceived >= posService.getCartTotal()) {
                    <div class="change-display">
                      Monnaie à rendre: <strong>{{ cashReceived - posService.getCartTotal() | ariary }}</strong>
                    </div>
                  }
                </div>
              }

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nom du client (optionnel)</mat-label>
                <input matInput [(ngModel)]="customerName">
              </mat-form-field>

              <button mat-raised-button
                      color="primary"
                      class="validate-btn"
                      [disabled]="!canValidate() || isProcessing()"
                      (click)="validateSale()">
                @if (isProcessing()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  <mat-icon>check_circle</mat-icon>
                  Valider la vente
                }
              </button>
            </div>
          }
        </div>
      </div>

      <!-- Receipt Modal -->
      @if (showReceipt()) {
        <div class="modal-overlay" (click)="closeReceipt()">
          <mat-card class="receipt-modal" (click)="$event.stopPropagation()">
            <div class="receipt">
              <div class="receipt-header">
                <mat-icon class="success-icon">check_circle</mat-icon>
                <h2>Vente enregistrée</h2>
                <span class="order-number">N° {{ posService.lastOrder()?.orderNumber }}</span>
              </div>

              <mat-divider></mat-divider>

              <div class="receipt-items">
                @for (item of posService.lastOrder()?.items; track item._id) {
                  <div class="receipt-item">
                    <span>{{ item.quantity }}x {{ item.name }}</span>
                    <span>{{ item.total | ariary }}</span>
                  </div>
                }
              </div>

              <mat-divider></mat-divider>

              <div class="receipt-total">
                <span>TOTAL</span>
                <span>{{ posService.lastOrder()?.total | ariary }}</span>
              </div>

              @if (posService.lastOrder()?.posData?.cashReceived) {
                <div class="receipt-payment">
                  <div>
                    <span>Espèces reçues</span>
                    <span>{{ posService.lastOrder()?.posData?.cashReceived | ariary }}</span>
                  </div>
                  <div>
                    <span>Monnaie rendue</span>
                    <span>{{ posService.lastOrder()?.posData?.changeGiven | ariary }}</span>
                  </div>
                </div>
              }

              <div class="receipt-footer">
                <span>{{ posService.lastOrder()?.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                <span>{{ posService.lastOrder()?.posData?.cashierName }}</span>
              </div>
            </div>

            <div class="receipt-actions">
              <button mat-stroked-button (click)="printReceipt()">
                <mat-icon>print</mat-icon>
                Imprimer
              </button>
              <button mat-raised-button color="primary" (click)="closeReceipt()">
                Nouvelle vente
              </button>
            </div>
          </mat-card>
        </div>
      }

      <!-- History Modal -->
      @if (showHistory) {
        <div class="modal-overlay" (click)="showHistory = false">
          <mat-card class="history-modal" (click)="$event.stopPropagation()">
            <mat-card-header>
              <mat-card-title>Historique des ventes</mat-card-title>
              <button mat-icon-button (click)="showHistory = false">
                <mat-icon>close</mat-icon>
              </button>
            </mat-card-header>
            <mat-card-content>
              <div class="history-filters">
                <mat-form-field appearance="outline">
                  <mat-label>Date</mat-label>
                  <input matInput type="date" [(ngModel)]="historyDate" (change)="loadHistory()">
                </mat-form-field>
              </div>

              <div class="history-list">
                @for (order of posService.orders(); track order._id) {
                  <div class="history-item">
                    <div class="history-info">
                      <span class="order-num">{{ order.orderNumber }}</span>
                      <span class="order-time">{{ order.createdAt | date:'HH:mm' }}</span>
                      <span class="order-customer">{{ order.posData?.customerName }}</span>
                    </div>
                    <div class="history-payment">
                      <mat-chip>
                        @if (order.payment.method === 'cash') {
                          <mat-icon>payments</mat-icon>
                        } @else {
                          <mat-icon>credit_card</mat-icon>
                        }
                        {{ order.payment.method === 'cash' ? 'Espèces' : 'Carte' }}
                      </mat-chip>
                    </div>
                    <div class="history-total">
                      {{ order.total | ariary }}
                    </div>
                  </div>
                } @empty {
                  <div class="empty-history">
                    <mat-icon>receipt_long</mat-icon>
                    <p>Aucune vente pour cette date</p>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .pos-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--bg-secondary);
    }

    .pos-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);

      h1 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0;
        font-size: 1.5rem;

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          color: var(--primary);
        }
      }

      .date {
        color: var(--text-secondary);
        font-size: 0.9rem;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 24px;
      }

      .daily-stats {
        display: flex;
        gap: 24px;

        .stat {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
            color: var(--text-secondary);
          }

          &.revenue {
            color: var(--success);
            font-size: 1.25rem;
          }
        }
      }
    }

    .pos-content {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 0;
      overflow: hidden;
    }

    .products-section {
      padding: 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .search-box {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;

      .search-field {
        flex: 1;
      }
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 16px;
      flex: 1;
    }

    .product-card {
      cursor: pointer;
      transition: all 0.2s;
      overflow: hidden;

      &:hover:not(.out-of-stock) {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
      }

      &.out-of-stock {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .product-image {
        height: 120px;
        background: var(--bg-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: var(--gray-300);
        }

        .stock-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        .stock-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: var(--warning);
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }
      }

      .product-info {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;

        .product-name {
          font-weight: 500;
          font-size: 0.9rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .variant {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .price {
          font-weight: 700;
          color: var(--primary);
        }
      }
    }

    .loading, .empty-products {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 48px;
      color: var(--text-secondary);

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: var(--gray-300);
      }
    }

    .cart-section {
      background: var(--bg-primary);
      border-left: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .cart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);

      h2 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0;
        font-size: 1.25rem;
      }
    }

    .cart-items {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    .empty-cart {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-secondary);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--gray-300);
      }
    }

    .cart-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--bg-secondary);
      border-radius: 8px;
      margin-bottom: 8px;

      .item-info {
        flex: 1;
        display: flex;
        flex-direction: column;

        .item-name {
          font-weight: 500;
          font-size: 0.9rem;
        }

        .item-variant {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .item-price {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
      }

      .item-quantity {
        display: flex;
        align-items: center;
        gap: 4px;

        .qty {
          width: 32px;
          text-align: center;
          font-weight: 600;
        }

        button {
          width: 28px;
          height: 28px;
          line-height: 28px;
        }
      }

      .item-total {
        font-weight: 600;
        min-width: 70px;
        text-align: right;
      }
    }

    .cart-summary {
      padding: 16px 20px;

      .total-row {
        display: flex;
        justify-content: space-between;
        font-size: 1.25rem;
        font-weight: 700;

        .total-amount {
          color: var(--primary);
        }
      }
    }

    .payment-section {
      padding: 16px 20px;
      border-top: 1px solid var(--border-color);

      h3 {
        margin: 0 0 12px;
        font-size: 0.9rem;
        font-weight: 600;
      }

      .payment-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 16px;
      }

      .payment-btn {
        padding: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;

        &.selected {
          background: var(--primary);
          color: white;
        }

        &.cash.selected {
          background: var(--success);
        }

        &.card.selected {
          background: var(--primary);
        }
      }

      .cash-section {
        margin-bottom: 12px;

        .change-display {
          text-align: center;
          padding: 12px;
          background: var(--success-light);
          color: var(--success);
          border-radius: 8px;
          margin-top: -8px;
          margin-bottom: 12px;
        }
      }

      .full-width {
        width: 100%;
      }

      .validate-btn {
        width: 100%;
        padding: 16px;
        font-size: 1.1rem;

        mat-icon {
          margin-right: 8px;
        }
      }
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .receipt-modal {
      width: 100%;
      max-width: 400px;
      max-height: 90vh;
      overflow-y: auto;

      .receipt {
        padding: 24px;
      }

      .receipt-header {
        text-align: center;
        margin-bottom: 24px;

        .success-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          color: var(--success);
        }

        h2 {
          margin: 16px 0 8px;
        }

        .order-number {
          color: var(--text-secondary);
        }
      }

      .receipt-items {
        padding: 16px 0;
      }

      .receipt-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
      }

      .receipt-total {
        display: flex;
        justify-content: space-between;
        padding: 16px 0;
        font-size: 1.25rem;
        font-weight: 700;
      }

      .receipt-payment {
        padding: 12px;
        background: var(--bg-secondary);
        border-radius: 8px;
        margin-bottom: 16px;

        div {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
        }
      }

      .receipt-footer {
        display: flex;
        justify-content: space-between;
        color: var(--text-secondary);
        font-size: 0.85rem;
        padding-top: 16px;
        border-top: 1px dashed var(--border-color);
      }

      .receipt-actions {
        display: flex;
        gap: 12px;
        padding: 16px 24px;
        border-top: 1px solid var(--border-color);

        button {
          flex: 1;
        }
      }
    }

    .history-modal {
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;

      mat-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        border-bottom: 1px solid var(--border-color);
      }

      mat-card-content {
        flex: 1;
        overflow-y: auto;
        padding: 0;
      }

      .history-filters {
        padding: 16px 24px;
        border-bottom: 1px solid var(--border-color);
      }

      .history-list {
        padding: 16px 24px;
      }

      .history-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        background: var(--bg-secondary);
        border-radius: 8px;
        margin-bottom: 8px;

        .history-info {
          flex: 1;
          display: flex;
          flex-direction: column;

          .order-num {
            font-weight: 600;
          }

          .order-time {
            font-size: 0.85rem;
            color: var(--text-secondary);
          }

          .order-customer {
            font-size: 0.85rem;
            color: var(--text-secondary);
          }
        }

        .history-total {
          font-weight: 700;
          font-size: 1.1rem;
        }
      }

      .empty-history {
        text-align: center;
        padding: 48px;
        color: var(--text-secondary);

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: var(--gray-300);
        }
      }
    }

    @media (max-width: 1024px) {
      .pos-content {
        grid-template-columns: 1fr;
        grid-template-rows: 1fr auto;
      }

      .cart-section {
        border-left: none;
        border-top: 1px solid var(--border-color);
        max-height: 50vh;
      }
    }

    @media (max-width: 768px) {
      .pos-header {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;

        .header-right {
          width: 100%;
          justify-content: space-between;
        }

        .daily-stats {
          gap: 16px;

          .stat.revenue {
            font-size: 1rem;
          }
        }
      }

      .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      }

      .product-card .product-image {
        height: 100px;
      }
    }
  `]
})
export class PosComponent implements OnInit {
  searchTerm = '';
  selectedPayment: 'cash' | 'card' | null = null;
  cashReceived: number | null = null;
  customerName = '';
  isProcessing = signal(false);
  showReceipt = signal(false);
  showHistory = false;
  historyDate = new Date().toISOString().split('T')[0];
  currentDate = new Date();

  constructor(
    public posService: PosService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.posService.getDailySummary().subscribe();
    this.searchProducts();
  }

  searchProducts(): void {
    this.posService.searchProducts(this.searchTerm || undefined).subscribe();
  }

  getImageUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${environment.apiUrl.replace('/api', '')}${path}`;
  }

  addToCart(product: PosProduct): void {
    this.posService.addToCart(product);
  }

  updateQuantity(index: number, quantity: number): void {
    this.posService.updateCartItemQuantity(index, quantity);
  }

  removeItem(index: number): void {
    this.posService.removeFromCart(index);
  }

  clearCart(): void {
    this.posService.clearCart();
    this.resetPayment();
  }

  selectPayment(method: 'cash' | 'card'): void {
    this.selectedPayment = method;
    if (method === 'card') {
      this.cashReceived = null;
    }
  }

  resetPayment(): void {
    this.selectedPayment = null;
    this.cashReceived = null;
    this.customerName = '';
  }

  canValidate(): boolean {
    if (!this.selectedPayment || this.posService.cart().length === 0) {
      return false;
    }
    if (this.selectedPayment === 'cash' && (!this.cashReceived || this.cashReceived < this.posService.getCartTotal())) {
      return false;
    }
    return true;
  }

  validateSale(): void {
    if (!this.canValidate()) return;

    this.isProcessing.set(true);

    this.posService.createOrder({
      paymentMethod: this.selectedPayment!,
      customerName: this.customerName || undefined,
      cashReceived: this.cashReceived || undefined
    }).subscribe({
      next: (response) => {
        this.isProcessing.set(false);
        if (response.success) {
          this.showReceipt.set(true);
          this.resetPayment();
          this.posService.getDailySummary().subscribe();
        }
      },
      error: (error) => {
        this.isProcessing.set(false);
        this.snackBar.open(
          error.error?.message || 'Erreur lors de la vente',
          'Fermer',
          { duration: 5000 }
        );
      }
    });
  }

  closeReceipt(): void {
    this.showReceipt.set(false);
    this.searchProducts();
  }

  printReceipt(): void {
    window.print();
  }

  loadHistory(): void {
    this.posService.getOrders({
      startDate: this.historyDate,
      endDate: this.historyDate
    }).subscribe();
  }
}
