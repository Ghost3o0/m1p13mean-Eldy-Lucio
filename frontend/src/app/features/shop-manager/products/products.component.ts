import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Product, Category } from '@shared/models/product.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';

@Component({
  selector: 'app-shop-products',
  standalone: true,
  imports: [
    AriaryPipe,
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    MatSlideToggleModule,
    MatDividerModule,
    LoadingComponent,
    AriaryPipe
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],})
export class ShopProductsComponent implements OnInit {
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  pagination = signal<any>(null);
  isLoading = signal(true);

  displayedColumns = ['image', 'name', 'category', 'price', 'stock', 'status', 'actions'];

  // Filters
  searchQuery = '';
  selectedCategory: string | null = null;
  selectedStatus: boolean | null = null;
  stockFilter: string | null = null;
  sortField = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
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

  loadProducts(page = 1): void {
    this.isLoading.set(true);

    const params: any = {
      page,
      limit: 20,
      sort: this.sortField,
      order: this.sortOrder
    };

    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedCategory) params.category = this.selectedCategory;
    if (this.selectedStatus !== null) params.isActive = this.selectedStatus;
    if (this.stockFilter) params.stock = this.stockFilter;

    this.http.get<any>(`${environment.apiUrl}/shop/products`, { params }).subscribe({
      next: (response) => {
        if (response.success) {
          this.products.set(response.data.products);
          this.pagination.set(response.data.pagination);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  applyFilters(): void {
    this.loadProducts();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = null;
    this.selectedStatus = null;
    this.stockFilter = null;
    this.loadProducts();
  }

  onSort(sort: Sort): void {
    this.sortField = sort.active || 'createdAt';
    this.sortOrder = (sort.direction as 'asc' | 'desc') || 'desc';
    this.loadProducts();
  }

  onPageChange(event: PageEvent): void {
    this.loadProducts(event.pageIndex + 1);
  }

  getCategoryName(categoryId: string | Category): string {
    if (!categoryId) return '-';
    if (typeof categoryId === 'object') return categoryId.name;

    const category = this.categories().find(c => c._id === categoryId);
    return category?.name || '-';
  }

  getStockClass(stock: number): string {
    if (stock <= 0) return 'stock-out';
    if (stock < 10) return 'stock-low';
    return 'stock-good';
  }

  toggleStatus(product: Product): void {
    this.http.put<any>(`${environment.apiUrl}/shop/products/${product._id}`, {
      isActive: !product.isActive
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.products.update(products =>
            products.map(p => p._id === product._id ? { ...p, isActive: !p.isActive } : p)
          );
        }
      }
    });
  }

  duplicateProduct(product: Product): void {
    this.http.post<any>(`${environment.apiUrl}/shop/products/${product._id}/duplicate`, {}).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadProducts();
        }
      }
    });
  }

  deleteProduct(product: Product): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${product.name}" ?`)) {
      this.http.delete<any>(`${environment.apiUrl}/shop/products/${product._id}`).subscribe({
        next: (response) => {
          if (response.success) {
            this.products.update(products => products.filter(p => p._id !== product._id));
          }
        }
      });
    }
  }
}


