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
import { NotificationsComponent } from '@shared/components/notifications/notifications.component';

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
    NotificationsComponent
  ],
  template: `
    <div class="client-layout" [class.dark-mode]="themeService.isDarkMode()">
      <!-- Header -->
      <header class="client-header" [class.scrolled]="isScrolled()">
        <div class="header-content">
          <!-- Logo -->
          <a routerLink="/" class="logo">
            <img src="/assets/logo.png" alt="Bazar'Be" class="logo-img" onerror="this.style.display='none'">
            <span class="logo-text">Bazar'Be</span>
          </a>

          <!-- Categories Dropdown -->
          <button class="categories-btn" [matMenuTriggerFor]="categoriesMenu">
            <mat-icon>menu</mat-icon>
            <span>Catégories</span>
            <mat-icon class="dropdown-arrow">expand_more</mat-icon>
          </button>

          <mat-menu #categoriesMenu="matMenu" class="categories-menu">
            <a mat-menu-item routerLink="/catalog" class="category-item all-categories">
              <mat-icon>apps</mat-icon>
              <span>Toutes les catégories</span>
            </a>
            <mat-divider></mat-divider>
            @for (category of categories(); track category._id) {
              <a mat-menu-item
                 [routerLink]="['/catalog']"
                 [queryParams]="{category: category.slug}"
                 class="category-item">
                <mat-icon>{{ category.icon || 'folder' }}</mat-icon>
                <span>{{ category.name }}</span>
              </a>
            }
          </mat-menu>

          <!-- Search Bar -->
          <div class="search-bar">
            <mat-icon>search</mat-icon>
            <input type="text"
                   placeholder="Rechercher des produits, boutiques..."
                   [(ngModel)]="searchQuery"
                   (keyup.enter)="search()" />
            @if (searchQuery()) {
              <button class="clear-search" (click)="clearSearch()">
                <mat-icon>close</mat-icon>
              </button>
            }
          </div>

          <!-- Navigation -->
          <nav class="nav-links">
            <a routerLink="/catalog" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
              <mat-icon>grid_view</mat-icon>
              <span>Catalogue</span>
            </a>
            <a routerLink="/catalog" [queryParams]="{promo: true}" class="promo-link">
              <mat-icon>local_fire_department</mat-icon>
              <span>Promos</span>
            </a>
          </nav>

          <!-- Actions -->
          <div class="actions">
            <!-- Theme Toggle -->
            <button class="action-btn theme-btn"
                    (click)="themeService.toggleTheme()"
                    [matTooltip]="themeService.isDarkMode() ? 'Mode clair' : 'Mode sombre'">
              <div class="theme-toggle-icon" [class.dark]="themeService.isDarkMode()">
                @if (themeService.isDarkMode()) {
                  <mat-icon>light_mode</mat-icon>
                } @else {
                  <mat-icon>dark_mode</mat-icon>
                }
              </div>
            </button>

            <!-- Cart -->
            <a routerLink="/cart" class="action-btn cart-btn" matTooltip="Mon panier">
              <mat-icon [matBadge]="cartCount()" matBadgeColor="accent" [matBadgeHidden]="cartCount() === 0" matBadgeSize="small">
                shopping_cart
              </mat-icon>
            </a>

            @if (authService.isAuthenticated()) {
              <!-- Notifications -->
              <app-notifications></app-notifications>

              <!-- Favorites -->
              <a routerLink="/favorites" class="action-btn">
                <mat-icon>favorite_border</mat-icon>
              </a>

              <!-- User Menu -->
              <button class="user-btn" [matMenuTriggerFor]="userMenu">
                <div class="user-avatar">{{ getUserInitials() }}</div>
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
                  <a mat-menu-item routerLink="/admin/dashboard" class="menu-item admin-item">
                    <mat-icon>admin_panel_settings</mat-icon>
                    <span>Administration</span>
                  </a>
                }

                @if (authService.isShopOwner()) {
                  <a mat-menu-item routerLink="/shop-manager/dashboard" class="menu-item shop-item">
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

                <a mat-menu-item routerLink="/reservations" class="menu-item">
                  <mat-icon>event</mat-icon>
                  <span>Mes réservations</span>
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

          <!-- Mobile Menu Toggle -->
          <button class="mobile-menu-toggle" (click)="toggleMobileMenu()">
            <mat-icon>{{ mobileMenuOpen() ? 'close' : 'menu' }}</mat-icon>
          </button>
        </div>

        <!-- Mobile Menu -->
        @if (mobileMenuOpen()) {
          <div class="mobile-menu">
            <div class="mobile-search">
              <mat-icon>search</mat-icon>
              <input type="text"
                     placeholder="Rechercher..."
                     [(ngModel)]="searchQuery"
                     (keyup.enter)="search(); closeMobileMenu()" />
            </div>

            <nav class="mobile-nav">
              <!-- Theme Toggle -->
              <button class="mobile-theme-toggle" (click)="themeService.toggleTheme()">
                @if (themeService.isDarkMode()) {
                  <mat-icon>light_mode</mat-icon>
                  <span>Mode clair</span>
                } @else {
                  <mat-icon>dark_mode</mat-icon>
                  <span>Mode sombre</span>
                }
              </button>

              <mat-divider></mat-divider>

              <a routerLink="/catalog" (click)="closeMobileMenu()">
                <mat-icon>grid_view</mat-icon>
                Catalogue
              </a>

              <!-- Categories submenu -->
              <div class="mobile-categories">
                <span class="mobile-category-title">Catégories</span>
                @for (category of categories(); track category._id) {
                  <a [routerLink]="['/catalog']"
                     [queryParams]="{category: category.slug}"
                     (click)="closeMobileMenu()"
                     class="mobile-category-item">
                    <mat-icon>{{ category.icon || 'folder' }}</mat-icon>
                    {{ category.name }}
                  </a>
                }
              </div>

              <mat-divider></mat-divider>

              <a routerLink="/catalog" [queryParams]="{promo: true}" (click)="closeMobileMenu()" class="mobile-promo">
                <mat-icon>local_fire_department</mat-icon>
                Promotions
              </a>
              <a routerLink="/cart" (click)="closeMobileMenu()">
                <mat-icon>shopping_cart</mat-icon>
                Panier ({{ cartCount() }})
              </a>

              @if (authService.isAuthenticated()) {
                <mat-divider></mat-divider>
                <a routerLink="/orders" (click)="closeMobileMenu()">
                  <mat-icon>receipt_long</mat-icon>
                  Mes commandes
                </a>
                <a routerLink="/favorites" (click)="closeMobileMenu()">
                  <mat-icon>favorite</mat-icon>
                  Mes favoris
                </a>
                <a routerLink="/profile" (click)="closeMobileMenu()">
                  <mat-icon>person</mat-icon>
                  Mon profil
                </a>
                @if (authService.isAdmin()) {
                  <a routerLink="/admin/dashboard" (click)="closeMobileMenu()" class="mobile-admin">
                    <mat-icon>admin_panel_settings</mat-icon>
                    Administration
                  </a>
                }
                @if (authService.isShopOwner()) {
                  <a routerLink="/shop-manager/dashboard" (click)="closeMobileMenu()" class="mobile-shop">
                    <mat-icon>store</mat-icon>
                    Ma boutique
                  </a>
                }
                <button (click)="logout(); closeMobileMenu()" class="mobile-logout">
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

      <!-- Main Content -->
      <main class="client-content">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer -->
      <footer class="client-footer">
        <div class="footer-content">
          <div class="footer-section">
            <h4>Bazar'Be</h4>
            <p>Votre centre commercial en ligne</p>
          </div>
          <div class="footer-section">
            <h4>Liens utiles</h4>
            <a routerLink="/catalog">Catalogue</a>
            <a routerLink="/become-vendor">Devenir vendeur</a>
          </div>
          <div class="footer-section">
            <h4>Contact</h4>
            <p>support&#64;bazarbe.mg</p>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2024 Bazar'Be. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .client-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    // Header
    .client-header {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: var(--bg-primary);
      box-shadow: var(--shadow);
      transition: all 0.3s;

      &.scrolled {
        box-shadow: var(--shadow-lg);
      }
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 12px 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

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

    .logo-text {
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #06b6d4, #0369a1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    // Categories Dropdown
    .categories-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: linear-gradient(135deg, #06b6d4, #0891b2);
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.3s;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .dropdown-arrow {
        font-size: 18px;
        width: 18px;
        height: 18px;
        transition: transform 0.3s;
      }

      &:hover {
        background: linear-gradient(135deg, #0891b2, #0e7490);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
      }

      &[aria-expanded="true"] .dropdown-arrow {
        transform: rotate(180deg);
      }
    }

    ::ng-deep .categories-menu {
      min-width: 280px !important;
      border-radius: 16px !important;
      padding: 8px !important;
      margin-top: 8px !important;

      .category-item {
        border-radius: 10px !important;
        margin: 2px 4px !important;
        padding: 12px 16px !important;

        mat-icon {
          color: #06b6d4;
          margin-right: 12px;
        }

        &:hover {
          background: #ecfeff !important;
        }

        &.all-categories {
          background: linear-gradient(135deg, #ecfeff, #cffafe) !important;
          font-weight: 600;

          mat-icon {
            color: #0891b2;
          }
        }
      }
    }

    .search-bar {
      flex: 1;
      max-width: 500px;
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--bg-secondary);
      border: 2px solid transparent;
      border-radius: 12px;
      padding: 10px 16px;
      transition: all 0.3s;

      &:focus-within {
        background: var(--bg-primary);
        border-color: #06b6d4;
        box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
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

      .clear-search {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border: none;
        background: var(--text-secondary);
        border-radius: 50%;
        cursor: pointer;
        opacity: 0.6;
        transition: opacity 0.2s;

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
          color: white;
        }

        &:hover {
          opacity: 1;
        }
      }
    }

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
        transition: all 0.3s;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }

        &:hover {
          background: var(--bg-secondary);
          color: #06b6d4;
        }

        &.active {
          background: #ecfeff;
          color: #06b6d4;
        }

        &.promo-link {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          color: #92400e;

          mat-icon {
            color: #f59e0b;
          }

          &:hover {
            background: linear-gradient(135deg, #fde68a, #fcd34d);
            transform: translateY(-1px);
          }
        }
      }
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
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
        color: #06b6d4;
      }

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      &.theme-btn {
        .theme-toggle-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          transition: all 0.3s;
          background: #fef3c7;

          mat-icon {
            color: #f59e0b;
            font-size: 20px;
            width: 20px;
            height: 20px;
          }

          &.dark {
            background: #1e293b;

            mat-icon {
              color: #fbbf24;
            }
          }
        }

        &:hover .theme-toggle-icon {
          transform: rotate(15deg);
        }
      }

      &.cart-btn {
        position: relative;

        &:hover {
          color: #06b6d4;
        }
      }
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
        border-color: #06b6d4;
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
      background: linear-gradient(135deg, #06b6d4, #0369a1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 0.8rem;
      font-weight: 700;
    }

    .login-btn {
      padding: 10px 20px;
      color: var(--text-secondary);
      font-weight: 600;
      text-decoration: none;
      border-radius: 10px;
      transition: all 0.3s;

      &:hover {
        background: var(--bg-secondary);
        color: #06b6d4;
      }
    }

    .signup-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      background: linear-gradient(135deg, #06b6d4, #0369a1);
      color: white;
      font-weight: 600;
      text-decoration: none;
      border-radius: 10px;
      transition: all 0.3s;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
      }
    }

    // Menu styles
    ::ng-deep .user-menu {
      border-radius: 16px !important;
      padding: 8px !important;
      min-width: 280px !important;
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
      background: linear-gradient(135deg, #06b6d4, #0369a1);
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
    }

    .menu-user-email {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    ::ng-deep .menu-item {
      border-radius: 8px !important;
      margin: 4px 0 !important;
    }

    ::ng-deep .admin-item {
      background: linear-gradient(135deg, #ede9fe, #ddd6fe) !important;
      color: #6d28d9 !important;

      mat-icon { color: #8b5cf6 !important; }
    }

    ::ng-deep .shop-item {
      background: linear-gradient(135deg, #fef3c7, #fde68a) !important;
      color: #92400e !important;

      mat-icon { color: #f59e0b !important; }
    }

    ::ng-deep .vendor-item {
      background: linear-gradient(135deg, #d1fae5, #a7f3d0) !important;
      color: #065f46 !important;

      mat-icon { color: #10b981 !important; }
    }

    ::ng-deep .logout-item {
      color: var(--error) !important;

      mat-icon { color: var(--error) !important; }
    }

    // Mobile
    .mobile-menu-toggle {
      display: none;
      width: 44px;
      height: 44px;
      align-items: center;
      justify-content: center;
      border: none;
      background: none;
      cursor: pointer;
      border-radius: 12px;

      &:hover {
        background: var(--bg-secondary);
      }

      mat-icon {
        font-size: 24px;
        color: var(--text-primary);
      }
    }

    .mobile-menu {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--bg-primary);
      border-top: 1px solid var(--border-color);
      box-shadow: var(--shadow-lg);
      padding: 16px;
    }

    .mobile-search {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--bg-secondary);
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 16px;

      input {
        flex: 1;
        border: none;
        background: none;
        outline: none;
        color: var(--text-primary);
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
        cursor: pointer;
        font-size: 1rem;

        mat-icon {
          color: var(--text-secondary);
        }

        &:hover {
          background: var(--bg-secondary);
          color: #06b6d4;

          mat-icon {
            color: #06b6d4;
          }
        }
      }

      .mobile-theme-toggle {
        background: var(--bg-secondary);
        justify-content: center;

        mat-icon {
          color: #f59e0b;
        }
      }

      .mobile-categories {
        display: flex;
        flex-direction: column;
        padding: 8px 0;

        .mobile-category-title {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-secondary);
          padding: 8px 16px;
          letter-spacing: 0.5px;
        }

        .mobile-category-item {
          padding: 10px 16px 10px 32px;
          font-size: 0.9rem;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            color: #06b6d4;
          }
        }
      }

      .mobile-promo {
        background: linear-gradient(135deg, #fef3c7, #fde68a);
        color: #92400e;

        mat-icon {
          color: #f59e0b !important;
        }
      }

      .mobile-admin {
        background: linear-gradient(135deg, #ede9fe, #ddd6fe);
        color: #6d28d9;

        mat-icon {
          color: #8b5cf6 !important;
        }
      }

      .mobile-shop {
        background: linear-gradient(135deg, #fef3c7, #fde68a);
        color: #92400e;

        mat-icon {
          color: #f59e0b !important;
        }
      }

      .mobile-logout {
        color: var(--error);

        mat-icon {
          color: var(--error) !important;
        }
      }

      .mobile-login {
        margin-top: 8px;
        justify-content: center;
        border: 2px solid var(--border-color);
      }

      .mobile-signup {
        justify-content: center;
        background: linear-gradient(135deg, #06b6d4, #0369a1);
        color: white;

        &:hover {
          color: white;
        }
      }
    }

    // Main Content
    .client-content {
      flex: 1;
    }

    // Footer
    .client-footer {
      background: var(--bg-secondary);
      border-top: 1px solid var(--border-color);
      margin-top: auto;
    }

    .footer-content {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 32px;
      max-width: 1400px;
      margin: 0 auto;
      padding: 48px 24px;
    }

    .footer-section {
      h4 {
        font-size: 1.1rem;
        margin-bottom: 16px;
        color: #06b6d4;
      }

      p, a {
        color: var(--text-secondary);
        font-size: 0.9rem;
        line-height: 1.8;
      }

      a {
        display: block;
        text-decoration: none;

        &:hover {
          color: #06b6d4;
        }
      }
    }

    .footer-bottom {
      text-align: center;
      padding: 24px;
      border-top: 1px solid var(--border-color);

      p {
        color: var(--text-secondary);
        font-size: 0.85rem;
      }
    }

    // Responsive
    @media (max-width: 1024px) {
      .nav-links {
        display: none;
      }

      .categories-btn span {
        display: none;
      }

      .categories-btn {
        padding: 10px 12px;

        .dropdown-arrow {
          display: none;
        }
      }
    }

    @media (max-width: 768px) {
      .header-content {
        padding: 10px 16px;
      }

      .search-bar {
        display: none;
      }

      .logo-text {
        display: none;
      }

      .categories-btn {
        display: none;
      }

      .login-btn, .signup-btn {
        display: none;
      }

      .mobile-menu-toggle {
        display: flex;
      }

      .footer-content {
        grid-template-columns: 1fr;
        text-align: center;
      }
    }

    // Dark mode adjustments
    :host-context(.dark-mode) {
      .categories-btn {
        background: linear-gradient(135deg, #0891b2, #0e7490);
      }

      ::ng-deep .categories-menu {
        .category-item {
          &:hover {
            background: rgba(6, 182, 212, 0.15) !important;
          }

          &.all-categories {
            background: rgba(6, 182, 212, 0.2) !important;
          }
        }
      }

      .nav-links a {
        &.active {
          background: rgba(6, 182, 212, 0.15);
        }

        &.promo-link {
          background: rgba(245, 158, 11, 0.2);
        }
      }
    }
  `]
})
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
