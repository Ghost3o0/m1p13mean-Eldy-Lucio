import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';
import { ExportService, ExportColumn } from '@shared/services/export.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [
    AriaryPipe,
    CommonModule, RouterLink, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatTableModule, MatPaginatorModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatChipsModule, MatTooltipModule,
    LoadingComponent, AriaryPipe
  ],
  template: `
    <div class="orders-container">
      <div class="orders-header">
        <h1>Toutes les commandes</h1>
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
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Rechercher</mat-label>
              <input matInput [(ngModel)]="searchQuery" (keyup.enter)="loadOrders()" placeholder="N° commande...">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Statut</mat-label>
              <mat-select [(ngModel)]="selectedStatus" (selectionChange)="loadOrders()">
                <mat-option [value]="null">Tous</mat-option>
                <mat-option value="pending">En attente</mat-option>
                <mat-option value="confirmed">Confirmées</mat-option>
                <mat-option value="delivered">Livrées</mat-option>
                <mat-option value="cancelled">Annulées</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      @if (isLoading()) {
        <app-loading></app-loading>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="orders()">
            <ng-container matColumnDef="orderNumber">
              <th mat-header-cell *matHeaderCellDef>N°</th>
              <td mat-cell *matCellDef="let order">{{ order.orderNumber }}</td>
            </ng-container>
            <ng-container matColumnDef="customer">
              <th mat-header-cell *matHeaderCellDef>Client</th>
              <td mat-cell *matCellDef="let order">{{ order.userId?.firstName }} {{ order.userId?.lastName }}</td>
            </ng-container>
            <ng-container matColumnDef="shop">
              <th mat-header-cell *matHeaderCellDef>Boutique</th>
              <td mat-cell *matCellDef="let order">{{ order.items?.[0]?.shopId?.name || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="total">
              <th mat-header-cell *matHeaderCellDef>Total</th>
              <td mat-cell *matCellDef="let order">{{ order.total | ariary }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let order">
                <mat-chip [class]="'status-' + order.status">{{ getStatusLabel(order.status) }}</mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let order">{{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['orderNumber', 'customer', 'shop', 'total', 'status', 'date']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['orderNumber', 'customer', 'shop', 'total', 'status', 'date'];"></tr>
          </table>
          <mat-paginator [length]="pagination()?.total || 0" [pageSize]="20" (page)="onPageChange($event)"></mat-paginator>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .orders-container { padding: 24px; }
    .orders-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    h1 { font-size: 2rem; margin: 0; }
    .export-buttons {
      display: flex;
      gap: 8px;
      button mat-icon { margin-right: 4px; }
    }
    .filters-card { margin-bottom: 24px; }
    .filters-row { display: flex; gap: 16px; flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 200px; }
    table { width: 100%; }
    mat-chip {
      &.status-pending { background: var(--warning-light) !important; color: var(--warning) !important; }
      &.status-confirmed { background: var(--primary-50) !important; color: var(--primary) !important; }
      &.status-delivered { background: var(--success-light) !important; color: var(--success) !important; }
      &.status-cancelled { background: var(--error-light) !important; color: var(--error) !important; }
    }

    @media (max-width: 768px) {
      h1 { font-size: 1.5rem; }
      .filters-row {
        flex-direction: column;
        .search-field { width: 100%; }
        mat-form-field { width: 100%; }
      }
      mat-card { overflow-x: auto; }
    }

    @media (max-width: 480px) {
      .orders-container { padding: 16px 12px; }
      h1 { font-size: 1.25rem; margin-bottom: 16px; }
    }
  `]
})
export class AdminOrdersComponent implements OnInit {
  orders = signal<any[]>([]);
  pagination = signal<any>(null);
  isLoading = signal(true);
  searchQuery = '';
  selectedStatus: string | null = null;

  constructor(
    private http: HttpClient,
    private exportService: ExportService
  ) {}

  ngOnInit(): void { this.loadOrders(); }

  loadOrders(page = 1): void {
    this.isLoading.set(true);
    const params: any = { page, limit: 20 };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedStatus) params.status = this.selectedStatus;

    this.http.get<any>(`${environment.apiUrl}/admin/orders`, { params }).subscribe({
      next: (res) => { if (res.success) { this.orders.set(res.data.orders); this.pagination.set(res.data.pagination); } this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  getStatusLabel(status: string): string {
    return { pending: 'En attente', confirmed: 'Confirmée', delivered: 'Livrée', cancelled: 'Annulée' }[status] || status;
  }

  onPageChange(event: PageEvent): void { this.loadOrders(event.pageIndex + 1); }

  private getExportColumns(): ExportColumn[] {
    return [
      { key: 'orderNumber', header: 'N° Commande' },
      { key: 'userId', header: 'Client', format: (u) => u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '-' },
      { key: 'items', header: 'Boutique', format: (items) => items?.[0]?.shopId?.name || '-' },
      { key: 'total', header: 'Total (Ar)', format: (v) => this.exportService.formatPrice(v) },
      { key: 'status', header: 'Statut', format: (v) => this.getStatusLabel(v) },
      { key: 'createdAt', header: 'Date', format: (v) => this.exportService.formatDateTime(v) }
    ];
  }

  exportToExcel(): void {
    this.exportService.exportToExcel(this.orders(), this.getExportColumns(), `commandes_admin_${new Date().toISOString().split('T')[0]}`);
  }

  exportToPDF(): void {
    const tableHTML = this.exportService.generateTableHTML(this.orders(), this.getExportColumns());
    this.exportService.exportToPDF('Rapport des Commandes - Administration', tableHTML, 'commandes_admin');
  }
}
