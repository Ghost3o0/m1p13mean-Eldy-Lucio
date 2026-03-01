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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SellerService } from '@shared/services/seller.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { SellerFormDialogComponent } from './seller-form-dialog.component';

@Component({
  selector: 'app-shop-sellers',
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
    MatCheckboxModule,
    MatSnackBarModule,
    LoadingComponent
  ],
  templateUrl: './sellers.component.html',
  styleUrls: ['./sellers.component.scss'],})
export class ShopSellersComponent implements OnInit {
  sellers = signal([]);
  stats = signal(null);
  pagination = signal(null);
  isLoading = signal(true);

  displayedColumns = ['avatar', 'name', 'employeeId', 'permissions', 'performance', 'status', 'actions'];

  searchQuery = '';
  selectedStatus = null;

  constructor(
    private sellerService: SellerService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadSellers();
    this.loadStats();
  }

  loadStats() {
    this.sellerService.getStatistics().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.stats.set(response.data);
        }
      }
    });
  }

  loadSellers(page = 1) {
    this.isLoading.set(true);

    const filters = { page, limit: 10 };
    if (this.searchQuery) filters['search'] = this.searchQuery;
    if (this.selectedStatus) filters['status'] = this.selectedStatus;

    this.sellerService.getSellers(filters).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.sellers.set(response.data.sellers);
          this.pagination.set(response.data.pagination);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  applyFilters() {
    this.loadSellers();
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedStatus = null;
    this.loadSellers();
  }

  onPageChange(event) {
    this.loadSellers(event.pageIndex + 1);
  }

  getStatusLabel(status) {
    const labels = {
      active: 'Actif',
      inactive: 'Inactif',
      on_leave: 'En congé'
    };
    return labels[status] || status;
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(SellerFormDialogComponent, {
      width: '500px',
      data: { seller: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSellers();
        this.loadStats();
      }
    });
  }

  openEditDialog(seller) {
    const dialogRef = this.dialog.open(SellerFormDialogComponent, {
      width: '500px',
      data: { seller }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSellers();
      }
    });
  }

  openPermissionsDialog(seller) {
    const permissions = { ...seller.permissions };
    const result = prompt(
      'Permissions (séparez par des virgules): sales, stock, cashRegister, orders, customers, reports',
      Object.entries(permissions).filter(([, v]) => v).map(([k]) => k).join(', ')
    );

    if (result !== null) {
      const selected = result.split(',').map(p => p.trim());
      const newPermissions = {};
      ['sales', 'stock', 'cashRegister', 'orders', 'customers', 'reports'].forEach(p => {
        newPermissions[p] = selected.includes(p);
      });

      this.sellerService.updatePermissions(seller._id, newPermissions).subscribe({
        next: () => {
          this.snackBar.open('Permissions mises à jour', 'OK', { duration: 3000 });
          this.loadSellers();
        }
      });
    }
  }

  updateStatus(seller, status) {
    this.sellerService.updateStatus(seller._id, status).subscribe({
      next: () => {
        this.snackBar.open('Statut mis à jour', 'OK', { duration: 3000 });
        this.loadSellers();
        this.loadStats();
      }
    });
  }

  deleteSeller(seller) {
    if (!confirm(`Supprimer ${seller.firstName} ${seller.lastName} ?`)) return;

    this.sellerService.deleteSeller(seller._id).subscribe({
      next: () => {
        this.snackBar.open('Vendeur supprimé', 'OK', { duration: 3000 });
        this.loadSellers();
        this.loadStats();
      }
    });
  }
}


