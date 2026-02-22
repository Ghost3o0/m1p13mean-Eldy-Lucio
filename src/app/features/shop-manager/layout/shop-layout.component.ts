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
import { NotificationsComponent } from '@shared/components/notifications/notifications.component';

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
    NotificationsComponent
  ],
  template: `
    <div class="shop-layout">
      <!-- Header -->
      <header class="shop-header">
        <div class="header-left">
          <button class="menu-toggle" (click)="toggleSidebar()">
            <mat-icon>{{ sidebarOpen() ? 'menu_open' : 'menu' }}</mat-icon>
          </button>
          <a routerLink="/shop-manager/dashboard" class="logo">
            <span class="logo-icon">🏪</span>
            <span class="logo-text">Bazar'Be</span>
            <span class="logo-badge">Vendeur</span>
          </a>
        </div>

        <div class="header-right">
          <!-- Quick Actions Dropdown -->
          <button mat-raised-button [matMenuTriggerFor]="quickActionsMenu" class="quick-actions-btn">
            <mat-icon>flash_on</mat-icon>
            Actions Rapides
            <mat-icon>expand_more</mat-icon>
          </button>
          <mat-menu #quickActionsMenu="matMenu" class="quick-actions-menu">
            <a mat-menu-item routerLink="/shop-manager/pos" class="quick-action pos">
              <mat-icon>point_of_sale</mat-icon>
              <span>Ouvrir la Caisse</span>
            </a>
            <mat-divider></mat-divider>
            <a mat-menu-item routerLink="/shop-manager/products/new">
              <mat-icon>add_box</mat-icon>
              <span>Nouveau Produit</span>
            </a>
            <a mat-menu-item routerLink="/shop-manager/orders">
              <mat-icon>shopping_bag</mat-icon>
              <span>Commandes en attente</span>
            </a>
            <a mat-menu-item routerLink="/shop-manager/stock">
              <mat-icon>inventory</mat-icon>
              <span>Gérer le Stock</span>
            </a>
            <mat-divider></mat-divider>
            <a mat-menu-item routerLink="/shop-manager/promotions">
              <mat-icon>local_offer</mat-icon>
              <span>Promotions</span>
            </a>
            <a mat-menu-item routerLink="/shop-manager/coupons">
              <mat-icon>confirmation_number</mat-icon>
              <span>Coupons</span>
            </a>
          </mat-menu>

          <app-notifications></app-notifications>

          <button mat-icon-button [matMenuTriggerFor]="userMenu" class="user-btn">
            <div class="user-avatar">{{ getUserInitials() }}</div>
          </button>
          <mat-menu #userMenu="matMenu">
            <div class="user-menu-header">
              <div class="user-info">
                <span class="user-name">{{ authService.currentUser()?.firstName }}</span>
                <span class="user-shop">{{ authService.currentShop()?.name }}</span>
              </div>
            </div>
            <mat-divider></mat-divider>
            <a mat-menu-item routerLink="/shop-manager/settings">
              <mat-icon>settings</mat-icon>
              <span>Paramètres boutique</span>
            </a>
            <a mat-menu-item (click)="viewMyShop()">
              <mat-icon>storefront</mat-icon>
              <span>Voir ma boutique</span>
            </a>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="logout()" class="logout-btn">
              <mat-icon>logout</mat-icon>
              <span>Déconnexion</span>
            </button>
          </mat-menu>
        </div>
      </header>

      <div class="shop-body">
        <!-- Sidebar -->
        <aside class="shop-sidebar" [class.open]="sidebarOpen()">
          <nav class="sidebar-nav">
            @for (item of navItems; track item.route) {
              <a [routerLink]="item.route"
                 routerLinkActive="active"
                 [routerLinkActiveOptions]="{exact: item.route === '/shop-manager/dashboard'}"
                 class="nav-item"
                 (click)="closeSidebarOnMobile()">
                <mat-icon>{{ item.icon }}</mat-icon>
                <span class="nav-label">{{ item.label }}</span>
                @if (item.badge) {
                  <span class="nav-badge">{{ item.badge }}</span>
                }
              </a>
            }
          </nav>

          <div class="sidebar-footer">
            <a routerLink="/" class="back-to-site">
              <mat-icon>arrow_back</mat-icon>
              <span>Retour au site</span>
            </a>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="shop-content" [class.sidebar-open]="sidebarOpen()">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Mobile Overlay -->
      @if (sidebarOpen()) {
        <div class="sidebar-overlay" (click)="closeSidebar()"></div>
      }
    </div>
  `,
  styles: [`
    .shop-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--bg-secondary);
    }

    // Header
    .shop-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      height: 64px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
      color: white;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .menu-toggle {
      display: none;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      border-radius: 8px;
      padding: 8px;
      cursor: pointer;
      color: white;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      @media (max-width: 1024px) {
        display: flex;
      }
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: white;
    }

    .logo-icon {
      font-size: 28px;
    }

    .logo-text {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .logo-badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .quick-actions-btn {
      background: rgba(255, 255, 255, 0.15) !important;
      color: white !important;
      border: 1px solid rgba(255, 255, 255, 0.3) !important;
      font-weight: 600;
      padding: 8px 20px !important;
      border-radius: 25px !important;

      mat-icon {
        margin-right: 8px;

        &:last-child {
          margin-right: 0;
          margin-left: 8px;
        }
      }

      &:hover {
        background: rgba(255, 255, 255, 0.25) !important;
      }
    }

    ::ng-deep .quick-actions-menu {
      min-width: 250px !important;

      .quick-action.pos {
        background: linear-gradient(135deg, #10b981, #059669) !important;
        color: white !important;
        margin: 8px;
        border-radius: 8px;

        mat-icon {
          color: white !important;
        }

        &:hover {
          background: linear-gradient(135deg, #059669, #047857) !important;
        }
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .user-btn {
      padding: 4px !important;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
    }

    ::ng-deep .user-menu-header {
      padding: 16px;

      .user-info {
        display: flex;
        flex-direction: column;

        .user-name {
          font-weight: 600;
        }

        .user-shop {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
      }
    }

    ::ng-deep .logout-btn {
      color: var(--error) !important;

      mat-icon {
        color: var(--error) !important;
      }
    }

    // Body
    .shop-body {
      display: flex;
      flex: 1;
    }

    // Sidebar
    .shop-sidebar {
      width: 260px;
      background: #1f2937;
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 64px;
      height: calc(100vh - 64px);
      overflow-y: auto;
      transition: transform 0.3s ease;

      @media (max-width: 1024px) {
        position: fixed;
        top: 64px;
        left: 0;
        bottom: 0;
        z-index: 999;
        transform: translateX(-100%);

        &.open {
          transform: translateX(0);
        }
      }
    }

    .sidebar-nav {
      flex: 1;
      padding: 16px 12px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      color: #9ca3af;
      text-decoration: none;
      margin-bottom: 4px;
      transition: all 0.2s;

      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      .nav-label {
        font-weight: 500;
      }

      .nav-badge {
        margin-left: auto;
        background: #f59e0b;
        color: #1f2937;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #d1d5db;
      }

      &.active {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;

        mat-icon {
          color: #f59e0b;
        }
      }
    }

    .sidebar-footer {
      padding: 16px 12px;
      border-top: 1px solid #374151;
    }

    .back-to-site {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      color: #9ca3af;
      text-decoration: none;
      transition: all 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #d1d5db;
      }
    }

    // Main Content
    .shop-content {
      flex: 1;
      min-width: 0;
      transition: margin-left 0.3s ease;

      @media (max-width: 1024px) {
        margin-left: 0;
      }
    }

    // Mobile Overlay
    .sidebar-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 998;

      @media (max-width: 1024px) {
        display: block;
      }
    }

    // Responsive
    @media (max-width: 768px) {
      .shop-header {
        padding: 0 16px;
      }

      .logo-text, .logo-badge {
        display: none;
      }

      .quick-actions-btn span {
        display: none;
      }

      .quick-actions-btn {
        padding: 8px 12px !important;
        min-width: auto !important;

        mat-icon:first-child {
          margin-right: 0;
        }

        mat-icon:last-child {
          display: none;
        }
      }
    }
  `]
})
export class ShopLayoutComponent {
  sidebarOpen = signal(true);

  navItems: NavItem[] = [
    { label: 'Tableau de bord', icon: 'dashboard', route: '/shop-manager/dashboard' },
    { label: 'Commandes', icon: 'shopping_bag', route: '/shop-manager/orders', badge: 3 },
    { label: 'Produits', icon: 'inventory_2', route: '/shop-manager/products' },
    { label: 'Stock', icon: 'warehouse', route: '/shop-manager/stock' },
    { label: 'Caisse (POS)', icon: 'point_of_sale', route: '/shop-manager/pos' },
    { label: 'Promotions', icon: 'local_offer', route: '/shop-manager/promotions' },
    { label: 'Coupons', icon: 'confirmation_number', route: '/shop-manager/coupons' },
    { label: 'Vendeurs', icon: 'people', route: '/shop-manager/sellers' },
    { label: 'Loyer', icon: 'payments', route: '/shop-manager/rent-payments' },
    { label: 'Demandes', icon: 'description', route: '/shop-manager/requests' },
    { label: 'Page boutique', icon: 'web', route: '/shop-manager/landing' },
    { label: 'Mon box', icon: 'store', route: '/shop-manager/box-info' },
    { label: 'Paramètres', icon: 'settings', route: '/shop-manager/settings' }
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
