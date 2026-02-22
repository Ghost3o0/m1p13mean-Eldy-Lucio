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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CouponService } from '@shared/services/coupon.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { CouponFormDialogComponent } from './coupon-form-dialog.component';

@Component({
  selector: 'app-shop-coupons',
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
    MatSlideToggleModule,
    MatSnackBarModule,
    LoadingComponent
  ],
  template: `
    <div class="coupons-container">
      <div class="page-header">
        <div>
          <h1>Mes Coupons</h1>
          <p class="subtitle">Gérez vos codes promotionnels</p>
        </div>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Nouveau coupon
        </button>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <mat-card class="stat-card">
          <mat-icon>confirmation_number</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats()?.totalCoupons || 0 }}</span>
            <span class="stat-label">Total coupons</span>
          </div>
        </mat-card>
        <mat-card class="stat-card active">
          <mat-icon>check_circle</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats()?.activeCoupons || 0 }}</span>
            <span class="stat-label">Actifs</span>
          </div>
        </mat-card>
        <mat-card class="stat-card usage">
          <mat-icon>trending_up</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats()?.totalUsage || 0 }}</span>
            <span class="stat-label">Utilisations</span>
          </div>
        </mat-card>
      </div>

      <!-- Table -->
      @if (isLoading()) {
        <app-loading message="Chargement des coupons..."></app-loading>
      } @else {
        <mat-card class="table-card">
          <table mat-table [dataSource]="coupons()">
            <!-- Code -->
            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef>Code</th>
              <td mat-cell *matCellDef="let coupon">
                <span class="coupon-code">{{ coupon.code }}</span>
              </td>
            </ng-container>

            <!-- Name -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nom</th>
              <td mat-cell *matCellDef="let coupon">
                {{ coupon.name || '-' }}
              </td>
            </ng-container>

            <!-- Type -->
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let coupon">
                <mat-chip [class]="'type-' + coupon.type">
                  {{ getTypeLabel(coupon.type) }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Value -->
            <ng-container matColumnDef="value">
              <th mat-header-cell *matHeaderCellDef>Valeur</th>
              <td mat-cell *matCellDef="let coupon">
                <span class="coupon-value">
                  @if (coupon.type === 'percentage') {
                    {{ coupon.value }}%
                  } @else if (coupon.type === 'fixed_amount') {
                    {{ coupon.value }} Ar
                  } @else {
                    Livraison gratuite
                  }
                </span>
              </td>
            </ng-container>

            <!-- Usage -->
            <ng-container matColumnDef="usage">
              <th mat-header-cell *matHeaderCellDef>Utilisation</th>
              <td mat-cell *matCellDef="let coupon">
                {{ coupon.usage?.currentUsage || 0 }}
                @if (coupon.usage?.totalLimit) {
                  / {{ coupon.usage.totalLimit }}
                }
              </td>
            </ng-container>

            <!-- Validity -->
            <ng-container matColumnDef="validity">
              <th mat-header-cell *matHeaderCellDef>Validité</th>
              <td mat-cell *matCellDef="let coupon">
                <div class="validity">
                  <span>{{ coupon.validity?.startDate | date:'dd/MM/yy' }}</span>
                  <mat-icon>arrow_forward</mat-icon>
                  <span>{{ coupon.validity?.endDate | date:'dd/MM/yy' }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Status -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let coupon">
                <mat-slide-toggle
                  [checked]="coupon.isActive"
                  (change)="toggleStatus(coupon)"
                  color="primary">
                </mat-slide-toggle>
              </td>
            </ng-container>

            <!-- Actions -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let coupon">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="openEditDialog(coupon)">
                    <mat-icon>edit</mat-icon>
                    <span>Modifier</span>
                  </button>
                  <button mat-menu-item (click)="copyCode(coupon.code)">
                    <mat-icon>content_copy</mat-icon>
                    <span>Copier le code</span>
                  </button>
                  <mat-divider></mat-divider>
                  <button mat-menu-item (click)="deleteCoupon(coupon)" class="delete-item">
                    <mat-icon color="warn">delete</mat-icon>
                    <span>Supprimer</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                [class.expired]="isExpired(row)"
                [class.inactive]="!row.isActive">
            </tr>
          </table>

          @if (coupons().length === 0) {
            <div class="empty-state">
              <mat-icon>confirmation_number</mat-icon>
              <h3>Aucun coupon</h3>
              <p>Créez des codes promotionnels pour vos clients.</p>
              <button mat-raised-button color="primary" (click)="openCreateDialog()">
                <mat-icon>add</mat-icon>
                Créer un coupon
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
    .coupons-container {
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

      &.usage mat-icon {
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

    .table-card {
      overflow: hidden;
    }

    table {
      width: 100%;
    }

    .coupon-code {
      font-family: monospace;
      font-weight: 600;
      font-size: 1rem;
      padding: 4px 8px;
      background: var(--primary-50);
      border-radius: 4px;
    }

    .coupon-value {
      font-weight: 600;
      color: var(--success);
    }

    mat-chip {
      &.type-percentage {
        background: var(--primary-50) !important;
        color: var(--primary) !important;
      }
      &.type-fixed_amount {
        background: var(--success-light) !important;
        color: var(--success) !important;
      }
      &.type-free_shipping {
        background: var(--warning-light) !important;
        color: var(--warning) !important;
      }
    }

    .validity {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.85rem;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
        color: var(--text-secondary);
      }
    }

    tr.expired {
      opacity: 0.5;
    }

    tr.inactive {
      background: var(--bg-secondary);
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
    }
  `]
})
export class ShopCouponsComponent implements OnInit {
  coupons = signal([]);
  stats = signal(null);
  pagination = signal(null);
  isLoading = signal(true);

  displayedColumns = ['code', 'name', 'type', 'value', 'usage', 'validity', 'status', 'actions'];

  constructor(
    private couponService: CouponService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadCoupons();
    this.loadStats();
  }

  loadStats() {
    this.couponService.getShopCouponStats().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.stats.set(response.data);
        }
      }
    });
  }

  loadCoupons(page = 1) {
    this.isLoading.set(true);

    this.couponService.getShopCoupons({ page, limit: 10, includeExpired: true }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.coupons.set(response.data.coupons);
          this.pagination.set(response.data.pagination);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onPageChange(event) {
    this.loadCoupons(event.pageIndex + 1);
  }

  getTypeLabel(type) {
    const labels = {
      percentage: 'Pourcentage',
      fixed_amount: 'Montant fixe',
      free_shipping: 'Livraison gratuite'
    };
    return labels[type] || type;
  }

  isExpired(coupon) {
    return new Date(coupon.validity?.endDate) < new Date();
  }

  toggleStatus(coupon) {
    this.couponService.toggleCouponStatus(coupon._id).subscribe({
      next: () => {
        this.loadCoupons();
        this.loadStats();
      }
    });
  }

  copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
      this.snackBar.open('Code copié!', 'OK', { duration: 2000 });
    });
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(CouponFormDialogComponent, {
      width: '600px',
      data: { coupon: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCoupons();
        this.loadStats();
      }
    });
  }

  openEditDialog(coupon) {
    const dialogRef = this.dialog.open(CouponFormDialogComponent, {
      width: '600px',
      data: { coupon }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCoupons();
      }
    });
  }

  deleteCoupon(coupon) {
    if (!confirm(`Supprimer le coupon "${coupon.code}" ?`)) return;

    this.couponService.deleteCoupon(coupon._id).subscribe({
      next: () => {
        this.snackBar.open('Coupon supprimé', 'OK', { duration: 3000 });
        this.loadCoupons();
        this.loadStats();
      }
    });
  }
}
