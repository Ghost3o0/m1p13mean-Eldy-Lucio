import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-payment-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <h2 mat-dialog-title>Détails du paiement</h2>
    <mat-dialog-content>
      <div class="payment-details">
        <!-- Header -->
        <div class="detail-header">
          <span class="payment-number">{{ data.payment.paymentNumber }}</span>
          <mat-chip [class]="'status-' + data.payment.status">
            {{ getStatusLabel(data.payment.status) }}
          </mat-chip>
        </div>

        <mat-divider></mat-divider>

        <!-- Shop & Box Info -->
        <div class="detail-section">
          <h3>Boutique</h3>
          <div class="detail-row">
            <mat-icon>store</mat-icon>
            <span>{{ getShopName(data.payment.shopId) }}</span>
          </div>
          @if (data.payment.boxId) {
            <div class="detail-row">
              <mat-icon>business</mat-icon>
              <span>{{ getBoxName(data.payment.boxId) }}</span>
            </div>
          }
        </div>

        <mat-divider></mat-divider>

        <!-- Period & Amount -->
        <div class="detail-section">
          <h3>Paiement</h3>
          <div class="detail-row">
            <mat-icon>calendar_month</mat-icon>
            <span>Période: {{ getMonthLabel(data.payment.period?.month) }} {{ data.payment.period?.year }}</span>
          </div>
          <div class="detail-row amount-row">
            <mat-icon>payments</mat-icon>
            <span class="amount">{{ data.payment.amount | number:'1.2-2' }} Ar</span>
          </div>
          <div class="detail-row">
            <mat-icon>{{ getMethodIcon(data.payment.paymentMethod) }}</mat-icon>
            <span>{{ getMethodLabel(data.payment.paymentMethod) }}</span>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Dates -->
        <div class="detail-section">
          <h3>Dates</h3>
          <div class="detail-row">
            <mat-icon>event</mat-icon>
            <span>Date de paiement: {{ data.payment.paymentDate | date:'dd/MM/yyyy' }}</span>
          </div>
          <div class="detail-row">
            <mat-icon>schedule</mat-icon>
            <span>Échéance: {{ data.payment.dueDate | date:'dd/MM/yyyy' }}</span>
          </div>
          <div class="detail-row">
            <mat-icon>add_circle</mat-icon>
            <span>Soumis le: {{ data.payment.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
        </div>

        <!-- Validation Info -->
        @if (data.payment.validation?.validatedAt) {
          <mat-divider></mat-divider>
          <div class="detail-section">
            <h3>Validation</h3>
            <div class="detail-row">
              <mat-icon>check_circle</mat-icon>
              <span>Validé le: {{ data.payment.validation?.validatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            @if (data.payment.validation?.rejectionReason) {
              <div class="detail-row rejection">
                <mat-icon>info</mat-icon>
                <span>Raison: {{ data.payment.validation?.rejectionReason }}</span>
              </div>
            }
          </div>
        }

        <!-- Invoice -->
        @if (data.payment.invoice?.number) {
          <mat-divider></mat-divider>
          <div class="detail-section">
            <h3>Facture</h3>
            <div class="detail-row">
              <mat-icon>receipt</mat-icon>
              <span>N°: {{ data.payment.invoice?.number }}</span>
            </div>
            @if (data.payment.invoice?.path) {
              <button mat-stroked-button color="primary" (click)="openInvoice()">
                <mat-icon>download</mat-icon>
                Télécharger la facture
              </button>
            }
          </div>
        }

        <!-- Proof -->
        @if (data.payment.paymentProof?.length) {
          <mat-divider></mat-divider>
          <div class="detail-section">
            <h3>Justificatifs</h3>
            <div class="proofs-list">
              @for (proof of data.payment.paymentProof; track proof.filename) {
                <button mat-stroked-button (click)="openProof(proof)">
                  <mat-icon>attach_file</mat-icon>
                  {{ proof.filename }}
                </button>
              }
            </div>
          </div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Fermer</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 450px;
    }

    .payment-details {
      padding: 8px 0;
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .payment-number {
        font-family: monospace;
        font-size: 1.2rem;
        font-weight: 600;
      }
    }

    .detail-section {
      padding: 16px 0;

      h3 {
        margin: 0 0 12px 0;
        font-size: 0.9rem;
        color: var(--text-secondary);
        text-transform: uppercase;
      }
    }

    .detail-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;

      mat-icon {
        color: var(--text-secondary);
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      &.amount-row .amount {
        font-size: 1.3rem;
        font-weight: 600;
        color: var(--success);
      }

      &.rejection {
        color: var(--error);

        mat-icon {
          color: var(--error);
        }
      }
    }

    .proofs-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    mat-chip {
      &.status-pending {
        background: var(--warning-light) !important;
        color: var(--warning) !important;
      }
      &.status-validated {
        background: var(--success-light) !important;
        color: var(--success) !important;
      }
      &.status-rejected {
        background: var(--error-light) !important;
        color: var(--error) !important;
      }
      &.status-late {
        background: var(--error-light) !important;
        color: var(--error) !important;
      }
    }

    mat-divider {
      margin: 8px 0;
    }

    @media (max-width: 600px) {
      mat-dialog-content {
        min-width: auto;
      }
    }
  `]
})
export class PaymentDetailDialogComponent {
  private months = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
  ];

  constructor(
    private dialogRef: MatDialogRef<PaymentDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  getShopName(shop) {
    if (typeof shop === 'object' && shop?.name) {
      return shop.name;
    }
    return 'Boutique';
  }

  getBoxName(box) {
    if (typeof box === 'object' && box?.name) {
      return box.name;
    }
    return 'Box';
  }

  getMonthLabel(month) {
    if (!month) return '';
    return this.months.find(m => m.value === month)?.label || '';
  }

  getMethodIcon(method) {
    const icons = {
      cash: 'payments',
      check: 'receipt_long',
      bank_transfer: 'account_balance'
    };
    return icons[method] || 'payment';
  }

  getMethodLabel(method) {
    const labels = {
      cash: 'Espèces',
      check: 'Chèque',
      bank_transfer: 'Virement bancaire'
    };
    return labels[method] || method;
  }

  getStatusLabel(status) {
    const labels = {
      pending: 'En attente',
      validated: 'Validé',
      rejected: 'Rejeté',
      late: 'En retard'
    };
    return labels[status] || status;
  }

  openInvoice() {
    if (this.data.payment.invoice?.path) {
      window.open(this.data.payment.invoice.path, '_blank');
    }
  }

  openProof(proof) {
    window.open(proof.path, '_blank');
  }
}
