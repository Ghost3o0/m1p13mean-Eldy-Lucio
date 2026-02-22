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
import { MatExpansionModule } from '@angular/material/expansion';
import { AuthService } from '@core/services/auth.service';
import { NotificationsComponent } from '@shared/components/notifications/notifications.component';

interface NavGroup {
  label: string;
  icon: string;
  children: NavItem[];
}

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-admin-layout',
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
    MatExpansionModule,
    NotificationsComponent
  ],
  template: `
    <div class="admin-layout">
      <!-- Header -->
      <header class="admin-header">
        <div class="header-left">
          <button class="menu-toggle" (click)="toggleSidebar()">
            <mat-icon>{{ sidebarOpen() ? 'menu_open' : 'menu' }}</mat-icon>
          </button>
          <a routerLink="/admin/dashboard" class="logo">
            <span class="logo-icon">⚙️</span>
            <span class="logo-text">Bazar'Be</span>
            <span class="logo-badge">Admin</span>
          </a>
        </div>

        <div class="header-center">
          <!-- System Status -->
          <div class="system-status">
            <div class="status-item">
              <mat-icon>check_circle</mat-icon>
              <span>Système OK</span>
            </div>
          </div>
        </div>

        <div class="header-right">
          <button mat-icon-button matTooltip="Tickets support" routerLink="/admin/tickets">
            <mat-icon [matBadge]="5" matBadgeColor="warn" matBadgeSize="small">support_agent</mat-icon>
          </button>

          <app-notifications></app-notifications>

          <button mat-icon-button [matMenuTriggerFor]="userMenu" class="user-btn">
            <div class="user-avatar">{{ getUserInitials() }}</div>
          </button>
          <mat-menu #userMenu="matMenu">
            <div class="user-menu-header">
              <div class="admin-badge">Administrateur</div>
              <div class="user-info">
                <span class="user-name">{{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}</span>
                <span class="user-email">{{ authService.currentUser()?.email }}</span>
              </div>
            </div>
            <mat-divider></mat-divider>
            <a mat-menu-item routerLink="/admin/settings">
              <mat-icon>settings</mat-icon>
              <span>Paramètres</span>
            </a>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="logout()" class="logout-btn">
              <mat-icon>logout</mat-icon>
              <span>Déconnexion</span>
            </button>
          </mat-menu>
        </div>
      </header>

      <div class="admin-body">
        <!-- Sidebar -->
        <aside class="admin-sidebar" [class.open]="sidebarOpen()">
          <nav class="sidebar-nav">
            <!-- Dashboard -->
            <a routerLink="/admin/dashboard"
               routerLinkActive="active"
               [routerLinkActiveOptions]="{exact: true}"
               class="nav-item main"
               (click)="closeSidebarOnMobile()">
              <mat-icon>dashboard</mat-icon>
              <span class="nav-label">Tableau de bord</span>
            </a>

            <div class="nav-section-title">Gestion</div>

            @for (item of managementItems; track item.route) {
              <a [routerLink]="item.route"
                 routerLinkActive="active"
                 class="nav-item"
                 (click)="closeSidebarOnMobile()">
                <mat-icon>{{ item.icon }}</mat-icon>
                <span class="nav-label">{{ item.label }}</span>
                @if (item.badge) {
                  <span class="nav-badge">{{ item.badge }}</span>
                }
              </a>
            }

            <div class="nav-section-title">Centre Commercial</div>

            @for (item of mallItems; track item.route) {
              <a [routerLink]="item.route"
                 routerLinkActive="active"
                 class="nav-item"
                 (click)="closeSidebarOnMobile()">
                <mat-icon>{{ item.icon }}</mat-icon>
                <span class="nav-label">{{ item.label }}</span>
                @if (item.badge) {
                  <span class="nav-badge">{{ item.badge }}</span>
                }
              </a>
            }

            <div class="nav-section-title">Configuration</div>

            @for (item of configItems; track item.route) {
              <a [routerLink]="item.route"
                 routerLinkActive="active"
                 class="nav-item"
                 (click)="closeSidebarOnMobile()">
                <mat-icon>{{ item.icon }}</mat-icon>
                <span class="nav-label">{{ item.label }}</span>
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
        <main class="admin-content" [class.sidebar-open]="sidebarOpen()">
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
    .admin-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--bg-secondary);
    }

    // Header
    .admin-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      height: 64px;
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%);
      color: white;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
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

    .header-center {
      display: flex;
      align-items: center;
    }

    .system-status {
      display: flex;
      align-items: center;
      gap: 16px;

      .status-item {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.1);
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 0.85rem;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: #4ade80;
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

      .admin-badge {
        background: linear-gradient(135deg, #8b5cf6, #6d28d9);
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        display: inline-block;
        margin-bottom: 8px;
      }

      .user-info {
        display: flex;
        flex-direction: column;

        .user-name {
          font-weight: 600;
        }

        .user-email {
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
    .admin-body {
      display: flex;
      flex: 1;
    }

    // Sidebar
    .admin-sidebar {
      width: 260px;
      background: #1e1b4b;
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

    .nav-section-title {
      padding: 16px 16px 8px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #6366f1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      color: #a5b4fc;
      text-decoration: none;
      margin-bottom: 4px;
      transition: all 0.2s;
      border-left: 3px solid transparent;

      &.main {
        background: rgba(139, 92, 246, 0.1);
        border-left-color: #8b5cf6;
      }

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
        background: #ef4444;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #c4b5fd;
      }

      &.active {
        background: rgba(139, 92, 246, 0.2);
        color: #c4b5fd;
        border-left-color: #8b5cf6;

        mat-icon {
          color: #a78bfa;
        }
      }
    }

    .sidebar-footer {
      padding: 16px 12px;
      border-top: 1px solid #312e81;
    }

    .back-to-site {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      color: #a5b4fc;
      text-decoration: none;
      transition: all 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #c4b5fd;
      }
    }

    // Main Content
    .admin-content {
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
      .admin-header {
        padding: 0 16px;
      }

      .logo-text, .logo-badge {
        display: none;
      }

      .system-status {
        display: none;
      }
    }
  `]
})
export class AdminLayoutComponent {
  sidebarOpen = signal(true);

  managementItems: NavItem[] = [
    { label: 'Utilisateurs', icon: 'people', route: '/admin/users' },
    { label: 'Boutiques', icon: 'store', route: '/admin/shops' },
    { label: 'Commandes', icon: 'shopping_cart', route: '/admin/orders' },
    { label: 'Catégories', icon: 'category', route: '/admin/categories' }
  ];

  mallItems: NavItem[] = [
    { label: 'Boxes', icon: 'grid_view', route: '/admin/boxes' },
    { label: 'Loyers', icon: 'payments', route: '/admin/rent-payments' },
    { label: 'Demandes boutique', icon: 'description', route: '/admin/shop-requests', badge: 2 },
    { label: 'Demandes vendeur', icon: 'person_add', route: '/admin/vendor-requests', badge: 4 },
    { label: 'Tickets support', icon: 'support_agent', route: '/admin/tickets', badge: 5 }
  ];

  configItems: NavItem[] = [
    { label: 'Page d\'accueil', icon: 'web', route: '/admin/landing' },
    { label: 'Paramètres', icon: 'settings', route: '/admin/settings' }
  ];

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
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
    if (!user) return 'A';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
