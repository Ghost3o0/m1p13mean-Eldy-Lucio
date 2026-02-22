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
  template: `
    <h2 mat-dialog-title>{{ data.coupon ? 'Modifier le coupon' : 'Nouveau coupon' }}</h2>
    <mat-dialog-content>
      <form class="coupon-form">
        <!-- Basic Info -->
        <div class="form-section">
          <h3>Informations générales</h3>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Code</mat-label>
              <input matInput [(ngModel)]="formData.code" name="code" required
                     [readonly]="!!data.coupon" placeholder="PROMO20">
              <mat-hint>Lettres majuscules et chiffres</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Nom (optionnel)</mat-label>
              <input matInput [(ngModel)]="formData.name" name="name" placeholder="Promotion été">
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description</mat-label>
            <textarea matInput [(ngModel)]="formData.description" name="description" rows="2"></textarea>
          </mat-form-field>
        </div>

        <mat-divider></mat-divider>

        <!-- Discount -->
        <div class="form-section">
          <h3>Réduction</h3>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Type</mat-label>
              <mat-select [(ngModel)]="formData.type" name="type" required>
                <mat-option value="percentage">Pourcentage (%)</mat-option>
                <mat-option value="fixed_amount">Montant fixe (Ar)</mat-option>
                <mat-option value="free_shipping">Livraison gratuite</mat-option>
              </mat-select>
            </mat-form-field>

            @if (formData.type !== 'free_shipping') {
              <mat-form-field appearance="outline">
                <mat-label>Valeur</mat-label>
                <input matInput type="number" [(ngModel)]="formData.value" name="value" required min="0">
                <span matTextSuffix>{{ formData.type === 'percentage' ? '%' : 'Ar' }}</span>
              </mat-form-field>
            }
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Validity -->
        <div class="form-section">
          <h3>Période de validité</h3>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Date de début</mat-label>
              <input matInput [matDatepicker]="startPicker" [(ngModel)]="formData.startDate" name="startDate" required>
              <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Date de fin</mat-label>
              <input matInput [matDatepicker]="endPicker" [(ngModel)]="formData.endDate" name="endDate" required>
              <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>
          </div>

          <mat-checkbox [(ngModel)]="formData.isFlashPromotion" name="flash" color="primary">
            Promotion flash (temps limité)
          </mat-checkbox>
        </div>

        <mat-divider></mat-divider>

        <!-- Conditions -->
        <div class="form-section">
          <h3>Conditions</h3>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Montant minimum de commande</mat-label>
              <input matInput type="number" [(ngModel)]="formData.minOrderAmount" name="minOrder" min="0">
              <span matTextSuffix>Ar</span>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Réduction maximum</mat-label>
              <input matInput type="number" [(ngModel)]="formData.maxDiscount" name="maxDiscount" min="0">
              <span matTextSuffix>Ar</span>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Limite totale d'utilisation</mat-label>
              <input matInput type="number" [(ngModel)]="formData.totalLimit" name="totalLimit" min="0">
              <mat-hint>Laisser vide pour illimité</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Limite par client</mat-label>
              <input matInput type="number" [(ngModel)]="formData.perCustomerLimit" name="perCustomer" min="1">
            </mat-form-field>
          </div>

          <mat-checkbox [(ngModel)]="formData.firstOrderOnly" name="firstOrder" color="primary">
            Première commande uniquement
          </mat-checkbox>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-raised-button color="primary" (click)="save()"
              [disabled]="isSaving() || !formData.code || !formData.type">
        @if (isSaving()) {
          Enregistrement...
        } @else {
          {{ data.coupon ? 'Modifier' : 'Créer' }}
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 500px;
    }

    .coupon-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-section {
      padding: 16px 0;

      h3 {
        margin: 0 0 16px 0;
        font-size: 0.95rem;
        color: var(--text-secondary);
      }
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

    mat-checkbox {
      margin-top: 8px;
    }

    @media (max-width: 600px) {
      mat-dialog-content {
        min-width: auto;
      }

      .form-row {
        flex-direction: column;
      }
    }
  `]
})
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
