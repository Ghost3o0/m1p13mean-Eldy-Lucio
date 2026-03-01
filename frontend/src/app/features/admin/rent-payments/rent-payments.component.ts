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
    MatTooltipModule
  ],
  templateUrl: './rent-payments.component.html',
  styleUrls: ['./rent-payments.component.scss']
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
    // Dialog will open payment details
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

  private getExportColumns(): ExportColumn[] {
    return [
      { key: 'paymentNumber', header: 'N° Paiement' },
      { key: 'shop', header: 'Boutique', format: (s) => s?.name || '-' },
      { key: 'period', header: 'Période' },
      { key: 'amount', header: 'Montant (Ar)', format: (v) => this.exportService.formatPrice(v) },
      { key: 'paymentDate', header: 'Date', format: (v) => this.exportService.formatDateTime(v) },
      { key: 'status', header: 'Statut', format: (v) => this.getStatusLabel(v) }
    ];
  }

  exportToExcel(): void {
    this.exportService.exportToExcel(this.payments(), this.getExportColumns(), `loyers_${new Date().toISOString().split('T')[0]}`);
  }

  exportToPDF(): void {
    const tableHTML = this.exportService.generateTableHTML(this.payments(), this.getExportColumns());
    this.exportService.exportToPDF('Rapport des Loyers', tableHTML, 'loyers');
  }
}