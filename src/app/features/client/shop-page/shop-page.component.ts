import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';

interface ShopLanding {
  hero: {
    enabled: boolean;
    title: string;
    subtitle: string;
    backgroundImage?: string;
    ctaText?: string;
    ctaLink?: string;
  };
  banners: any[];
  shopContent: {
    aboutUs?: string;
    promotionalText?: string;
    theme?: {
      primaryColor: string;
      secondaryColor: string;
    };
  };
  isPublished: boolean;
}

interface ShopInfo {
  _id: string;
  name: string;
  logo?: string;
  banner?: string;
  contact: {
    phone?: string;
    email?: string;
  };
  hours?: any[];
  rating?: {
    average: number;
    count: number;
  };
}

interface Product {
  _id: string;
  name: string;
  images: string[];
  basePrice: number;
  compareAtPrice?: number;
  stock: number;
}

@Component({
  selector: 'app-shop-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    LoadingComponent,
    AriaryPipe
  ],
  template: `
    @if (isLoading()) {
      <app-loading message="Chargement de la boutique..." fullscreen></app-loading>
    }

    @if (!isLoading() && error()) {
      <div class="error-container">
        <mat-icon>error_outline</mat-icon>
        <h2>{{ error() }}</h2>
        <a routerLink="/" mat-raised-button color="primary">
          Retour à l'accueil
        </a>
      </div>
    }

    @if (!isLoading() && !error() && shop()) {
      <div class="shop-page" [style.--shop-primary]="getThemeColor('primary')" [style.--shop-secondary]="getThemeColor('secondary')">
        <!-- Hero Section -->
        @if (landing()?.hero?.enabled) {
          <section class="hero-section" [style.backgroundImage]="getHeroBackground()">
            <div class="hero-overlay"></div>
            <div class="hero-content">
              <h1>{{ landing()?.hero?.title || shop()?.name }}</h1>
              @if (landing()?.hero?.subtitle) {
                <p class="hero-subtitle">{{ landing()?.hero?.subtitle }}</p>
              }
              @if (landing()?.hero?.ctaText) {
                <a [routerLink]="landing()?.hero?.ctaLink || '/catalog'"
                   [queryParams]="{shop: shop()?._id}"
                   mat-raised-button color="primary" class="cta-btn">
                  {{ landing()?.hero?.ctaText }}
                </a>
              }
            </div>
          </section>
        } @else {
          <section class="simple-header">
            <div class="shop-logo">
              @if (shop()?.logo) {
                <img [src]="shop()?.logo" [alt]="shop()?.name">
              } @else {
                <mat-icon>store</mat-icon>
              }
            </div>
            <h1>{{ shop()?.name }}</h1>
            @if (shop()?.rating?.count) {
              <div class="shop-rating">
                <mat-icon>star</mat-icon>
                <span>{{ shop()?.rating?.average?.toFixed(1) }}</span>
                <span class="count">({{ shop()?.rating?.count }} avis)</span>
              </div>
            }
          </section>
        }

        <!-- Navigation Tabs -->
        <mat-tab-group class="shop-tabs">
          <mat-tab label="Produits">
            <div class="tab-content">
              @if (products().length === 0) {
                <div class="empty-products">
                  <mat-icon>inventory_2</mat-icon>
                  <p>Aucun produit disponible pour le moment.</p>
                </div>
              } @else {
                <div class="products-grid">
                  @for (product of products(); track product._id) {
                    <mat-card class="product-card" [routerLink]="['/product', product._id]">
                      <div class="product-image">
                        <img [src]="product.images[0] || '/assets/placeholder.png'" [alt]="product.name">
                        @if (product.compareAtPrice && product.compareAtPrice > product.basePrice) {
                          <span class="discount-badge">
                            -{{ getDiscountPercent(product) }}%
                          </span>
                        }
                      </div>
                      <mat-card-content>
                        <h3 class="product-name">{{ product.name }}</h3>
                        <div class="product-price">
                          <span class="current-price">{{ product.basePrice | ariary }}</span>
                          @if (product.compareAtPrice && product.compareAtPrice > product.basePrice) {
                            <span class="old-price">{{ product.compareAtPrice | ariary }}</span>
                          }
                        </div>
                      </mat-card-content>
                    </mat-card>
                  }
                </div>
                <div class="view-all">
                  <a [routerLink]="['/catalog']" [queryParams]="{shop: shop()?._id}" mat-stroked-button>
                    Voir tous les produits
                    <mat-icon>arrow_forward</mat-icon>
                  </a>
                </div>
              }
            </div>
          </mat-tab>

          <mat-tab label="À propos">
            <div class="tab-content about-section">
              @if (landing()?.shopContent?.aboutUs) {
                <p>{{ landing()?.shopContent?.aboutUs }}</p>
              } @else {
                <p>Aucune description disponible.</p>
              }

              @if (landing()?.shopContent?.promotionalText) {
                <div class="promo-banner">
                  <mat-icon>local_offer</mat-icon>
                  <span>{{ landing()?.shopContent?.promotionalText }}</span>
                </div>
              }
            </div>
          </mat-tab>

          <mat-tab label="Contact">
            <div class="tab-content contact-section">
              <div class="contact-info">
                @if (shop()?.contact?.phone) {
                  <div class="contact-item">
                    <mat-icon>phone</mat-icon>
                    <span>{{ shop()?.contact?.phone }}</span>
                  </div>
                }
                @if (shop()?.contact?.email) {
                  <div class="contact-item">
                    <mat-icon>email</mat-icon>
                    <a [href]="'mailto:' + shop()?.contact?.email">{{ shop()?.contact?.email }}</a>
                  </div>
                }
              </div>

              @if (shop()?.hours?.length) {
                <div class="opening-hours">
                  <h4>Horaires d'ouverture</h4>
                  @for (hour of shop()?.hours; track hour.day) {
                    <div class="hour-row" [class.closed]="hour.closed">
                      <span class="day">{{ getDayName(hour.day) }}</span>
                      @if (hour.closed) {
                        <span class="time">Fermé</span>
                      } @else {
                        <span class="time">{{ hour.open }} - {{ hour.close }}</span>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    }
  `,
  styles: [`
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      text-align: center;
      padding: 24px;

      mat-icon {
        font-size: 80px;
        width: 80px;
        height: 80px;
        color: var(--error);
        margin-bottom: 16px;
      }

      h2 {
        margin-bottom: 24px;
        color: var(--text-secondary);
      }
    }

    .shop-page {
      --shop-primary: var(--primary);
      --shop-secondary: var(--secondary);
    }

    .hero-section {
      position: relative;
      min-height: 400px;
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.3));
    }

    .hero-content {
      position: relative;
      z-index: 1;
      text-align: center;
      color: white;
      padding: 24px;
      max-width: 800px;

      h1 {
        font-size: 3rem;
        font-weight: 700;
        margin: 0 0 16px;
      }

      .hero-subtitle {
        font-size: 1.25rem;
        opacity: 0.9;
        margin: 0 0 24px;
      }

      .cta-btn {
        padding: 12px 32px;
        font-size: 1.1rem;
      }
    }

    .simple-header {
      text-align: center;
      padding: 48px 24px;
      background: linear-gradient(135deg, var(--shop-primary), var(--shop-secondary));
      color: white;

      .shop-logo {
        width: 100px;
        height: 100px;
        margin: 0 auto 16px;
        border-radius: 50%;
        overflow: hidden;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: var(--shop-primary);
        }
      }

      h1 {
        font-size: 2rem;
        margin: 0 0 8px;
      }

      .shop-rating {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;

        mat-icon {
          color: #ffc107;
          font-size: 20px;
          width: 20px;
          height: 20px;
        }

        .count {
          opacity: 0.8;
        }
      }
    }

    .shop-tabs {
      max-width: 1200px;
      margin: 0 auto;
    }

    .tab-content {
      padding: 24px;
    }

    .empty-products {
      text-align: center;
      padding: 48px;
      color: var(--text-secondary);

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
      }
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 24px;
    }

    .product-card {
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }

      .product-image {
        position: relative;
        aspect-ratio: 1;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .discount-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: var(--error);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 600;
        }
      }

      .product-name {
        font-size: 1rem;
        margin: 0 0 8px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .product-price {
        display: flex;
        align-items: center;
        gap: 8px;

        .current-price {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--shop-primary);
        }

        .old-price {
          text-decoration: line-through;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
      }
    }

    .view-all {
      text-align: center;
      margin-top: 32px;
    }

    .about-section {
      max-width: 800px;
      margin: 0 auto;

      p {
        font-size: 1.1rem;
        line-height: 1.8;
        color: var(--text-primary);
      }

      .promo-banner {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 24px;
        background: linear-gradient(135deg, var(--shop-primary), var(--shop-secondary));
        color: white;
        border-radius: 12px;
        margin-top: 24px;

        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
        }
      }
    }

    .contact-section {
      max-width: 600px;
      margin: 0 auto;
    }

    .contact-info {
      margin-bottom: 32px;

      .contact-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: var(--bg-secondary);
        border-radius: 8px;
        margin-bottom: 12px;

        mat-icon {
          color: var(--shop-primary);
        }

        a {
          color: var(--shop-primary);
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }

    .opening-hours {
      h4 {
        margin: 0 0 16px;
        font-size: 1.1rem;
      }

      .hour-row {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid var(--border-color);

        &.closed .time {
          color: var(--error);
        }

        .day {
          font-weight: 500;
        }

        .time {
          color: var(--text-secondary);
        }
      }
    }

    @media (max-width: 768px) {
      .hero-content h1 {
        font-size: 2rem;
      }

      .products-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
    }
  `]
})
export class ShopPageComponent implements OnInit {
  isLoading = signal(true);
  error = signal<string | null>(null);
  shop = signal<ShopInfo | null>(null);
  landing = signal<ShopLanding | null>(null);
  products = signal<Product[]>([]);

  private dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const shopId = params['id'];
      if (shopId) {
        this.loadShop(shopId);
      }
    });
  }

  loadShop(shopId: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Load landing page data
    this.http.get<any>(`${environment.apiUrl}/landing/shop/${shopId}`).subscribe({
      next: (response) => {
        if (response.success) {
          if (response.data.redirect && response.data.externalUrl) {
            // Redirect to external URL
            window.location.href = response.data.externalUrl;
            return;
          }
          this.landing.set(response.data.landing);
          this.shop.set(response.data.shop);
          this.loadProducts(shopId);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Cette boutique n\'existe pas ou n\'est pas disponible.');
        this.isLoading.set(false);
      }
    });
  }

  loadProducts(shopId: string): void {
    this.http.get<any>(`${environment.apiUrl}/products`, {
      params: { shop: shopId, limit: '8', isActive: 'true' }
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.products.set(response.data.products);
        }
      }
    });
  }

  getHeroBackground(): string {
    const bg = this.landing()?.hero?.backgroundImage;
    if (bg) {
      return `url('${bg}')`;
    }
    return 'linear-gradient(135deg, var(--shop-primary), var(--shop-secondary))';
  }

  getThemeColor(type: 'primary' | 'secondary'): string {
    const theme = this.landing()?.shopContent?.theme;
    if (theme) {
      return type === 'primary' ? theme.primaryColor : theme.secondaryColor;
    }
    return type === 'primary' ? '#1e3a5f' : '#2563eb';
  }

  getDiscountPercent(product: Product): number {
    if (!product.compareAtPrice || product.compareAtPrice <= product.basePrice) return 0;
    return Math.round((1 - product.basePrice / product.compareAtPrice) * 100);
  }

  getDayName(index: number): string {
    return this.dayNames[index] || '';
  }
}
