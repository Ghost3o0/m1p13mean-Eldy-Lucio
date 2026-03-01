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
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],})
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


