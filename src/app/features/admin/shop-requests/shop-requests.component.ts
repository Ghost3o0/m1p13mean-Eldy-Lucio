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
    LoadingComponent
  ],
  template: `
    <div class="requests-container">
      <div class="requests-header">
        <h1>Demandes des boutiques</h1>
        <div class="header-stats">
          <div class="stat pending">
            <span class="stat-value">{{ stats()?.pending || 0 }}</span>
            <span class="stat-label">En attente</span>
          </div>
          <div class="stat urgent">
            <span class="stat-value">{{ stats()?.urgent || 0 }}</span>
            <span class="stat-label">Urgentes</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ stats()?.inReview || 0 }}</span>
            <span class="stat-label">En cours</span>
          </div>
        </div>
      </div>

      <mat-tab-group (selectedTabChange)="onTabChange($event.index)">
        <mat-tab label="Toutes"></mat-tab>
        <mat-tab>
          <ng-template mat-tab-label>
            En attente
            @if (stats()?.pending) {
              <span class="badge">{{ stats()?.pending }}</span>
            }
          </ng-template>
        </mat-tab>
        <mat-tab label="En cours"></mat-tab>
        <mat-tab label="Traitées"></mat-tab>
      </mat-tab-group>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline">
              <mat-label>Type de demande</mat-label>
              <mat-select [(ngModel)]="selectedType" (selectionChange)="applyFilters()">
                <mat-option [value]="null">Tous</mat-option>
                <mat-option value="box_change">Changement de box</mat-option>
                <mat-option value="problem_report">Signalement</mat-option>
                <mat-option value="termination">Résiliation</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-icon-button (click)="clearFilters()" matTooltip="Réinitialiser">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      @if (isLoading()) {
        <app-loading message="Chargement des demandes..."></app-loading>
      }

      @if (!isLoading()) {
        <mat-card class="table-card">
          <table mat-table [dataSource]="requests()">
            <!-- Request Number -->
            <ng-container matColumnDef="requestNumber">
              <th mat-header-cell *matHeaderCellDef>N° Demande</th>
              <td mat-cell *matCellDef="let request">
                <span class="request-number">{{ request.requestNumber }}</span>
              </td>
            </ng-container>

            <!-- Type -->
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let request">
                <mat-chip [class]="'type-' + request.type">
                  <mat-icon>{{ getTypeIcon(request.type) }}</mat-icon>
                  {{ getTypeLabel(request.type) }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Shop -->
            <ng-container matColumnDef="shop">
              <th mat-header-cell *matHeaderCellDef>Boutique</th>
              <td mat-cell *matCellDef="let request">
                {{ getShopName(request.shopId) }}
              </td>
            </ng-container>

            <!-- Summary -->
            <ng-container matColumnDef="summary">
              <th mat-header-cell *matHeaderCellDef>Résumé</th>
              <td mat-cell *matCellDef="let request">
                <span class="summary">{{ getRequestSummary(request) }}</span>
              </td>
            </ng-container>

            <!-- Urgency -->
            <ng-container matColumnDef="urgency">
              <th mat-header-cell *matHeaderCellDef>Urgence</th>
              <td mat-cell *matCellDef="let request">
                @if (request.problemReport?.urgency) {
                  <mat-chip [class]="'urgency-' + request.problemReport.urgency">
                    {{ getUrgencyLabel(request.problemReport.urgency) }}
                  </mat-chip>
                } @else {
                  -
                }
              </td>
            </ng-container>

            <!-- Status -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let request">
                <mat-chip [class]="'status-' + request.status">
                  {{ getStatusLabel(request.status) }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Date -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let request">
                {{ request.createdAt | date:'dd/MM/yyyy' }}
              </td>
            </ng-container>

            <!-- Actions -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let request">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="viewDetails(request)">
                    <mat-icon>visibility</mat-icon>
                    <span>Voir les détails</span>
                  </button>
                  <mat-divider></mat-divider>
                  @if (request.status === 'pending') {
                    <button mat-menu-item (click)="startReview(request)">
                      <mat-icon>rate_review</mat-icon>
                      <span>Commencer l'examen</span>
                    </button>
                  }
                  @if (request.status === 'pending' || request.status === 'in_review') {
                    <button mat-menu-item (click)="approveRequest(request)">
                      <mat-icon color="primary">check_circle</mat-icon>
                      <span>Approuver</span>
                    </button>
                    <button mat-menu-item (click)="rejectRequest(request)">
                      <mat-icon color="warn">cancel</mat-icon>
                      <span>Rejeter</span>
                    </button>
                  }
                  @if (request.status === 'approved') {
                    <button mat-menu-item (click)="completeRequest(request)">
                      <mat-icon>task_alt</mat-icon>
                      <span>Marquer comme terminé</span>
                    </button>
                  }
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                class="request-row"
                [class.urgent]="row.problemReport?.urgency === 'urgent' || row.problemReport?.urgency === 'critical'">
            </tr>
          </table>

          @if (requests().length === 0) {
            <div class="empty-state">
              <mat-icon>inbox</mat-icon>
              <h3>Aucune demande</h3>
              <p>Aucune demande ne correspond à vos critères.</p>
            </div>
          }

          <mat-paginator
            [length]="pagination()?.total || 0"
            [pageSize]="pagination()?.limit || 20"
            [pageIndex]="(pagination()?.page || 1) - 1"
            [pageSizeOptions]="[10, 20, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .requests-container {
      padding: 24px;
    }

    .requests-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;

      h1 {
        font-size: 2rem;
        margin: 0;
      }

      .header-stats {
        display: flex;
        gap: 32px;

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;

          .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--primary);
          }

          &.pending .stat-value {
            color: var(--warning);
          }

          &.urgent .stat-value {
            color: var(--error);
          }

          .stat-label {
            font-size: 0.85rem;
            color: var(--text-secondary);
          }
        }
      }
    }

    mat-tab-group {
      margin-bottom: 24px;

      .badge {
        background: var(--error);
        color: var(--bg-primary);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        margin-left: 8px;
      }
    }

    .filters-card {
      margin-bottom: 24px;
    }

    .filters-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .table-card {
      overflow: hidden;
    }

    table {
      width: 100%;
    }

    .request-number {
      font-family: monospace;
      font-weight: 500;
    }

    .summary {
      max-width: 250px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: block;
    }

    mat-chip {
      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        margin-right: 4px;
      }

      &.type-box_change {
        background: var(--primary-50) !important;
        color: var(--primary) !important;
      }
      &.type-problem_report {
        background: var(--warning-light) !important;
        color: var(--warning) !important;
      }
      &.type-termination {
        background: var(--error-light) !important;
        color: var(--error) !important;
      }

      &.status-pending {
        background: var(--warning-light) !important;
        color: var(--warning) !important;
      }
      &.status-in_review {
        background: var(--primary-50) !important;
        color: var(--primary) !important;
      }
      &.status-approved {
        background: var(--success-light) !important;
        color: var(--success) !important;
      }
      &.status-rejected {
        background: var(--error-light) !important;
        color: var(--error) !important;
      }
      &.status-completed {
        background: var(--bg-secondary) !important;
        color: var(--text-secondary) !important;
      }

      &.urgency-low {
        background: var(--success-light) !important;
        color: var(--success) !important;
      }
      &.urgency-medium {
        background: var(--warning-light) !important;
        color: var(--warning) !important;
      }
      &.urgency-urgent {
        background: var(--error-light) !important;
        color: var(--error) !important;
      }
      &.urgency-critical {
        background: var(--error) !important;
        color: var(--bg-primary) !important;
      }
    }

    .request-row {
      cursor: pointer;

      &:hover {
        background: var(--bg-secondary);
      }

      &.urgent {
        background: var(--warning-light);

        &:hover {
          background: var(--warning-light);
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 64px 24px;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: var(--gray-300);
      }

      h3 {
        margin: 16px 0 8px;
      }

      p {
        color: var(--text-secondary);
      }
    }

    mat-paginator {
      border-top: 1px solid var(--border-color);
    }

    @media (max-width: 768px) {
      .requests-header {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class AdminShopRequestsComponent implements OnInit {
  requests = signal([]);
  stats = signal(null);
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

    const filters = { page, limit: 20 };
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
