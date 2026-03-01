import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription } from 'rxjs';
import { SocketService, Notification } from '@core/services/socket.service';
import { AuthService } from '@core/services/auth.service';

interface NotificationItem extends Notification {
  read: boolean;
  icon: string;
  color: string;
  link?: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule
  ],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications = signal<NotificationItem[]>([]);
  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  private subscriptions: Subscription[] = [];
  private audio: HTMLAudioElement | null = null;

  constructor(
    private socketService: SocketService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Connect to socket when authenticated
    if (this.authService.isAuthenticated()) {
      this.socketService.connect();
      this.setupListeners();
    }

    // Try to initialize notification sound
    if (typeof window !== 'undefined') {
      this.audio = new Audio('/assets/sounds/notification.mp3');
      this.audio.volume = 0.5;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupListeners(): void {
    // Generic notifications
    this.subscriptions.push(
      this.socketService.notifications$.subscribe(notif => {
        this.addNotification(notif);
      })
    );

    // New order notifications (for shop owners)
    this.subscriptions.push(
      this.socketService.newOrders$.subscribe(data => {
        this.addNotification({
          _id: `order-${data.orderId}`,
          type: 'new_order',
          title: 'Nouvelle commande',
          message: `Commande #${data.orderNumber} - ${this.formatPrice(data.total)}`,
          data,
          createdAt: new Date().toISOString()
        });
      })
    );

    // Order status updates (for clients)
    this.subscriptions.push(
      this.socketService.orderUpdates$.subscribe(data => {
        this.addNotification({
          _id: `order-update-${data.orderId}`,
          type: 'order_update',
          title: 'Commande mise à jour',
          message: `Votre commande est maintenant: ${this.translateStatus(data.status)}`,
          data,
          createdAt: new Date().toISOString()
        });
      })
    );
  }

  private addNotification(notif: Notification): void {
    const item: NotificationItem = {
      ...notif,
      read: false,
      icon: this.getIcon(notif.type),
      color: this.getColor(notif.type),
      link: this.getLink(notif)
    };

    this.notifications.update(list => [item, ...list].slice(0, 50));
    this.playSound();
  }

  markAsRead(notif: NotificationItem): void {
    this.notifications.update(list =>
      list.map(n => n._id === notif._id ? { ...n, read: true } : n)
    );
  }

  markAllAsRead(): void {
    this.notifications.update(list =>
      list.map(n => ({ ...n, read: true }))
    );
  }

  clearAll(): void {
    this.notifications.set([]);
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  }

  private formatPrice(amount: number): string {
    return Math.round(amount).toLocaleString('fr-FR') + ' Ar';
  }

  private translateStatus(status: string): string {
    const statuses: Record<string, string> = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'processing': 'En préparation',
      'shipped': 'Expédiée',
      'delivered': 'Livrée',
      'cancelled': 'Annulée',
      'ready': 'Prête'
    };
    return statuses[status] || status;
  }

  private getIcon(type: string): string {
    const icons: Record<string, string> = {
      'new_order': 'shopping_cart',
      'order_update': 'local_shipping',
      'order_status': 'update',
      'payment': 'payment',
      'stock_alert': 'inventory',
      'reservation': 'event',
      'message': 'message',
      'system': 'info',
      'promotion': 'local_offer'
    };
    return icons[type] || 'notifications';
  }

  private getColor(type: string): string {
    const colors: Record<string, string> = {
      'new_order': 'linear-gradient(135deg, #10b981, #059669)',
      'order_update': 'linear-gradient(135deg, #3b82f6, #2563eb)',
      'order_status': 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
      'payment': 'linear-gradient(135deg, #f59e0b, #d97706)',
      'stock_alert': 'linear-gradient(135deg, #ef4444, #dc2626)',
      'reservation': 'linear-gradient(135deg, #ec4899, #db2777)',
      'message': 'linear-gradient(135deg, #06b6d4, #0891b2)',
      'promotion': 'linear-gradient(135deg, #f59e0b, #d97706)'
    };
    return colors[type] || 'linear-gradient(135deg, #6b7280, #4b5563)';
  }

  private getLink(notif: Notification): string | undefined {
    if (notif.type === 'new_order' && notif.data?.orderId) {
      return `/shop-manager/orders/${notif.data.orderId}`;
    }
    if (notif.type === 'order_update' && notif.data?.orderId) {
      return `/orders/${notif.data.orderId}`;
    }
    if (notif.type === 'reservation' && notif.data?.reservationId) {
      return `/shop-manager/reservations`;
    }
    return undefined;
  }

  private playSound(): void {
    if (this.audio) {
      this.audio.play().catch(() => {
        // Ignore audio play errors (user hasn't interacted with page yet)
      });
    }
  }
}


