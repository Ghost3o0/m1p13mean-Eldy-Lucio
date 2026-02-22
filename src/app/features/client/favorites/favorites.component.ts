import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ProductService } from '@shared/services/product.service';
import { CartService } from '@shared/services/cart.service';
import { AuthService } from '@core/services/auth.service';
import { Product, Pagination } from '@shared/models/product.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    AriaryPipe,
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    LoadingComponent,
    AriaryPipe
  ],
  template: `
    <div class="favorites-container container">
      <h1>Mes favoris</h1>

      @if (isLoading()) {
        <app-loading message="Chargement des favoris..."></app-loading>
      }

      @if (!isLoading()) {
        @if (favorites().length === 0) {
          <div class="empty-favorites">
            <mat-icon>favorite_border</mat-icon>
            <h2>Aucun favori</h2>
            <p>Vous n'avez pas encore de produits favoris.</p>
            <a routerLink="/catalog" mat-raised-button color="primary">
              Explorer le catalogue
            </a>
          </div>
        } @else {
          <div class="favorites-grid">
            @for (product of favorites(); track product._id) {
              <mat-card class="favorite-card">
                <button mat-icon-button class="remove-btn" (click)="removeFavorite(product._id)" [disabled]="isRemoving()">
                  <mat-icon>close</mat-icon>
                </button>
                <a [routerLink]="['/product', product._id]">
                  <img [src]="product.images[0] || '/assets/placeholder.png'" [alt]="product.name" class="product-image">
                </a>
                <mat-card-content>
                  <a [routerLink]="['/product', product._id]" class="product-name">
                    {{ product.name }}
                  </a>
                  @if (getShopName(product.shopId)) {
                    <span class="product-shop">{{ getShopName(product.shopId) }}</span>
                  }
                  <div class="product-price-row">
                    <span class="product-price">{{ product.basePrice | ariary }}</span>
                    @if (product.compareAtPrice && product.compareAtPrice > product.basePrice) {
                      <span class="product-old-price">{{ product.compareAtPrice | ariary }}</span>
                    }
                  </div>
                  <div class="stock-status" [class.in-stock]="product.stock > 0" [class.out-of-stock]="product.stock <= 0">
                    @if (product.stock > 0) {
                      <mat-icon>check_circle</mat-icon>
                      En stock
                    } @else {
                      <mat-icon>cancel</mat-icon>
                      Rupture de stock
                    }
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <button
                    mat-raised-button
                    color="primary"
                    class="add-cart-btn"
                    [disabled]="product.stock <= 0 || isAddingToCart()"
                    (click)="addToCart(product)">
                    <mat-icon>add_shopping_cart</mat-icon>
                    Ajouter au panier
                  </button>
                </mat-card-actions>
              </mat-card>
            }
          </div>

          @if (pagination() && pagination()!.totalPages > 1) {
            <mat-paginator
              [length]="pagination()!.total"
              [pageSize]="pagination()!.limit"
              [pageIndex]="pagination()!.page - 1"
              [pageSizeOptions]="[12, 24, 48]"
              (page)="onPageChange($event)"
              showFirstLastButtons>
            </mat-paginator>
          }
        }
      }
    </div>
  `,
  styles: [`
    .favorites-container {
      padding: 24px 16px;
      min-height: calc(100vh - 64px - 200px);
    }

    h1 {
      font-size: 2rem;
      margin-bottom: 24px;
    }

    .empty-favorites {
      text-align: center;
      padding: 80px 24px;
      background: white;
      border-radius: 8px;

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

    .favorites-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 24px;
    }

    .favorite-card {
      position: relative;
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0,0,0,0.15);
      }

      .remove-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 1;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
    }

    .product-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }

    mat-card-content {
      padding: 16px;
    }

    .product-name {
      display: block;
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 4px;
      text-decoration: none;
      color: #333;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;

      &:hover {
        color: #3f51b5;
      }
    }

    .product-shop {
      display: block;
      font-size: 0.85rem;
      color: #666;
      margin-bottom: 8px;
    }

    .product-price-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .product-price {
      font-size: 1.25rem;
      font-weight: 700;
      color: #3f51b5;
    }

    .product-old-price {
      text-decoration: line-through;
      color: #999;
      font-size: 0.9rem;
    }

    .stock-status {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.85rem;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      &.in-stock {
        color: #4caf50;
      }

      &.out-of-stock {
        color: #f44336;
      }
    }

    mat-card-actions {
      padding: 0 16px 16px;
    }

    .add-cart-btn {
      width: 100%;
    }

    mat-paginator {
      margin-top: 24px;
      background: white;
      border-radius: 4px;
    }

    @media (max-width: 768px) {
      .favorites-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .product-name {
        font-size: 0.9rem;
      }

      .product-price {
        font-size: 1rem;
      }
    }
  `]
})
export class FavoritesComponent implements OnInit {
  favorites = signal<Product[]>([]);
  pagination = signal<Pagination | null>(null);
  isLoading = signal(true);
  isRemoving = signal(false);
  isAddingToCart = signal(false);

  constructor(
    private authService: AuthService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadFavorites();
  }

  loadFavorites(page = 1): void {
    this.isLoading.set(true);

    this.authService.getFavorites(page, 12).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.favorites.set(response.data.favorites);
          this.pagination.set(response.data.pagination);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.loadFavorites(event.pageIndex + 1);
  }

  getShopName(shopId: string | any): string {
    if (typeof shopId === 'object' && shopId?.name) {
      return shopId.name;
    }
    return '';
  }

  removeFavorite(productId: string): void {
    this.isRemoving.set(true);

    this.authService.removeFavorite(productId).subscribe({
      next: () => {
        this.favorites.update(favs => favs.filter(f => f._id !== productId));
        this.isRemoving.set(false);
      },
      error: () => {
        this.isRemoving.set(false);
      }
    });
  }

  addToCart(product: Product): void {
    if (product.stock <= 0) return;

    this.isAddingToCart.set(true);

    this.cartService.addToCart(product._id, 1).subscribe({
      next: () => {
        this.isAddingToCart.set(false);
        // Show success notification
      },
      error: () => {
        this.isAddingToCart.set(false);
        // Show error notification
      }
    });
  }
}
