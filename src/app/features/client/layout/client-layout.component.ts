import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '@core/services/auth.service';
import { CartService } from '@shared/services/cart.service';
import { ThemeService } from '@shared/services/theme.service';
import { ProductService } from '@shared/services/product.service';
// import { NotificationsComponent } from '@shared/components/notifications/notifications.component';

interface NavCategory {
  _id: string;
  name: string;
  icon?: string;
  slug: string;
}

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule,
    // NotificationsComponent
  ],
  templateUrl: './client-layout.component.html',
  styleUrls: ['./client-layout.component.scss'],})
export class ClientLayoutComponent implements OnInit {
  currentUser = this.authService.currentUser;
  cartCount = computed(() => this.cartService.itemCount());
  isScrolled = signal(false);
  mobileMenuOpen = signal(false);
  categories = signal<NavCategory[]>([]);
  searchQuery = signal('');

  constructor(
    public authService: AuthService,
    private cartService: CartService,
    public themeService: ThemeService,
    private productService: ProductService,
    private router: Router
  ) {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        this.isScrolled.set(window.scrollY > 10);
      });
    }
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (response) => {
        const cats = response.data?.categories || [];
        this.categories.set(cats.slice(0, 10).map(c => ({
          _id: c._id,
          name: c.name,
          icon: this.getCategoryIcon(c.slug),
          slug: c.slug
        })));
      },
      error: () => {
        // Fallback categories
        this.categories.set([
          { _id: '1', name: 'Électronique', icon: 'devices', slug: 'electronique' },
          { _id: '2', name: 'Mode', icon: 'checkroom', slug: 'mode' },
          { _id: '3', name: 'Maison', icon: 'home', slug: 'maison' },
          { _id: '4', name: 'Beauté', icon: 'spa', slug: 'beaute' },
          { _id: '5', name: 'Sport', icon: 'fitness_center', slug: 'sport' }
        ]);
      }
    });
  }

  getCategoryIcon(slug: string): string {
    const iconMap: Record<string, string> = {
      'electronique': 'devices',
      'mode': 'checkroom',
      'maison': 'home',
      'beaute': 'spa',
      'sport': 'fitness_center',
      'alimentation': 'restaurant',
      'jouets': 'toys',
      'livres': 'menu_book',
      'musique': 'music_note',
      'auto': 'directions_car'
    };
    return iconMap[slug] || 'category';
  }

  search(): void {
    const query = this.searchQuery().trim();
    if (query) {
      this.router.navigate(['/catalog'], { queryParams: { search: query } });
    }
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'U';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.cartService.resetCart();
    this.router.navigate(['/']);
  }
}


