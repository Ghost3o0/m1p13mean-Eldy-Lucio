import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ProductService } from '@shared/services/product.service';
import { Product, Shop, Pagination } from '@shared/models/product.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';

@Component({
  selector: 'app-shop-detail',
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
    @if (isLoading()) {
      <app-loading [fullscreen]="true" message="Chargement de la boutique..."></app-loading>
    }

    @if (!isLoading() && shop()) {
      <!-- Shop Header -->
      <div class="shop-header">
        <div class="shop-banner" [style.backgroundImage]="'url(' + (shop()!.banner || '/assets/shop-banner.jpg') + ')'">
          <div class="banner-overlay"></div>
        </div>
        <div class="shop-info-container">
          <div class="shop-logo">
            @if (shop()!.logo) {
              <img [src]="shop()!.logo" [alt]="shop()!.name">
            } @else {
              <mat-icon>store</mat-icon>
            }
          </div>
          <div class="shop-details">
            <h1>{{ shop()!.name }}</h1>
            @if (shop()!.rating?.average) {
              <div class="shop-rating">
                <mat-icon>star</mat-icon>
                <span class="rating-value">{{ shop()!.rating!.average!.toFixed(1) }}</span>
                <span class="rating-count">({{ shop()!.rating!.count }} avis)</span>
              </div>
            }
            @if (shop()!.shortDescription) {
              <p class="shop-description">{{ shop()!.shortDescription }}</p>
            }
          </div>
          <div class="shop-actions">
            @if (isShopOpen()) {
              <span class="status-badge open">
                <mat-icon>access_time</mat-icon>
                Ouvert
              </span>
            } @else {
              <span class="status-badge closed">
                <mat-icon>schedule</mat-icon>
                Fermé
              </span>
            }
          </div>
        </div>
      </div>

      <div class="shop-content">
        <mat-tab-group>
          <!-- Products Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>inventory_2</mat-icon>
              <span>Produits ({{ pagination()?.total || 0 }})</span>
            </ng-template>

            <div class="tab-content">
              @if (products().length > 0) {
                <div class="products-grid">
                  @for (product of products(); track product._id) {
                    <div class="product-card" [routerLink]="['/product', product._id]">
                      <div class="product-image-wrapper">
                        <img [src]="product.images[0] || '/assets/placeholder.png'" [alt]="product.name">
                        @if (product.compareAtPrice && product.compareAtPrice > product.basePrice) {
                          <span class="badge sale">-{{ getDiscountPercent(product) }}%</span>
                        }
                        @if (product.isFeatured) {
                          <span class="badge featured">Vedette</span>
                        }
                      </div>
                      <div class="product-info">
                        <h3>{{ product.name }}</h3>
                        <div class="product-price">
                          <span class="current-price">{{ product.basePrice | ariary:'symbol':'1.2-2':'fr' }}</span>
                          @if (product.compareAtPrice && product.compareAtPrice > product.basePrice) {
                            <span class="original-price">{{ product.compareAtPrice | ariary:'symbol':'1.2-2':'fr' }}</span>
                          }
                        </div>
                      </div>
                    </div>
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
              } @else {
                <div class="empty-state">
                  <mat-icon>inventory_2</mat-icon>
                  <h3>Aucun produit</h3>
                  <p>Cette boutique n'a pas encore ajouté de produits.</p>
                </div>
              }
            </div>
          </mat-tab>

          <!-- Info Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>info</mat-icon>
              <span>Informations</span>
            </ng-template>

            <div class="tab-content">
              <div class="info-grid">
                <!-- Description -->
                @if (shop()!.description) {
                  <div class="info-card">
                    <h3>
                      <mat-icon>description</mat-icon>
                      À propos
                    </h3>
                    <p>{{ shop()!.description }}</p>
                  </div>
                }

                <!-- Contact -->
                <div class="info-card">
                  <h3>
                    <mat-icon>contact_phone</mat-icon>
                    Contact
                  </h3>
                  @if (shop()!.contact?.email) {
                    <div class="contact-item">
                      <mat-icon>email</mat-icon>
                      <a [href]="'mailto:' + shop()!.contact!.email">{{ shop()!.contact!.email }}</a>
                    </div>
                  }
                  @if (shop()!.contact?.phone) {
                    <div class="contact-item">
                      <mat-icon>phone</mat-icon>
                      <a [href]="'tel:' + shop()!.contact!.phone">{{ shop()!.contact!.phone }}</a>
                    </div>
                  }
                  @if (shop()!.contact?.website) {
                    <div class="contact-item">
                      <mat-icon>language</mat-icon>
                      <a [href]="shop()!.contact!.website" target="_blank">{{ shop()!.contact!.website }}</a>
                    </div>
                  }
                </div>

                <!-- Location -->
                @if (shop()!.address?.location) {
                  <div class="info-card">
                    <h3>
                      <mat-icon>location_on</mat-icon>
                      Emplacement
                    </h3>
                    <p>{{ shop()!.address!.location }}</p>
                    @if (shop()!.address!.floor) {
                      <p>Étage: {{ shop()!.address!.floor }}</p>
                    }
                  </div>
                }

                <!-- Hours -->
                @if (shop()!.hours && shop()!.hours!.length > 0) {
                  <div class="info-card hours-card">
                    <h3>
                      <mat-icon>schedule</mat-icon>
                      Horaires d'ouverture
                    </h3>
                    <div class="hours-list">
                      @for (hour of shop()!.hours; track hour.day) {
                        <div class="hour-row" [class.today]="isToday(hour.day)" [class.closed]="hour.isClosed">
                          <span class="day-name">{{ getDayName(hour.day) }}</span>
                          @if (hour.isClosed) {
                            <span class="hour-value">Fermé</span>
                          } @else {
                            <span class="hour-value">{{ hour.open }} - {{ hour.close }}</span>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    }

    @if (!isLoading() && !shop()) {
      <div class="not-found">
        <mat-icon>store_off</mat-icon>
        <h2>Boutique non trouvée</h2>
        <p>Cette boutique n'existe pas ou n'est plus disponible.</p>
        <a routerLink="/catalog" mat-raised-button color="primary">
          Voir toutes les boutiques
        </a>
      </div>
    }
  `,
  styles: [`
    /* Shop Header */
    .shop-header {
      position: relative;
    }

    .shop-banner {
      height: 250px;
      background-size: cover;
      background-position: center;
      position: relative;
    }

    .banner-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, transparent 0%, rgba(26, 26, 46, 0.8) 100%);
    }

    .shop-info-container {
      display: flex;
      align-items: flex-end;
      gap: 24px;
      max-width: 1400px;
      margin: -80px auto 0;
      padding: 0 24px;
      position: relative;
      z-index: 1;
    }

    .shop-logo {
      width: 140px;
      height: 140px;
      background: white;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      flex-shrink: 0;

      img {
        max-width: 100px;
        max-height: 100px;
        object-fit: contain;
      }

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #ccc;
      }
    }

    .shop-details {
      flex: 1;
      padding-bottom: 16px;

      h1 {
        font-size: 2rem;
        font-weight: 700;
        color: white;
        margin: 0 0 8px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
    }

    .shop-rating {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #ffd93d;
      }

      .rating-value {
        font-weight: 600;
        color: white;
      }

      .rating-count {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.9rem;
      }
    }

    .shop-description {
      color: rgba(255, 255, 255, 0.8);
      margin: 0;
      max-width: 600px;
    }

    .shop-actions {
      padding-bottom: 16px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &.open {
        background: #e8f5e9;
        color: #2e7d32;
      }

      &.closed {
        background: #ffebee;
        color: #c62828;
      }
    }

    /* Shop Content */
    .shop-content {
      max-width: 1400px;
      margin: 32px auto;
      padding: 0 24px;
    }

    mat-tab-group {
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .tab-content {
      padding: 24px;
    }

    /* Products Grid */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 24px;
    }

    .product-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid #f0f0f0;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);

        img {
          transform: scale(1.05);
        }
      }
    }

    .product-image-wrapper {
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
      background: #f8f9fa;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.4s ease;
      }
    }

    .badge {
      position: absolute;
      top: 10px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;

      &.sale {
        left: 10px;
        background: #ff6b6b;
        color: white;
      }

      &.featured {
        right: 10px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
      }
    }

    .product-info {
      padding: 16px;

      h3 {
        font-size: 0.95rem;
        font-weight: 600;
        color: #1a1a2e;
        margin: 0 0 8px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }

    .product-price {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .current-price {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1a1a2e;
    }

    .original-price {
      text-decoration: line-through;
      color: #999;
      font-size: 0.9rem;
    }

    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
    }

    .info-card {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 20px;

      h3 {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 1rem;
        font-weight: 600;
        color: #1a1a2e;
        margin: 0 0 16px;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          color: #667eea;
        }
      }

      p {
        color: #666;
        line-height: 1.6;
        margin: 0;
      }
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #999;
      }

      a {
        color: #667eea;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .hours-card {
      grid-column: span 1;
    }

    .hours-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .hour-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;

      &:last-child {
        border-bottom: none;
      }

      &.today {
        background: #f0f2ff;
        margin: 0 -12px;
        padding: 8px 12px;
        border-radius: 6px;

        .day-name {
          font-weight: 600;
          color: #667eea;
        }
      }

      &.closed .hour-value {
        color: #c62828;
      }

      .day-name {
        font-weight: 500;
        color: #333;
      }

      .hour-value {
        color: #666;
      }
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 60px 20px;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #ddd;
        margin-bottom: 16px;
      }

      h3 {
        font-size: 1.25rem;
        color: #333;
        margin: 0 0 8px;
      }

      p {
        color: #666;
        margin: 0;
      }
    }

    /* Not Found */
    .not-found {
      min-height: 60vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px;

      mat-icon {
        font-size: 80px;
        width: 80px;
        height: 80px;
        color: #ddd;
        margin-bottom: 24px;
      }

      h2 {
        font-size: 1.5rem;
        color: #333;
        margin: 0 0 8px;
      }

      p {
        color: #666;
        margin: 0 0 24px;
      }
    }

    mat-paginator {
      margin-top: 24px;
      background: transparent;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .shop-banner {
        height: 180px;
      }

      .shop-info-container {
        flex-direction: column;
        align-items: center;
        text-align: center;
        margin-top: -60px;
      }

      .shop-logo {
        width: 100px;
        height: 100px;

        img {
          max-width: 70px;
          max-height: 70px;
        }

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
        }
      }

      .shop-details {
        padding-bottom: 0;

        h1 {
          font-size: 1.5rem;
        }
      }

      .shop-rating {
        justify-content: center;
      }

      .shop-description {
        text-align: center;
      }

      .products-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ShopDetailComponent implements OnInit {
  shop = signal<Shop | null>(null);
  products = signal<Product[]>([]);
  pagination = signal<Pagination | null>(null);
  isLoading = signal(true);

  private shopId: string = '';
  private daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.shopId = params['id'];
      this.loadShop();
    });
  }

  loadShop(): void {
    this.isLoading.set(true);

    this.productService.getShop(this.shopId).subscribe({
      next: (response) => {
        if (response.success) {
          this.shop.set(response.data.shop);
          this.loadProducts();
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadProducts(page = 1): void {
    this.productService.getProducts({
      shop: this.shopId,
      page,
      limit: 12
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.products.set(response.data.products);
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
    this.loadProducts(event.pageIndex + 1);
  }

  getDiscountPercent(product: Product): number {
    if (!product.compareAtPrice || product.compareAtPrice <= product.basePrice) return 0;
    return Math.round((1 - product.basePrice / product.compareAtPrice) * 100);
  }

  getDayName(day: number): string {
    return this.daysOfWeek[day] || '';
  }

  isToday(day: number): boolean {
    return new Date().getDay() === day;
  }

  isShopOpen(): boolean {
    const shop = this.shop();
    if (!shop?.hours) return false;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const todayHours = shop.hours.find(h => h.day === dayOfWeek);
    if (!todayHours || todayHours.isClosed) return false;

    return currentTime >= (todayHours.open || '00:00') && currentTime <= (todayHours.close || '23:59');
  }
}
