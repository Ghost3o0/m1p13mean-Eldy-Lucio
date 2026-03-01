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
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RentPaymentService } from '@shared/services/rent-payment.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';

@Component({
  selector: 'app-shop-rent-payments',
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
    MatDividerModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    LoadingComponent
  ],
  templateUrl: './rent-payments.component.html',
  styleUrls: ['./rent-payments.component.scss'],})
export class ShopRentPaymentsComponent implements OnInit {
  payments = signal([]);
  stats = signal(null);
  pagination = signal(null);
  isLoading = signal(true);
  isSubmitting = signal(false);

  showPaymentForm = false;
  selectedFile = null;

  displayedColumns = ['paymentNumber', 'period', 'amount', 'method', 'status', 'date', 'invoice'];

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

  newPayment = {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: 0,
    paymentMethod: 'bank_transfer',
    paymentDate: new Date()
  };

  constructor(
    private rentPaymentService: RentPaymentService,
    private snackBar: MatSnackBar
  ) {
    const currentYear = new Date().getFullYear();
    this.years = [currentYear - 1, currentYear, currentYear + 1];
  }

  ngOnInit() {
    this.loadPayments();
    this.loadStats();
  }

  loadStats() {
    this.rentPaymentService.getShopStats().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.stats.set(response.data);
        }
      }
    });
  }

  loadPayments(page = 1) {
    this.isLoading.set(true);

    this.rentPaymentService.getShopPayments({ page, limit: 10 }).subscribe({
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

  onPageChange(event) {
    this.loadPayments(event.pageIndex + 1);
  }

  onFileSelect(event) {
    this.selectedFile = event.target.files?.[0] || null;
  }

  submitPayment() {
    this.isSubmitting.set(true);

    const files = this.selectedFile ? [this.selectedFile] : undefined;

    this.rentPaymentService.submitPayment({
      month: this.newPayment.month,
      year: this.newPayment.year,
      amount: this.newPayment.amount,
      paymentMethod: this.newPayment.paymentMethod,
      paymentDate: this.newPayment.paymentDate.toISOString()
    }, files).subscribe({
      next: () => {
        this.snackBar.open('Paiement soumis avec succès', 'OK', { duration: 3000 });
        this.showPaymentForm = false;
        this.selectedFile = null;
        this.loadPayments();
        this.loadStats();
        this.isSubmitting.set(false);
      },
      error: () => {
        this.snackBar.open('Erreur lors de la soumission', 'OK', { duration: 3000 });
        this.isSubmitting.set(false);
      }
    });
  }

  getMonthLabel(month) {
    return this.months.find(m => m.value === month)?.label || '';
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

  downloadInvoice(payment) {
    if (payment.invoice?.path) {
      window.open(payment.invoice.path, '_blank');
    }
  }
}


