import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { ProductService } from '@shared/services/product.service';
import { CartService } from '@shared/services/cart.service';
import { Product, Shop, Variation, VariationOption } from '@shared/models/product.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';

@Component({
  selector: 'app-product-detail',
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
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
    MatDividerModule,
    LoadingComponent,
    AriaryPipe
  ],
  template: `
    @if (isLoading()) {
      <app-loading message="Chargement du produit..." fullscreen></app-loading>
    }

    @if (!isLoading() && product()) {
      <div class="product-detail-container container">
        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <a routerLink="/">Accueil</a>
          <mat-icon>chevron_right</mat-icon>
          <a routerLink="/catalog">Catalogue</a>
          @if (getShop()) {
            <mat-icon>chevron_right</mat-icon>
            <a [routerLink]="['/shop', getShop()!._id]">{{ getShop()!.name }}</a>
          }
          <mat-icon>chevron_right</mat-icon>
          <span>{{ product()!.name }}</span>
        </div>

        <div class="product-main">
          <!-- Images Gallery -->
          <div class="product-gallery">
            <div class="main-image">
              <img [src]="selectedImage()" [alt]="product()!.name">
              @if (product()!.compareAtPrice && product()!.compareAtPrice! > product()!.basePrice) {
                <span class="discount-badge">
                  -{{ getDiscountPercent() }}%
                </span>
              }
            </div>
            @if (product()!.images.length > 1) {
              <div class="thumbnail-list">
                @for (image of product()!.images; track $index) {
                  <button
                    class="thumbnail"
                    [class.active]="selectedImage() === image"
                    (click)="selectedImage.set(image)">
                    <img [src]="image" [alt]="product()!.name">
                  </button>
                }
              </div>
            }
          </div>

          <!-- Product Info -->
          <div class="product-info">
            <h1 class="product-name">{{ product()!.name }}</h1>

            @if (getShop()) {
              <a [routerLink]="['/shop', getShop()!._id]" class="shop-link">
                <mat-icon>store</mat-icon>
                {{ getShop()!.name }}
              </a>
            }

            @if (product()!.rating?.average) {
              <div class="rating">
                @for (star of [1,2,3,4,5]; track star) {
                  <mat-icon [class.filled]="star <= product()!.rating!.average">
                    {{ star <= product()!.rating!.average ? 'star' : 'star_border' }}
                  </mat-icon>
                }
                <span>{{ product()!.rating!.average.toFixed(1) }} ({{ product()!.rating!.count }} avis)</span>
              </div>
            }

            <div class="price-section">
              <span class="current-price">{{ calculatePrice() | ariary }}</span>
              @if (product()!.compareAtPrice && product()!.compareAtPrice! > product()!.basePrice) {
                <span class="original-price">{{ product()!.compareAtPrice | ariary }}</span>
                <span class="discount-tag">-{{ getDiscountPercent() }}%</span>
              }
            </div>

            @if (product()!.shortDescription) {
              <p class="short-description">{{ product()!.shortDescription }}</p>
            }

            <!-- Variations -->
            @if (product()!.variations && product()!.variations!.length > 0) {
              <div class="variations-section">
                @for (variation of product()!.variations; track variation._id) {
                  <div class="variation-group">
                    <label>{{ variation.name }}</label>
                    <mat-chip-listbox
                      [value]="selectedVariations()[variation.name]"
                      (change)="selectVariation(variation.name, $event.value)">
                      @for (option of variation.options; track option._id) {
                        <mat-chip-option
                          [value]="option.value"
                          [disabled]="option.stock <= 0"
                          [selectable]="option.stock > 0">
                          {{ option.value }}
                          @if (option.priceModifier !== 0) {
                            <span class="price-modifier">
                              ({{ option.priceModifier > 0 ? '+' : '' }}{{ option.priceModifier | ariary }})
                            </span>
                          }
                          @if (option.stock <= 0) {
                            <span class="out-of-stock">Rupture</span>
                          }
                        </mat-chip-option>
                      }
                    </mat-chip-listbox>
                  </div>
                }
              </div>
            }

            <!-- Quantity & Add to Cart -->
            <div class="purchase-section">
              <div class="quantity-selector">
                <button mat-icon-button (click)="decreaseQuantity()" [disabled]="quantity() <= 1">
                  <mat-icon>remove</mat-icon>
                </button>
                <span class="quantity">{{ quantity() }}</span>
                <button mat-icon-button (click)="increaseQuantity()" [disabled]="quantity() >= getMaxStock()">
                  <mat-icon>add</mat-icon>
                </button>
              </div>

              <div class="stock-status" [class.in-stock]="getMaxStock() > 0" [class.out-of-stock]="getMaxStock() <= 0">
                @if (getMaxStock() > 0) {
                  <mat-icon>check_circle</mat-icon>
                  <span>{{ getMaxStock() }} en stock</span>
                } @else {
                  <mat-icon>cancel</mat-icon>
                  <span>Rupture de stock</span>
                }
              </div>
            </div>

            <div class="action-buttons">
              <button
                mat-raised-button
                color="primary"
                class="add-to-cart-btn"
                [disabled]="getMaxStock() <= 0 || isAddingToCart()"
                (click)="addToCart()">
                <mat-icon>add_shopping_cart</mat-icon>
                Ajouter au panier
              </button>
              <button mat-stroked-button color="accent" class="favorite-btn">
                <mat-icon>favorite_border</mat-icon>
                Favoris
              </button>
            </div>

            <!-- Tags -->
            @if (product()!.tags && product()!.tags!.length > 0) {
              <div class="tags-section">
                <span class="tags-label">Tags:</span>
                <mat-chip-set>
                  @for (tag of product()!.tags; track tag) {
                    <mat-chip [routerLink]="['/catalog']" [queryParams]="{search: tag}">
                      {{ tag }}
                    </mat-chip>
                  }
                </mat-chip-set>
              </div>
            }
          </div>
        </div>

        <!-- Tabs: Description & Details -->
        <mat-tab-group class="product-tabs">
          <mat-tab label="Description">
            <div class="tab-content">
              @if (product()!.description) {
                <div [innerHTML]="product()!.description"></div>
              } @else {
                <p>Aucune description disponible.</p>
              }
            </div>
          </mat-tab>
          <mat-tab label="Caractéristiques">
            <div class="tab-content">
              <table class="specs-table">
                <tr>
                  <td>Référence</td>
                  <td>{{ product()!.sku || product()!._id }}</td>
                </tr>
                @if (getShop()) {
                  <tr>
                    <td>Vendeur</td>
                    <td>{{ getShop()!.name }}</td>
                  </tr>
                }
                @if (product()!.variations) {
                  @for (variation of product()!.variations; track variation._id) {
                    <tr>
                      <td>{{ variation.name }}</td>
                      <td>{{ getVariationValues(variation) }}</td>
                    </tr>
                  }
                }
              </table>
            </div>
          </mat-tab>
        </mat-tab-group>

        <!-- Related Products -->
        @if (relatedProducts().length > 0) {
          <section class="related-products">
            <h2>Produits similaires</h2>
            <div class="products-grid">
              @for (related of relatedProducts(); track related._id) {
                <mat-card class="product-card" [routerLink]="['/product', related._id]">
                  <img [src]="related.images[0] || '/assets/placeholder.png'" [alt]="related.name" class="product-image">
                  <mat-card-content>
                    <h3>{{ related.name }}</h3>
                    <span class="price">{{ related.basePrice | ariary }}</span>
                  </mat-card-content>
                </mat-card>
              }
            </div>
          </section>
        }
      </div>
    }

    @if (!isLoading() && !product()) {
      <div class="not-found container">
        <mat-icon>error_outline</mat-icon>
        <h2>Produit non trouvé</h2>
        <p>Le produit que vous recherchez n'existe pas ou a été supprimé.</p>
        <a routerLink="/catalog" mat-raised-button color="primary">
          Retour au catalogue
        </a>
      </div>
    }
  `,
  styles: [`
    .product-detail-container {
      padding: 24px 16px;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 24px;
      font-size: 0.9rem;
      flex-wrap: wrap;

      a {
        color: var(--primary);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }

      span {
        color: var(--text-secondary);
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--text-secondary);
      }
    }

    .product-main {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
      margin-bottom: 48px;
    }

    .product-gallery {
      .main-image {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 16px;

        img {
          width: 100%;
          height: 500px;
          object-fit: contain;
          background: var(--bg-secondary);
        }
      }

      .discount-badge {
        position: absolute;
        top: 16px;
        left: 16px;
        background: var(--error);
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        font-weight: 600;
      }

      .thumbnail-list {
        display: flex;
        gap: 12px;
        overflow-x: auto;
      }

      .thumbnail {
        width: 80px;
        height: 80px;
        padding: 0;
        border: 2px solid transparent;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        background: none;

        &.active {
          border-color: var(--primary);
        }

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
    }

    .product-info {
      .product-name {
        font-size: 2rem;
        font-weight: 600;
        margin: 0 0 12px;
      }

      .shop-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--primary);
        text-decoration: none;
        font-size: 1rem;
        margin-bottom: 12px;

        &:hover {
          text-decoration: underline;
        }

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      .rating {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 16px;

        mat-icon {
          color: var(--gray-300);
          font-size: 20px;
          width: 20px;
          height: 20px;

          &.filled {
            color: var(--warning);
          }
        }

        span {
          color: var(--text-secondary);
          margin-left: 8px;
        }
      }

      .price-section {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;

        .current-price {
          font-size: 2rem;
          font-weight: 700;
          color: var(--primary);
        }

        .original-price {
          font-size: 1.25rem;
          text-decoration: line-through;
          color: var(--text-secondary);
        }

        .discount-tag {
          background: var(--error-light);
          color: var(--error);
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
        }
      }

      .short-description {
        color: var(--text-secondary);
        line-height: 1.6;
        margin-bottom: 24px;
      }
    }

    .variations-section {
      margin-bottom: 24px;

      .variation-group {
        margin-bottom: 16px;

        label {
          display: block;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .price-modifier {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .out-of-stock {
          font-size: 0.75rem;
          color: var(--error);
          margin-left: 4px;
        }
      }
    }

    .purchase-section {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-bottom: 24px;
    }

    .quantity-selector {
      display: flex;
      align-items: center;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;

      .quantity {
        width: 50px;
        text-align: center;
        font-size: 1.1rem;
        font-weight: 500;
      }
    }

    .stock-status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;

      &.in-stock {
        color: var(--success);
      }

      &.out-of-stock {
        color: var(--error);
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .action-buttons {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;

      .add-to-cart-btn {
        flex: 1;
        height: 48px;
        font-size: 1rem;
      }

      .favorite-btn {
        height: 48px;
      }
    }

    .tags-section {
      display: flex;
      align-items: center;
      gap: 12px;

      .tags-label {
        color: var(--text-secondary);
      }
    }

    .product-tabs {
      margin-bottom: 48px;
    }

    .tab-content {
      padding: 24px;
      background: var(--bg-primary);
      min-height: 200px;
    }

    .specs-table {
      width: 100%;
      max-width: 500px;
      border-collapse: collapse;

      tr {
        border-bottom: 1px solid var(--border-color);
      }

      td {
        padding: 12px 0;

        &:first-child {
          color: var(--text-secondary);
          width: 40%;
        }
      }
    }

    .related-products {
      h2 {
        font-size: 1.5rem;
        margin-bottom: 24px;
      }

      .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 24px;
      }

      .product-card {
        cursor: pointer;
        transition: transform 0.2s;

        &:hover {
          transform: translateY(-4px);
        }

        .product-image {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }

        h3 {
          font-size: 0.95rem;
          margin: 8px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .price {
          font-weight: 600;
          color: var(--primary);
        }
      }
    }

    .not-found {
      text-align: center;
      padding: 80px 24px;

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

    @media (max-width: 768px) {
      .product-main {
        grid-template-columns: 1fr;
        gap: 24px;
      }

      .product-gallery .main-image img {
        height: 300px;
      }

      .product-info .product-name {
        font-size: 1.5rem;
      }

      .product-info .price-section .current-price {
        font-size: 1.5rem;
      }

      .action-buttons {
        flex-direction: column;
      }

      .purchase-section {
        flex-wrap: wrap;
        gap: 16px;
      }

      .tab-content {
        padding: 16px;
      }

      .related-products .products-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }
    }

    @media (max-width: 480px) {
      .product-detail-container {
        padding: 16px 12px;
      }

      .breadcrumb {
        font-size: 0.8rem;
        margin-bottom: 16px;

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
      }

      .product-gallery {
        .main-image img {
          height: 250px;
        }

        .thumbnail {
          width: 60px;
          height: 60px;
        }
      }

      .product-info {
        .product-name {
          font-size: 1.25rem;
        }

        .shop-link {
          font-size: 0.9rem;
        }

        .price-section {
          flex-wrap: wrap;
          gap: 8px;

          .current-price {
            font-size: 1.35rem;
          }

          .original-price {
            font-size: 1rem;
          }
        }

        .short-description {
          font-size: 0.9rem;
        }
      }

      .variations-section .variation-group {
        label {
          font-size: 0.9rem;
        }
      }

      .purchase-section {
        flex-direction: column;
        align-items: flex-start;
      }

      .action-buttons {
        gap: 12px;

        .add-to-cart-btn,
        .favorite-btn {
          height: 44px;
          font-size: 0.9rem;
        }
      }

      .tab-content {
        padding: 12px;
        min-height: 150px;
      }

      .specs-table td {
        padding: 8px 0;
        font-size: 0.9rem;
      }

      .related-products {
        h2 {
          font-size: 1.25rem;
          margin-bottom: 16px;
        }

        .products-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .product-card {
          .product-image {
            height: 120px;
          }

          h3 {
            font-size: 0.85rem;
          }

          .price {
            font-size: 0.9rem;
          }
        }
      }

      .not-found {
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
    }
  `]
})
export class ProductDetailComponent implements OnInit {
  product = signal<Product | null>(null);
  relatedProducts = signal<Product[]>([]);
  isLoading = signal(true);
  isAddingToCart = signal(false);

  selectedImage = signal<string>('');
  selectedVariations = signal<Record<string, string>>({});
  quantity = signal(1);

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const productId = params['id'];
      if (productId) {
        this.loadProduct(productId);
      }
    });
  }

  loadProduct(id: string): void {
    this.isLoading.set(true);
    this.quantity.set(1);
    this.selectedVariations.set({});

    this.productService.getProduct(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.product.set(response.data.product);
          this.relatedProducts.set(response.data.relatedProducts || []);

          if (response.data.product.images.length > 0) {
            this.selectedImage.set(response.data.product.images[0]);
          }

          // Pre-select first option for each variation
          if (response.data.product.variations) {
            const selections: Record<string, string> = {};
            response.data.product.variations.forEach(v => {
              const availableOption = v.options.find(o => o.stock > 0);
              if (availableOption) {
                selections[v.name] = availableOption.value;
              }
            });
            this.selectedVariations.set(selections);
          }
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.product.set(null);
      }
    });
  }

  getShop(): Shop | null {
    const shopId = this.product()?.shopId;
    if (typeof shopId === 'object' && shopId) {
      return shopId;
    }
    return null;
  }

  getDiscountPercent(): number {
    const p = this.product();
    if (!p || !p.compareAtPrice || p.compareAtPrice <= p.basePrice) return 0;
    return Math.round((1 - p.basePrice / p.compareAtPrice) * 100);
  }

  calculatePrice(): number {
    const p = this.product();
    if (!p) return 0;

    let price = p.basePrice;

    if (p.variations) {
      const selections = this.selectedVariations();
      p.variations.forEach(v => {
        const selectedValue = selections[v.name];
        if (selectedValue) {
          const option = v.options.find(o => o.value === selectedValue);
          if (option) {
            price += option.priceModifier;
          }
        }
      });
    }

    return price;
  }

  getMaxStock(): number {
    const p = this.product();
    if (!p) return 0;

    if (p.variations && p.variations.length > 0) {
      const selections = this.selectedVariations();
      let minStock = Infinity;

      p.variations.forEach(v => {
        const selectedValue = selections[v.name];
        if (selectedValue) {
          const option = v.options.find(o => o.value === selectedValue);
          if (option) {
            minStock = Math.min(minStock, option.stock);
          }
        }
      });

      return minStock === Infinity ? 0 : minStock;
    }

    return p.stock;
  }

  selectVariation(name: string, value: string): void {
    const current = this.selectedVariations();
    this.selectedVariations.set({ ...current, [name]: value });

    // Reset quantity if it exceeds new stock
    if (this.quantity() > this.getMaxStock()) {
      this.quantity.set(Math.max(1, this.getMaxStock()));
    }
  }

  increaseQuantity(): void {
    if (this.quantity() < this.getMaxStock()) {
      this.quantity.update(q => q + 1);
    }
  }

  decreaseQuantity(): void {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  addToCart(): void {
    const p = this.product();
    if (!p || this.getMaxStock() <= 0) return;

    this.isAddingToCart.set(true);

    const variation = Object.keys(this.selectedVariations()).length > 0
      ? this.selectedVariations()
      : undefined;

    this.cartService.addToCart(p._id, this.quantity(), variation).subscribe({
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

  getVariationValues(variation: Variation): string {
    return variation.options.map(o => o.value).join(', ');
  }
}
