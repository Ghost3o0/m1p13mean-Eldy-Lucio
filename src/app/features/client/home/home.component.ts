import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { ProductService } from '@shared/services/product.service';
import { Product, Category, Shop } from '@shared/models/product.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    AriaryPipe,
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule,
    LoadingComponent,
    AriaryPipe
  ],
  template: `
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <div class="hero-badge">
          <mat-icon>local_offer</mat-icon>
          <span>Offres exclusives</span>
        </div>
        <h1 class="hero-title">
          Découvrez le meilleur du
          <span class="gradient-text">shopping</span>
        </h1>
        <p class="hero-subtitle">
          Plus de 100 boutiques, des milliers de produits et des offres exclusives vous attendent
        </p>
        <div class="hero-actions">
          <a routerLink="/catalog" class="btn-primary">
            <mat-icon>explore</mat-icon>
            Explorer les boutiques
          </a>
          <a routerLink="/catalog" [queryParams]="{featured: true}" class="btn-secondary">
            <mat-icon>auto_awesome</mat-icon>
            Voir les tendances
          </a>
        </div>
        <div class="hero-stats">
          <div class="stat">
            <span class="stat-number">100+</span>
            <span class="stat-label">Boutiques</span>
          </div>
          <div class="stat">
            <span class="stat-number">10K+</span>
            <span class="stat-label">Produits</span>
          </div>
          <div class="stat">
            <span class="stat-number">50K+</span>
            <span class="stat-label">Clients satisfaits</span>
          </div>
        </div>
      </div>
      <div class="hero-decoration">
        <div class="floating-card card-1">
          <mat-icon>shopping_bag</mat-icon>
        </div>
        <div class="floating-card card-2">
          <mat-icon>favorite</mat-icon>
        </div>
        <div class="floating-card card-3">
          <mat-icon>star</mat-icon>
        </div>
      </div>
    </section>

    <div class="main-content">
      <!-- Categories Section -->
      <section class="section categories-section">
        <div class="section-header">
          <div class="section-title-group">
            <h2>Explorez par catégorie</h2>
            <p class="section-subtitle">Trouvez exactement ce que vous cherchez</p>
          </div>
          <a routerLink="/catalog" class="view-all-link">
            Voir tout
            <mat-icon>arrow_forward</mat-icon>
          </a>
        </div>
        <div class="categories-grid">
          @for (category of categories(); track category._id) {
            <a [routerLink]="['/catalog']" [queryParams]="{category: category._id}" class="category-card">
              <div class="category-icon">
                <mat-icon>{{ getCategoryIcon(category.name) }}</mat-icon>
              </div>
              <span class="category-name">{{ category.name }}</span>
              <mat-icon class="category-arrow">arrow_forward</mat-icon>
            </a>
          }
        </div>
      </section>

      <!-- Promo Banner -->
      <section class="promo-banner">
        <div class="promo-content">
          <div class="promo-text">
            <span class="promo-label">Offre limitée</span>
            <h3>Jusqu'à -50% sur une sélection d'articles</h3>
            <p>Profitez de nos offres exceptionnelles avant qu'il ne soit trop tard !</p>
          </div>
          <a routerLink="/catalog" [queryParams]="{promo: true}" class="promo-btn">
            En profiter
            <mat-icon>arrow_forward</mat-icon>
          </a>
        </div>
        <div class="promo-decoration">
          <mat-icon>percent</mat-icon>
        </div>
      </section>

      <!-- Featured Products -->
      <section class="section products-section">
        <div class="section-header">
          <div class="section-title-group">
            <h2>Produits en vedette</h2>
            <p class="section-subtitle">Les coups de coeur de nos clients</p>
          </div>
          <a routerLink="/catalog" [queryParams]="{featured: true}" class="view-all-link">
            Voir tout
            <mat-icon>arrow_forward</mat-icon>
          </a>
        </div>
        @if (isLoadingProducts()) {
          <app-loading message="Chargement des produits..."></app-loading>
        } @else {
          <div class="products-grid">
            @for (product of featuredProducts(); track product._id) {
              <div class="product-card" [routerLink]="['/product', product._id]">
                <div class="product-image-container">
                  <img [src]="product.images[0] || '/assets/placeholder.png'" [alt]="product.name" class="product-image">
                  @if (product.compareAtPrice) {
                    <span class="product-badge sale">Promo</span>
                  }
                  @if (product.isFeatured) {
                    <span class="product-badge featured">Vedette</span>
                  }
                  <div class="product-actions">
                    <button class="action-btn" title="Ajouter aux favoris">
                      <mat-icon>favorite_border</mat-icon>
                    </button>
                    <button class="action-btn" title="Aperçu rapide">
                      <mat-icon>visibility</mat-icon>
                    </button>
                  </div>
                </div>
                <div class="product-info">
                  @if (getShopName(product.shopId)) {
                    <span class="product-shop">{{ getShopName(product.shopId) }}</span>
                  }
                  <h3 class="product-name">{{ product.name }}</h3>
                  <div class="product-price-row">
                    <span class="product-price">{{ product.basePrice | ariary:'symbol':'1.2-2':'fr' }}</span>
                    @if (product.compareAtPrice) {
                      <span class="product-old-price">{{ product.compareAtPrice | ariary:'symbol':'1.2-2':'fr' }}</span>
                    }
                  </div>
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <mat-icon>inventory_2</mat-icon>
                <p>Aucun produit en vedette pour le moment</p>
              </div>
            }
          </div>
        }
      </section>

      <!-- Featured Shops -->
      <section class="section shops-section">
        <div class="section-header">
          <div class="section-title-group">
            <h2>Boutiques populaires</h2>
            <p class="section-subtitle">Découvrez nos partenaires de confiance</p>
          </div>
          <a routerLink="/catalog" class="view-all-link">
            Voir toutes les boutiques
            <mat-icon>arrow_forward</mat-icon>
          </a>
        </div>
        <div class="shops-grid">
          @for (shop of featuredShops(); track shop._id) {
            <div class="shop-card" [routerLink]="['/shop', shop._id]">
              <div class="shop-header">
                <div class="shop-logo">
                  @if (shop.logo) {
                    <img [src]="shop.logo" [alt]="shop.name">
                  } @else {
                    <mat-icon>store</mat-icon>
                  }
                </div>
                @if (shop.rating?.average) {
                  <div class="shop-rating">
                    <mat-icon>star</mat-icon>
                    <span>{{ shop.rating!.average!.toFixed(1) }}</span>
                  </div>
                }
              </div>
              <div class="shop-info">
                <h3 class="shop-name">{{ shop.name }}</h3>
                <p class="shop-description">{{ shop.shortDescription || shop.description | slice:0:80 }}...</p>
              </div>
              <div class="shop-footer">
                <span class="shop-cta">
                  Visiter la boutique
                  <mat-icon>arrow_forward</mat-icon>
                </span>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <mat-icon>storefront</mat-icon>
              <p>Aucune boutique disponible</p>
            </div>
          }
        </div>
      </section>

      <!-- Features Section -->
      <section class="features-section">
        <div class="feature">
          <div class="feature-icon">
            <mat-icon>local_shipping</mat-icon>
          </div>
          <h4>Livraison rapide</h4>
          <p>Recevez vos commandes en 24-48h</p>
        </div>
        <div class="feature">
          <div class="feature-icon">
            <mat-icon>verified_user</mat-icon>
          </div>
          <h4>Paiement sécurisé</h4>
          <p>Transactions 100% sécurisées</p>
        </div>
        <div class="feature">
          <div class="feature-icon">
            <mat-icon>support_agent</mat-icon>
          </div>
          <h4>Support 24/7</h4>
          <p>Une équipe à votre écoute</p>
        </div>
        <div class="feature">
          <div class="feature-icon">
            <mat-icon>autorenew</mat-icon>
          </div>
          <h4>Retours faciles</h4>
          <p>30 jours pour changer d'avis</p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    /* Hero Section */
    .hero {
      position: relative;
      min-height: 600px;
      display: flex;
      align-items: center;
      padding: 80px 5%;
      overflow: hidden;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    }

    .hero-bg {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 107, 107, 0.2) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(78, 205, 196, 0.2) 0%, transparent 50%);
    }

    .hero-content {
      position: relative;
      z-index: 2;
      max-width: 650px;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(255, 107, 107, 0.2);
      border: 1px solid rgba(255, 107, 107, 0.4);
      border-radius: 50px;
      color: #ff6b6b;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 24px;
      animation: fadeIn 0.6s ease-out;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .hero-title {
      font-size: 3.5rem;
      font-weight: 800;
      color: white;
      line-height: 1.1;
      margin-bottom: 20px;
      animation: slideUp 0.6s ease-out 0.1s both;
    }

    .gradient-text {
      background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle {
      font-size: 1.25rem;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.6;
      margin-bottom: 32px;
      animation: slideUp 0.6s ease-out 0.2s both;
    }

    .hero-actions {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 48px;
      animation: slideUp 0.6s ease-out 0.3s both;
    }

    .btn-primary, .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 14px 28px;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s ease;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
      }
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
      }
    }

    .hero-stats {
      display: flex;
      gap: 48px;
      animation: slideUp 0.6s ease-out 0.4s both;
    }

    .stat {
      display: flex;
      flex-direction: column;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: 800;
      color: white;
    }

    .stat-label {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.6);
    }

    .hero-decoration {
      position: absolute;
      right: 10%;
      top: 50%;
      transform: translateY(-50%);
      width: 400px;
      height: 400px;
    }

    .floating-card {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      animation: float 3s ease-in-out infinite;

      mat-icon {
        color: white;
      }
    }

    .card-1 {
      width: 100px;
      height: 100px;
      top: 0;
      left: 50%;
      animation-delay: 0s;

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
      }
    }

    .card-2 {
      width: 80px;
      height: 80px;
      top: 40%;
      left: 10%;
      animation-delay: 1s;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: #ff6b6b;
      }
    }

    .card-3 {
      width: 70px;
      height: 70px;
      bottom: 10%;
      right: 20%;
      animation-delay: 2s;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: #ffd93d;
      }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Main Content */
    .main-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* Section Styles */
    .section {
      padding: 60px 0;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 32px;
    }

    .section-title-group h2 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 8px;
    }

    .section-subtitle {
      color: var(--text-secondary);
      margin: 0;
    }

    .view-all-link {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
      transition: gap 0.3s ease;

      &:hover {
        gap: 8px;
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    /* Categories */
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
    }

    .category-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 24px 16px;
      background: var(--bg-primary);
      border-radius: 16px;
      text-decoration: none;
      color: var(--text-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(102, 126, 234, 0.15);

        .category-icon {
          background: linear-gradient(135deg, #667eea, #764ba2);

          mat-icon {
            color: white;
          }
        }

        .category-arrow {
          opacity: 1;
          transform: translateX(0);
        }
      }
    }

    .category-icon {
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--primary-50);
      border-radius: 16px;
      transition: all 0.3s ease;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: var(--primary);
        transition: color 0.3s ease;
      }
    }

    .category-name {
      font-weight: 600;
      font-size: 0.95rem;
      text-align: center;
    }

    .category-arrow {
      position: absolute;
      bottom: 12px;
      right: 12px;
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--primary);
      opacity: 0;
      transform: translateX(-10px);
      transition: all 0.3s ease;
    }

    /* Promo Banner */
    .promo-banner {
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 24px;
      padding: 40px;
      margin: 20px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    }

    .promo-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      z-index: 1;
    }

    .promo-text {
      color: white;
    }

    .promo-label {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }

    .promo-text h3 {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 0 8px;
    }

    .promo-text p {
      margin: 0;
      opacity: 0.9;
    }

    .promo-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 14px 28px;
      background: white;
      color: #667eea;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
      flex-shrink: 0;

      &:hover {
        transform: scale(1.05);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .promo-decoration {
      position: absolute;
      right: -50px;
      top: 50%;
      transform: translateY(-50%);
      opacity: 0.1;

      mat-icon {
        font-size: 200px;
        width: 200px;
        height: 200px;
        color: white;
      }
    }

    /* Products Grid */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 24px;
    }

    .product-card {
      background: var(--bg-primary);
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      &:hover {
        transform: translateY(-8px);
        box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);

        .product-actions {
          opacity: 1;
          transform: translateY(0);
        }

        .product-image {
          transform: scale(1.05);
        }
      }
    }

    .product-image-container {
      position: relative;
      overflow: hidden;
      aspect-ratio: 1;
    }

    .product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }

    .product-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;

      &.sale {
        background: var(--error);
        color: white;
      }

      &.featured {
        background: var(--primary);
        color: white;
        left: auto;
        right: 12px;
      }
    }

    .product-actions {
      position: absolute;
      bottom: 12px;
      right: 12px;
      display: flex;
      gap: 8px;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.3s ease;
    }

    .action-btn {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 50%;
      background: var(--bg-primary);
      color: var(--text-primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: all 0.2s ease;

      &:hover {
        background: var(--primary);
        color: white;
        transform: scale(1.1);
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .product-info {
      padding: 16px;
    }

    .product-shop {
      font-size: 0.75rem;
      color: var(--primary);
      font-weight: 500;
      margin-bottom: 4px;
      display: block;
    }

    .product-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 8px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.4;
    }

    .product-price-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .product-price {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .product-old-price {
      text-decoration: line-through;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    /* Shops Grid */
    .shops-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
    }

    .shop-card {
      background: var(--bg-primary);
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      &:hover {
        transform: translateY(-8px);
        box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);

        .shop-cta mat-icon {
          transform: translateX(4px);
        }
      }
    }

    .shop-header {
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: var(--primary-50);
    }

    .shop-logo {
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-primary);
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

      img {
        max-width: 60px;
        max-height: 60px;
        object-fit: contain;
      }

      mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: var(--gray-300);
      }
    }

    .shop-rating {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      background: var(--bg-primary);
      border-radius: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #ffd93d;
      }

      span {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 0.875rem;
      }
    }

    .shop-info {
      padding: 20px 24px;
    }

    .shop-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 8px;
    }

    .shop-description {
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.5;
      margin: 0;
    }

    .shop-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--border-color);
    }

    .shop-cta {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--primary);
      font-weight: 600;
      font-size: 0.9rem;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        transition: transform 0.3s ease;
      }
    }

    /* Features Section */
    .features-section {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      padding: 60px 0;
      border-top: 1px solid var(--border-color);
      margin-top: 20px;
    }

    .feature {
      text-align: center;
      padding: 24px;
    }

    .feature-icon {
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--primary-50);
      border-radius: 16px;
      margin: 0 auto 16px;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: var(--primary);
      }
    }

    .feature h4 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 8px;
    }

    .feature p {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin: 0;
    }

    /* Empty State */
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px 20px;
      color: var(--text-secondary);

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: var(--gray-300);
        margin-bottom: 16px;
      }

      p {
        margin: 0;
        font-size: 1.1rem;
      }
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .hero {
        min-height: auto;
        padding: 60px 5%;
      }

      .hero-title {
        font-size: 2.5rem;
      }

      .hero-decoration {
        display: none;
      }

      .features-section {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .hero {
        padding: 40px 20px;
      }

      .hero-title {
        font-size: 2rem;
      }

      .hero-subtitle {
        font-size: 1rem;
      }

      .hero-stats {
        gap: 24px;
      }

      .stat-number {
        font-size: 1.5rem;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .promo-banner {
        padding: 24px;
      }

      .promo-content {
        flex-direction: column;
        gap: 20px;
        text-align: center;
      }

      .promo-text h3 {
        font-size: 1.25rem;
      }

      .categories-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .products-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .shops-grid {
        grid-template-columns: 1fr;
      }

      .features-section {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }

    @media (max-width: 480px) {
      .hero-actions {
        flex-direction: column;
      }

      .btn-primary, .btn-secondary {
        width: 100%;
        justify-content: center;
      }

      .products-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  categories = signal<Category[]>([]);
  featuredProducts = signal<Product[]>([]);
  featuredShops = signal<Shop[]>([]);
  isLoadingProducts = signal(true);

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    // Load categories
    this.productService.getCategories(false, true).subscribe({
      next: (response) => {
        if (response.success) {
          this.categories.set(response.data.categories.slice(0, 8));
        }
      }
    });

    // Load featured products
    this.productService.getFeaturedProducts(8).subscribe({
      next: (response) => {
        if (response.success) {
          this.featuredProducts.set(response.data.products);
        }
        this.isLoadingProducts.set(false);
      },
      error: () => {
        this.isLoadingProducts.set(false);
      }
    });

    // Load featured shops
    this.productService.getShops({ featured: true, limit: 4 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.featuredShops.set(response.data.shops);
        }
      }
    });
  }

  getCategoryIcon(name: string): string {
    const icons: Record<string, string> = {
      'Mode & Vêtements': 'checkroom',
      'Électronique': 'devices',
      'Maison & Décoration': 'home',
      'Beauté & Bien-être': 'spa',
      'Alimentation': 'restaurant',
      'Sports & Loisirs': 'sports_soccer',
      'Bijoux & Montres': 'watch',
      'Enfants & Bébés': 'child_care'
    };
    return icons[name] || 'category';
  }

  getShopName(shopId: string | Shop): string {
    if (typeof shopId === 'object' && shopId?.name) {
      return shopId.name;
    }
    return '';
  }
}
