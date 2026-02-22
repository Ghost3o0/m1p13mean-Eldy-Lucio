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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { LoadingComponent } from '@shared/components/loading/loading.component';

@Component({
  selector: 'app-admin-tickets',
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
    MatDialogModule,
    MatDividerModule,
    LoadingComponent
  ],
  template: `
    <div class="tickets-container">
      <div class="tickets-header">
        <h1>Support - Tickets</h1>
        <div class="header-stats">
          <div class="stat open">
            <span class="stat-value">{{ openCount() }}</span>
            <span class="stat-label">Ouverts</span>
          </div>
          <div class="stat in-progress">
            <span class="stat-value">{{ inProgressCount() }}</span>
            <span class="stat-label">En cours</span>
          </div>
          <div class="stat resolved">
            <span class="stat-value">{{ resolvedCount() }}</span>
            <span class="stat-label">Résolus</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Rechercher</mat-label>
              <input matInput [(ngModel)]="searchQuery" (keyup.enter)="loadTickets()" placeholder="Sujet, utilisateur...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Statut</mat-label>
              <mat-select [(ngModel)]="selectedStatus" (selectionChange)="loadTickets()">
                <mat-option [value]="null">Tous</mat-option>
                <mat-option value="open">Ouverts</mat-option>
                <mat-option value="in_progress">En cours</mat-option>
                <mat-option value="resolved">Résolus</mat-option>
                <mat-option value="closed">Fermés</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Priorité</mat-label>
              <mat-select [(ngModel)]="selectedPriority" (selectionChange)="loadTickets()">
                <mat-option [value]="null">Toutes</mat-option>
                <mat-option value="high">Haute</mat-option>
                <mat-option value="medium">Moyenne</mat-option>
                <mat-option value="low">Basse</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      @if (isLoading()) {
        <app-loading message="Chargement des tickets..."></app-loading>
      } @else {
        <mat-card class="tickets-card">
          @if (tickets().length > 0) {
            <table mat-table [dataSource]="tickets()">
              <ng-container matColumnDef="priority">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let ticket">
                  <div class="priority-indicator" [class]="'priority-' + ticket.priority"></div>
                </td>
              </ng-container>

              <ng-container matColumnDef="subject">
                <th mat-header-cell *matHeaderCellDef>Sujet</th>
                <td mat-cell *matCellDef="let ticket">
                  <div class="ticket-subject">
                    <span class="subject-text">{{ ticket.subject }}</span>
                    @if (ticket.orderId) {
                      <span class="order-ref">Commande #{{ ticket.orderId.orderNumber }}</span>
                    }
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="user">
                <th mat-header-cell *matHeaderCellDef>Utilisateur</th>
                <td mat-cell *matCellDef="let ticket">
                  <div class="user-info">
                    <span class="user-name">{{ ticket.userId?.firstName }} {{ ticket.userId?.lastName }}</span>
                    <span class="user-email">{{ ticket.userId?.email }}</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let ticket">
                  <mat-chip [class]="'status-' + ticket.status">
                    {{ getStatusLabel(ticket.status) }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="messages">
                <th mat-header-cell *matHeaderCellDef>Messages</th>
                <td mat-cell *matCellDef="let ticket">
                  <span class="message-count">{{ ticket.messages?.length || 0 }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let ticket">{{ ticket.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let ticket">
                  <button mat-icon-button (click)="openTicketDetail(ticket)">
                    <mat-icon>visibility</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                  [class.unread]="row.status === 'open'"
                  (click)="openTicketDetail(row)"></tr>
            </table>

            <mat-paginator
              [length]="pagination()?.total || 0"
              [pageSize]="20"
              (page)="onPageChange($event)">
            </mat-paginator>
          } @else {
            <div class="empty-state">
              <mat-icon>support_agent</mat-icon>
              <h3>Aucun ticket</h3>
              <p>Aucun ticket ne correspond à vos critères.</p>
            </div>
          }
        </mat-card>
      }

      <!-- Ticket Detail Panel -->
      @if (selectedTicket()) {
        <div class="ticket-detail-overlay" (click)="closeTicketDetail()"></div>
        <div class="ticket-detail-panel">
          <div class="panel-header">
            <div class="panel-title">
              <h2>{{ selectedTicket()!.subject }}</h2>
              <mat-chip [class]="'status-' + selectedTicket()!.status">
                {{ getStatusLabel(selectedTicket()!.status) }}
              </mat-chip>
            </div>
            <button mat-icon-button (click)="closeTicketDetail()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="ticket-meta">
            <div class="meta-item">
              <mat-icon>person</mat-icon>
              <span>{{ selectedTicket()!.userId?.firstName }} {{ selectedTicket()!.userId?.lastName }}</span>
            </div>
            <div class="meta-item">
              <mat-icon>email</mat-icon>
              <span>{{ selectedTicket()!.userId?.email }}</span>
            </div>
            <div class="meta-item">
              <mat-icon>schedule</mat-icon>
              <span>{{ selectedTicket()!.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            @if (selectedTicket()!.orderId) {
              <div class="meta-item">
                <mat-icon>receipt</mat-icon>
                <span>Commande #{{ selectedTicket()!.orderId.orderNumber }}</span>
              </div>
            }
          </div>

          <mat-divider></mat-divider>

          <div class="messages-container">
            @for (message of selectedTicket()!.messages || []; track $index) {
              <div class="message" [class.admin-message]="message.isAdmin">
                <div class="message-header">
                  <span class="sender">{{ message.isAdmin ? 'Support' : (selectedTicket()!.userId?.firstName || 'Client') }}</span>
                  <span class="time">{{ message.createdAt | date:'dd/MM HH:mm' }}</span>
                </div>
                <p class="message-content">{{ message.content }}</p>
              </div>
            }
          </div>

          <mat-divider></mat-divider>

          <div class="reply-section">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Répondre</mat-label>
              <textarea matInput [(ngModel)]="replyMessage" rows="3" placeholder="Votre réponse..."></textarea>
            </mat-form-field>
            <div class="reply-actions">
              <mat-form-field appearance="outline">
                <mat-label>Statut</mat-label>
                <mat-select [(ngModel)]="newStatus">
                  <mat-option value="open">Ouvert</mat-option>
                  <mat-option value="in_progress">En cours</mat-option>
                  <mat-option value="resolved">Résolu</mat-option>
                  <mat-option value="closed">Fermé</mat-option>
                </mat-select>
              </mat-form-field>
              <button mat-raised-button color="primary" (click)="sendReply()" [disabled]="!replyMessage.trim()">
                <mat-icon>send</mat-icon>
                Envoyer
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .tickets-container {
      padding: 24px;
    }

    .tickets-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h1 {
        font-size: 2rem;
        margin: 0;
      }
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
        }

        &.open .stat-value { color: var(--warning); }
        &.in-progress .stat-value { color: var(--primary); }
        &.resolved .stat-value { color: var(--success); }

        .stat-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
      }
    }

    .filters-card {
      margin-bottom: 24px;
    }

    .filters-row {
      display: flex;
      gap: 16px;
    }

    .search-field {
      flex: 1;
    }

    .tickets-card {
      overflow: hidden;
    }

    table {
      width: 100%;
    }

    .priority-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;

      &.priority-high { background: var(--error); }
      &.priority-medium { background: var(--warning); }
      &.priority-low { background: var(--success); }
    }

    .ticket-subject {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .subject-text {
        font-weight: 500;
      }

      .order-ref {
        font-size: 0.85rem;
        color: var(--text-secondary);
      }
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .user-name {
        font-weight: 500;
      }

      .user-email {
        font-size: 0.85rem;
        color: var(--text-secondary);
      }
    }

    mat-chip {
      &.status-open { background: var(--warning-light) !important; color: var(--warning) !important; }
      &.status-in_progress { background: var(--primary-50) !important; color: var(--primary) !important; }
      &.status-resolved { background: var(--success-light) !important; color: var(--success) !important; }
      &.status-closed { background: var(--bg-secondary) !important; color: var(--text-secondary) !important; }
    }

    .message-count {
      background: var(--gray-200);
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.85rem;
    }

    tr.mat-mdc-row {
      cursor: pointer;

      &:hover {
        background: var(--bg-secondary);
      }

      &.unread {
        background: var(--warning-light);
      }
    }

    .empty-state {
      text-align: center;
      padding: 64px;

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

    .ticket-detail-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.3);
      z-index: 1000;
    }

    .ticket-detail-panel {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 500px;
      max-width: 100%;
      background: var(--bg-primary);
      box-shadow: -4px 0 20px rgba(0,0,0,0.15);
      z-index: 1001;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px;
      background: var(--bg-secondary);
    }

    .panel-title {
      display: flex;
      flex-direction: column;
      gap: 8px;

      h2 {
        margin: 0;
        font-size: 1.25rem;
      }
    }

    .ticket-meta {
      padding: 16px 24px;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      color: var(--text-secondary);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .message {
      background: var(--bg-secondary);
      padding: 12px 16px;
      border-radius: 12px;
      max-width: 85%;

      &.admin-message {
        background: var(--primary-50);
        align-self: flex-end;
      }
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;

      .sender {
        font-weight: 600;
        font-size: 0.9rem;
      }

      .time {
        font-size: 0.8rem;
        color: var(--text-secondary);
      }
    }

    .message-content {
      margin: 0;
      white-space: pre-wrap;
    }

    .reply-section {
      padding: 16px 24px;
      background: var(--bg-secondary);
    }

    .full-width {
      width: 100%;
    }

    .reply-actions {
      display: flex;
      gap: 16px;
      align-items: flex-start;

      mat-form-field {
        flex: 1;
      }
    }

    @media (max-width: 768px) {
      .tickets-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .filters-row {
        flex-direction: column;
      }

      .ticket-detail-panel {
        width: 100%;
      }
    }
  `]
})
export class AdminTicketsComponent implements OnInit {
  tickets = signal<any[]>([]);
  pagination = signal<any>(null);
  isLoading = signal(true);
  selectedTicket = signal<any>(null);

  openCount = signal(0);
  inProgressCount = signal(0);
  resolvedCount = signal(0);

  displayedColumns = ['priority', 'subject', 'user', 'status', 'messages', 'date', 'actions'];

  searchQuery = '';
  selectedStatus: string | null = null;
  selectedPriority: string | null = null;

  replyMessage = '';
  newStatus = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadTickets();
    this.loadStats();
  }

  loadStats(): void {
    this.http.get<any>(`${environment.apiUrl}/admin/tickets/stats`).subscribe({
      next: (response) => {
        if (response.success) {
          this.openCount.set(response.data.open || 0);
          this.inProgressCount.set(response.data.inProgress || 0);
          this.resolvedCount.set(response.data.resolved || 0);
        }
      }
    });
  }

  loadTickets(page = 1): void {
    this.isLoading.set(true);
    const params: any = { page, limit: 20 };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedStatus) params.status = this.selectedStatus;
    if (this.selectedPriority) params.priority = this.selectedPriority;

    this.http.get<any>(`${environment.apiUrl}/admin/tickets`, { params }).subscribe({
      next: (response) => {
        if (response.success) {
          this.tickets.set(response.data.tickets);
          this.pagination.set(response.data.pagination);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      open: 'Ouvert',
      in_progress: 'En cours',
      resolved: 'Résolu',
      closed: 'Fermé'
    };
    return labels[status] || status;
  }

  openTicketDetail(ticket: any): void {
    this.selectedTicket.set(ticket);
    this.newStatus = ticket.status;
    this.replyMessage = '';
  }

  closeTicketDetail(): void {
    this.selectedTicket.set(null);
  }

  sendReply(): void {
    if (!this.replyMessage.trim() || !this.selectedTicket()) return;

    const ticketId = this.selectedTicket()!._id;
    this.http.post<any>(`${environment.apiUrl}/admin/tickets/${ticketId}/reply`, {
      content: this.replyMessage,
      status: this.newStatus
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.selectedTicket.set(response.data.ticket);
          this.replyMessage = '';
          this.loadTickets();
          this.loadStats();
        }
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.loadTickets(event.pageIndex + 1);
  }
}
