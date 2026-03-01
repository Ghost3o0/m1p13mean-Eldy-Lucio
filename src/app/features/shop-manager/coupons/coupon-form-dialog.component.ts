import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { CouponService } from '@shared/services/coupon.service';

@Component({
  selector: 'app-coupon-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './coupon-form-dialog.component.html',
  styleUrls: ['./coupon-form-dialog.component.scss'],})
export class CouponFormDialogComponent implements OnInit {
  isSaving = signal(false);

  formData = {
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: 10,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isFlashPromotion: false,
    minOrderAmount: 0,
    maxDiscount: null,
    totalLimit: null,
    perCustomerLimit: 1,
    firstOrderOnly: false
  };

  constructor(
    private dialogRef: MatDialogRef<CouponFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    private couponService: CouponService
  ) {}

  ngOnInit() {
    if (this.data.coupon) {
      const c = this.data.coupon;
      this.formData = {
        code: c.code || '',
        name: c.name || '',
        description: c.description || '',
        type: c.type || 'percentage',
        value: c.value || 10,
        startDate: c.validity?.startDate ? new Date(c.validity.startDate) : new Date(),
        endDate: c.validity?.endDate ? new Date(c.validity.endDate) : new Date(),
        isFlashPromotion: c.validity?.isFlashPromotion || false,
        minOrderAmount: c.conditions?.minOrderAmount || 0,
        maxDiscount: c.conditions?.maxDiscount || null,
        totalLimit: c.usage?.totalLimit || null,
        perCustomerLimit: c.conditions?.perCustomerLimit || 1,
        firstOrderOnly: c.conditions?.firstOrderOnly || false
      };
    }
  }

  save() {
    if (!this.formData.code || !this.formData.type) return;

    this.isSaving.set(true);

    const payload = {
      code: this.formData.code.toUpperCase(),
      name: this.formData.name || undefined,
      description: this.formData.description || undefined,
      type: this.formData.type,
      value: this.formData.type === 'free_shipping' ? 0 : this.formData.value,
      validity: {
        startDate: this.formData.startDate.toISOString(),
        endDate: this.formData.endDate.toISOString(),
        isFlashPromotion: this.formData.isFlashPromotion
      },
      conditions: {
        minOrderAmount: this.formData.minOrderAmount || undefined,
        maxDiscount: this.formData.maxDiscount || undefined,
        perCustomerLimit: this.formData.perCustomerLimit,
        firstOrderOnly: this.formData.firstOrderOnly
      },
      usage: {
        totalLimit: this.formData.totalLimit || undefined,
        currentUsage: this.data.coupon?.usage?.currentUsage || 0
      }
    };

    const request = this.data.coupon
      ? this.couponService.updateCoupon(this.data.coupon._id, payload)
      : this.couponService.createCoupon(payload);

    request.subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }
}


