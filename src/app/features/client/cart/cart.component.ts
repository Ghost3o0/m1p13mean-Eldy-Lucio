import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { CartService } from '@shared/services/cart.service';
import { AuthService } from '@core/services/auth.service';
import { Cart, CartItem } from '@shared/models/order.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    AriaryPipe,
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    LoadingComponent,
    AriaryPipe
  ],
  template: `
    <div class="cart-container container">
      <h1>Mon panier</h1>

      @if (cartService.isLoading()) {
        <app-loading message="Chargement du panier..."></app-loading>
      }

      @if (!cartService.isLoading()) {
        @if (!isLoggedIn()) {
          <div class="login-prompt">
            <mat-icon>shopping_cart</mat-icon>
            <h2>Connectez-vous pour voir votre panier</h2>
            <p>Vous devez être connecté pour ajouter des articles et passer commande.</p>
            <a routerLink="/auth/login" [queryParams]="{returnUrl: '/cart'}" mat-raised-button color="primary">
              Se connecter
            </a>
          </div>
        } @else if (!cart() || cart()!.items.length === 0) {
          <div class="empty-cart">
            <mat-icon>remove_shopping_cart</mat-icon>
            <h2>Votre panier est vide</h2>
            <p>Découvrez nos produits et ajoutez-les à votre panier.</p>
            <a routerLink="/catalog" mat-raised-button color="primary">
              Explorer le catalogue
            </a>
          </div>
        } @else {
          <div class="cart-content">
            <!-- Cart Items -->
            <div class="cart-items">
              @for (shopGroup of groupedItems(); track shopGroup.shopId) {
                <mat-card class="shop-group">
                  <div class="shop-header">
                    <mat-icon>store</mat-icon>
                    <span class="shop-name">{{ shopGroup.shopName }}</span>
                  </div>

                  @for (item of shopGroup.items; track item._id) {
                    <div class="cart-item">
                      <img [src]="item.product?.images?.[0] || '/assets/placeholder.png'" [alt]="item.product?.name" class="item-image">
                      <div class="item-details">
                        <a [routerLink]="['/product', item.productId]" class="item-name">
                          {{ item.product?.name || 'Produit' }}
                        </a>
                        @if (item.variation && getVariationText(item.variation)) {
                          <span class="item-variation">{{ getVariationText(item.variation) }}</span>
                        }
                        <span class="item-price">{{ item.unitPrice | ariary }}</span>
                      </div>
                      <div class="item-quantity">
                        <button mat-icon-button (click)="updateQuantity(item, item.quantity - 1)" [disabled]="item.quantity <= 1 || isUpdating()">
                          <mat-icon>remove</mat-icon>
                        </button>
                        <span>{{ item.quantity }}</span>
                        <button mat-icon-button (click)="updateQuantity(item, item.quantity + 1)" [disabled]="isUpdating()">
                          <mat-icon>add</mat-icon>
                        </button>
                      </div>
                      <div class="item-total">
                        {{ item.unitPrice * item.quantity | ariary }}
                      </div>
                      <button mat-icon-button color="warn" (click)="removeItem(item)" [disabled]="isUpdating()">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  }

                  <!-- Promo Code for this shop -->
                  <div class="promo-section">
                    <mat-form-field appearance="outline" class="promo-input">
                      <mat-label>Code promo</mat-label>
                      <input matInput [(ngModel)]="promoCodes[shopGroup.shopId]" placeholder="Entrez votre code">
                    </mat-form-field>
                    <button mat-stroked-button color="primary" (click)="applyPromoCode(shopGroup.shopId)" [disabled]="!promoCodes[shopGroup.shopId]">
                      Appliquer
                    </button>
                  </div>

                  <div class="shop-subtotal">
                    <span>Sous-total</span>
                    <span>{{ shopGroup.subtotal | ariary }}</span>
                  </div>
                </mat-card>
              }
            </div>

            <!-- Order Summary -->
            <div class="order-summary">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Récapitulatif</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="summary-row">
                    <span>Sous-total ({{ cart()!.itemCount }} articles)</span>
                    <span>{{ cart()!.subtotal | ariary }}</span>
                  </div>
                  @if (cart()!.discount && cart()!.discount! > 0) {
                    <div class="summary-row discount">
                      <span>Réduction</span>
                      <span>-{{ cart()!.discount | ariary }}</span>
                    </div>
                  }
                  <div class="summary-row">
                    <span>Frais de livraison</span>
                    <span>{{ cart()!.deliveryFee || 0 | ariary }}</span>
                  </div>
                  <mat-divider></mat-divider>
                  <div class="summary-row total">
                    <span>Total</span>
                    <span>{{ calculateTotal() | ariary }}</span>
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <a routerLink="/checkout" mat-raised-button color="primary" class="checkout-btn">
                    Passer la commande
                  </a>
                  <button mat-button color="warn" (click)="clearCart()">
                    Vider le panier
                  </button>
                </mat-card-actions>
              </mat-card>

              <!-- Benefits -->
              <div class="benefits">
                <div class="benefit">
                  <mat-icon>local_shipping</mat-icon>
                  <div>
                    <strong>Livraison gratuite</strong>
                    <span>À partir de 50€ d'achat</span>
                  </div>
                </div>
                <div class="benefit">
                  <mat-icon>replay</mat-icon>
                  <div>
                    <strong>Retours gratuits</strong>
                    <span>Sous 30 jours</span>
                  </div>
                </div>
                <div class="benefit">
                  <mat-icon>security</mat-icon>
                  <div>
                    <strong>Paiement sécurisé</strong>
                    <span>SSL 256 bits</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .cart-container {
      padding: 24px 16px;
      min-height: calc(100vh - 64px - 200px);
    }

    h1 {
      font-size: 2rem;
      margin-bottom: 24px;
    }

    .login-prompt,
    .empty-cart {
      text-align: center;
      padding: 80px 24px;
      background: var(--bg-primary);
      border-radius: 8px;

      mat-icon {
        font-size: 80px;
        width: 80px;
        height: 80px;
        color: var(--gray-300);
        margin-bottom: 16px;
      }

      h2 {
        margin: 0 0 8px;
        color: var(--text-primary);
      }

      p {
        color: var(--text-secondary);
        margin-bottom: 24px;
      }
    }

    .cart-content {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 24px;
      align-items: start;
    }

    .cart-items {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .shop-group {
      padding: 16px;
    }

    .shop-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 16px;

      mat-icon {
        color: var(--primary);
      }

      .shop-name {
        font-weight: 500;
        font-size: 1.1rem;
      }
    }

    .cart-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 0;
      border-bottom: 1px solid var(--border-color);

      &:last-of-type {
        border-bottom: none;
      }
    }

    .item-image {
      width: 80px;
      height: 80px;
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
        color: var(--text-primary);
        text-decoration: none;

        &:hover {
          color: var(--primary);
        }
      }

      .item-variation {
        font-size: 0.85rem;
        color: var(--text-secondary);
      }

      .item-price {
        font-size: 0.9rem;
        color: var(--text-secondary);
      }
    }

    .item-quantity {
      display: flex;
      align-items: center;
      gap: 8px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 4px;

      span {
        min-width: 32px;
        text-align: center;
      }
    }

    .item-total {
      font-weight: 600;
      min-width: 80px;
      text-align: right;
    }

    .promo-section {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);

      .promo-input {
        flex: 1;
      }
    }

    .shop-subtotal {
      display: flex;
      justify-content: space-between;
      padding-top: 16px;
      margin-top: 16px;
      border-top: 1px solid var(--border-color);
      font-weight: 500;
    }

    .order-summary {
      position: sticky;
      top: 88px;
    }

    mat-card-header {
      margin-bottom: 16px;
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

    mat-divider {
      margin: 8px 0;
    }

    mat-card-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
    }

    .checkout-btn {
      width: 100%;
      height: 48px;
      font-size: 1rem;
    }

    .benefits {
      margin-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;

      .benefit {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: var(--bg-primary);
        border-radius: 8px;

        mat-icon {
          color: var(--primary);
        }

        div {
          display: flex;
          flex-direction: column;

          strong {
            font-size: 0.9rem;
          }

          span {
            font-size: 0.8rem;
            color: var(--text-secondary);
          }
        }
      }
    }

    @media (max-width: 768px) {
      .cart-content {
        grid-template-columns: 1fr;
      }

      .order-summary {
        position: static;
      }

      .cart-item {
        flex-wrap: wrap;

        .item-image {
          width: 60px;
          height: 60px;
        }

        .item-total {
          width: 100%;
          text-align: left;
          padding-left: 76px;
        }
      }

      h1 {
        font-size: 1.5rem;
      }

      .promo-section {
        flex-direction: column;

        button {
          width: 100%;
        }
      }
    }

    @media (max-width: 480px) {
      .cart-container {
        padding: 16px 12px;
      }

      h1 {
        font-size: 1.25rem;
        margin-bottom: 16px;
      }

      .login-prompt,
      .empty-cart {
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

      .shop-group {
        padding: 12px;
      }

      .cart-item {
        gap: 12px;
        padding: 12px 0;

        .item-image {
          width: 50px;
          height: 50px;
        }

        .item-total {
          padding-left: 62px;
          font-size: 0.9rem;
        }
      }

      .item-details {
        .item-name {
          font-size: 0.9rem;
        }

        .item-variation,
        .item-price {
          font-size: 0.8rem;
        }
      }

      .item-quantity {
        span {
          min-width: 24px;
          font-size: 0.9rem;
        }
      }

      .benefits {
        .benefit {
          padding: 10px;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }

          strong {
            font-size: 0.85rem;
          }

          span {
            font-size: 0.75rem;
          }
        }
      }

      .summary-row.total {
        font-size: 1.1rem;
      }

      .checkout-btn {
        height: 44px;
        font-size: 0.95rem;
      }
    }
  `]
})
export class CartComponent implements OnInit {
  isUpdating = signal(false);
  promoCodes: Record<string, string> = {};

  cart = computed(() => this.cartService.cart());

  groupedItems = computed(() => {
    const c = this.cart();
    if (!c || !c.items) return [];

    const groups: Record<string, { shopId: string; shopName: string; items: CartItem[]; subtotal: number }> = {};

    c.items.forEach(item => {
      const shopId = typeof item.shopId === 'string' ? item.shopId : (item.shopId as any)?._id || 'unknown';
      const shopName = typeof item.shopId === 'object' ? (item.shopId as any)?.name : 'Boutique';

      if (!groups[shopId]) {
        groups[shopId] = { shopId, shopName, items: [], subtotal: 0 };
      }
      groups[shopId].items.push(item);
      groups[shopId].subtotal += item.unitPrice * item.quantity;
    });

    return Object.values(groups);
  });

  constructor(
    public cartService: CartService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.isLoggedIn()) {
      this.cartService.loadCart().subscribe();
    }
  }

  isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  getVariationText(variation: any): string {
    if (!variation) return '';
    return Object.entries(variation)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }

  updateQuantity(item: CartItem, newQuantity: number): void {
    if (newQuantity < 1) return;

    this.isUpdating.set(true);
    this.cartService.updateItem(item._id, newQuantity).subscribe({
      next: () => this.isUpdating.set(false),
      error: () => this.isUpdating.set(false)
    });
  }

  removeItem(item: CartItem): void {
    this.isUpdating.set(true);
    this.cartService.removeItem(item._id).subscribe({
      next: () => this.isUpdating.set(false),
      error: () => this.isUpdating.set(false)
    });
  }

  applyPromoCode(shopId: string): void {
    const code = this.promoCodes[shopId];
    if (!code) return;

    this.cartService.applyPromoCode(code, shopId).subscribe({
      next: () => {
        this.promoCodes[shopId] = '';
      },
      error: () => {
        // Show error notification
      }
    });
  }

  clearCart(): void {
    if (confirm('Êtes-vous sûr de vouloir vider votre panier ?')) {
      this.cartService.clearCart().subscribe();
    }
  }

  calculateTotal(): number {
    const c = this.cart();
    if (!c) return 0;
    return c.subtotal - (c.discount || 0) + (c.deliveryFee || 0);
  }
}
