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
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RentPaymentService } from '@shared/services/rent-payment.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { PaymentDetailDialogComponent } from './payment-detail-dialog.component';
import { ExportService, ExportColumn } from '@shared/services/export.service';

@Component({
  selector: 'app-admin-rent-payments',
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
    MatTabsModule,
    MatDividerModule,
    MatDialogModule,
    MatTooltipModule,
    LoadingComponent
  ],
  template: `
    <div class="payments-container">
      <div class="payments-header">
        <div class="header-left">
          <h1>Paiements de loyer</h1>
          <div class="export-buttons">
            <button mat-stroked-button (click)="exportToExcel()" matTooltip="Exporter en Excel">
              <mat-icon>table_chart</mat-icon>
              Excel
            </button>
            <button mat-stroked-button (click)="exportToPDF()" matTooltip="Exporter en PDF">
              <mat-icon>picture_as_pdf</mat-icon>
              PDF
            </button>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat">
            <span class="stat-value">{{ stats()?.totalPayments || 0 }}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="stat pending">
            <span class="stat-value">{{ stats()?.pendingPayments || 0 }}</span>
            <span class="stat-label">En attente</span>
          </div>
          <div class="stat late">
            <span class="stat-value">{{ stats()?.latePayments || 0 }}</span>
            <span class="stat-label">En retard</span>
          </div>
          <div class="stat validated">
            <span class="stat-value">{{ stats()?.totalRevenue | number:'1.0-0' }} Ar</span>
            <span class="stat-label">Revenus validés</span>
          </div>
        </div>
      </div>

      <mat-tab-group (selectedTabChange)="onTabChange($event.index)">
        <mat-tab label="Tous"></mat-tab>
        <mat-tab label="En attente"></mat-tab>
        <mat-tab label="Validés"></mat-tab>
        <mat-tab label="En retard"></mat-tab>
        <mat-tab label="Rejetés"></mat-tab>
      </mat-tab-group>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline">
              <mat-label>Mois</mat-label>
              <mat-select [(ngModel)]="selectedMonth" (selectionChange)="applyFilters()">
                <mat-option [value]="null">Tous</mat-option>
                @for (month of months; track month.value) {
                  <mat-option [value]="month.value">{{ month.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Année</mat-label>
              <mat-select [(ngModel)]="selectedYear" (selectionChange)="applyFilters()">
                <mat-option [value]="null">Toutes</mat-option>
                @for (year of years; track year) {
                  <mat-option [value]="year">{{ year }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Mode de paiement</mat-label>
              <mat-select [(ngModel)]="selectedMethod" (selectionChange)="applyFilters()">
                <mat-option [value]="null">Tous</mat-option>
                <mat-option value="cash">Espèces</mat-option>
                <mat-option value="check">Chèque</mat-option>
                <mat-option value="bank_transfer">Virement</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-icon-button (click)="clearFilters()" matTooltip="Réinitialiser">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      @if (isLoading()) {
        <app-loading message="Chargement des paiements..."></app-loading>
      }

      @if (!isLoading()) {
        <mat-card class="table-card">
          <table mat-table [dataSource]="payments()">
            <!-- Payment Number -->
            <ng-container matColumnDef="paymentNumber">
              <th mat-header-cell *matHeaderCellDef>N° Paiement</th>
              <td mat-cell *matCellDef="let payment">
                <span class="payment-number">{{ payment.paymentNumber }}</span>
              </td>
            </ng-container>

            <!-- Shop -->
            <ng-container matColumnDef="shop">
              <th mat-header-cell *matHeaderCellDef>Boutique</th>
              <td mat-cell *matCellDef="let payment">
                <div class="shop-cell">
                  <span class="shop-name">{{ getShopName(payment.shopId) }}</span>
                  <span class="box-name">{{ getBoxName(payment.boxId) }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Period -->
            <ng-container matColumnDef="period">
              <th mat-header-cell *matHeaderCellDef>Période</th>
              <td mat-cell *matCellDef="let payment">
                {{ getMonthLabel(payment.period?.month) }} {{ payment.period?.year }}
              </td>
            </ng-container>

            <!-- Amount -->
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Montant</th>
              <td mat-cell *matCellDef="let payment">
                <span class="amount">{{ payment.amount | number:'1.2-2' }} Ar</span>
              </td>
            </ng-container>

            <!-- Method -->
            <ng-container matColumnDef="method">
              <th mat-header-cell *matHeaderCellDef>Mode</th>
              <td mat-cell *matCellDef="let payment">
                <mat-chip class="method-chip">
                  <mat-icon>{{ getMethodIcon(payment.paymentMethod) }}</mat-icon>
                  {{ getMethodLabel(payment.paymentMethod) }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Payment Date -->
            <ng-container matColumnDef="paymentDate">
              <th mat-header-cell *matHeaderCellDef>Date paiement</th>
              <td mat-cell *matCellDef="let payment">
                {{ payment.paymentDate | date:'dd/MM/yyyy' }}
              </td>
            </ng-container>

            <!-- Status -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let payment">
                <mat-chip [class]="'status-' + payment.status">
                  {{ getStatusLabel(payment.status) }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Actions -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let payment">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="viewDetails(payment)">
                    <mat-icon>visibility</mat-icon>
                    <span>Voir les détails</span>
                  </button>
                  @if (payment.paymentProof?.length) {
                    <button mat-menu-item (click)="viewProof(payment)">
                      <mat-icon>attach_file</mat-icon>
                      <span>Voir le justificatif</span>
                    </button>
                  }
                  <mat-divider></mat-divider>
                  @if (payment.status === 'pending') {
                    <button mat-menu-item (click)="validatePayment(payment)">
                      <mat-icon color="primary">check_circle</mat-icon>
                      <span>Valider</span>
                    </button>
                    <button mat-menu-item (click)="rejectPayment(payment)">
                      <mat-icon color="warn">cancel</mat-icon>
                      <span>Rejeter</span>
                    </button>
                  }
                  @if (payment.status === 'validated' && !payment.invoice?.number) {
                    <button mat-menu-item (click)="generateInvoice(payment)">
                      <mat-icon>receipt</mat-icon>
                      <span>Générer la facture</span>
                    </button>
                  }
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="payment-row"></tr>
          </table>

          @if (payments().length === 0) {
            <div class="empty-state">
              <mat-icon>payments</mat-icon>
              <h3>Aucun paiement</h3>
              <p>Aucun paiement ne correspond à vos critères.</p>
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
    .payments-container {
      padding: 24px;
    }

    .payments-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;

      .header-left {
        display: flex;
        align-items: center;
        gap: 24px;
      }

      h1 {
        font-size: 2rem;
        margin: 0;
      }

      .export-buttons {
        display: flex;
        gap: 8px;
        button mat-icon { margin-right: 4px; }
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

          &.late .stat-value {
            color: var(--error);
          }

          &.validated .stat-value {
            color: var(--success);
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
      flex-wrap: wrap;
    }

    .table-card {
      overflow: hidden;
    }

    table {
      width: 100%;
    }

    .payment-number {
      font-family: monospace;
      font-weight: 500;
    }

    .shop-cell {
      display: flex;
      flex-direction: column;

      .shop-name {
        font-weight: 500;
      }

      .box-name {
        font-size: 0.85rem;
        color: var(--text-secondary);
      }
    }

    .amount {
      font-weight: 600;
      color: var(--success);
    }

    .method-chip {
      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        margin-right: 4px;
      }
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

    .payment-row {
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
      .payments-header {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class AdminRentPaymentsComponent implements OnInit {
  payments = signal([]);
  stats = signal(null);
  pagination = signal(null);
  isLoading = signal(true);

  displayedColumns = ['paymentNumber', 'shop', 'period', 'amount', 'method', 'paymentDate', 'status', 'actions'];

  selectedMonth = null;
  selectedYear = null;
  selectedMethod = null;
  currentTab = 0;

  months = [
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

  years = [];

  private statusFilters = [undefined, 'pending', 'validated', 'late', 'rejected'];

  constructor(
    private rentPaymentService: RentPaymentService,
    private dialog: MatDialog,
    private exportService: ExportService
  ) {
    const currentYear = new Date().getFullYear();
    this.years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
  }

  ngOnInit() {
    this.loadStats();
    this.loadPayments();
  }

  loadStats() {
    this.rentPaymentService.getStatistics().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.stats.set(response.data);
        }
      }
    });
  }

  loadPayments(page = 1) {
    this.isLoading.set(true);

    const filters = { page, limit: 20 };
    if (this.selectedMonth) filters['month'] = this.selectedMonth;
    if (this.selectedYear) filters['year'] = this.selectedYear;
    if (this.selectedMethod) filters['paymentMethod'] = this.selectedMethod;

    const statusFilter = this.statusFilters[this.currentTab];
    if (statusFilter) filters['status'] = statusFilter;

    this.rentPaymentService.getAllPayments(filters).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.payments.set(response.data.payments);
          this.pagination.set(response.data.pagination);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onTabChange(index) {
    this.currentTab = index;
    this.loadPayments();
  }

  applyFilters() {
    this.loadPayments();
  }

  clearFilters() {
    this.selectedMonth = null;
    this.selectedYear = null;
    this.selectedMethod = null;
    this.loadPayments();
  }

  onPageChange(event) {
    this.loadPayments(event.pageIndex + 1);
  }

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
    return '';
  }

  getMonthLabel(month) {
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
      bank_transfer: 'Virement'
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

  viewDetails(payment) {
    this.dialog.open(PaymentDetailDialogComponent, {
      width: '600px',
      data: { payment }
    });
  }

  viewProof(payment) {
    if (payment.paymentProof?.length) {
      window.open(payment.paymentProof[0].path, '_blank');
    }
  }

  validatePayment(payment) {
    if (!confirm('Voulez-vous valider ce paiement ?')) return;

    this.rentPaymentService.validatePayment(payment._id).subscribe({
      next: () => {
        this.loadPayments();
        this.loadStats();
      }
    });
  }

  rejectPayment(payment) {
    const reason = prompt('Raison du rejet:');
    if (reason === null) return;

    this.rentPaymentService.rejectPayment(payment._id, reason).subscribe({
      next: () => {
        this.loadPayments();
        this.loadStats();
      }
    });
  }

  generateInvoice(payment) {
    this.rentPaymentService.generateInvoice(payment._id).subscribe({
      next: (response: any) => {
        if (response.success && response.data?.invoice?.path) {
          window.open(response.data.invoice.path, '_blank');
        }
        this.loadPayments();
      }
    });
  }

  // ========== EXPORT METHODS ==========

  private getExportColumns(): ExportColumn[] {
    return [
      { key: 'paymentNumber', header: 'N° Paiement' },
      { key: 'shopId', header: 'Boutique', format: (s) => this.getShopName(s) },
      { key: 'boxId', header: 'Box', format: (b) => this.getBoxName(b) },
      { key: 'period', header: 'Période', format: (p) => `${this.getMonthLabel(p?.month)} ${p?.year}` },
      { key: 'amount', header: 'Montant (Ar)', format: (v) => this.exportService.formatPrice(v) },
      { key: 'paymentMethod', header: 'Mode', format: (m) => this.getMethodLabel(m) },
      { key: 'paymentDate', header: 'Date paiement', format: (v) => this.exportService.formatDate(v) },
      { key: 'status', header: 'Statut', format: (s) => this.getStatusLabel(s) }
    ];
  }

  exportToExcel(): void {
    this.exportService.exportToExcel(this.payments(), this.getExportColumns(), `loyers_${new Date().toISOString().split('T')[0]}`);
  }

  exportToPDF(): void {
    const stats = this.stats();
    const statsHTML = this.exportService.generateStatsHTML([
      { label: 'Total paiements', value: stats?.totalPayments || 0 },
      { label: 'En attente', value: stats?.pendingPayments || 0 },
      { label: 'En retard', value: stats?.latePayments || 0 },
      { label: 'Revenus validés', value: this.exportService.formatPrice(stats?.totalRevenue || 0) }
    ]);

    const tableHTML = this.exportService.generateTableHTML(this.payments(), this.getExportColumns());
    this.exportService.exportToPDF('Rapport des Paiements de Loyer', statsHTML + tableHTML, 'loyers');
  }
}
