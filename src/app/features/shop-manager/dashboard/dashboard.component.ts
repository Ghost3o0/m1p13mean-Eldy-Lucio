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
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],})
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
          console.log(response);
          
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


