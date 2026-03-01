import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { ProductService } from '@shared/services/product.service';
import { Product, Category, Shop } from '@shared/models/product.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    AriaryPipe,
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule,
    LoadingComponent,
    AriaryPipe
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],})
export class HomeComponent implements OnInit {
  categories = signal<Category[]>([]);
  featuredProducts = signal<Product[]>([]);
  featuredShops = signal<Shop[]>([]);
  isLoadingProducts = signal(true);

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    // Load categories
    this.productService.getCategories(false, true).subscribe({
      next: (response) => {
        if (response.success) {
          this.categories.set(response.data.categories.slice(0, 8));
        }
      }
    });

    // Load featured products
    this.productService.getFeaturedProducts(8).subscribe({
      next: (response) => {
        if (response.success) {
          this.featuredProducts.set(response.data.products);
        }
        this.isLoadingProducts.set(false);
      },
      error: () => {
        this.isLoadingProducts.set(false);
      }
    });

    // Load featured shops
    this.productService.getShops({ featured: true, limit: 4 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.featuredShops.set(response.data.shops);
        }
      }
    });
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

  getShopName(shopId: string | Shop): string {
    if (typeof shopId === 'object' && shopId?.name) {
      return shopId.name;
    }
    return '';
  }
}


