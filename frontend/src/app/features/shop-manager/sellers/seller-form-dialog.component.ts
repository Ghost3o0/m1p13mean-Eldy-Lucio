import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { SellerService } from '@shared/services/seller.service';

@Component({
  selector: 'app-seller-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './seller-form-dialog.component.html',
  styleUrls: ['./seller-form-dialog.component.scss'],})
export class SellerFormDialogComponent implements OnInit {
  isSaving = signal(false);

  formData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeId: '',
    permissions: {
      sales: true,
      stock: false,
      cashRegister: false,
      orders: false,
      customers: false,
      reports: false
    }
  };

  constructor(
    private dialogRef: MatDialogRef<SellerFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    private sellerService: SellerService
  ) {}

  ngOnInit() {
    if (this.data.seller) {
      this.formData = {
        firstName: this.data.seller.firstName || '',
        lastName: this.data.seller.lastName || '',
        email: this.data.seller.email || '',
        phone: this.data.seller.phone || '',
        employeeId: this.data.seller.employeeId || '',
        permissions: {
          sales: this.data.seller.permissions?.sales ?? true,
          stock: this.data.seller.permissions?.stock ?? false,
          cashRegister: this.data.seller.permissions?.cashRegister ?? false,
          orders: this.data.seller.permissions?.orders ?? false,
          customers: this.data.seller.permissions?.customers ?? false,
          reports: this.data.seller.permissions?.reports ?? false
        }
      };
    }
  }

  save() {
    if (!this.formData.firstName || !this.formData.lastName || !this.formData.email) return;

    this.isSaving.set(true);

    const payload = {
      firstName: this.formData.firstName,
      lastName: this.formData.lastName,
      email: this.formData.email,
      phone: this.formData.phone || undefined,
      employeeId: this.formData.employeeId || undefined,
      permissions: this.formData.permissions
    };

    const request = this.data.seller
      ? this.sellerService.updateSeller(this.data.seller._id, payload)
      : this.sellerService.createSeller(payload);

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


