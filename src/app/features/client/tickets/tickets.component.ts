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
  template: `
    <div class="tickets-page">
      <div class="page-header">
        <h1>{{ showNewForm() ? 'Nouveau ticket' : 'Mes tickets' }}</h1>
        @if (!showNewForm()) {
          <button mat-raised-button color="primary" (click)="showNewForm.set(true)">
            <mat-icon>add</mat-icon>
            Nouveau ticket
          </button>
        }
      </div>

      @if (showNewForm()) {
        <mat-card class="new-ticket-card">
          <mat-card-header>
            <mat-card-title>Créer un nouveau ticket</mat-card-title>
            <mat-card-subtitle>Décrivez votre problème et notre équipe vous répondra rapidement</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="ticketForm" (ngSubmit)="submitTicket()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Catégorie</mat-label>
                <mat-select formControlName="category">
                  <mat-option value="order">Commande</mat-option>
                  <mat-option value="product">Produit</mat-option>
                  <mat-option value="payment">Paiement</mat-option>
                  <mat-option value="delivery">Livraison</mat-option>
                  <mat-option value="refund">Remboursement</mat-option>
                  <mat-option value="other">Autre</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Sujet</mat-label>
                <input matInput formControlName="subject" placeholder="Décrivez brièvement votre problème">
                @if (ticketForm.get('subject')?.hasError('required') && ticketForm.get('subject')?.touched) {
                  <mat-error>Le sujet est requis</mat-error>
                }
              </mat-form-field>

              @if (orderId) {
                <div class="order-reference">
                  <mat-icon>receipt</mat-icon>
                  <span>Commande référencée: {{ orderId }}</span>
                </div>
              }

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Message</mat-label>
                <textarea matInput formControlName="message" rows="6" placeholder="Décrivez votre problème en détail..."></textarea>
                @if (ticketForm.get('message')?.hasError('required') && ticketForm.get('message')?.touched) {
                  <mat-error>Le message est requis</mat-error>
                }
              </mat-form-field>

              <div class="form-actions">
                <button mat-button type="button" (click)="cancelNewTicket()">Annuler</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="ticketForm.invalid || isSubmitting()">
                  @if (isSubmitting()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    Envoyer le ticket
                  }
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      @if (!showNewForm()) {
        @if (isLoading()) {
          <app-loading message="Chargement des tickets..."></app-loading>
        } @else {
          @if (tickets().length === 0) {
            <div class="empty-state">
              <mat-icon>support_agent</mat-icon>
              <h2>Aucun ticket</h2>
              <p>Vous n'avez pas encore créé de ticket de support.</p>
              <button mat-raised-button color="primary" (click)="showNewForm.set(true)">
                <mat-icon>add</mat-icon>
                Créer un ticket
              </button>
            </div>
          } @else {
            <div class="tickets-list">
              @for (ticket of tickets(); track ticket._id) {
                <mat-card class="ticket-card" (click)="selectTicket(ticket)">
                  <div class="ticket-header">
                    <div class="ticket-info">
                      <span class="ticket-number">#{{ ticket.ticketNumber }}</span>
                      <h3 class="ticket-subject">{{ ticket.subject }}</h3>
                    </div>
                    <mat-chip [class]="'status-' + ticket.status">
                      {{ getStatusLabel(ticket.status) }}
                    </mat-chip>
                  </div>
                  <div class="ticket-meta">
                    <span class="category">
                      <mat-icon>{{ getCategoryIcon(ticket.category) }}</mat-icon>
                      {{ getCategoryLabel(ticket.category) }}
                    </span>
                    <span class="date">{{ ticket.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                  @if (ticket.messages.length > 0) {
                    <p class="ticket-preview">{{ ticket.messages[ticket.messages.length - 1].content | slice:0:100 }}...</p>
                  }
                </mat-card>
              }
            </div>
          }
        }
      }

      <!-- Ticket Detail Dialog -->
      @if (selectedTicket()) {
        <div class="ticket-detail-overlay" (click)="selectedTicket.set(null)">
          <div class="ticket-detail-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <span class="ticket-number">#{{ selectedTicket()!.ticketNumber }}</span>
                <h2>{{ selectedTicket()!.subject }}</h2>
              </div>
              <button mat-icon-button (click)="selectedTicket.set(null)">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="modal-content">
              <div class="messages-list">
                @for (message of selectedTicket()!.messages; track message.createdAt) {
                  <div class="message" [class.own]="message.senderRole === 'client'">
                    <div class="message-bubble">
                      <p>{{ message.content }}</p>
                      <span class="message-time">{{ message.createdAt | date:'dd/MM HH:mm' }}</span>
                    </div>
                    <span class="sender">{{ message.senderRole === 'client' ? 'Vous' : 'Support' }}</span>
                  </div>
                }
              </div>

              @if (selectedTicket()!.status !== 'closed' && selectedTicket()!.status !== 'resolved') {
                <form [formGroup]="replyForm" (ngSubmit)="sendReply()" class="reply-form">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Votre réponse</mat-label>
                    <textarea matInput formControlName="reply" rows="3" placeholder="Tapez votre message..."></textarea>
                  </mat-form-field>
                  <button mat-raised-button color="primary" type="submit" [disabled]="replyForm.invalid || isSendingReply()">
                    @if (isSendingReply()) {
                      <mat-spinner diameter="20"></mat-spinner>
                    } @else {
                      <mat-icon>send</mat-icon>
                      Envoyer
                    }
                  </button>
                </form>
              } @else {
                <div class="ticket-closed">
                  <mat-icon>check_circle</mat-icon>
                  <span>Ce ticket est fermé</span>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .tickets-page {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #1a1a2e;
        margin: 0;
      }
    }

    .new-ticket-card {
      padding: 8px;
      margin-bottom: 24px;

      mat-card-header {
        margin-bottom: 16px;
      }
    }

    .full-width {
      width: 100%;
    }

    .order-reference {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #f0f2ff;
      border-radius: 8px;
      margin-bottom: 16px;
      color: #667eea;
      font-weight: 500;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
    }

    .empty-state {
      text-align: center;
      padding: 80px 24px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      mat-icon {
        font-size: 80px;
        width: 80px;
        height: 80px;
        color: #ddd;
      }

      h2 {
        font-size: 1.5rem;
        color: #333;
        margin: 16px 0 8px;
      }

      p {
        color: #666;
        margin-bottom: 24px;
      }
    }

    .tickets-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .ticket-card {
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
      }
    }

    .ticket-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .ticket-info {
      .ticket-number {
        font-size: 0.8rem;
        color: #667eea;
        font-weight: 500;
      }

      .ticket-subject {
        font-size: 1.1rem;
        font-weight: 600;
        color: #1a1a2e;
        margin: 4px 0 0;
      }
    }

    mat-chip {
      &.status-open {
        background: #fff3e0 !important;
        color: #e65100 !important;
      }

      &.status-in_progress {
        background: #e3f2fd !important;
        color: #1565c0 !important;
      }

      &.status-waiting_customer {
        background: #fce4ec !important;
        color: #c2185b !important;
      }

      &.status-resolved, &.status-closed {
        background: #e8f5e9 !important;
        color: #2e7d32 !important;
      }
    }

    .ticket-meta {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 12px;
      font-size: 0.9rem;
      color: #666;

      .category {
        display: flex;
        align-items: center;
        gap: 4px;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }

    .ticket-preview {
      color: #666;
      font-size: 0.9rem;
      margin: 0;
      line-height: 1.5;
    }

    /* Modal */
    .ticket-detail-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 24px;
    }

    .ticket-detail-modal {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 600px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px 24px;
      border-bottom: 1px solid #f0f0f0;

      .ticket-number {
        font-size: 0.8rem;
        color: #667eea;
      }

      h2 {
        font-size: 1.25rem;
        margin: 4px 0 0;
        color: #1a1a2e;
      }
    }

    .modal-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }

    .message {
      display: flex;
      flex-direction: column;
      align-items: flex-start;

      &.own {
        align-items: flex-end;

        .message-bubble {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;

          .message-time {
            color: rgba(255, 255, 255, 0.7);
          }
        }
      }
    }

    .message-bubble {
      max-width: 80%;
      padding: 12px 16px;
      background: #f0f0f0;
      border-radius: 12px;

      p {
        margin: 0 0 4px;
        line-height: 1.5;
      }

      .message-time {
        font-size: 0.75rem;
        color: #999;
      }
    }

    .sender {
      font-size: 0.75rem;
      color: #999;
      margin-top: 4px;
    }

    .reply-form {
      display: flex;
      gap: 12px;
      align-items: flex-end;
      border-top: 1px solid #f0f0f0;
      padding-top: 16px;

      mat-form-field {
        flex: 1;
      }
    }

    .ticket-closed {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 16px;
      background: #e8f5e9;
      border-radius: 8px;
      color: #2e7d32;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    @media (max-width: 768px) {
      .tickets-page {
        padding: 16px;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;

        h1 {
          font-size: 1.5rem;
        }
      }

      .ticket-detail-modal {
        max-height: 90vh;
      }
    }
  `]
})
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
