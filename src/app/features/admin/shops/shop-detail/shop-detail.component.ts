import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

interface Shop {
  _id?: string;
  name?: string;
  status?: 'pending' | 'approved' | 'suspended' | 'rejected';
  [key: string]: any;
}

@Component({
  selector: 'app-admin-shop-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatTableModule,
    MatMenuModule,
    MatDividerModule,
    AriaryPipe
  ],
  templateUrl: './shop-detail.component.html',
  styleUrls: ['./shop-detail.component.scss']
})
export class AdminShopDetailComponent implements OnInit {
  shop = signal<Shop | null>(null);
  owner = signal<any>(null);
  products = signal<any[]>([]);
  orders = signal<any[]>([]);
  isLoading = signal(true);

  private shopId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.shopId = this.route.snapshot.paramMap.get('id') || '';
    if (this.shopId) {
      this.loadShopDetails();
    }
  }

  loadShopDetails(): void {
    this.isLoading.set(true);

    this.http.get<any>(`${environment.apiUrl}/admin/shops/${this.shopId}`).subscribe({
      next: (response) => {
        if (response.success) {
          this.shop.set(response.data.shop);
          this.owner.set(response.data.owner);
          this.products.set(response.data.products || []);
          this.orders.set(response.data.orders || []);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      approved: 'Approuvée',
      suspended: 'Suspendue',
      rejected: 'Rejetée'
    };
    return labels[status] || status;
  }

  getOrderStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      preparing: 'En préparation',
      ready: 'Prête',
      delivered: 'Livrée',
      cancelled: 'Annulée'
    };
    return labels[status] || status;
  }

  getDayName(day: number): string {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[day] || '';
  }

  updateStatus(newStatus: string): void {
    const confirmMessages: Record<string, string> = {
      approved: 'Voulez-vous approuver cette boutique ?',
      rejected: 'Voulez-vous rejeter cette boutique ?',
      suspended: 'Voulez-vous suspendre cette boutique ?'
    };

    if (!confirm(confirmMessages[newStatus])) return;

    this.http.put<any>(`${environment.apiUrl}/admin/shops/${this.shopId}/status`, {
      status: newStatus
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.shop.update(s => s ? { ...s, status: newStatus as Shop['status'] } : null);
        }
      }
    });
  }
}
