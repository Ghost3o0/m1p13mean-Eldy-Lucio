import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '@core/services/auth.service';
import { CartService } from '@shared/services/cart.service';
import { ThemeService } from '@shared/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule
  ],
  template: `
    <header class="header" [class.scrolled]="isScrolled()">
      <div class="container header-content">
        <!-- Logo -->
        <a routerLink="/" class="logo">
          <img src="/assets/logo.png" alt="Bazar'Be" class="logo-img">
        </a>

        <!-- Search Bar -->
        <div class="search-bar">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Rechercher des produits, boutiques..." />
        </div>

        <!-- Navigation -->
        <nav class="nav-links">
          <a routerLink="/catalog" routerLinkActive="active">
            <mat-icon>grid_view</mat-icon>
            <span>Catalogue</span>
          </a>
          <a routerLink="/catalog" [queryParams]="{featured: true}" routerLinkActive="active">
            <mat-icon>local_offer</mat-icon>
            <span>Promos</span>
          </a>
        </nav>

        <!-- Desktop Actions -->
        <div class="actions desktop-actions">
          <!-- Theme Toggle -->
          <button class="action-btn theme-toggle-btn" (click)="themeService.toggleTheme()" [attr.aria-label]="'Basculer le mode ' + (themeService.isDarkMode() ? 'clair' : 'sombre')">
            @if (themeService.isDarkMode()) {
              <mat-icon>light_mode</mat-icon>
            } @else {
              <mat-icon>dark_mode</mat-icon>
            }
          </button>

          <!-- Cart -->
          <a routerLink="/cart" class="action-btn cart-btn" [attr.aria-label]="'Panier (' + cartCount() + ' article(s))'">
            <mat-icon [matBadge]="cartCount()" matBadgeColor="warn" [matBadgeHidden]="cartCount() === 0" matBadgeSize="small" [attr.aria-hidden]="false">
              shopping_bag
            </mat-icon>
          </a>

          @if (authService.isAuthenticated()) {
            <!-- Favorites -->
            <a routerLink="/favorites" class="action-btn">
              <mat-icon>favorite_border</mat-icon>
            </a>

            <!-- User Menu -->
            <button class="user-btn" [matMenuTriggerFor]="userMenu">
              <div class="user-avatar">
                {{ getUserInitials() }}
              </div>
              <mat-icon class="dropdown-icon">expand_more</mat-icon>
            </button>

            <mat-menu #userMenu="matMenu" class="user-menu">
              <div class="menu-header">
                <div class="menu-avatar">{{ getUserInitials() }}</div>
                <div class="menu-user-info">
                  <span class="menu-user-name">{{ currentUser()?.firstName }} {{ currentUser()?.lastName }}</span>
                  <span class="menu-user-email">{{ currentUser()?.email }}</span>
                </div>
              </div>

              <mat-divider></mat-divider>

              @if (authService.isAdmin()) {
                <a mat-menu-item routerLink="/admin/dashboard" class="menu-item">
                  <mat-icon>admin_panel_settings</mat-icon>
                  <span>Administration</span>
                </a>
              }

              @if (authService.isShopOwner()) {
                <a mat-menu-item routerLink="/shop-manager/dashboard" class="menu-item">
                  <mat-icon>store</mat-icon>
                  <span>Gestion Boutique</span>
                </a>
              }

              @if (!authService.isShopOwner() && !authService.isAdmin()) {
                <a mat-menu-item routerLink="/become-vendor" class="menu-item vendor-item">
                  <mat-icon>storefront</mat-icon>
                  <span>Devenir vendeur</span>
                </a>
              }

              <a mat-menu-item routerLink="/orders" class="menu-item">
                <mat-icon>receipt_long</mat-icon>
                <span>Mes commandes</span>
              </a>

              <a mat-menu-item routerLink="/favorites" class="menu-item">
                <mat-icon>favorite</mat-icon>
                <span>Mes favoris</span>
              </a>

              <a mat-menu-item routerLink="/profile" class="menu-item">
                <mat-icon>settings</mat-icon>
                <span>Paramètres</span>
              </a>

              <mat-divider></mat-divider>

              <button mat-menu-item (click)="logout()" class="menu-item logout-item">
                <mat-icon>logout</mat-icon>
                <span>Déconnexion</span>
              </button>
            </mat-menu>
          } @else {
            <a routerLink="/auth/login" class="login-btn">Connexion</a>
            <a routerLink="/auth/register" class="signup-btn">
              <span>Inscription</span>
              <mat-icon>arrow_forward</mat-icon>
            </a>
          }
        </div>

        <!-- Mobile Actions (visible only on mobile) -->
        <div class="actions mobile-actions">
          <!-- Theme Toggle -->
          <button class="action-btn theme-toggle-btn" (click)="themeService.toggleTheme()">
            @if (themeService.isDarkMode()) {
              <mat-icon>light_mode</mat-icon>
            } @else {
              <mat-icon>dark_mode</mat-icon>
            }
          </button>

          <!-- Cart -->
          <a routerLink="/cart" class="action-btn cart-btn">
            <mat-icon [matBadge]="cartCount()" matBadgeColor="warn" [matBadgeHidden]="cartCount() === 0" matBadgeSize="small" [attr.aria-hidden]="false">
              shopping_bag
            </mat-icon>
          </a>

          <!-- Mobile Menu Toggle -->
          <button class="action-btn" (click)="toggleMobileMenu()">
            <mat-icon>{{ mobileMenuOpen() ? 'close' : 'menu' }}</mat-icon>
          </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      @if (mobileMenuOpen()) {
        <div class="mobile-menu">
          <div class="mobile-search">
            <mat-icon>search</mat-icon>
            <input type="text" placeholder="Rechercher..." />
          </div>

          <nav class="mobile-nav">
            <a routerLink="/catalog" (click)="closeMobileMenu()">
              <mat-icon>grid_view</mat-icon>
              Catalogue
            </a>
            <a routerLink="/catalog" [queryParams]="{featured: true}" (click)="closeMobileMenu()">
              <mat-icon>local_offer</mat-icon>
              Promotions
            </a>
            <a routerLink="/cart" (click)="closeMobileMenu()">
              <mat-icon>shopping_bag</mat-icon>
              Panier ({{ cartCount() }})
            </a>

            <button (click)="themeService.toggleTheme()" class="mobile-theme-toggle">
              @if (themeService.isDarkMode()) {
                <mat-icon>light_mode</mat-icon>
                Mode clair
              } @else {
                <mat-icon>dark_mode</mat-icon>
                Mode sombre
              }
            </button>

            @if (authService.isAuthenticated()) {
              <mat-divider></mat-divider>
              <a routerLink="/orders" (click)="closeMobileMenu()">
                <mat-icon>receipt_long</mat-icon>
                Mes commandes
              </a>
              <a routerLink="/profile" (click)="closeMobileMenu()">
                <mat-icon>person</mat-icon>
                Mon profil
              </a>
              <button (click)="logout(); closeMobileMenu()">
                <mat-icon>logout</mat-icon>
                Déconnexion
              </button>
            } @else {
              <mat-divider></mat-divider>
              <a routerLink="/auth/login" class="mobile-login" (click)="closeMobileMenu()">Connexion</a>
              <a routerLink="/auth/register" class="mobile-signup" (click)="closeMobileMenu()">Inscription</a>
            }
          </nav>
        </div>
      }
    </header>
  `,
  styles: [`
    .header {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: var(--bg-primary);
      color: var(--text-primary);
      box-shadow: var(--shadow);
      transition: all var(--transition);
    }

    .header.scrolled {
      box-shadow: var(--shadow-lg);
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 12px 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Logo */
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: inherit;
    }

    .logo-img {
      height: 44px;
      width: auto;
      object-fit: contain;
    }

    /* Search Bar */
    .search-bar {
      flex: 1;
      max-width: 500px;
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--bg-secondary);
      border-radius: 12px;
      padding: 12px 16px;
      transition: all var(--transition);

      &:focus-within {
        background: var(--bg-primary);
        box-shadow: 0 0 0 2px #6366f1;
      }

      mat-icon {
        color: var(--text-secondary);
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      input {
        flex: 1;
        border: none;
        background: none;
        font-size: 0.95rem;
        color: var(--text-primary);
        outline: none;

        &::placeholder {
          color: var(--text-secondary);
        }
      }
    }

    /* Navigation */
    .nav-links {
      display: flex;
      gap: 8px;

      a {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 10px 16px;
        border-radius: 10px;
        color: var(--text-secondary);
        text-decoration: none;
        font-weight: 500;
        font-size: 0.9rem;
        transition: all var(--transition);

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }

        &:hover {
          background: var(--bg-secondary);
          color: #6366f1;
        }

        &.active {
          background: #eef2ff;
          color: #6366f1;
        }
      }
    }

    /* Actions */
    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .mobile-actions {
      display: none;
      margin-left: auto;
    }

    .desktop-actions {
      display: flex;
    }

    .action-btn {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      background: none;
      border: none;

      &:hover {
        background: var(--bg-secondary);
        color: #6366f1;
      }

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .theme-toggle-btn {
      &:hover {
        background: var(--bg-secondary);
      }
    }

    .cart-btn {
      position: relative;
    }

    .user-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px 6px 6px;
      border: 2px solid var(--border-color);
      border-radius: 50px;
      background: var(--bg-primary);
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: #6366f1;
      }

      .dropdown-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--text-secondary);
      }
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 0.8rem;
      font-weight: 700;
    }

    /* Auth Buttons */
    .login-btn {
      padding: 10px 20px;
      color: var(--text-secondary);
      font-weight: 600;
      text-decoration: none;
      border-radius: 10px;
      transition: all var(--transition);

      &:hover {
        background: var(--bg-secondary);
        color: #6366f1;
      }
    }

    .signup-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      font-weight: 600;
      text-decoration: none;
      border-radius: 10px;
      transition: all var(--transition);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
      }
    }

    /* Menu Styles */
    ::ng-deep .user-menu {
      border-radius: 16px !important;
      padding: 8px !important;
      box-shadow: var(--shadow-xl) !important;
      min-width: 280px !important;
      background: var(--bg-primary) !important;
      color: var(--text-primary) !important;
    }

    .menu-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
    }

    .menu-avatar {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1rem;
      font-weight: 700;
    }

    .menu-user-info {
      display: flex;
      flex-direction: column;
    }

    .menu-user-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .menu-user-email {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    ::ng-deep .menu-item {
      border-radius: 8px !important;
      margin: 4px 0 !important;

      mat-icon {
        color: var(--text-secondary);
      }

      &:hover {
        background: var(--bg-secondary) !important;

        mat-icon {
          color: #6366f1;
        }
      }
    }

    ::ng-deep .logout-item {
      color: var(--error) !important;

      mat-icon {
        color: var(--error) !important;
      }

      &:hover {
        background: var(--error-light) !important;
      }
    }

    ::ng-deep .vendor-item {
      background: linear-gradient(135deg, #fef3c7, #fde68a) !important;
      color: #92400e !important;

      mat-icon {
        color: #d97706 !important;
      }

      &:hover {
        background: linear-gradient(135deg, #fde68a, #fcd34d) !important;
      }
    }

    /* Mobile */

    .mobile-menu {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--bg-primary);
      border-top: 1px solid var(--border-color);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      padding: 16px;
      animation: slideDown 0.2s ease;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .mobile-search {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--bg-secondary);
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 16px;

      mat-icon {
        color: var(--text-secondary);
      }

      input {
        flex: 1;
        border: none;
        background: none;
        font-size: 1rem;
        color: var(--text-primary);
        outline: none;

        &::placeholder {
          color: var(--text-secondary);
        }
      }
    }

    .mobile-nav {
      display: flex;
      flex-direction: column;
      gap: 4px;

      a, button {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        border-radius: 12px;
        color: var(--text-primary);
        text-decoration: none;
        font-weight: 500;
        border: none;
        background: none;
        width: 100%;
        text-align: left;
        font-size: 1rem;
        cursor: pointer;
        transition: background-color var(--transition);

        mat-icon {
          color: var(--text-secondary);
        }

        &:hover {
          background: var(--bg-secondary);
          color: var(--primary);

          mat-icon {
            color: var(--primary);
          }
        }
      }

      .mobile-theme-toggle {
        display: flex;
      }

      .mobile-login {
        margin-top: 8px;
        justify-content: center;
        border: 2px solid var(--border-color);
      }

      .mobile-signup {
        justify-content: center;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;

        &:hover {
          color: white;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
        }
      }
    }

    @media (max-width: 1024px) {
      .nav-links {
        display: none;
      }
    }

    @media (max-width: 768px) {
      .header-content {
        padding: 10px 16px;
      }

      .search-bar,
      .nav-links {
        display: none;
      }

      .logo-img {
        height: 38px;
      }

      .logo {
        flex: 0;
      }

      .desktop-actions {
        display: none !important;
      }

      .mobile-actions {
        display: flex !important;
        gap: 4px;
        margin-left: auto;
      }
    }

    @media (max-width: 480px) {
      .header-content {
        padding: 8px 12px;
      }

      .logo-img {
        height: 32px;
      }

      .mobile-actions {
        gap: 2px;
      }

      .action-btn {
        width: 36px;
        height: 36px;

        mat-icon {
          font-size: 22px;
          width: 22px;
          height: 22px;
        }
      }

      .mobile-menu {
        padding: 12px;
      }

      .mobile-search {
        padding: 10px 12px;
      }

      .mobile-nav {
        a, button {
          padding: 12px 14px;
          font-size: 0.95rem;
        }
      }
    }
  `]
})
export class HeaderComponent {
  currentUser = this.authService.currentUser;
  cartCount = computed(() => this.cartService.itemCount());

  isScrolled = signal(false);
  mobileMenuOpen = signal(false);

  constructor(
    public authService: AuthService,
    private cartService: CartService,
    public themeService: ThemeService
  ) {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        this.isScrolled.set(window.scrollY > 10);
      });
    }
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
  }
}
