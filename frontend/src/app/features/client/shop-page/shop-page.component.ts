import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';

interface ShopLanding {
  hero: {
    enabled: boolean;
    title: string;
    subtitle: string;
    backgroundImage?: string;
    ctaText?: string;
    ctaLink?: string;
  };
  banners: any[];
  shopContent: {
    aboutUs?: string;
    promotionalText?: string;
    theme?: {
      primaryColor: string;
      secondaryColor: string;
    };
  };
  isPublished: boolean;
}

interface ShopInfo {
  _id: string;
  name: string;
  logo?: string;
  banner?: string;
  contact: {
    phone?: string;
    email?: string;
  };
  hours?: any[];
  rating?: {
    average: number;
    count: number;
  };
}

interface Product {
  _id: string;
  name: string;
  images: string[];
  basePrice: number;
  compareAtPrice?: number;
  stock: number;
}

@Component({
  selector: 'app-shop-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    LoadingComponent,
    AriaryPipe
  ],
  templateUrl: './shop-page.component.html',
  styleUrls: ['./shop-page.component.scss'],})
export class ShopPageComponent implements OnInit {
  isLoading = signal(true);
  error = signal<string | null>(null);
  shop = signal<ShopInfo | null>(null);
  landing = signal<ShopLanding | null>(null);
  products = signal<Product[]>([]);

  private dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const shopId = params['id'];
      if (shopId) {
        this.loadShop(shopId);
      }
    });
  }

  loadShop(shopId: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Load landing page data
    this.http.get<any>(`${environment.apiUrl}/landing/shop/${shopId}`).subscribe({
      next: (response) => {
        if (response.success) {
          if (response.data.redirect && response.data.externalUrl) {
            // Redirect to external URL
            window.location.href = response.data.externalUrl;
            return;
          }
          this.landing.set(response.data.landing);
          this.shop.set(response.data.shop);
          this.loadProducts(shopId);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Cette boutique n\'existe pas ou n\'est pas disponible.');
        this.isLoading.set(false);
      }
    });
  }

  loadProducts(shopId: string): void {
    this.http.get<any>(`${environment.apiUrl}/products`, {
      params: { shop: shopId, limit: '8', isActive: 'true' }
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.products.set(response.data.products);
        }
      }
    });
  }

  getHeroBackground(): string {
    const bg = this.landing()?.hero?.backgroundImage;
    if (bg) {
      return `url('${bg}')`;
    }
    return 'linear-gradient(135deg, var(--shop-primary), var(--shop-secondary))';
  }

  getThemeColor(type: 'primary' | 'secondary'): string {
    const theme = this.landing()?.shopContent?.theme;
    if (theme) {
      return type === 'primary' ? theme.primaryColor : theme.secondaryColor;
    }
    return type === 'primary' ? '#1e3a5f' : '#2563eb';
  }

  getDiscountPercent(product: Product): number {
    if (!product.compareAtPrice || product.compareAtPrice <= product.basePrice) return 0;
    return Math.round((1 - product.basePrice / product.compareAtPrice) * 100);
  }

  getDayName(index: number): string {
    return this.dayNames[index] || '';
  }
}


