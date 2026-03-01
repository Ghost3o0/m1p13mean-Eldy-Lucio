import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ProductService } from '@shared/services/product.service';
import { Product, Shop, Pagination } from '@shared/models/product.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';

@Component({
  selector: 'app-shop-detail',
  standalone: true,
  imports: [
    AriaryPipe,
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatPaginatorModule,
    LoadingComponent,
    AriaryPipe
  ],
  templateUrl: './shop-detail.component.html',
  styleUrls: ['./shop-detail.component.scss'],})
export class ShopDetailComponent implements OnInit {
  shop = signal<Shop | null>(null);
  products = signal<Product[]>([]);
  pagination = signal<Pagination | null>(null);
  isLoading = signal(true);

  private shopId: string = '';
  private daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.shopId = params['id'];
      this.loadShop();
    });
  }

  loadShop(): void {
    this.isLoading.set(true);

    this.productService.getShop(this.shopId).subscribe({
      next: (response) => {
        if (response.success) {
          this.shop.set(response.data.shop);
          this.loadProducts();
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadProducts(page = 1): void {
    this.productService.getProducts({
      shop: this.shopId,
      page,
      limit: 12
    }).subscribe({
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

  onPageChange(event: PageEvent): void {
    this.loadProducts(event.pageIndex + 1);
  }

  getDiscountPercent(product: Product): number {
    if (!product.compareAtPrice || product.compareAtPrice <= product.basePrice) return 0;
    return Math.round((1 - product.basePrice / product.compareAtPrice) * 100);
  }

  getDayName(day: number): string {
    return this.daysOfWeek[day] || '';
  }

  isToday(day: number): boolean {
    return new Date().getDay() === day;
  }

  isShopOpen(): boolean {
    const shop = this.shop();
    if (!shop?.hours) return false;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const todayHours = shop.hours.find(h => h.day === dayOfWeek);
    if (!todayHours || todayHours.isClosed) return false;

    return currentTime >= (todayHours.open || '00:00') && currentTime <= (todayHours.close || '23:59');
  }
}


