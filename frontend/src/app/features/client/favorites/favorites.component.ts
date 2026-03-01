import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ProductService } from '@shared/services/product.service';
import { CartService } from '@shared/services/cart.service';
import { AuthService } from '@core/services/auth.service';
import { Product, Pagination } from '@shared/models/product.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    AriaryPipe,
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    LoadingComponent,
    AriaryPipe
  ],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss'],})
export class FavoritesComponent implements OnInit {
  favorites = signal<Product[]>([]);
  pagination = signal<Pagination | null>(null);
  isLoading = signal(true);
  isRemoving = signal(false);
  isAddingToCart = signal(false);

  constructor(
    private authService: AuthService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadFavorites();
  }

  loadFavorites(page = 1): void {
    this.isLoading.set(true);

    this.authService.getFavorites(page, 12).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.favorites.set(response.data.favorites);
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
    this.loadFavorites(event.pageIndex + 1);
  }

  getShopName(shopId: string | any): string {
    if (typeof shopId === 'object' && shopId?.name) {
      return shopId.name;
    }
    return '';
  }

  removeFavorite(productId: string): void {
    this.isRemoving.set(true);

    this.authService.removeFavorite(productId).subscribe({
      next: () => {
        this.favorites.update(favs => favs.filter(f => f._id !== productId));
        this.isRemoving.set(false);
      },
      error: () => {
        this.isRemoving.set(false);
      }
    });
  }

  addToCart(product: Product): void {
    if (product.stock <= 0) return;

    this.isAddingToCart.set(true);

    this.cartService.addToCart(product._id, 1).subscribe({
      next: () => {
        this.isAddingToCart.set(false);
        // Show success notification
      },
      error: () => {
        this.isAddingToCart.set(false);
        // Show error notification
      }
    });
  }
}


