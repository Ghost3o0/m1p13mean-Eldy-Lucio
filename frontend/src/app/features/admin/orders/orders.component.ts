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
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
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
