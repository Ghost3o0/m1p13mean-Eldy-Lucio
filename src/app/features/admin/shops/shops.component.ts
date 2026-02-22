import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Shop } from '@shared/models/product.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';

@Component({
  selector: 'app-admin-shops',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatTabsModule,
    MatDividerModule,
    LoadingComponent
  ],
  template: `
    <div class="shops-container">
      <div class="shops-header">
        <h1>Gestion des boutiques</h1>
        <div class="header-stats">
          <div class="stat">
            <span class="stat-value">{{ totalShops() }}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="stat pending">
            <span class="stat-value">{{ pendingCount() }}</span>
            <span class="stat-label">En attente</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ approvedCount() }}</span>
            <span class="stat-label">Approuvées</span>
          </div>
        </div>
      </div>

      <mat-tab-group (selectedTabChange)="onTabChange($event.index)">
        <mat-tab label="Toutes"></mat-tab>
        <mat-tab label="En attente"></mat-tab>
        <mat-tab label="Approuvées"></mat-tab>
        <mat-tab label="Suspendues"></mat-tab>
      </mat-tab-group>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Rechercher</mat-label>
              <input matInput [(ngModel)]="searchQuery" (keyup.enter)="applyFilters()" placeholder="Nom de la boutique...">
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

            <button mat-icon-button (click)="clearFilters()">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      @if (isLoading()) {
        <app-loading message="Chargement des boutiques..."></app-loading>
      }

      @if (!isLoading()) {
        <mat-card class="table-card">
          <table mat-table [dataSource]="shops()">
            <!-- Logo -->
            <ng-container matColumnDef="logo">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let shop">
                <div class="shop-logo">
                  @if (shop.logo) {
                    <img [src]="shop.logo" [alt]="shop.name">
                  } @else {
                    <mat-icon>store</mat-icon>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Name -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Boutique</th>
              <td mat-cell *matCellDef="let shop">
                <div class="shop-name-cell">
                  <a [routerLink]="['/admin/shops', shop._id]">{{ shop.name }}</a>
                  @if (shop.shortDescription) {
                    <span class="description">{{ shop.shortDescription | slice:0:60 }}...</span>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Owner -->
            <ng-container matColumnDef="owner">
              <th mat-header-cell *matHeaderCellDef>Propriétaire</th>
              <td mat-cell *matCellDef="let shop">
                {{ getOwnerName(shop.ownerId) }}
              </td>
            </ng-container>

            <!-- Category -->
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Catégorie</th>
              <td mat-cell *matCellDef="let shop">
                {{ getCategoryName(shop.category) }}
              </td>
            </ng-container>

            <!-- Products -->
            <ng-container matColumnDef="products">
              <th mat-header-cell *matHeaderCellDef>Produits</th>
              <td mat-cell *matCellDef="let shop">
                {{ shop.stats?.totalProducts || 0 }}
              </td>
            </ng-container>

            <!-- Status -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let shop">
                <mat-chip [class]="'status-' + shop.status">
                  {{ getStatusLabel(shop.status) }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Date -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Créée le</th>
              <td mat-cell *matCellDef="let shop">
                {{ shop.createdAt | date:'dd/MM/yyyy' }}
              </td>
            </ng-container>

            <!-- Actions -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let shop">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <a mat-menu-item [routerLink]="['/admin/shops', shop._id]">
                    <mat-icon>visibility</mat-icon>
                    <span>Voir les détails</span>
                  </a>
                  <a mat-menu-item [routerLink]="['/shop', shop._id]" target="_blank">
                    <mat-icon>open_in_new</mat-icon>
                    <span>Voir la page</span>
                  </a>
                  <mat-divider></mat-divider>
                  @if (shop.status === 'pending') {
                    <button mat-menu-item (click)="updateStatus(shop, 'approved')">
                      <mat-icon>check_circle</mat-icon>
                      <span>Approuver</span>
                    </button>
                    <button mat-menu-item (click)="updateStatus(shop, 'rejected')">
                      <mat-icon>cancel</mat-icon>
                      <span>Rejeter</span>
                    </button>
                  }
                  @if (shop.status === 'approved') {
                    <button mat-menu-item (click)="updateStatus(shop, 'suspended')">
                      <mat-icon color="warn">block</mat-icon>
                      <span>Suspendre</span>
                    </button>
                  }
                  @if (shop.status === 'suspended') {
                    <button mat-menu-item (click)="updateStatus(shop, 'approved')">
                      <mat-icon>check_circle</mat-icon>
                      <span>Réactiver</span>
                    </button>
                  }
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="shop-row"></tr>
          </table>

          @if (shops().length === 0) {
            <div class="empty-state">
              <mat-icon>store</mat-icon>
              <h3>Aucune boutique</h3>
              <p>Aucune boutique ne correspond à vos critères.</p>
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
    .shops-container {
      padding: 24px;
    }

    .shops-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h1 {
        font-size: 2rem;
        margin: 0;
      }

      .header-stats {
        display: flex;
        gap: 32px;

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;

          .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--primary);
          }

          &.pending .stat-value {
            color: var(--warning);
          }

          .stat-label {
            font-size: 0.85rem;
            color: var(--text-secondary);
          }
        }
      }
    }

    mat-tab-group {
      margin-bottom: 24px;
    }

    .filters-card {
      margin-bottom: 24px;
    }

    .filters-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;

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

    .shop-logo {
      width: 50px;
      height: 50px;
      border-radius: 8px;
      background: var(--bg-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      mat-icon {
        color: var(--gray-300);
      }
    }

    .shop-name-cell {
      display: flex;
      flex-direction: column;

      a {
        font-weight: 500;
        color: var(--primary);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }

      .description {
        font-size: 0.85rem;
        color: var(--text-secondary);
      }
    }

    mat-chip {
      &.status-pending {
        background: var(--warning-light) !important;
        color: var(--warning) !important;
      }
      &.status-approved {
        background: var(--success-light) !important;
        color: var(--success) !important;
      }
      &.status-suspended {
        background: var(--error-light) !important;
        color: var(--error) !important;
      }
      &.status-rejected {
        background: var(--bg-secondary) !important;
        color: var(--text-secondary) !important;
      }
    }

    .shop-row {
      cursor: pointer;

      &:hover {
        background: var(--bg-secondary);
      }
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
      }
    }

    mat-paginator {
      border-top: 1px solid var(--border-color);
    }

    @media (max-width: 768px) {
      .shops-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
    }
  `]
})
export class AdminShopsComponent implements OnInit {
  shops = signal<Shop[]>([]);
  categories = signal<any[]>([]);
  pagination = signal<any>(null);
  isLoading = signal(true);

  totalShops = signal(0);
  pendingCount = signal(0);
  approvedCount = signal(0);

  displayedColumns = ['logo', 'name', 'owner', 'category', 'products', 'status', 'date', 'actions'];

  searchQuery = '';
  selectedCategory: string | null = null;
  currentTab = 0;

  private statusFilters = [undefined, 'pending', 'approved', 'suspended'];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadStats();
    this.loadShops();
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

  loadStats(): void {
    this.http.get<any>(`${environment.apiUrl}/admin/shops/stats`).subscribe({
      next: (response) => {
        if (response.success) {
          this.totalShops.set(response.data.total || 0);
          this.pendingCount.set(response.data.pending || 0);
          this.approvedCount.set(response.data.approved || 0);
        }
      }
    });
  }

  loadShops(page = 1): void {
    this.isLoading.set(true);

    const params: any = { page, limit: 20 };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedCategory) params.category = this.selectedCategory;
    const statusFilter = this.statusFilters[this.currentTab];
    if (statusFilter) params.status = statusFilter;

    this.http.get<any>(`${environment.apiUrl}/admin/shops`, { params }).subscribe({
      next: (response) => {
        if (response.success) {
          this.shops.set(response.data.shops);
          this.pagination.set(response.data.pagination);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onTabChange(index: number): void {
    this.currentTab = index;
    this.loadShops();
  }

  applyFilters(): void {
    this.loadShops();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = null;
    this.loadShops();
  }

  onPageChange(event: PageEvent): void {
    this.loadShops(event.pageIndex + 1);
  }

  getOwnerName(owner: any): string {
    if (typeof owner === 'object' && owner) {
      return `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || 'Propriétaire';
    }
    return 'Propriétaire';
  }

  getCategoryName(category: any): string {
    if (typeof category === 'object' && category?.name) {
      return category.name;
    }
    const cat = this.categories().find(c => c._id === category);
    return cat?.name || '-';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      approved: 'Approuvée',
      suspended: 'Suspendue',
      rejected: 'Rejetée'
    };
    return labels[status] || status;
  }

  updateStatus(shop: Shop, newStatus: string): void {
    const confirmMessages: Record<string, string> = {
      approved: 'Voulez-vous approuver cette boutique ?',
      rejected: 'Voulez-vous rejeter cette boutique ?',
      suspended: 'Voulez-vous suspendre cette boutique ?'
    };

    if (!confirm(confirmMessages[newStatus])) return;

    this.http.put<any>(`${environment.apiUrl}/admin/shops/${shop._id}/status`, {
      status: newStatus
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadShops();
          this.loadStats();
        }
      }
    });
  }
}
