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
  template: `
    <h2 mat-dialog-title>{{ data.seller ? 'Modifier le vendeur' : 'Nouveau vendeur' }}</h2>
    <mat-dialog-content>
      <form class="seller-form">
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Prénom</mat-label>
            <input matInput [(ngModel)]="formData.firstName" name="firstName" required>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Nom</mat-label>
            <input matInput [(ngModel)]="formData.lastName" name="lastName" required>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput [(ngModel)]="formData.email" name="email" type="email" required>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Téléphone</mat-label>
            <input matInput [(ngModel)]="formData.phone" name="phone">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>ID Employé</mat-label>
            <input matInput [(ngModel)]="formData.employeeId" name="employeeId" placeholder="EMP-001">
          </mat-form-field>
        </div>

        <mat-divider></mat-divider>

        <div class="permissions-section">
          <h3>Permissions</h3>
          <div class="permissions-grid">
            <mat-checkbox [(ngModel)]="formData.permissions.sales" name="permSales">
              <mat-icon>point_of_sale</mat-icon>
              Ventes
            </mat-checkbox>
            <mat-checkbox [(ngModel)]="formData.permissions.stock" name="permStock">
              <mat-icon>inventory</mat-icon>
              Stock
            </mat-checkbox>
            <mat-checkbox [(ngModel)]="formData.permissions.cashRegister" name="permCash">
              <mat-icon>calculate</mat-icon>
              Caisse
            </mat-checkbox>
            <mat-checkbox [(ngModel)]="formData.permissions.orders" name="permOrders">
              <mat-icon>shopping_cart</mat-icon>
              Commandes
            </mat-checkbox>
            <mat-checkbox [(ngModel)]="formData.permissions.customers" name="permCustomers">
              <mat-icon>people</mat-icon>
              Clients
            </mat-checkbox>
            <mat-checkbox [(ngModel)]="formData.permissions.reports" name="permReports">
              <mat-icon>analytics</mat-icon>
              Rapports
            </mat-checkbox>
          </div>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-raised-button color="primary" (click)="save()"
              [disabled]="isSaving() || !formData.firstName || !formData.lastName || !formData.email">
        @if (isSaving()) {
          Enregistrement...
        } @else {
          {{ data.seller ? 'Modifier' : 'Créer' }}
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 400px;
    }

    .seller-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 0;
    }

    .form-row {
      display: flex;
      gap: 16px;

      mat-form-field {
        flex: 1;
      }
    }

    .full-width {
      width: 100%;
    }

    mat-divider {
      margin: 8px 0;
    }

    .permissions-section {
      padding: 16px 0;

      h3 {
        margin: 0 0 16px 0;
        font-size: 1rem;
        color: var(--text-secondary);
      }
    }

    .permissions-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;

      mat-checkbox {
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          margin-right: 8px;
          vertical-align: middle;
          color: var(--text-secondary);
        }
      }
    }

    @media (max-width: 600px) {
      mat-dialog-content {
        min-width: auto;
      }

      .form-row {
        flex-direction: column;
      }

      .permissions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
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
