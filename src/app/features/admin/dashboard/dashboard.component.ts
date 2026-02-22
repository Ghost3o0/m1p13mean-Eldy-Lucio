import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';

interface DashboardStats {
  totalUsers: number;
  totalShops: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  pendingShops: number;
  openTickets: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    AriaryPipe,
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    NgChartsModule,
    LoadingComponent,
    AriaryPipe
  ],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Tableau de bord Admin</h1>
        <span class="subtitle">Vue d'ensemble de la plateforme</span>
      </div>

      @if (isLoading()) {
        <app-loading message="Chargement des statistiques..."></app-loading>
      }

      @if (!isLoading()) {
        <!-- Stats Grid -->
        <div class="stats-grid">
          <mat-card class="stat-card" routerLink="/admin/users">
            <mat-card-content>
              <div class="stat-icon users">
                <mat-icon>people</mat-icon>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ stats()?.totalUsers }}</span>
                <span class="stat-label">Utilisateurs</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card" routerLink="/admin/shops">
            <mat-card-content>
              <div class="stat-icon shops">
                <mat-icon>store</mat-icon>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ stats()?.totalShops }}</span>
                <span class="stat-label">Boutiques</span>
                @if (stats()?.pendingShops && stats()!.pendingShops > 0) {
                  <span class="stat-badge">{{ stats()!.pendingShops }} en attente</span>
                }
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
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card" routerLink="/admin/orders">
            <mat-card-content>
              <div class="stat-icon orders">
                <mat-icon>receipt_long</mat-icon>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ stats()?.totalOrders }}</span>
                <span class="stat-label">Commandes</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card revenue">
            <mat-card-content>
              <div class="stat-icon revenue-icon">
                <mat-icon>euro</mat-icon>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ stats()?.totalRevenue | ariary:'symbol':'1.0-0' }}</span>
                <span class="stat-label">Revenu total</span>
                <span class="stat-detail">{{ stats()?.todayRevenue | ariary }} aujourd'hui</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card" routerLink="/admin/tickets">
            <mat-card-content>
              <div class="stat-icon tickets">
                <mat-icon>support_agent</mat-icon>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ stats()?.openTickets }}</span>
                <span class="stat-label">Tickets ouverts</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Charts Row -->
        <div class="charts-row">
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>Revenus des 30 derniers jours</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <canvas baseChart
                [data]="revenueChartData"
                [options]="revenueChartOptions"
                type="line">
              </canvas>
            </mat-card-content>
          </mat-card>

          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>Répartition par catégorie</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <canvas baseChart
                [data]="categoryChartData"
                [options]="categoryChartOptions"
                type="doughnut">
              </canvas>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Recent Activity -->
        <div class="activity-row">
          <mat-card class="activity-card">
            <mat-card-header>
              <mat-card-title>Boutiques en attente</mat-card-title>
              <a routerLink="/admin/shops" mat-button color="primary">Voir tout</a>
            </mat-card-header>
            <mat-card-content>
              @if (pendingShops().length > 0) {
                <table mat-table [dataSource]="pendingShops()">
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Boutique</th>
                    <td mat-cell *matCellDef="let shop">{{ shop.name }}</td>
                  </ng-container>
                  <ng-container matColumnDef="owner">
                    <th mat-header-cell *matHeaderCellDef>Propriétaire</th>
                    <td mat-cell *matCellDef="let shop">{{ shop.ownerName }}</td>
                  </ng-container>
                  <ng-container matColumnDef="date">
                    <th mat-header-cell *matHeaderCellDef>Date</th>
                    <td mat-cell *matCellDef="let shop">{{ shop.createdAt | date:'dd/MM/yyyy' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef></th>
                    <td mat-cell *matCellDef="let shop">
                      <a [routerLink]="['/admin/shops', shop._id]" mat-button color="primary">
                        Examiner
                      </a>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="['name', 'owner', 'date', 'actions']"></tr>
                  <tr mat-row *matRowDef="let row; columns: ['name', 'owner', 'date', 'actions'];"></tr>
                </table>
              } @else {
                <div class="empty-state">
                  <mat-icon>check_circle</mat-icon>
                  <p>Aucune boutique en attente</p>
                </div>
              }
            </mat-card-content>
          </mat-card>

          <mat-card class="activity-card">
            <mat-card-header>
              <mat-card-title>Tickets récents</mat-card-title>
              <a routerLink="/admin/tickets" mat-button color="primary">Voir tout</a>
            </mat-card-header>
            <mat-card-content>
              @if (recentTickets().length > 0) {
                <div class="tickets-list">
                  @for (ticket of recentTickets(); track ticket._id) {
                    <div class="ticket-item" [routerLink]="['/admin/tickets', ticket._id]">
                      <div class="ticket-info">
                        <span class="ticket-subject">{{ ticket.subject }}</span>
                        <span class="ticket-user">{{ ticket.userName }}</span>
                      </div>
                      <mat-chip [class]="'priority-' + ticket.priority">
                        {{ ticket.priority }}
                      </mat-chip>
                    </div>
                  }
                </div>
              } @else {
                <div class="empty-state">
                  <mat-icon>check_circle</mat-icon>
                  <p>Aucun ticket ouvert</p>
                </div>
              }
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
      margin-bottom: 24px;

      h1 {
        font-size: 2rem;
        margin: 0 0 4px;
      }

      .subtitle {
        color: var(--text-secondary);
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }

      mat-card-content {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
      }
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: white;
      }

      &.users { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
      &.shops { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
      &.products { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
      &.orders { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
      &.revenue-icon { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
      &.tickets { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); }
    }

    .stat-info {
      display: flex;
      flex-direction: column;

      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
      }

      .stat-label {
        color: var(--text-secondary);
        font-size: 0.85rem;
      }

      .stat-badge {
        font-size: 0.75rem;
        color: var(--warning);
      }

      .stat-detail {
        font-size: 0.8rem;
        color: var(--success);
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
        margin-bottom: 16px;
      }

      canvas {
        max-height: 300px;
      }
    }

    .activity-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .activity-card {
      mat-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      table {
        width: 100%;
      }
    }

    .tickets-list {
      display: flex;
      flex-direction: column;
    }

    .ticket-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-color);
      cursor: pointer;

      &:hover {
        background: var(--bg-secondary);
        margin: 0 -16px;
        padding: 12px 16px;
      }

      &:last-child {
        border-bottom: none;
      }

      .ticket-info {
        display: flex;
        flex-direction: column;

        .ticket-subject {
          font-weight: 500;
        }

        .ticket-user {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
      }
    }

    mat-chip {
      &.priority-high {
        background: var(--error-light) !important;
        color: var(--error) !important;
      }
      &.priority-medium {
        background: var(--warning-light) !important;
        color: var(--warning) !important;
      }
      &.priority-low {
        background: var(--success-light) !important;
        color: var(--success) !important;
      }
    }

    .empty-state {
      text-align: center;
      padding: 32px;
      color: var(--text-secondary);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--success);
      }
    }

    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .charts-row,
      .activity-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats = signal<DashboardStats | null>(null);
  pendingShops = signal<any[]>([]);
  recentTickets = signal<any[]>([]);
  isLoading = signal(true);

  revenueChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Revenus',
      fill: true,
      tension: 0.4,
      borderColor: 'var(--primary)',
      backgroundColor: 'rgba(63, 81, 181, 0.1)'
    }]
  };

  revenueChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (value) => '€' + value }
      }
    }
  };

  categoryChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: ['#667eea', '#f5576c', '#4facfe', '#43e97b', '#fa709a', '#fee140']
    }]
  };

  categoryChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } }
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);

    this.http.get<any>(`${environment.apiUrl}/admin/dashboard`).subscribe({
      next: (response) => {
        if (response.success) {
          this.stats.set(response.data.stats);
          this.pendingShops.set(response.data.pendingShops || []);
          this.recentTickets.set(response.data.recentTickets || []);

          if (response.data.revenueByDay) {
            this.revenueChartData.labels = response.data.revenueByDay.map((d: any) => d.date);
            this.revenueChartData.datasets[0].data = response.data.revenueByDay.map((d: any) => d.total);
          }

          if (response.data.salesByCategory) {
            this.categoryChartData.labels = response.data.salesByCategory.map((c: any) => c.name);
            this.categoryChartData.datasets[0].data = response.data.salesByCategory.map((c: any) => c.total);
          }
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}
