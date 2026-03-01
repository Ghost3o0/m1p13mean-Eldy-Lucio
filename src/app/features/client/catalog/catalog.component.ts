import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatExpansionModule } from '@angular/material/expansion';
import { ProductService, ProductFilters } from '@shared/services/product.service';
import { CartService } from '@shared/services/cart.service';
import { Product, Category, Shop, Pagination } from '@shared/models/product.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    AriaryPipe,
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatSidenavModule,
    MatExpansionModule,
    LoadingComponent,
    AriaryPipe
  ],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss'],})
export class CatalogComponent implements OnInit {
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  pagination = signal<Pagination | null>(null);
  isLoading = signal(true);
  isMobile = signal(false);

  // Filter state
  searchQuery = '';
  selectedCategory = signal<string | null>(null);
  minPrice?: number;
  maxPrice?: number;
  inStockOnly = false;
  sortOption: ProductFilters['sort'] = 'newest';
  viewMode: 'grid' | 'list' = 'grid';

  pageTitle = computed(() => {
    if (this.searchQuery) {
      return `Recherche: "${this.searchQuery}"`;
    }
    const category = this.categories().find(c => c._id === this.selectedCategory());
    if (category) {
      return category.name;
    }
    return 'Catalogue';
  });

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());
  }

  ngOnInit(): void {
    this.loadCategories();

    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['search'] || '';
      this.selectedCategory.set(params['category'] || null);
      this.minPrice = params['minPrice'] ? +params['minPrice'] : undefined;
      this.maxPrice = params['maxPrice'] ? +params['maxPrice'] : undefined;
      this.inStockOnly = params['inStock'] === 'true';
      this.sortOption = params['sort'] || 'newest';

      this.loadProducts();
    });
  }

  private checkMobile(): void {
    this.isMobile.set(window.innerWidth < 768);
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (response) => {
        if (response.success) {
          this.categories.set(response.data.categories);
        }
      }
    });
  }

  loadProducts(page = 1): void {
    this.isLoading.set(true);

    const filters: ProductFilters = {
      search: this.searchQuery || undefined,
      category: this.selectedCategory() || undefined,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      inStock: this.inStockOnly || undefined,
      sort: this.sortOption,
      page,
      limit: 12
    };

    this.productService.getProducts(filters).subscribe({
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
    const queryParams: any = {};

    if (this.searchQuery) queryParams.search = this.searchQuery;
    if (this.selectedCategory()) queryParams.category = this.selectedCategory();
    if (this.minPrice) queryParams.minPrice = this.minPrice;
    if (this.maxPrice) queryParams.maxPrice = this.maxPrice;
    if (this.inStockOnly) queryParams.inStock = 'true';
    if (this.sortOption !== 'newest') queryParams.sort = this.sortOption;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory.set(null);
    this.minPrice = undefined;
    this.maxPrice = undefined;
    this.inStockOnly = false;
    this.sortOption = 'newest';

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    });
  }

  selectCategory(categoryId: string | null): void {
    this.selectedCategory.set(categoryId);
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchQuery ||
      this.selectedCategory() ||
      this.minPrice ||
      this.maxPrice ||
      this.inStockOnly
    );
  }

  getActiveFilterCount(): number {
    let count = 0;
    if (this.searchQuery) count++;
    if (this.selectedCategory()) count++;
    if (this.minPrice || this.maxPrice) count++;
    if (this.inStockOnly) count++;
    return count;
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories().find(c => c._id === categoryId);
    return category?.name || '';
  }

  getCategoryIcon(name: string): string {
    const icons: Record<string, string> = {
      'Mode & Vêtements': 'checkroom',
      'Électronique': 'devices',
      'Maison & Décoration': 'home',
      'Beauté & Bien-être': 'spa',
      'Alimentation': 'restaurant',
      'Sports & Loisirs': 'sports_soccer',
      'Bijoux & Montres': 'watch',
      'Enfants & Bébés': 'child_care'
    };
    return icons[name] || 'category';
  }

  onPageChange(event: PageEvent): void {
    this.loadProducts(event.pageIndex + 1);
  }

  getDiscountPercent(product: Product): number {
    if (!product.compareAtPrice || product.compareAtPrice <= product.basePrice) return 0;
    return Math.round((1 - product.basePrice / product.compareAtPrice) * 100);
  }

  getShopName(shopId: string | Shop): string {
    if (typeof shopId === 'object' && shopId?.name) {
      return shopId.name;
    }
    return '';
  }

  addToCart(event: Event, product: Product): void {
    event.stopPropagation();
    event.preventDefault();

    if (product.stock <= 0) return;

    this.cartService.addToCart(product._id, 1).subscribe({
      next: () => {
        // Show success notification
      },
      error: () => {
        // Show error notification
      }
    });
  }
}


