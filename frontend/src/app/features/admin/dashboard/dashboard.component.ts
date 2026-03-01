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
    LoadingComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
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
