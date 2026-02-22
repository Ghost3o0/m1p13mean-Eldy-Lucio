import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Shop } from '@shared/models/product.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';

@Component({
  selector: 'app-admin-shop-detail',
  standalone: true,
  imports: [
    AriaryPipe,
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatTableModule,
    MatDividerModule,
    MatMenuModule,
    LoadingComponent,
    AriaryPipe
  ],
  template: `
    <div class="shop-detail-container">
      @if (isLoading()) {
        <app-loading message="Chargement des informations..."></app-loading>
      } @else if (shop()) {
        <!-- Header -->
        <div class="shop-header">
          <button mat-icon-button routerLink="/admin/shops">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="shop-identity">
            <div class="shop-logo">
              @if (shop()!.logo) {
                <img [src]="shop()!.logo" [alt]="shop()!.name">
              } @else {
                <mat-icon>store</mat-icon>
              }
            </div>
            <div class="shop-info">
              <h1>{{ shop()!.name }}</h1>
              <mat-chip [class]="'status-' + shop()!.status">
                {{ getStatusLabel(shop()!.status) }}
              </mat-chip>
            </div>
          </div>
          <div class="header-actions">
            <button mat-stroked-button [routerLink]="['/shop', shop()!._id]" target="_blank">
              <mat-icon>open_in_new</mat-icon>
              Voir la page
            </button>
            <button mat-icon-button [matMenuTriggerFor]="actionsMenu">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #actionsMenu="matMenu">
              @if (shop()!.status === 'pending') {
                <button mat-menu-item (click)="updateStatus('approved')">
                  <mat-icon>check_circle</mat-icon>
                  <span>Approuver</span>
                </button>
                <button mat-menu-item (click)="updateStatus('rejected')">
                  <mat-icon>cancel</mat-icon>
                  <span>Rejeter</span>
                </button>
              }
              @if (shop()!.status === 'approved') {
                <button mat-menu-item (click)="updateStatus('suspended')">
                  <mat-icon color="warn">block</mat-icon>
                  <span>Suspendre</span>
                </button>
              }
              @if (shop()!.status === 'suspended') {
                <button mat-menu-item (click)="updateStatus('approved')">
                  <mat-icon>check_circle</mat-icon>
                  <span>Réactiver</span>
                </button>
              }
            </mat-menu>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <mat-card class="stat-card">
            <mat-icon>inventory_2</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ shop()!.stats?.totalProducts || 0 }}</span>
              <span class="stat-label">Produits</span>
            </div>
          </mat-card>
          <mat-card class="stat-card">
            <mat-icon>shopping_cart</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ shop()!.stats?.totalOrders || 0 }}</span>
              <span class="stat-label">Commandes</span>
            </div>
          </mat-card>
          <mat-card class="stat-card">
            <mat-icon>euro</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ shop()!.stats?.totalRevenue || 0 | ariary }}</span>
              <span class="stat-label">Chiffre d'affaires</span>
            </div>
          </mat-card>
          <mat-card class="stat-card">
            <mat-icon>star</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ shop()!.rating || '-' }}</span>
              <span class="stat-label">Note moyenne</span>
            </div>
          </mat-card>
        </div>

        <!-- Tabs -->
        <mat-tab-group>
          <!-- Info Tab -->
          <mat-tab label="Informations">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Informations de la boutique</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">Description</span>
                      <p class="info-value">{{ shop()!.description || 'Aucune description' }}</p>
                    </div>
                    <mat-divider></mat-divider>
                    <div class="info-row">
                      <div class="info-item">
                        <span class="info-label">Email</span>
                        <span class="info-value">{{ shop()!.contact?.email || '-' }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Téléphone</span>
                        <span class="info-value">{{ shop()!.contact?.phone || '-' }}</span>
                      </div>
                    </div>
                    <mat-divider></mat-divider>
                    <div class="info-row">
                      <div class="info-item">
                        <span class="info-label">Emplacement</span>
                        <span class="info-value">{{ shop()!.address?.location || '-' }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Étage</span>
                        <span class="info-value">{{ shop()!.address?.floor || '-' }}</span>
                      </div>
                    </div>
                    <mat-divider></mat-divider>
                    <div class="info-row">
                      <div class="info-item">
                        <span class="info-label">Commission</span>
                        <span class="info-value">{{ shop()!.commission || 0 }}%</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Créée le</span>
                        <span class="info-value">{{ shop()!.createdAt | date:'dd/MM/yyyy' }}</span>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card>
                <mat-card-header>
                  <mat-card-title>Propriétaire</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  @if (owner()) {
                    <div class="owner-info">
                      <div class="owner-avatar">
                        <mat-icon>person</mat-icon>
                      </div>
                      <div class="owner-details">
                        <span class="owner-name">{{ owner()!.firstName }} {{ owner()!.lastName }}</span>
                        <span class="owner-email">{{ owner()!.email }}</span>
                        <span class="owner-phone">{{ owner()!.phone || '-' }}</span>
                      </div>
                    </div>
                  }
                </mat-card-content>
              </mat-card>

              <mat-card>
                <mat-card-header>
                  <mat-card-title>Horaires d'ouverture</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="hours-list">
                    @for (hour of shop()!.hours || []; track hour.day) {
                      <div class="hour-item">
                        <span class="day-name">{{ getDayName(hour.day) }}</span>
                        @if (hour.isClosed) {
                          <span class="closed">Fermé</span>
                        } @else {
                          <span class="time">{{ hour.open }} - {{ hour.close }}</span>
                        }
                      </div>
                    }
                    @if (!shop()!.hours?.length) {
                      <p class="no-hours">Aucun horaire défini</p>
                    }
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Products Tab -->
          <mat-tab label="Produits">
            <div class="tab-content">
              <mat-card>
                @if (products().length > 0) {
                  <table mat-table [dataSource]="products()">
                    <ng-container matColumnDef="image">
                      <th mat-header-cell *matHeaderCellDef></th>
                      <td mat-cell *matCellDef="let product">
                        <div class="product-image">
                          @if (product.images?.[0]) {
                            <img [src]="product.images[0]" [alt]="product.name">
                          } @else {
                            <mat-icon>image</mat-icon>
                          }
                        </div>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="name">
                      <th mat-header-cell *matHeaderCellDef>Produit</th>
                      <td mat-cell *matCellDef="let product">{{ product.name }}</td>
                    </ng-container>
                    <ng-container matColumnDef="price">
                      <th mat-header-cell *matHeaderCellDef>Prix</th>
                      <td mat-cell *matCellDef="let product">{{ product.basePrice | ariary }}</td>
                    </ng-container>
                    <ng-container matColumnDef="stock">
                      <th mat-header-cell *matHeaderCellDef>Stock</th>
                      <td mat-cell *matCellDef="let product">{{ product.stock }}</td>
                    </ng-container>
                    <ng-container matColumnDef="status">
                      <th mat-header-cell *matHeaderCellDef>Statut</th>
                      <td mat-cell *matCellDef="let product">
                        <mat-chip [class]="product.isActive ? 'status-active' : 'status-inactive'">
                          {{ product.isActive ? 'Actif' : 'Inactif' }}
                        </mat-chip>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="['image', 'name', 'price', 'stock', 'status']"></tr>
                    <tr mat-row *matRowDef="let row; columns: ['image', 'name', 'price', 'stock', 'status'];"></tr>
                  </table>
                } @else {
                  <div class="empty-state">
                    <mat-icon>inventory_2</mat-icon>
                    <p>Aucun produit</p>
                  </div>
                }
              </mat-card>
            </div>
          </mat-tab>

          <!-- Orders Tab -->
          <mat-tab label="Commandes">
            <div class="tab-content">
              <mat-card>
                @if (orders().length > 0) {
                  <table mat-table [dataSource]="orders()">
                    <ng-container matColumnDef="orderNumber">
                      <th mat-header-cell *matHeaderCellDef>N°</th>
                      <td mat-cell *matCellDef="let order">{{ order.orderNumber }}</td>
                    </ng-container>
                    <ng-container matColumnDef="customer">
                      <th mat-header-cell *matHeaderCellDef>Client</th>
                      <td mat-cell *matCellDef="let order">
                        {{ order.userId?.firstName }} {{ order.userId?.lastName }}
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="total">
                      <th mat-header-cell *matHeaderCellDef>Total</th>
                      <td mat-cell *matCellDef="let order">{{ order.total | ariary }}</td>
                    </ng-container>
                    <ng-container matColumnDef="status">
                      <th mat-header-cell *matHeaderCellDef>Statut</th>
                      <td mat-cell *matCellDef="let order">
                        <mat-chip [class]="'order-status-' + order.status">
                          {{ getOrderStatusLabel(order.status) }}
                        </mat-chip>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="date">
                      <th mat-header-cell *matHeaderCellDef>Date</th>
                      <td mat-cell *matCellDef="let order">{{ order.createdAt | date:'dd/MM/yyyy' }}</td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="['orderNumber', 'customer', 'total', 'status', 'date']"></tr>
                    <tr mat-row *matRowDef="let row; columns: ['orderNumber', 'customer', 'total', 'status', 'date'];"></tr>
                  </table>
                } @else {
                  <div class="empty-state">
                    <mat-icon>shopping_cart</mat-icon>
                    <p>Aucune commande</p>
                  </div>
                }
              </mat-card>
            </div>
          </mat-tab>
        </mat-tab-group>
      } @else {
        <div class="not-found">
          <mat-icon>store_off</mat-icon>
          <h2>Boutique non trouvée</h2>
          <button mat-raised-button routerLink="/admin/shops">
            Retour à la liste
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .shop-detail-container {
      padding: 24px;
    }

    .shop-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .shop-identity {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
    }

    .shop-logo {
      width: 80px;
      height: 80px;
      border-radius: 12px;
      background: var(--bg-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: var(--gray-300);
      }
    }

    .shop-info {
      display: flex;
      flex-direction: column;
      gap: 8px;

      h1 {
        margin: 0;
        font-size: 1.75rem;
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    mat-chip {
      &.status-pending { background: var(--warning-light) !important; color: var(--warning) !important; }
      &.status-approved { background: var(--success-light) !important; color: var(--success) !important; }
      &.status-suspended { background: var(--error-light) !important; color: var(--error) !important; }
      &.status-rejected { background: var(--bg-secondary) !important; color: var(--text-secondary) !important; }
      &.status-active { background: var(--success-light) !important; color: var(--success) !important; }
      &.status-inactive { background: var(--error-light) !important; color: var(--error) !important; }
      &.order-status-pending { background: var(--warning-light) !important; color: var(--warning) !important; }
      &.order-status-confirmed { background: var(--primary-50) !important; color: var(--primary) !important; }
      &.order-status-delivered { background: var(--success-light) !important; color: var(--success) !important; }
      &.order-status-cancelled { background: var(--error-light) !important; color: var(--error) !important; }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: var(--primary);
      }

      .stat-info {
        display: flex;
        flex-direction: column;
      }

      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
    }

    .tab-content {
      padding: 24px 0;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .info-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .info-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .info-value {
      font-size: 1rem;
    }

    .owner-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .owner-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--primary-50);
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: var(--primary);
      }
    }

    .owner-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .owner-name {
      font-weight: 600;
      font-size: 1.1rem;
    }

    .owner-email, .owner-phone {
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .hours-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .hour-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--border-color);

      &:last-child {
        border-bottom: none;
      }
    }

    .day-name {
      font-weight: 500;
    }

    .closed {
      color: var(--error);
    }

    .no-hours {
      color: var(--text-secondary);
      font-style: italic;
    }

    table {
      width: 100%;
    }

    .product-image {
      width: 50px;
      height: 50px;
      border-radius: 8px;
      background: var(--bg-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      mat-icon {
        color: var(--gray-300);
      }
    }

    .empty-state {
      text-align: center;
      padding: 48px;
      color: var(--text-secondary);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--gray-300);
      }

      p {
        margin-top: 16px;
      }
    }

    .not-found {
      text-align: center;
      padding: 64px;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: var(--gray-300);
      }

      h2 {
        margin: 16px 0 24px;
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .info-row {
        grid-template-columns: 1fr;
      }

      .shop-header {
        flex-wrap: wrap;
      }
    }
  `]
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
