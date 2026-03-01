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
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss']
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
