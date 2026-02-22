import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SellerService } from '@shared/services/seller.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { SellerFormDialogComponent } from './seller-form-dialog.component';

@Component({
  selector: 'app-shop-sellers',
  standalone: true,
  imports: [
    CommonModule,
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
    MatDividerModule,
    MatDialogModule,
    MatCheckboxModule,
    MatSnackBarModule,
    LoadingComponent
  ],
  template: `
    <div class="sellers-container">
      <div class="page-header">
        <div>
          <h1>Mes Vendeurs</h1>
          <p class="subtitle">Gérez l'équipe de votre boutique</p>
        </div>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>person_add</mat-icon>
          Ajouter un vendeur
        </button>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <mat-card class="stat-card">
          <mat-icon>people</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats()?.totalSellers || 0 }}</span>
            <span class="stat-label">Total vendeurs</span>
          </div>
        </mat-card>
        <mat-card class="stat-card active">
          <mat-icon>check_circle</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats()?.activeSellers || 0 }}</span>
            <span class="stat-label">Actifs</span>
          </div>
        </mat-card>
        <mat-card class="stat-card sales">
          <mat-icon>trending_up</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats()?.totalSales | number:'1.0-0' }} Ar</span>
            <span class="stat-label">Ventes totales</span>
          </div>
        </mat-card>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Rechercher</mat-label>
              <input matInput [(ngModel)]="searchQuery" (keyup.enter)="applyFilters()" placeholder="Nom, email...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Statut</mat-label>
              <mat-select [(ngModel)]="selectedStatus" (selectionChange)="applyFilters()">
                <mat-option [value]="null">Tous</mat-option>
                <mat-option value="active">Actif</mat-option>
                <mat-option value="inactive">Inactif</mat-option>
                <mat-option value="on_leave">En congé</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-icon-button (click)="clearFilters()">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Table -->
      @if (isLoading()) {
        <app-loading message="Chargement des vendeurs..."></app-loading>
      } @else {
        <mat-card class="table-card">
          <table mat-table [dataSource]="sellers()">
            <!-- Avatar -->
            <ng-container matColumnDef="avatar">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let seller">
                <div class="seller-avatar">
                  @if (seller.avatar) {
                    <img [src]="seller.avatar" [alt]="seller.firstName">
                  } @else {
                    <mat-icon>person</mat-icon>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Name -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Vendeur</th>
              <td mat-cell *matCellDef="let seller">
                <div class="seller-name">
                  <span class="name">{{ seller.firstName }} {{ seller.lastName }}</span>
                  <span class="email">{{ seller.email }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Employee ID -->
            <ng-container matColumnDef="employeeId">
              <th mat-header-cell *matHeaderCellDef>ID Employé</th>
              <td mat-cell *matCellDef="let seller">
                {{ seller.employeeId || '-' }}
              </td>
            </ng-container>

            <!-- Permissions -->
            <ng-container matColumnDef="permissions">
              <th mat-header-cell *matHeaderCellDef>Permissions</th>
              <td mat-cell *matCellDef="let seller">
                <div class="permissions-chips">
                  @if (seller.permissions?.sales) {
                    <mat-chip>Ventes</mat-chip>
                  }
                  @if (seller.permissions?.stock) {
                    <mat-chip>Stock</mat-chip>
                  }
                  @if (seller.permissions?.cashRegister) {
                    <mat-chip>Caisse</mat-chip>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Performance -->
            <ng-container matColumnDef="performance">
              <th mat-header-cell *matHeaderCellDef>Performance</th>
              <td mat-cell *matCellDef="let seller">
                <div class="performance">
                  <span class="sales">{{ seller.performance?.totalRevenue | number:'1.0-0' }} Ar</span>
                  <span class="orders">{{ seller.performance?.totalOrders || 0 }} commandes</span>
                </div>
              </td>
            </ng-container>

            <!-- Status -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let seller">
                <mat-chip [class]="'status-' + seller.status">
                  {{ getStatusLabel(seller.status) }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Actions -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let seller">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="openEditDialog(seller)">
                    <mat-icon>edit</mat-icon>
                    <span>Modifier</span>
                  </button>
                  <button mat-menu-item (click)="openPermissionsDialog(seller)">
                    <mat-icon>security</mat-icon>
                    <span>Permissions</span>
                  </button>
                  <mat-divider></mat-divider>
                  @if (seller.status === 'active') {
                    <button mat-menu-item (click)="updateStatus(seller, 'inactive')">
                      <mat-icon>block</mat-icon>
                      <span>Désactiver</span>
                    </button>
                    <button mat-menu-item (click)="updateStatus(seller, 'on_leave')">
                      <mat-icon>beach_access</mat-icon>
                      <span>Mettre en congé</span>
                    </button>
                  } @else {
                    <button mat-menu-item (click)="updateStatus(seller, 'active')">
                      <mat-icon>check_circle</mat-icon>
                      <span>Activer</span>
                    </button>
                  }
                  <mat-divider></mat-divider>
                  <button mat-menu-item (click)="deleteSeller(seller)" class="delete-item">
                    <mat-icon color="warn">delete</mat-icon>
                    <span>Supprimer</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          @if (sellers().length === 0) {
            <div class="empty-state">
              <mat-icon>people</mat-icon>
              <h3>Aucun vendeur</h3>
              <p>Ajoutez des vendeurs pour gérer votre équipe.</p>
              <button mat-raised-button color="primary" (click)="openCreateDialog()">
                <mat-icon>person_add</mat-icon>
                Ajouter un vendeur
              </button>
            </div>
          }

          <mat-paginator
            [length]="pagination()?.total || 0"
            [pageSize]="pagination()?.limit || 10"
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
    .sellers-container {
      padding: 24px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;

      h1 {
        font-size: 2rem;
        margin: 0;
      }

      .subtitle {
        color: var(--text-secondary);
        margin: 4px 0 0 0;
      }
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: var(--primary);
      }

      &.active mat-icon {
        color: var(--success);
      }

      &.sales mat-icon {
        color: var(--warning);
      }

      .stat-info {
        display: flex;
        flex-direction: column;

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .stat-label {
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

    .seller-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
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

    .seller-name {
      display: flex;
      flex-direction: column;

      .name {
        font-weight: 500;
      }

      .email {
        font-size: 0.85rem;
        color: var(--text-secondary);
      }
    }

    .permissions-chips {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;

      mat-chip {
        font-size: 0.75rem;
        min-height: 24px;
      }
    }

    .performance {
      display: flex;
      flex-direction: column;

      .sales {
        font-weight: 500;
        color: var(--success);
      }

      .orders {
        font-size: 0.85rem;
        color: var(--text-secondary);
      }
    }

    mat-chip {
      &.status-active {
        background: var(--success-light) !important;
        color: var(--success) !important;
      }
      &.status-inactive {
        background: var(--bg-secondary) !important;
        color: var(--text-secondary) !important;
      }
      &.status-on_leave {
        background: var(--warning-light) !important;
        color: var(--warning) !important;
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
        margin-bottom: 16px;
      }
    }

    .delete-item {
      color: var(--error);
    }

    mat-paginator {
      border-top: 1px solid var(--border-color);
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 16px;
      }

      .filters-row {
        flex-direction: column;
      }
    }
  `]
})
export class ShopSellersComponent implements OnInit {
  sellers = signal([]);
  stats = signal(null);
  pagination = signal(null);
  isLoading = signal(true);

  displayedColumns = ['avatar', 'name', 'employeeId', 'permissions', 'performance', 'status', 'actions'];

  searchQuery = '';
  selectedStatus = null;

  constructor(
    private sellerService: SellerService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadSellers();
    this.loadStats();
  }

  loadStats() {
    this.sellerService.getStatistics().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.stats.set(response.data);
        }
      }
    });
  }

  loadSellers(page = 1) {
    this.isLoading.set(true);

    const filters = { page, limit: 10 };
    if (this.searchQuery) filters['search'] = this.searchQuery;
    if (this.selectedStatus) filters['status'] = this.selectedStatus;

    this.sellerService.getSellers(filters).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.sellers.set(response.data.sellers);
          this.pagination.set(response.data.pagination);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  applyFilters() {
    this.loadSellers();
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedStatus = null;
    this.loadSellers();
  }

  onPageChange(event) {
    this.loadSellers(event.pageIndex + 1);
  }

  getStatusLabel(status) {
    const labels = {
      active: 'Actif',
      inactive: 'Inactif',
      on_leave: 'En congé'
    };
    return labels[status] || status;
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(SellerFormDialogComponent, {
      width: '500px',
      data: { seller: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSellers();
        this.loadStats();
      }
    });
  }

  openEditDialog(seller) {
    const dialogRef = this.dialog.open(SellerFormDialogComponent, {
      width: '500px',
      data: { seller }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSellers();
      }
    });
  }

  openPermissionsDialog(seller) {
    const permissions = { ...seller.permissions };
    const result = prompt(
      'Permissions (séparez par des virgules): sales, stock, cashRegister, orders, customers, reports',
      Object.entries(permissions).filter(([, v]) => v).map(([k]) => k).join(', ')
    );

    if (result !== null) {
      const selected = result.split(',').map(p => p.trim());
      const newPermissions = {};
      ['sales', 'stock', 'cashRegister', 'orders', 'customers', 'reports'].forEach(p => {
        newPermissions[p] = selected.includes(p);
      });

      this.sellerService.updatePermissions(seller._id, newPermissions).subscribe({
        next: () => {
          this.snackBar.open('Permissions mises à jour', 'OK', { duration: 3000 });
          this.loadSellers();
        }
      });
    }
  }

  updateStatus(seller, status) {
    this.sellerService.updateStatus(seller._id, status).subscribe({
      next: () => {
        this.snackBar.open('Statut mis à jour', 'OK', { duration: 3000 });
        this.loadSellers();
        this.loadStats();
      }
    });
  }

  deleteSeller(seller) {
    if (!confirm(`Supprimer ${seller.firstName} ${seller.lastName} ?`)) return;

    this.sellerService.deleteSeller(seller._id).subscribe({
      next: () => {
        this.snackBar.open('Vendeur supprimé', 'OK', { duration: 3000 });
        this.loadSellers();
        this.loadStats();
      }
    });
  }
}
