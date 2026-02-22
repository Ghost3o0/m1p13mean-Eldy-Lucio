import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Product, Category } from '@shared/models/product.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';

@Component({
  selector: 'app-shop-products',
  standalone: true,
  imports: [
    AriaryPipe,
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    MatSlideToggleModule,
    MatDividerModule,
    LoadingComponent,
    AriaryPipe
  ],
  template: `
    <div class="products-container">
      <div class="products-header">
        <div class="header-left">
          <h1>Mes produits</h1>
          <span class="product-count">{{ pagination()?.total || 0 }} produits</span>
        </div>
        <a routerLink="/shop-manager/products/new" mat-raised-button color="primary">
          <mat-icon>add</mat-icon>
          Ajouter un produit
        </a>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Rechercher</mat-label>
              <input matInput [(ngModel)]="searchQuery" (keyup.enter)="applyFilters()" placeholder="Nom du produit...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Catégorie</mat-label>
              <mat-select [(ngModel)]="selectedCategory" (selectionChange)="applyFilters()">
                <mat-option [value]="null">Toutes</mat-option>
                @for (category of categories(); track category._id) {
                  <mat-option [value]="category._id">{{ category.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Statut</mat-label>
              <mat-select [(ngModel)]="selectedStatus" (selectionChange)="applyFilters()">
                <mat-option [value]="null">Tous</mat-option>
                <mat-option [value]="true">Actifs</mat-option>
                <mat-option [value]="false">Inactifs</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Stock</mat-label>
              <mat-select [(ngModel)]="stockFilter" (selectionChange)="applyFilters()">
                <mat-option [value]="null">Tous</mat-option>
                <mat-option value="inStock">En stock</mat-option>
                <mat-option value="lowStock">Stock faible</mat-option>
                <mat-option value="outOfStock">Rupture</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-icon-button (click)="clearFilters()" matTooltip="Réinitialiser">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      @if (isLoading()) {
        <app-loading message="Chargement des produits..."></app-loading>
      }

      @if (!isLoading()) {
        <mat-card class="table-card">
          <table mat-table [dataSource]="products()" matSort (matSortChange)="onSort($event)">
            <!-- Image Column -->
            <ng-container matColumnDef="image">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let product">
                <img [src]="product.images?.[0] || '/assets/placeholder.png'" [alt]="product.name" class="product-thumb">
              </td>
            </ng-container>

            <!-- Name Column -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Produit</th>
              <td mat-cell *matCellDef="let product">
                <div class="product-name-cell">
                  <span class="product-name">{{ product.name }}</span>
                  @if (product.sku) {
                    <span class="product-sku">SKU: {{ product.sku }}</span>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Category Column -->
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Catégorie</th>
              <td mat-cell *matCellDef="let product">
                {{ getCategoryName(product.categories?.[0]) }}
              </td>
            </ng-container>

            <!-- Price Column -->
            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Prix</th>
              <td mat-cell *matCellDef="let product">
                <div class="price-cell">
                  <span class="price">{{ product.basePrice | ariary }}</span>
                  @if (product.compareAtPrice && product.compareAtPrice > product.basePrice) {
                    <span class="compare-price">{{ product.compareAtPrice | ariary }}</span>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Stock Column -->
            <ng-container matColumnDef="stock">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Stock</th>
              <td mat-cell *matCellDef="let product">
                <mat-chip [class]="getStockClass(product.stock)">
                  {{ product.stock }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let product">
                <mat-slide-toggle
                  [checked]="product.isActive"
                  (change)="toggleStatus(product)"
                  color="primary">
                </mat-slide-toggle>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let product">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <a mat-menu-item [routerLink]="['/shop-manager/products', product._id]">
                    <mat-icon>edit</mat-icon>
                    <span>Modifier</span>
                  </a>
                  <a mat-menu-item [routerLink]="['/product', product._id]" target="_blank">
                    <mat-icon>visibility</mat-icon>
                    <span>Voir la page</span>
                  </a>
                  <button mat-menu-item (click)="duplicateProduct(product)">
                    <mat-icon>content_copy</mat-icon>
                    <span>Dupliquer</span>
                  </button>
                  <mat-divider></mat-divider>
                  <button mat-menu-item (click)="deleteProduct(product)" class="delete-action">
                    <mat-icon color="warn">delete</mat-icon>
                    <span>Supprimer</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="product-row"></tr>
          </table>

          @if (products().length === 0) {
            <div class="empty-state">
              <mat-icon>inventory_2</mat-icon>
              <h3>Aucun produit</h3>
              <p>Vous n'avez pas encore de produits. Commencez par en ajouter un.</p>
              <a routerLink="/shop-manager/products/new" mat-raised-button color="primary">
                <mat-icon>add</mat-icon>
                Ajouter un produit
              </a>
            </div>
          }

          <mat-paginator
            [length]="pagination()?.total || 0"
            [pageSize]="pagination()?.limit || 20"
            [pageIndex]="(pagination()?.page || 1) - 1"
            [pageSizeOptions]="[10, 20, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .products-container {
      padding: 24px;
    }

    .products-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      .header-left {
        display: flex;
        align-items: baseline;
        gap: 16px;

        h1 {
          font-size: 2rem;
          margin: 0;
        }

        .product-count {
          color: var(--text-secondary);
        }
      }
    }

    .filters-card {
      margin-bottom: 24px;
    }

    .filters-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      flex-wrap: wrap;

      .search-field {
        flex: 1;
        min-width: 250px;
      }
    }

    .table-card {
      overflow: hidden;
    }

    table {
      width: 100%;
    }

    .product-thumb {
      width: 50px;
      height: 50px;
      object-fit: cover;
      border-radius: 8px;
    }

    .product-name-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .product-name {
        font-weight: 500;
      }

      .product-sku {
        font-size: 0.8rem;
        color: var(--text-secondary);
      }
    }

    .price-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .price {
        font-weight: 500;
      }

      .compare-price {
        font-size: 0.8rem;
        color: var(--text-secondary);
        text-decoration: line-through;
      }
    }

    mat-chip {
      &.stock-good {
        background: var(--success-light) !important;
        color: var(--success) !important;
      }

      &.stock-low {
        background: var(--warning-light) !important;
        color: var(--warning) !important;
      }

      &.stock-out {
        background: var(--error-light) !important;
        color: var(--error) !important;
      }
    }

    .product-row {
      cursor: pointer;

      &:hover {
        background: var(--bg-secondary);
      }
    }

    .delete-action {
      color: var(--error);
    }

    .empty-state {
      text-align: center;
      padding: 64px 24px;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: var(--gray-300);
      }

      h3 {
        margin: 16px 0 8px;
      }

      p {
        color: var(--text-secondary);
        margin-bottom: 24px;
      }
    }

    mat-paginator {
      border-top: 1px solid var(--border-color);
    }

    @media (max-width: 768px) {
      .products-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;

        .header-left {
          flex-direction: column;
          gap: 4px;
          align-items: flex-start;

          h1 {
            font-size: 1.5rem;
          }
        }

        a {
          width: 100%;
        }
      }

      .filters-row {
        flex-direction: column;

        .search-field {
          width: 100%;
        }

        mat-form-field {
          width: 100%;
        }
      }

      .table-card {
        overflow-x: auto;
      }
    }

    @media (max-width: 480px) {
      .products-container {
        padding: 16px 12px;
      }

      .products-header {
        .header-left h1 {
          font-size: 1.25rem;
        }
      }

      .filters-card {
        mat-card-content {
          padding: 12px;
        }
      }

      .product-thumb {
        width: 40px;
        height: 40px;
      }

      .product-name-cell {
        .product-name {
          font-size: 0.9rem;
        }

        .product-sku {
          font-size: 0.75rem;
        }
      }

      .price-cell .price {
        font-size: 0.9rem;
      }

      .empty-state {
        padding: 40px 16px;

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
        }

        h3 {
          font-size: 1.1rem;
        }
      }
    }
  `]
})
export class ShopProductsComponent implements OnInit {
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  pagination = signal<any>(null);
  isLoading = signal(true);

  displayedColumns = ['image', 'name', 'category', 'price', 'stock', 'status', 'actions'];

  // Filters
  searchQuery = '';
  selectedCategory: string | null = null;
  selectedStatus: boolean | null = null;
  stockFilter: string | null = null;
  sortField = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.http.get<any>(`${environment.apiUrl}/products/categories`).subscribe({
      next: (response) => {
        if (response.success) {
          this.categories.set(response.data.categories);
        }
      }
    });
  }

  loadProducts(page = 1): void {
    this.isLoading.set(true);

    const params: any = {
      page,
      limit: 20,
      sort: this.sortField,
      order: this.sortOrder
    };

    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedCategory) params.category = this.selectedCategory;
    if (this.selectedStatus !== null) params.isActive = this.selectedStatus;
    if (this.stockFilter) params.stock = this.stockFilter;

    this.http.get<any>(`${environment.apiUrl}/shop/products`, { params }).subscribe({
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
    this.loadProducts();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = null;
    this.selectedStatus = null;
    this.stockFilter = null;
    this.loadProducts();
  }

  onSort(sort: Sort): void {
    this.sortField = sort.active || 'createdAt';
    this.sortOrder = (sort.direction as 'asc' | 'desc') || 'desc';
    this.loadProducts();
  }

  onPageChange(event: PageEvent): void {
    this.loadProducts(event.pageIndex + 1);
  }

  getCategoryName(categoryId: string | Category): string {
    if (!categoryId) return '-';
    if (typeof categoryId === 'object') return categoryId.name;

    const category = this.categories().find(c => c._id === categoryId);
    return category?.name || '-';
  }

  getStockClass(stock: number): string {
    if (stock <= 0) return 'stock-out';
    if (stock < 10) return 'stock-low';
    return 'stock-good';
  }

  toggleStatus(product: Product): void {
    this.http.put<any>(`${environment.apiUrl}/shop/products/${product._id}`, {
      isActive: !product.isActive
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.products.update(products =>
            products.map(p => p._id === product._id ? { ...p, isActive: !p.isActive } : p)
          );
        }
      }
    });
  }

  duplicateProduct(product: Product): void {
    this.http.post<any>(`${environment.apiUrl}/shop/products/${product._id}/duplicate`, {}).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadProducts();
        }
      }
    });
  }

  deleteProduct(product: Product): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${product.name}" ?`)) {
      this.http.delete<any>(`${environment.apiUrl}/shop/products/${product._id}`).subscribe({
        next: (response) => {
          if (response.success) {
            this.products.update(products => products.filter(p => p._id !== product._id));
          }
        }
      });
    }
  }
}
