import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';
import { OrderService } from '@shared/services/order.service';
import { Order, OrderStatus } from '@shared/models/order.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    AriaryPipe,
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatStepperModule,
    LoadingComponent,
    AriaryPipe
  ],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],})
export class OrderDetailComponent implements OnInit {
  order = signal<Order | null>(null);
  isLoading = signal(true);
  showSuccessMessage = false;

  progressSteps = [
    { status: 'pending', label: 'Commande reçue', icon: 'receipt' },
    { status: 'confirmed', label: 'Confirmée', icon: 'check_circle' },
    { status: 'preparing', label: 'En préparation', icon: 'inventory_2' },
    { status: 'shipped', label: 'Expédiée', icon: 'local_shipping' },
    { status: 'delivered', label: 'Livrée', icon: 'done_all' }
  ];

  private statusOrder: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered'];

  constructor(
    private orderService: OrderService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const orderId = params['id'];
      if (orderId) {
        this.loadOrder(orderId);
      }
    });

    this.route.queryParams.subscribe(params => {
      this.showSuccessMessage = params['success'] === 'true';
    });
  }

  loadOrder(id: string): void {
    this.isLoading.set(true);

    this.orderService.getOrder(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.order.set(response.data.order);

          // Adjust progress steps for pickup orders
          if (response.data.order.deliveryMethod === 'pickup') {
            this.progressSteps = [
              { status: 'pending', label: 'Commande reçue', icon: 'receipt' },
              { status: 'confirmed', label: 'Confirmée', icon: 'check_circle' },
              { status: 'preparing', label: 'En préparation', icon: 'inventory_2' },
              { status: 'ready', label: 'Prête', icon: 'store' },
              { status: 'delivered', label: 'Récupérée', icon: 'done_all' }
            ];
          }
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      preparing: 'En préparation',
      ready: 'Prête',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
      refunded: 'Remboursée'
    };
    return labels[status] || status;
  }

  getPaymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      processing: 'En cours',
      completed: 'Payé',
      failed: 'Échoué',
      refunded: 'Remboursé'
    };
    return labels[status] || status;
  }

  isCancelled(): boolean {
    const o = this.order();
    return o ? ['cancelled', 'refunded'].includes(o.status) : false;
  }

  isStepActive(stepStatus: string): boolean {
    const o = this.order();
    return o?.status === stepStatus;
  }

  isStepCompleted(stepStatus: string): boolean {
    const o = this.order();
    if (!o) return false;

    const currentIndex = this.statusOrder.indexOf(o.status);
    const stepIndex = this.statusOrder.indexOf(stepStatus as OrderStatus);

    return stepIndex < currentIndex;
  }

  getStepDate(stepStatus: string): string | null {
    const o = this.order();
    if (!o || !o.statusHistory) return null;

    const history = o.statusHistory.find(h => h.status === stepStatus);
    return history?.timestamp || null;
  }

  getShopName(shopId: string | any): string {
    if (typeof shopId === 'object' && shopId?.name) {
      return shopId.name;
    }
    return 'Boutique';
  }

  canCancel(): boolean {
    const o = this.order();
    return o ? ['pending', 'confirmed'].includes(o.status) : false;
  }

  cancelOrder(): void {
    const o = this.order();
    if (!o) return;

    if (confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      this.orderService.cancelOrder(o._id).subscribe({
        next: () => {
          this.loadOrder(o._id);
        }
      });
    }
  }

  contactSupport(): void {
    // Navigate to support ticket creation
  }

  downloadInvoice(): void {
    const o = this.order();
    if (!o) return;

    // Open invoice in new window for printing/saving
    this.orderService.getInvoice(o._id).subscribe({
      next: (html) => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
        }
      },
      error: () => {
        alert('Erreur lors de la génération de la facture');
      }
    });
  }
}


