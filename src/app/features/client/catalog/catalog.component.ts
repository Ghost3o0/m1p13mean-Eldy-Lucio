import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatExpansionModule } from '@angular/material/expansion';
import { ProductService, ProductFilters } from '@shared/services/product.service';
import { CartService } from '@shared/services/cart.service';
import { Product, Category, Shop, Pagination } from '@shared/models/product.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';

@Component({
  selector: 'app-catalog',
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
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatSidenavModule,
    MatExpansionModule,
    LoadingComponent,
    AriaryPipe
  ],
  template: `
    <div class="catalog-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>{{ pageTitle() }}</h1>
          @if (pagination()) {
            <p class="results-count">{{ pagination()?.total }} produits trouvés</p>
          }
        </div>
      </div>

      <div class="catalog-container">
        <mat-sidenav-container class="sidenav-container">
          <!-- Filters Sidebar -->
          <mat-sidenav #sidenav mode="side" [opened]="!isMobile()" class="filters-sidenav">
            <div class="filters-panel">
              <div class="filters-header">
                <h3>
                  <mat-icon>tune</mat-icon>
                  Filtres
                </h3>
                <button mat-icon-button (click)="clearFilters()" title="Réinitialiser">
                  <mat-icon>refresh</mat-icon>
                </button>
              </div>

              <!-- Search -->
              <div class="filter-section">
                <div class="search-input">
                  <mat-icon>search</mat-icon>
                  <input
                    type="text"
                    [(ngModel)]="searchQuery"
                    (keyup.enter)="applyFilters()"
                    placeholder="Rechercher un produit...">
                  @if (searchQuery) {
                    <button class="clear-btn" (click)="searchQuery = ''; applyFilters()">
                      <mat-icon>close</mat-icon>
                    </button>
                  }
                </div>
              </div>

              <!-- Categories -->
              <div class="filter-section">
                <h4>Catégories</h4>
                <div class="category-list">
                  <button
                    class="category-btn"
                    [class.active]="!selectedCategory()"
                    (click)="selectCategory(null)">
                    <mat-icon>apps</mat-icon>
                    Toutes les catégories
                  </button>
                  @for (category of categories(); track category._id) {
                    <button
                      class="category-btn"
                      [class.active]="selectedCategory() === category._id"
                      (click)="selectCategory(category._id)">
                      <mat-icon>{{ getCategoryIcon(category.name) }}</mat-icon>
                      {{ category.name }}
                    </button>
                  }
                </div>
              </div>

              <!-- Price Range -->
              <div class="filter-section">
                <h4>Fourchette de prix</h4>
                <div class="price-inputs">
                  <div class="price-field">
                    <span class="currency">€</span>
                    <input
                      type="number"
                      [(ngModel)]="minPrice"
                      placeholder="Min"
                      min="0">
                  </div>
                  <span class="price-divider">—</span>
                  <div class="price-field">
                    <span class="currency">€</span>
                    <input
                      type="number"
                      [(ngModel)]="maxPrice"
                      placeholder="Max"
                      min="0">
                  </div>
                </div>
              </div>

              <!-- Stock Toggle -->
              <div class="filter-section">
                <label class="toggle-option">
                  <input type="checkbox" [(ngModel)]="inStockOnly">
                  <span class="toggle-switch"></span>
                  <span class="toggle-label">En stock uniquement</span>
                </label>
              </div>

              <button class="apply-filters-btn" (click)="applyFilters()">
                <mat-icon>check</mat-icon>
                Appliquer les filtres
              </button>
            </div>
          </mat-sidenav>

          <!-- Main Content -->
          <mat-sidenav-content class="catalog-content">
            <!-- Toolbar -->
            <div class="catalog-toolbar">
              <button class="mobile-filter-btn" (click)="sidenav.toggle()">
                <mat-icon>filter_list</mat-icon>
                Filtres
                @if (hasActiveFilters()) {
                  <span class="filter-badge">{{ getActiveFilterCount() }}</span>
                }
              </button>

              <div class="toolbar-right">
                <div class="sort-dropdown">
                  <mat-icon>sort</mat-icon>
                  <select [(ngModel)]="sortOption" (change)="applyFilters()">
                    <option value="newest">Plus récents</option>
                    <option value="price_asc">Prix croissant</option>
                    <option value="price_desc">Prix décroissant</option>
                    <option value="popular">Populaires</option>
                    <option value="rating">Mieux notés</option>
                  </select>
                </div>

                <div class="view-toggle">
                  <button
                    [class.active]="viewMode === 'grid'"
                    (click)="viewMode = 'grid'"
                    title="Vue grille">
                    <mat-icon>grid_view</mat-icon>
                  </button>
                  <button
                    [class.active]="viewMode === 'list'"
                    (click)="viewMode = 'list'"
                    title="Vue liste">
                    <mat-icon>view_list</mat-icon>
                  </button>
                </div>
              </div>
            </div>

            <!-- Active Filters -->
            @if (hasActiveFilters()) {
              <div class="active-filters">
                @if (searchQuery) {
                  <span class="filter-tag">
                    <mat-icon>search</mat-icon>
                    "{{ searchQuery }}"
                    <button (click)="searchQuery = ''; applyFilters()">
                      <mat-icon>close</mat-icon>
                    </button>
                  </span>
                }
                @if (selectedCategory()) {
                  <span class="filter-tag">
                    <mat-icon>category</mat-icon>
                    {{ getCategoryName(selectedCategory()!) }}
                    <button (click)="selectCategory(null)">
                      <mat-icon>close</mat-icon>
                    </button>
                  </span>
                }
                @if (minPrice || maxPrice) {
                  <span class="filter-tag">
                    <mat-icon>euro</mat-icon>
                    {{ minPrice || 0 }}€ - {{ maxPrice || '∞' }}€
                    <button (click)="minPrice = undefined; maxPrice = undefined; applyFilters()">
                      <mat-icon>close</mat-icon>
                    </button>
                  </span>
                }
                @if (inStockOnly) {
                  <span class="filter-tag">
                    <mat-icon>inventory_2</mat-icon>
                    En stock
                    <button (click)="inStockOnly = false; applyFilters()">
                      <mat-icon>close</mat-icon>
                    </button>
                  </span>
                }
                <button class="clear-all-btn" (click)="clearFilters()">
                  Tout effacer
                </button>
              </div>
            }

            <!-- Loading -->
            @if (isLoading()) {
              <div class="loading-container">
                <app-loading message="Chargement des produits..."></app-loading>
              </div>
            }

            <!-- Products Grid/List -->
            @if (!isLoading()) {
              <div
                class="products-container"
                [class.grid-view]="viewMode === 'grid'"
                [class.list-view]="viewMode === 'list'">
                @for (product of products(); track product._id) {
                  <div class="product-card" [routerLink]="['/product', product._id]">
                    <div class="product-image-wrapper">
                      <img
                        [src]="product.images[0] || '/assets/placeholder.png'"
                        [alt]="product.name"
                        class="product-image">
                      <div class="product-badges">
                        @if (product.compareAtPrice && product.compareAtPrice > product.basePrice) {
                          <span class="badge sale">-{{ getDiscountPercent(product) }}%</span>
                        }
                        @if (product.isFeatured) {
                          <span class="badge featured">Vedette</span>
                        }
                        @if (product.stock <= 0) {
                          <span class="badge out-of-stock">Rupture</span>
                        }
                      </div>
                      <div class="product-quick-actions">
                        <button
                          class="quick-action-btn cart"
                          (click)="addToCart($event, product)"
                          [disabled]="product.stock <= 0"
                          title="Ajouter au panier">
                          <mat-icon>add_shopping_cart</mat-icon>
                        </button>
                        <button class="quick-action-btn favorite" title="Ajouter aux favoris">
                          <mat-icon>favorite_border</mat-icon>
                        </button>
                        <button class="quick-action-btn preview" title="Aperçu rapide">
                          <mat-icon>visibility</mat-icon>
                        </button>
                      </div>
                    </div>
                    <div class="product-details">
                      @if (getShopName(product.shopId)) {
                        <span class="product-shop">{{ getShopName(product.shopId) }}</span>
                      }
                      <h3 class="product-name">{{ product.name }}</h3>
                      @if (viewMode === 'list' && product.shortDescription) {
                        <p class="product-description">{{ product.shortDescription }}</p>
                      }
                      <div class="product-meta">
                        @if (product.rating?.average) {
                          <div class="product-rating">
                            <mat-icon>star</mat-icon>
                            <span>{{ product.rating!.average!.toFixed(1) }}</span>
                            <span class="rating-count">({{ product.rating?.count || 0 }})</span>
                          </div>
                        }
                      </div>
                      <div class="product-price-section">
                        <span class="current-price">{{ product.basePrice | ariary:'symbol':'1.2-2':'fr' }}</span>
                        @if (product.compareAtPrice && product.compareAtPrice > product.basePrice) {
                          <span class="original-price">{{ product.compareAtPrice | ariary:'symbol':'1.2-2':'fr' }}</span>
                        }
                      </div>
                    </div>
                  </div>
                } @empty {
                  <div class="empty-state">
                    <div class="empty-icon">
                      <mat-icon>search_off</mat-icon>
                    </div>
                    <h3>Aucun produit trouvé</h3>
                    <p>Essayez de modifier vos filtres ou effectuez une nouvelle recherche.</p>
                    <button class="reset-btn" (click)="clearFilters()">
                      <mat-icon>refresh</mat-icon>
                      Réinitialiser les filtres
                    </button>
                  </div>
                }
              </div>

              <!-- Pagination -->
              @if (pagination() && pagination()!.totalPages > 1) {
                <div class="pagination-container">
                  <mat-paginator
                    [length]="pagination()!.total"
                    [pageSize]="pagination()!.limit"
                    [pageIndex]="pagination()!.page - 1"
                    [pageSizeOptions]="[12, 24, 48]"
                    (page)="onPageChange($event)"
                    showFirstLastButtons>
                  </mat-paginator>
                </div>
              }
            }
          </mat-sidenav-content>
        </mat-sidenav-container>
      </div>
    </div>
  `,
  styles: [`
    .catalog-page {
      min-height: 100vh;
      background: var(--bg-secondary);
    }

    /* Page Header */
    .page-header {
      background: linear-gradient(135deg, var(--primary) 0%, #16213e 100%);
      padding: 48px 24px;
      text-align: center;
    }

    .header-content h1 {
      color: white;
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 8px;
    }

    .results-count {
      color: rgba(255, 255, 255, 0.7);
      margin: 0;
    }

    /* Container */
    .catalog-container {
      max-width: 1600px;
      margin: 0 auto;
      padding: 0 24px 48px;
    }

    .sidenav-container {
      min-height: calc(100vh - 200px);
      background: transparent;
    }

    /* Filters Sidebar */
    .filters-sidenav {
      width: 300px;
      background: transparent;
      border: none;
    }

    .filters-panel {
      background: var(--bg-primary);
      border-radius: 16px;
      padding: 24px;
      margin-top: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .filters-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-color);

      h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary);

        mat-icon {
          color: var(--primary);
        }
      }

      button {
        color: var(--text-secondary);

        &:hover {
          color: var(--primary);
        }
      }
    }

    .filter-section {
      margin-bottom: 24px;

      h4 {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 12px;
      }
    }

    /* Search Input */
    .search-input {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: var(--bg-secondary);
      border-radius: 12px;
      border: 2px solid transparent;
      transition: all 0.3s ease;

      &:focus-within {
        background: var(--bg-primary);
        border-color: var(--primary);
      }

      mat-icon {
        color: var(--text-secondary);
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      input {
        flex: 1;
        border: none;
        background: transparent;
        font-size: 0.95rem;
        outline: none;
        color: var(--text-primary);

        &::placeholder {
          color: var(--text-secondary);
        }
      }

      .clear-btn {
        padding: 4px;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          color: var(--primary);
        }

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }

    /* Category List */
    .category-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .category-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: transparent;
      border: none;
      border-radius: 10px;
      font-size: 0.9rem;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: var(--text-secondary);
      }

      &:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
      }

      &.active {
        background: var(--primary-50);
        color: var(--primary);
        font-weight: 500;

        mat-icon {
          color: var(--primary);
        }
      }
    }

    /* Price Inputs */
    .price-inputs {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .price-field {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: var(--bg-secondary);
      border-radius: 10px;
      border: 2px solid transparent;
      transition: all 0.3s ease;

      &:focus-within {
        background: var(--bg-primary);
        border-color: var(--primary);
      }

      .currency {
        color: var(--text-secondary);
        font-weight: 500;
      }

      input {
        flex: 1;
        width: 100%;
        border: none;
        background: transparent;
        font-size: 0.95rem;
        outline: none;
        color: var(--text-primary);

        &::placeholder {
          color: var(--gray-300);
        }
      }
    }

    .price-divider {
      color: var(--gray-300);
    }

    /* Toggle Option */
    .toggle-option {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;

      input {
        display: none;

        &:checked + .toggle-switch {
          background: var(--primary);

          &::after {
            transform: translateX(20px);
          }
        }
      }

      .toggle-switch {
        width: 44px;
        height: 24px;
        background: var(--gray-300);
        border-radius: 12px;
        position: relative;
        transition: background 0.3s ease;

        &::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          top: 2px;
          left: 2px;
          transition: transform 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      }

      .toggle-label {
        font-size: 0.9rem;
        color: var(--text-secondary);
      }
    }

    /* Apply Filters Button */
    .apply-filters-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    /* Main Content */
    .catalog-content {
      padding: 24px 0 24px 24px;
      background: transparent;
    }

    /* Toolbar */
    .catalog-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      gap: 16px;
    }

    .mobile-filter-btn {
      display: none;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      font-size: 0.95rem;
      color: var(--text-primary);
      cursor: pointer;
      position: relative;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .filter-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        width: 20px;
        height: 20px;
        background: var(--primary);
        color: white;
        border-radius: 50%;
        font-size: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-left: auto;
    }

    .sort-dropdown {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 12px;

      mat-icon {
        color: var(--text-secondary);
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      select {
        border: none;
        background: transparent;
        font-size: 0.9rem;
        color: var(--text-primary);
        outline: none;
        cursor: pointer;
        padding-right: 8px;
      }
    }

    .view-toggle {
      display: flex;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      overflow: hidden;

      button {
        padding: 10px 14px;
        background: transparent;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          color: var(--primary);
        }

        &.active {
          background: linear-gradient(135deg, var(--primary), #764ba2);
          color: white;
        }

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
    }

    /* Active Filters */
    .active-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      margin-bottom: 24px;
    }

    .filter-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      font-size: 0.85rem;
      color: var(--text-secondary);

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: var(--primary);
      }

      button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2px;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-secondary);
        margin-left: 4px;

        &:hover {
          color: var(--error);
        }

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
          color: inherit;
        }
      }
    }

    .clear-all-btn {
      padding: 8px 16px;
      background: transparent;
      border: none;
      color: var(--primary);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }

    /* Loading */
    .loading-container {
      padding: 60px 0;
    }

    /* Products Container */
    .products-container {
      display: grid;
      gap: 24px;

      &.grid-view {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      }

      &.list-view {
        grid-template-columns: 1fr;

        .product-card {
          flex-direction: row;
          align-items: stretch;

          .product-image-wrapper {
            width: 240px;
            flex-shrink: 0;
          }

          .product-details {
            flex: 1;
            padding: 24px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .product-name {
            font-size: 1.25rem;
            -webkit-line-clamp: 2;
          }

          .product-description {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            color: var(--text-secondary);
            margin: 8px 0;
            font-size: 0.9rem;
            line-height: 1.5;
          }
        }
      }
    }

    /* Product Card */
    .product-card {
      display: flex;
      flex-direction: column;
      background: var(--bg-primary);
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      &:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);

        .product-image {
          transform: scale(1.08);
        }

        .product-quick-actions {
          opacity: 1;
          transform: translateY(0);
        }
      }
    }

    .product-image-wrapper {
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
      background: var(--bg-secondary);
    }

    .product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }

    .product-badges {
      position: absolute;
      top: 12px;
      left: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .badge {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;

      &.sale {
        background: var(--error);
        color: white;
      }

      &.featured {
        background: linear-gradient(135deg, var(--primary), #764ba2);
        color: white;
      }

      &.out-of-stock {
        background: rgba(0, 0, 0, 0.7);
        color: white;
      }
    }

    .product-quick-actions {
      position: absolute;
      bottom: 12px;
      right: 12px;
      display: flex;
      gap: 8px;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.3s ease;
    }

    .quick-action-btn {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-primary);
      border: none;
      border-radius: 12px;
      color: var(--text-primary);
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.2s ease;

      &:hover {
        transform: scale(1.1);
      }

      &.cart:hover {
        background: var(--primary);
        color: white;
      }

      &.favorite:hover {
        background: var(--error);
        color: white;
      }

      &.preview:hover {
        background: var(--text-primary);
        color: white;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;

        &:hover {
          transform: none;
          background: var(--bg-primary);
          color: var(--text-primary);
        }
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .product-details {
      padding: 20px;
    }

    .product-shop {
      font-size: 0.8rem;
      color: var(--primary);
      font-weight: 500;
      display: block;
      margin-bottom: 6px;
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

    .product-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .product-rating {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.85rem;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: var(--warning);
      }

      span {
        color: var(--text-primary);
        font-weight: 500;
      }

      .rating-count {
        color: var(--text-secondary);
        font-weight: 400;
      }
    }

    .product-price-section {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .current-price {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .original-price {
      text-decoration: line-through;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    /* Empty State */
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 80px 24px;
      background: var(--bg-primary);
      border-radius: 16px;

      .empty-icon {
        width: 100px;
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-secondary);
        border-radius: 50%;
        margin: 0 auto 24px;

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: var(--gray-300);
        }
      }

      h3 {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 8px;
      }

      p {
        color: var(--text-secondary);
        margin: 0 0 24px;
      }

      .reset-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
    }

    /* Pagination */
    .pagination-container {
      display: flex;
      justify-content: center;
      margin-top: 32px;

      mat-paginator {
        background: var(--bg-primary);
        border-radius: 12px;
      }
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .catalog-content {
        padding: 24px 0;
      }

      .products-container.grid-view {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 768px) {
      .page-header {
        padding: 32px 16px;
      }

      .header-content h1 {
        font-size: 1.75rem;
      }

      .catalog-container {
        padding: 0 16px 32px;
      }

      .mobile-filter-btn {
        display: flex;
      }

      .toolbar-right {
        margin-left: 0;
      }

      .view-toggle {
        display: none;
      }

      .products-container.grid-view {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .product-details {
        padding: 12px;
      }

      .product-name {
        font-size: 0.9rem;
      }

      .current-price {
        font-size: 1.1rem;
      }
    }

    @media (max-width: 480px) {
      .products-container.grid-view {
        grid-template-columns: 1fr;
      }

      .sort-dropdown select {
        max-width: 100px;
      }
    }
  `]
})
export class CatalogComponent implements OnInit {
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  pagination = signal<Pagination | null>(null);
  isLoading = signal(true);
  isMobile = signal(false);

  // Filter state
  searchQuery = '';
  selectedCategory = signal<string | null>(null);
  minPrice?: number;
  maxPrice?: number;
  inStockOnly = false;
  sortOption: ProductFilters['sort'] = 'newest';
  viewMode: 'grid' | 'list' = 'grid';

  pageTitle = computed(() => {
    if (this.searchQuery) {
      return `Recherche: "${this.searchQuery}"`;
    }
    const category = this.categories().find(c => c._id === this.selectedCategory());
    if (category) {
      return category.name;
    }
    return 'Catalogue';
  });

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());
  }

  ngOnInit(): void {
    this.loadCategories();

    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['search'] || '';
      this.selectedCategory.set(params['category'] || null);
      this.minPrice = params['minPrice'] ? +params['minPrice'] : undefined;
      this.maxPrice = params['maxPrice'] ? +params['maxPrice'] : undefined;
      this.inStockOnly = params['inStock'] === 'true';
      this.sortOption = params['sort'] || 'newest';

      this.loadProducts();
    });
  }

  private checkMobile(): void {
    this.isMobile.set(window.innerWidth < 768);
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (response) => {
        if (response.success) {
          this.categories.set(response.data.categories);
        }
      }
    });
  }

  loadProducts(page = 1): void {
    this.isLoading.set(true);

    const filters: ProductFilters = {
      search: this.searchQuery || undefined,
      category: this.selectedCategory() || undefined,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      inStock: this.inStockOnly || undefined,
      sort: this.sortOption,
      page,
      limit: 12
    };

    this.productService.getProducts(filters).subscribe({
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

  applyFilters(): void {
    const queryParams: any = {};

    if (this.searchQuery) queryParams.search = this.searchQuery;
    if (this.selectedCategory()) queryParams.category = this.selectedCategory();
    if (this.minPrice) queryParams.minPrice = this.minPrice;
    if (this.maxPrice) queryParams.maxPrice = this.maxPrice;
    if (this.inStockOnly) queryParams.inStock = 'true';
    if (this.sortOption !== 'newest') queryParams.sort = this.sortOption;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory.set(null);
    this.minPrice = undefined;
    this.maxPrice = undefined;
    this.inStockOnly = false;
    this.sortOption = 'newest';

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    });
  }

  selectCategory(categoryId: string | null): void {
    this.selectedCategory.set(categoryId);
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchQuery ||
      this.selectedCategory() ||
      this.minPrice ||
      this.maxPrice ||
      this.inStockOnly
    );
  }

  getActiveFilterCount(): number {
    let count = 0;
    if (this.searchQuery) count++;
    if (this.selectedCategory()) count++;
    if (this.minPrice || this.maxPrice) count++;
    if (this.inStockOnly) count++;
    return count;
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories().find(c => c._id === categoryId);
    return category?.name || '';
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

  onPageChange(event: PageEvent): void {
    this.loadProducts(event.pageIndex + 1);
  }

  getDiscountPercent(product: Product): number {
    if (!product.compareAtPrice || product.compareAtPrice <= product.basePrice) return 0;
    return Math.round((1 - product.basePrice / product.compareAtPrice) * 100);
  }

  getShopName(shopId: string | Shop): string {
    if (typeof shopId === 'object' && shopId?.name) {
      return shopId.name;
    }
    return '';
  }

  addToCart(event: Event, product: Product): void {
    event.stopPropagation();
    event.preventDefault();

    if (product.stock <= 0) return;

    this.cartService.addToCart(product._id, 1).subscribe({
      next: () => {
        // Show success notification
      },
      error: () => {
        // Show error notification
      }
    });
  }
}
