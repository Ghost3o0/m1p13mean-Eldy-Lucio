import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PosService, PosProduct, PosCartItem, PosOrder } from '@shared/services/pos.service';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';
import { environment } from '@env/environment';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatDividerModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTooltipModule,
    MatBadgeModule,
    MatSnackBarModule,
    AriaryPipe
  ],
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.scss'],})
export class PosComponent implements OnInit {
  searchTerm = '';
  selectedPayment: 'cash' | 'card' | null = null;
  cashReceived: number | null = null;
  customerName = '';
  isProcessing = signal(false);
  showReceipt = signal(false);
  showHistory = false;
  historyDate = new Date().toISOString().split('T')[0];
  currentDate = new Date();

  constructor(
    public posService: PosService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.posService.getDailySummary().subscribe();
    this.searchProducts();
  }

  searchProducts(): void {
    this.posService.searchProducts(this.searchTerm || undefined).subscribe();
  }

  getImageUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${environment.apiUrl.replace('/api', '')}${path}`;
  }

  addToCart(product: PosProduct): void {
    this.posService.addToCart(product);
  }

  updateQuantity(index: number, quantity: number): void {
    this.posService.updateCartItemQuantity(index, quantity);
  }

  removeItem(index: number): void {
    this.posService.removeFromCart(index);
  }

  clearCart(): void {
    this.posService.clearCart();
    this.resetPayment();
  }

  selectPayment(method: 'cash' | 'card'): void {
    this.selectedPayment = method;
    if (method === 'card') {
      this.cashReceived = null;
    }
  }

  resetPayment(): void {
    this.selectedPayment = null;
    this.cashReceived = null;
    this.customerName = '';
  }

  canValidate(): boolean {
    if (!this.selectedPayment || this.posService.cart().length === 0) {
      return false;
    }
    if (this.selectedPayment === 'cash' && (!this.cashReceived || this.cashReceived < this.posService.getCartTotal())) {
      return false;
    }
    return true;
  }

  validateSale(): void {
    if (!this.canValidate()) return;

    this.isProcessing.set(true);

    this.posService.createOrder({
      paymentMethod: this.selectedPayment!,
      customerName: this.customerName || undefined,
      cashReceived: this.cashReceived || undefined
    }).subscribe({
      next: (response) => {
        this.isProcessing.set(false);
        if (response.success) {
          this.showReceipt.set(true);
          this.resetPayment();
          this.posService.getDailySummary().subscribe();
        }
      },
      error: (error) => {
        this.isProcessing.set(false);
        this.snackBar.open(
          error.error?.message || 'Erreur lors de la vente',
          'Fermer',
          { duration: 5000 }
        );
      }
    });
  }

  closeReceipt(): void {
    this.showReceipt.set(false);
    this.searchProducts();
  }

  printReceipt(): void {
    window.print();
  }

  loadHistory(): void {
    this.posService.getOrders({
      startDate: this.historyDate,
      endDate: this.historyDate
    }).subscribe();
  }
}


