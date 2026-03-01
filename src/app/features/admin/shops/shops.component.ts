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
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Shop } from '@shared/models/product.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';

@Component({
  selector: 'app-admin-shops',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
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
    LoadingComponent
  ],
  templateUrl: './shops.component.html',
  styleUrls: ['./shops.component.scss']
})
export class AdminShopsComponent implements OnInit {
  shops = signal<Shop[]>([]);
  categories = signal<any[]>([]);
  pagination = signal<any>(null);
  isLoading = signal(true);

  totalShops = signal(0);
  pendingCount = signal(0);
  approvedCount = signal(0);

  displayedColumns = ['logo', 'name', 'owner', 'category', 'products', 'status', 'date', 'actions'];

  searchQuery = '';
  selectedCategory: string | null = null;
  currentTab = 0;

  private statusFilters = [undefined, 'pending', 'approved', 'suspended'];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadStats();
    this.loadShops();
  }

  loadCategories(): void {
    this.http.get<any>(`${environment.apiUrl}/products/categories`).subscribe({
      next: (response) => {
        if (response.success) {
          this.categories.set(response.data.categories);
        }
      }
    });
  }

  loadStats(): void {
    this.http.get<any>(`${environment.apiUrl}/admin/shops/stats`).subscribe({
      next: (response) => {
        if (response.success) {
          this.totalShops.set(response.data.total || 0);
          this.pendingCount.set(response.data.pending || 0);
          this.approvedCount.set(response.data.approved || 0);
        }
      }
    });
  }

  loadShops(page = 1): void {
    this.isLoading.set(true);

    const params: any = { page, limit: 20 };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedCategory) params.category = this.selectedCategory;
    const statusFilter = this.statusFilters[this.currentTab];
    if (statusFilter) params.status = statusFilter;

    this.http.get<any>(`${environment.apiUrl}/admin/shops`, { params }).subscribe({
      next: (response) => {
        if (response.success) {
          this.shops.set(response.data.shops);
          this.pagination.set(response.data.pagination);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onTabChange(index: number): void {
    this.currentTab = index;
    this.loadShops();
  }

  applyFilters(): void {
    this.loadShops();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = null;
    this.loadShops();
  }

  onPageChange(event: PageEvent): void {
    this.loadShops(event.pageIndex + 1);
  }

  getOwnerName(owner: any): string {
    if (typeof owner === 'object' && owner) {
      return `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || 'Propriétaire';
    }
    return 'Propriétaire';
  }

  getCategoryName(category: any): string {
    if (typeof category === 'object' && category?.name) {
      return category.name;
    }
    const cat = this.categories().find(c => c._id === category);
    return cat?.name || '-';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      approved: 'Approuvée',
      suspended: 'Suspendue',
      rejected: 'Rejetée'
    };
    return labels[status] || status;
  }

  updateStatus(shop: Shop, newStatus: string): void {
    const confirmMessages: Record<string, string> = {
      approved: 'Voulez-vous approuver cette boutique ?',
      rejected: 'Voulez-vous rejeter cette boutique ?',
      suspended: 'Voulez-vous suspendre cette boutique ?'
    };

    if (!confirm(confirmMessages[newStatus])) return;

    this.http.put<any>(`${environment.apiUrl}/admin/shops/${shop._id}/status`, {
      status: newStatus
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadShops();
          this.loadStats();
        }
      }
    });
  }
}
