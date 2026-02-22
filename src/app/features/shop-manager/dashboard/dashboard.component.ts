import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';
import { ExportService } from '@shared/services/export.service';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  averageOrderValue: number;
  lowStockProducts: number;
  monthlyGrowth?: number;
  conversionRate?: number;
}

interface TopProduct {
  _id: string;
  name: string;
  image?: string;
  sold: number;
  revenue: number;
  stock: number;
}

interface RecentOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-shop-dashboard',
  standalone: true,
  imports: [
    AriaryPipe,
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatTooltipModule,
    NgChartsModule,
    LoadingComponent,
    AriaryPipe
  ],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <div class="header-left">
          <h1>Tableau de bord</h1>
          <span class="welcome-text">Bienvenue dans votre espace vendeur</span>
        </div>
        <div class="header-actions">
          <mat-form-field appearance="outline" class="period-select">
            <mat-select [(ngModel)]="selectedPeriod" (selectionChange)="loadDashboard()">
              <mat-option value="7days">7 derniers jours</mat-option>
              <mat-option value="30days">30 derniers jours</mat-option>
              <mat-option value="90days">3 derniers mois</mat-option>
              <mat-option value="year">Cette année</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-stroked-button (click)="exportDashboard()" matTooltip="Exporter le rapport">
            <mat-icon>picture_as_pdf</mat-icon>
            Exporter
          </button>
        </div>
      </div>

      @if (isLoading()) {
        <app-loading message="Chargement des statistiques..."></app-loading>
      }

      @if (!isLoading()) {
        <!-- Stats Cards -->
        <div class="stats-grid">
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon revenue">
                <mat-icon>euro</mat-icon>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ stats()?.totalRevenue | ariary }}</span>
                <span class="stat-label">Revenu total</span>
                <span class="stat-detail">{{ stats()?.todayRevenue | ariary }} aujourd'hui</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon orders">
                <mat-icon>receipt_long</mat-icon>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ stats()?.totalOrders }}</span>
                <span class="stat-label">Commandes totales</span>
                <span class="stat-detail">{{ stats()?.pendingOrders }} en attente</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon products">
                <mat-icon>inventory_2</mat-icon>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ stats()?.totalProducts }}</span>
                <span class="stat-label">Produits</span>
                <span class="stat-detail warning">{{ stats()?.lowStockProducts }} stock faible</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon average">
                <mat-icon>trending_up</mat-icon>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ stats()?.averageOrderValue | ariary }}</span>
                <span class="stat-label">Panier moyen</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Charts Row -->
        <div class="charts-row">
          <mat-card class="chart-card main-chart">
            <mat-card-header>
              <mat-card-title>Évolution des ventes</mat-card-title>
              <div class="chart-legend">
                <span class="legend-item"><span class="dot revenue"></span> Revenus</span>
                <span class="legend-item"><span class="dot orders"></span> Commandes</span>
              </div>
            </mat-card-header>
            <mat-card-content>
              <canvas baseChart
                [data]="salesChartData"
                [options]="salesChartOptions"
                type="line">
              </canvas>
            </mat-card-content>
          </mat-card>

          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>Répartition des commandes</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <canvas baseChart
                [data]="ordersChartData"
                [options]="ordersChartOptions"
                type="doughnut">
              </canvas>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Top Products Row -->
        <div class="products-row">
          <mat-card class="top-products-card">
            <mat-card-header>
              <mat-card-title>Produits les plus vendus</mat-card-title>
              <a routerLink="/shop-manager/products" mat-button color="primary">Voir tout</a>
            </mat-card-header>
            <mat-card-content>
              @if (topProducts().length > 0) {
                <div class="top-products-list">
                  @for (product of topProducts(); track product._id; let i = $index) {
                    <div class="product-item">
                      <span class="rank">{{ i + 1 }}</span>
                      <div class="product-info">
                        <span class="product-name">{{ product.name }}</span>
                        <div class="product-stats">
                          <span class="sold">{{ product.sold }} vendus</span>
                          <span class="revenue">{{ product.revenue | ariary }}</span>
                        </div>
                        <mat-progress-bar
                          mode="determinate"
                          [value]="getProductPercentage(product.sold)">
                        </mat-progress-bar>
                      </div>
                      <div class="stock-badge" [class.low]="product.stock < 10">
                        {{ product.stock }} en stock
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="empty-products">
                  <mat-icon>inventory_2</mat-icon>
                  <p>Aucune donnée de ventes disponible</p>
                </div>
              }
            </mat-card-content>
          </mat-card>

          <mat-card class="performance-card">
            <mat-card-header>
              <mat-card-title>Performance</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="performance-metrics">
                <div class="metric">
                  <div class="metric-header">
                    <span class="metric-label">Croissance mensuelle</span>
                    <span class="metric-value" [class.positive]="(stats()?.monthlyGrowth || 0) >= 0" [class.negative]="(stats()?.monthlyGrowth || 0) < 0">
                      {{ (stats()?.monthlyGrowth || 0) >= 0 ? '+' : '' }}{{ stats()?.monthlyGrowth || 0 }}%
                    </span>
                  </div>
                  <mat-progress-bar mode="determinate" [value]="Math.abs(stats()?.monthlyGrowth || 0)"></mat-progress-bar>
                </div>

                <div class="metric">
                  <div class="metric-header">
                    <span class="metric-label">Taux de conversion</span>
                    <span class="metric-value">{{ stats()?.conversionRate || 0 }}%</span>
                  </div>
                  <mat-progress-bar mode="determinate" [value]="stats()?.conversionRate || 0"></mat-progress-bar>
                </div>

                <div class="metric">
                  <div class="metric-header">
                    <span class="metric-label">Commandes en attente</span>
                    <span class="metric-value warning">{{ stats()?.pendingOrders || 0 }}</span>
                  </div>
                </div>

                <div class="metric">
                  <div class="metric-header">
                    <span class="metric-label">Produits à faible stock</span>
                    <span class="metric-value" [class.warning]="(stats()?.lowStockProducts || 0) > 0">{{ stats()?.lowStockProducts || 0 }}</span>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Recent Orders & Quick Actions -->
        <div class="bottom-row">
          <mat-card class="recent-orders-card">
            <mat-card-header>
              <mat-card-title>Commandes récentes</mat-card-title>
              <a routerLink="/shop-manager/orders" mat-button color="primary">Voir tout</a>
            </mat-card-header>
            <mat-card-content>
              @if (recentOrders().length > 0) {
                <table mat-table [dataSource]="recentOrders()" class="orders-table">
                  <ng-container matColumnDef="orderNumber">
                    <th mat-header-cell *matHeaderCellDef>N° Commande</th>
                    <td mat-cell *matCellDef="let order">{{ order.orderNumber }}</td>
                  </ng-container>

                  <ng-container matColumnDef="customer">
                    <th mat-header-cell *matHeaderCellDef>Client</th>
                    <td mat-cell *matCellDef="let order">{{ order.customerName }}</td>
                  </ng-container>

                  <ng-container matColumnDef="total">
                    <th mat-header-cell *matHeaderCellDef>Total</th>
                    <td mat-cell *matCellDef="let order">{{ order.total | ariary }}</td>
                  </ng-container>

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Statut</th>
                    <td mat-cell *matCellDef="let order">
                      <mat-chip [class]="'status-' + order.status">
                        {{ getStatusLabel(order.status) }}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="date">
                    <th mat-header-cell *matHeaderCellDef>Date</th>
                    <td mat-cell *matCellDef="let order">{{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;" [routerLink]="['/shop-manager/orders', row._id]"></tr>
                </table>
              } @else {
                <div class="empty-orders">
                  <mat-icon>receipt_long</mat-icon>
                  <p>Aucune commande récente</p>
                </div>
              }
            </mat-card-content>
          </mat-card>

          <mat-card class="quick-actions-card">
            <mat-card-header>
              <mat-card-title>Actions rapides</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <a routerLink="/shop-manager/pos" mat-raised-button color="accent" class="action-btn pos-btn">
                <mat-icon>point_of_sale</mat-icon>
                Ouvrir la caisse
              </a>
              <a routerLink="/shop-manager/products/new" mat-raised-button color="primary" class="action-btn">
                <mat-icon>add</mat-icon>
                Ajouter un produit
              </a>
              <a routerLink="/shop-manager/stock" mat-stroked-button class="action-btn">
                <mat-icon>inventory</mat-icon>
                Gestion du stock
              </a>
              <a routerLink="/shop-manager/promotions" mat-stroked-button class="action-btn">
                <mat-icon>local_offer</mat-icon>
                Gérer les promotions
              </a>
              <a routerLink="/shop-manager/settings" mat-stroked-button class="action-btn">
                <mat-icon>settings</mat-icon>
                Paramètres boutique
              </a>
            </mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;

      .header-left {
        h1 {
          font-size: 2rem;
          margin: 0 0 4px;
        }

        .welcome-text {
          color: var(--text-secondary);
        }
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 12px;

        .period-select {
          width: 180px;

          ::ng-deep .mat-mdc-form-field-subscript-wrapper {
            display: none;
          }
        }
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      margin-bottom: 24px;
    }

    .stat-card {
      mat-card-content {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 24px;
      }
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: white;
      }

      &.revenue {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      &.orders {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }

      &.products {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }

      &.average {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      }
    }

    .stat-info {
      display: flex;
      flex-direction: column;

      .stat-value {
        font-size: 1.75rem;
        font-weight: 700;
      }

      .stat-label {
        color: var(--text-secondary);
        font-size: 0.9rem;
      }

      .stat-detail {
        font-size: 0.8rem;
        color: var(--success);

        &.warning {
          color: var(--warning);
        }
      }
    }

    .charts-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    .chart-card {
      padding: 16px;

      mat-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      &.main-chart {
        .chart-legend {
          display: flex;
          gap: 16px;

          .legend-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.85rem;
            color: var(--text-secondary);

            .dot {
              width: 10px;
              height: 10px;
              border-radius: 50%;

              &.revenue { background: #3f51b5; }
              &.orders { background: #ff9800; }
            }
          }
        }
      }

      canvas {
        max-height: 300px;
      }
    }

    .products-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    .top-products-card {
      mat-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .top-products-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .product-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px;
        background: var(--bg-secondary);
        border-radius: 12px;

        .rank {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .product-info {
          flex: 1;

          .product-name {
            font-weight: 600;
            display: block;
            margin-bottom: 4px;
          }

          .product-stats {
            display: flex;
            gap: 16px;
            font-size: 0.85rem;
            color: var(--text-secondary);
            margin-bottom: 8px;

            .revenue {
              color: var(--success);
              font-weight: 600;
            }
          }

          mat-progress-bar {
            height: 4px;
            border-radius: 2px;
          }
        }

        .stock-badge {
          padding: 4px 12px;
          background: var(--success-light);
          color: var(--success);
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;

          &.low {
            background: var(--warning-light);
            color: var(--warning);
          }
        }
      }

      .empty-products {
        text-align: center;
        padding: 48px;
        color: var(--text-secondary);

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: var(--gray-300);
        }
      }
    }

    .performance-card {
      .performance-metrics {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .metric {
        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .metric-label {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .metric-value {
          font-size: 1.25rem;
          font-weight: 700;

          &.positive { color: var(--success); }
          &.negative { color: var(--error); }
          &.warning { color: var(--warning); }
        }

        mat-progress-bar {
          height: 6px;
          border-radius: 3px;
        }
      }
    }

    .bottom-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
    }

    .recent-orders-card {
      mat-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .orders-table {
        width: 100%;

        tr.mat-mdc-row {
          cursor: pointer;

          &:hover {
            background: var(--bg-secondary);
          }
        }
      }

      mat-chip {
        &.status-pending {
          background: var(--warning-light) !important;
          color: var(--warning) !important;
        }

        &.status-confirmed {
          background: var(--primary-50) !important;
          color: var(--primary) !important;
        }

        &.status-preparing {
          background: var(--error-light) !important;
          color: var(--error) !important;
        }

        &.status-ready, &.status-delivered {
          background: var(--success-light) !important;
          color: var(--success) !important;
        }

        &.status-cancelled {
          background: var(--error-light) !important;
          color: var(--error) !important;
        }
      }
    }

    .empty-orders {
      text-align: center;
      padding: 48px;
      color: var(--text-secondary);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--gray-300);
      }
    }

    .quick-actions-card {
      mat-card-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .action-btn {
        justify-content: flex-start;
        padding: 16px;
      }

      .pos-btn {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        color: #1a1a1a;
        font-weight: 600;
      }
    }

    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .charts-row,
      .bottom-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ShopDashboardComponent implements OnInit {
  stats = signal<DashboardStats | null>(null);
  recentOrders = signal<RecentOrder[]>([]);
  topProducts = signal<TopProduct[]>([]);
  isLoading = signal(true);
  selectedPeriod: string = '7days';
  maxSold: number = 0;
  Math = Math;

  displayedColumns = ['orderNumber', 'customer', 'total', 'status', 'date'];

  salesChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Ventes',
      fill: true,
      tension: 0.4,
      borderColor: '#3f51b5',
      backgroundColor: 'rgba(63, 81, 181, 0.1)'
    }]
  };

  salesChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => '€' + value
        }
      }
    }
  };

  ordersChartData: ChartData<'doughnut'> = {
    labels: ['En attente', 'Confirmées', 'En préparation', 'Livrées', 'Annulées'],
    datasets: [{
      data: [0, 0, 0, 0, 0],
      backgroundColor: ['#ff9800', '#2196f3', '#e91e63', '#4caf50', '#f44336']
    }]
  };

  ordersChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  constructor(
    private http: HttpClient,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);

    const params = { period: this.selectedPeriod };

    this.http.get<any>(`${environment.apiUrl}/shop/dashboard`, { params }).subscribe({
      next: (response) => {
        if (response.success) {
          this.stats.set(response.data.stats);
          this.recentOrders.set(response.data.recentOrders || []);

          // Set top products
          if (response.data.topProducts) {
            this.topProducts.set(response.data.topProducts);
            this.maxSold = Math.max(...response.data.topProducts.map((p: TopProduct) => p.sold), 1);
          }

          // Update charts
          if (response.data.salesByDay) {
            this.salesChartData.labels = response.data.salesByDay.map((d: any) => d.date);
            this.salesChartData.datasets[0].data = response.data.salesByDay.map((d: any) => d.total);
          }

          if (response.data.ordersByStatus) {
            this.ordersChartData.datasets[0].data = [
              response.data.ordersByStatus.pending || 0,
              response.data.ordersByStatus.confirmed || 0,
              response.data.ordersByStatus.preparing || 0,
              response.data.ordersByStatus.delivered || 0,
              response.data.ordersByStatus.cancelled || 0
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

  getProductPercentage(sold: number): number {
    return this.maxSold > 0 ? (sold / this.maxSold) * 100 : 0;
  }

  exportDashboard(): void {
    const statsData = this.stats();
    const statsHTML = this.exportService.generateStatsHTML([
      { label: 'Revenu total', value: this.exportService.formatPrice(statsData?.totalRevenue || 0) },
      { label: 'Commandes', value: statsData?.totalOrders || 0 },
      { label: 'Produits', value: statsData?.totalProducts || 0 },
      { label: 'Panier moyen', value: this.exportService.formatPrice(statsData?.averageOrderValue || 0) }
    ]);

    const ordersColumns = [
      { key: 'orderNumber', header: 'N° Commande' },
      { key: 'customerName', header: 'Client' },
      { key: 'total', header: 'Total', format: (v: number) => this.exportService.formatPrice(v) },
      { key: 'status', header: 'Statut', format: (v: string) => this.getStatusLabel(v) },
      { key: 'createdAt', header: 'Date', format: (v: string) => this.exportService.formatDateTime(v) }
    ];

    const ordersHTML = this.exportService.generateTableHTML(this.recentOrders(), ordersColumns, 'Commandes récentes');

    const productsColumns = [
      { key: 'name', header: 'Produit' },
      { key: 'sold', header: 'Vendus' },
      { key: 'revenue', header: 'Revenus', format: (v: number) => this.exportService.formatPrice(v) },
      { key: 'stock', header: 'Stock' }
    ];

    const productsHTML = this.exportService.generateTableHTML(this.topProducts(), productsColumns, 'Produits les plus vendus');

    const content = statsHTML + ordersHTML + productsHTML;
    this.exportService.exportToPDF('Rapport du Tableau de Bord', content, 'dashboard');
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      preparing: 'En préparation',
      ready: 'Prête',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée'
    };
    return labels[status] || status;
  }
}
