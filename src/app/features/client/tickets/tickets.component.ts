import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { LoadingComponent } from '@shared/components/loading/loading.component';

interface Ticket {
  _id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  messages: { content: string; senderRole: string; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    LoadingComponent
  ],
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss'],})
export class TicketsComponent implements OnInit {
  tickets = signal<Ticket[]>([]);
  selectedTicket = signal<Ticket | null>(null);
  showNewForm = signal(false);
  isLoading = signal(true);
  isSubmitting = signal(false);
  isSendingReply = signal(false);

  ticketForm: FormGroup;
  replyForm: FormGroup;
  orderId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.ticketForm = this.fb.group({
      category: ['other'],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });

    this.replyForm = this.fb.group({
      reply: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.orderId = params['orderId'] || null;
      if (params['new'] === 'true' || this.orderId) {
        this.showNewForm.set(true);
        if (this.orderId) {
          this.ticketForm.patchValue({ category: 'order' });
        }
      }
    });

    this.loadTickets();
  }

  loadTickets(): void {
    this.isLoading.set(true);

    this.http.get<any>(`${environment.apiUrl}/client/tickets`).subscribe({
      next: (response) => {
        if (response.success) {
          this.tickets.set(response.data.tickets);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  submitTicket(): void {
    if (this.ticketForm.invalid) return;

    this.isSubmitting.set(true);

    const data = {
      ...this.ticketForm.value,
      orderId: this.orderId
    };

    this.http.post<any>(`${environment.apiUrl}/client/tickets`, data).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        if (response.success) {
          this.ticketForm.reset({ category: 'other' });
          this.orderId = null;
          this.showNewForm.set(false);
          this.loadTickets();
        }
      },
      error: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  cancelNewTicket(): void {
    this.ticketForm.reset({ category: 'other' });
    this.orderId = null;
    this.showNewForm.set(false);
  }

  selectTicket(ticket: Ticket): void {
    this.selectedTicket.set(ticket);
  }

  sendReply(): void {
    if (this.replyForm.invalid || !this.selectedTicket()) return;

    this.isSendingReply.set(true);

    this.http.post<any>(`${environment.apiUrl}/client/tickets/${this.selectedTicket()!._id}/reply`, {
      content: this.replyForm.get('reply')?.value
    }).subscribe({
      next: (response) => {
        this.isSendingReply.set(false);
        if (response.success) {
          this.replyForm.reset();
          // Update ticket in list
          const updatedTicket = response.data.ticket;
          this.selectedTicket.set(updatedTicket);
          this.tickets.update(tickets =>
            tickets.map(t => t._id === updatedTicket._id ? updatedTicket : t)
          );
        }
      },
      error: () => {
        this.isSendingReply.set(false);
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      open: 'Ouvert',
      in_progress: 'En cours',
      waiting_customer: 'En attente',
      waiting_shop: 'En attente boutique',
      resolved: 'Résolu',
      closed: 'Fermé'
    };
    return labels[status] || status;
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      order: 'Commande',
      product: 'Produit',
      payment: 'Paiement',
      delivery: 'Livraison',
      refund: 'Remboursement',
      other: 'Autre'
    };
    return labels[category] || category;
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      order: 'receipt',
      product: 'inventory_2',
      payment: 'payment',
      delivery: 'local_shipping',
      refund: 'currency_exchange',
      other: 'help'
    };
    return icons[category] || 'help';
  }
}


