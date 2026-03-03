import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { ShopRequestService } from '@shared/services/shop-request.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { RequestDetailDialogComponent } from './request-detail-dialog.component';

interface ShopRequestStats {
  pending : number;
  in_review : number;
  approved : number;
  rejected : number;
  completed : number;
}

@Component({
  selector: 'app-admin-shop-requests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatTabsModule,
    MatDividerModule,
    MatDialogModule,
    MatTooltipModule,
    MatBadgeModule,
    LoadingComponent,
    RequestDetailDialogComponent
  ],
  templateUrl: './shop-requests.component.html',
  styleUrls: ['./shop-requests.component.scss']
})
export class AdminShopRequestsComponent implements OnInit {
  requests = signal([]);
  stats = signal<ShopRequestStats | null>(null);
  pagination = signal(null);
  isLoading = signal(true);

  displayedColumns = ['requestNumber', 'type', 'shop', 'summary', 'urgency', 'status', 'date', 'actions'];

  selectedType = null;
  currentTab = 0;

  private statusFilters = [undefined, 'pending', 'in_review', 'completed'];

  constructor(
    private shopRequestService: ShopRequestService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadStats();
    this.loadRequests();
  }

  loadStats() {
    this.shopRequestService.getStatistics().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.stats.set(response.data);
        }
      }
    });
  }

  loadRequests(page = 1) {
    this.isLoading.set(true);

    const filters = { page, limit: 10 };
    if (this.selectedType) filters['type'] = this.selectedType;

    const statusFilter = this.statusFilters[this.currentTab];
    if (statusFilter === 'completed') {
      filters['status'] = 'approved,rejected,completed';
    } else if (statusFilter) {
      filters['status'] = statusFilter;
    }

    this.shopRequestService.getAllRequests(filters).subscribe({
      next: (response: any) => {        
        if (response.success) {
          console.log(response);
          this.stats.set(response.stats);
          this.requests.set(response.data.requests);
          this.pagination.set(response.data.pagination);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onTabChange(index) {
    this.currentTab = index;
    this.loadRequests();
  }

  applyFilters() {
    this.loadRequests();
  }

  clearFilters() {
    this.selectedType = null;
    this.loadRequests();
  }

  onPageChange(event) {
    this.loadRequests(event.pageIndex + 1);
  }

  getShopName(shop) {
    if (typeof shop === 'object' && shop?.name) {
      return shop.name;
    }
    return 'Boutique';
  }

  getTypeIcon(type) {
    const icons = {
      box_change: 'swap_horiz',
      problem_report: 'report_problem',
      termination: 'exit_to_app'
    };
    return icons[type] || 'help';
  }

  getTypeLabel(type) {
    const labels = {
      box_change: 'Changement de box',
      problem_report: 'Signalement',
      termination: 'Résiliation'
    };
    return labels[type] || type;
  }

  getStatusLabel(status) {
    const labels = {
      pending: 'En attente',
      in_review: 'En cours d\'examen',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      completed: 'Terminé'
    };
    return labels[status] || status;
  }

  getUrgencyLabel(urgency) {
    const labels = {
      low: 'Faible',
      medium: 'Moyenne',
      urgent: 'Urgente',
      critical: 'Critique'
    };
    return labels[urgency] || urgency;
  }

  getRequestSummary(request) {
    if (request.type === 'box_change') {
      return request.boxChange?.reason || 'Demande de changement de box';
    }
    if (request.type === 'problem_report') {
      return request.problemReport?.description || 'Signalement de problème';
    }
    if (request.type === 'termination') {
      return request.termination?.reason || 'Demande de résiliation';
    }
    return '';
  }

  viewDetails(request) {
    this.dialog.open(RequestDetailDialogComponent, {
      width: '600px',
      data: { request }
    });
  }

  startReview(request) {
    this.shopRequestService.updateStatus(request._id, 'in_review').subscribe({
      next: () => {
        this.loadRequests();
        this.loadStats();
      }
    });
  }

  approveRequest(request) {
    const notes = prompt('Notes (optionnel):');
    if (notes === null) return;

    this.shopRequestService.approveRequest(request._id, notes || undefined).subscribe({
      next: () => {
        this.loadRequests();
        this.loadStats();
      }
    });
  }

  rejectRequest(request) {
    const reason = prompt('Raison du rejet:');
    if (!reason) return;

    this.shopRequestService.rejectRequest(request._id, reason).subscribe({
      next: () => {
        this.loadRequests();
        this.loadStats();
      }
    });
  }

  completeRequest(request) {
    const notes = prompt('Notes de finalisation (optionnel):');
    if (notes === null) return;

    this.shopRequestService.completeRequest(request._id, notes || undefined).subscribe({
      next: () => {
        this.loadRequests();
        this.loadStats();
      }
    });
  }
}
