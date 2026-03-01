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
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
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
