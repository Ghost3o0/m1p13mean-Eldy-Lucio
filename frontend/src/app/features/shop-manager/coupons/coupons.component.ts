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
  templateUrl: './coupons.component.html',
  styleUrls: ['./coupons.component.scss'],})
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


