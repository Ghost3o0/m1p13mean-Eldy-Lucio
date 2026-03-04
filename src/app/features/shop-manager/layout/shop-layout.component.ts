import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '@core/services/auth.service';
// import { NotificationsComponent } from '@shared/components/notifications/notifications.component';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-shop-layout',
  standalone: true,
  imports: [
    CommonModule,
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
  templateUrl: './shop-layout.component.html',
  styleUrls: ['./shop-layout.component.scss'],})
export class ShopLayoutComponent {
  sidebarOpen = signal(true);

  navItems: NavItem[] = [
    { label: 'Tableau de bord', icon: 'dashboard', route: '/shop-manager/dashboard' },
    { label: 'Commandes', icon: 'shopping_bag', route: '/shop-manager/orders' },
    { label: 'Produits', icon: 'inventory_2', route: '/shop-manager/products' },
    { label: 'Stock', icon: 'warehouse', route: '/shop-manager/stock' },
    { label: 'Caisse (POS)', icon: 'point_of_sale', route: '/shop-manager/pos' },
    { label: 'Promotions', icon: 'local_offer', route: '/shop-manager/promotions' },
    { label: 'Coupons', icon: 'confirmation_number', route: '/shop-manager/coupons' },
    { label: 'Vendeurs', icon: 'people', route: '/shop-manager/sellers' },
    { label: 'Loyer', icon: 'payments', route: '/shop-manager/rent-payments' },
    { label: 'Demandes', icon: 'description', route: '/shop-manager/requests' },
    { label: 'Mon box', icon: 'store', route: '/shop-manager/box-info' }
  ];

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    // Close sidebar on mobile by default
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      this.sidebarOpen.set(false);
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  closeSidebarOnMobile(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      this.closeSidebar();
    }
  }

  getUserInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return 'U';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  viewMyShop(): void {
    const shopId = this.authService.currentShop()?._id;
    if (shopId) {
      window.open(`/shop/${shopId}`, '_blank');
    }
  }
}


