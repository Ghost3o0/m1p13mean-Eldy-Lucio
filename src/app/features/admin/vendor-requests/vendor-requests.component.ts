import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { LoadingComponent } from '@shared/components/loading/loading.component';

interface VendorRequest {
  _id: string;
  requestNumber: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  shopInfo: {
    name: string;
    description?: string;
    category?: { _id: string; name: string };
  };
  professionalContact: {
    phone: string;
    email?: string;
  };
  businessInfo: {
    registrationNumber: string;
    registrationType: string;
  };
  commercialAddress: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  documents: {
    idDocument?: { filename: string; path: string };
    businessDocument?: { filename: string; path: string };
    additionalDocuments: { filename: string; path: string; label?: string }[];
  };
  messages: {
    _id: string;
    senderId: { _id: string; firstName: string; lastName: string };
    senderRole: 'client' | 'admin';
    content: string;
    createdAt: string;
  }[];
  status: string;
  assignedTo?: { _id: string; firstName: string; lastName: string };
  resolution?: { resolvedBy: any; resolvedAt: string; note: string };
  shopId?: { _id: string; name: string };
  createdAt: string;
}

@Component({
  selector: 'app-admin-vendor-requests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
    MatProgressSpinnerModule,
    LoadingComponent
  ],
  template: `
    <div class="vendor-requests-container">
      <div class="page-header">
        <h1>Demandes vendeur</h1>
        <div class="header-stats">
          <div class="stat pending">
            <span class="stat-value">{{ stats()?.pending || 0 }}</span>
            <span class="stat-label">En attente</span>
          </div>
          <div class="stat review">
            <span class="stat-value">{{ stats()?.underReview || 0 }}</span>
            <span class="stat-label">En examen</span>
          </div>
          <div class="stat docs">
            <span class="stat-value">{{ stats()?.documentsRequested || 0 }}</span>
            <span class="stat-label">Docs requis</span>
          </div>
        </div>
      </div>

      <mat-tab-group (selectedTabChange)="onTabChange($event.index)">
        <mat-tab label="Toutes"></mat-tab>
        <mat-tab label="En attente"></mat-tab>
        <mat-tab label="En examen"></mat-tab>
        <mat-tab label="Docs requis"></mat-tab>
        <mat-tab label="Traitees"></mat-tab>
      </mat-tab-group>

      <!-- Search -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Rechercher</mat-label>
              <input matInput [(ngModel)]="searchQuery" (keyup.enter)="loadRequests()" placeholder="Nom, email, SIRET...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
            <button mat-icon-button (click)="searchQuery = ''; loadRequests()">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      @if (isLoading()) {
        <app-loading message="Chargement des demandes..."></app-loading>
      } @else {
        <mat-card class="table-card">
          <table mat-table [dataSource]="requests()">
            <!-- Request Number -->
            <ng-container matColumnDef="number">
              <th mat-header-cell *matHeaderCellDef>N Demande</th>
              <td mat-cell *matCellDef="let request">
                <span class="request-number">{{ request.requestNumber }}</span>
              </td>
            </ng-container>

            <!-- User -->
            <ng-container matColumnDef="user">
              <th mat-header-cell *matHeaderCellDef>Demandeur</th>
              <td mat-cell *matCellDef="let request">
                <div class="user-cell">
                  <span class="name">{{ request.userId.firstName }} {{ request.userId.lastName }}</span>
                  <span class="email">{{ request.userId.email }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Shop Name -->
            <ng-container matColumnDef="shop">
              <th mat-header-cell *matHeaderCellDef>Boutique</th>
              <td mat-cell *matCellDef="let request">
                <span class="shop-name">{{ request.shopInfo.name }}</span>
              </td>
            </ng-container>

            <!-- Business Number -->
            <ng-container matColumnDef="business">
              <th mat-header-cell *matHeaderCellDef>Immatriculation</th>
              <td mat-cell *matCellDef="let request">
                <span class="business-number">{{ request.businessInfo.registrationNumber }}</span>
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
                  <button mat-menu-item (click)="openDetail(request)">
                    <mat-icon>visibility</mat-icon>
                    <span>Voir les details</span>
                  </button>
                  <mat-divider></mat-divider>
                  @if (request.status === 'pending' || request.status === 'under_review') {
                    <button mat-menu-item (click)="quickAction(request, 'approved')">
                      <mat-icon>check_circle</mat-icon>
                      <span>Approuver</span>
                    </button>
                    <button mat-menu-item (click)="openRequestDocs(request)">
                      <mat-icon>description</mat-icon>
                      <span>Demander des documents</span>
                    </button>
                    <button mat-menu-item (click)="quickAction(request, 'rejected')">
                      <mat-icon>cancel</mat-icon>
                      <span>Rejeter</span>
                    </button>
                  }
                  @if (request.status === 'documents_requested') {
                    <button mat-menu-item (click)="quickAction(request, 'approved')">
                      <mat-icon>check_circle</mat-icon>
                      <span>Approuver</span>
                    </button>
                  }
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="request-row" (click)="openDetail(row)"></tr>
          </table>

          @if (requests().length === 0) {
            <div class="empty-state">
              <mat-icon>assignment</mat-icon>
              <h3>Aucune demande</h3>
              <p>Aucune demande vendeur ne correspond a vos criteres.</p>
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

      <!-- Detail Modal -->
      @if (selectedRequest()) {
        <div class="modal-overlay" (click)="closeDetail()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <span class="request-number">#{{ selectedRequest()!.requestNumber }}</span>
                <h2>{{ selectedRequest()!.shopInfo.name }}</h2>
              </div>
              <div class="header-actions">
                <mat-chip [class]="'status-' + selectedRequest()!.status">
                  {{ getStatusLabel(selectedRequest()!.status) }}
                </mat-chip>
                <button mat-icon-button (click)="closeDetail()">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            </div>

            <div class="modal-body">
              <div class="details-grid">
                <div class="detail-section">
                  <h4>Demandeur</h4>
                  <p><strong>{{ selectedRequest()!.userId.firstName }} {{ selectedRequest()!.userId.lastName }}</strong></p>
                  <p><mat-icon>email</mat-icon> {{ selectedRequest()!.userId.email }}</p>
                  @if (selectedRequest()!.userId.phone) {
                    <p><mat-icon>phone</mat-icon> {{ selectedRequest()!.userId.phone }}</p>
                  }
                </div>

                <div class="detail-section">
                  <h4>Contact pro</h4>
                  <p><mat-icon>phone</mat-icon> {{ selectedRequest()!.professionalContact.phone }}</p>
                  @if (selectedRequest()!.professionalContact.email) {
                    <p><mat-icon>email</mat-icon> {{ selectedRequest()!.professionalContact.email }}</p>
                  }
                </div>

                <div class="detail-section">
                  <h4>Entreprise</h4>
                  <p><strong>{{ getRegistrationTypeLabel(selectedRequest()!.businessInfo.registrationType) }}:</strong></p>
                  <p>{{ selectedRequest()!.businessInfo.registrationNumber }}</p>
                </div>

                <div class="detail-section">
                  <h4>Adresse</h4>
                  <p>{{ selectedRequest()!.commercialAddress.street }}</p>
                  <p>{{ selectedRequest()!.commercialAddress.zipCode }} {{ selectedRequest()!.commercialAddress.city }}</p>
                </div>
              </div>

              @if (selectedRequest()!.shopInfo.description) {
                <div class="description-section">
                  <h4>Description de la boutique</h4>
                  <p>{{ selectedRequest()!.shopInfo.description }}</p>
                </div>
              }

              <!-- Documents -->
              <div class="documents-section">
                <h4>Documents</h4>
                <div class="documents-list">
                  @if (selectedRequest()!.documents.idDocument) {
                    <a class="document-item" [href]="selectedRequest()!.documents.idDocument!.path" target="_blank">
                      <mat-icon>description</mat-icon>
                      <span>Piece d'identite</span>
                      <mat-icon>open_in_new</mat-icon>
                    </a>
                  }
                  @if (selectedRequest()!.documents.businessDocument) {
                    <a class="document-item" [href]="selectedRequest()!.documents.businessDocument!.path" target="_blank">
                      <mat-icon>description</mat-icon>
                      <span>Document entreprise</span>
                      <mat-icon>open_in_new</mat-icon>
                    </a>
                  }
                  @for (doc of selectedRequest()!.documents.additionalDocuments; track doc.filename) {
                    <a class="document-item" [href]="doc.path" target="_blank">
                      <mat-icon>description</mat-icon>
                      <span>{{ doc.label || 'Document supplementaire' }}</span>
                      <mat-icon>open_in_new</mat-icon>
                    </a>
                  }
                </div>
              </div>

              <!-- Messages -->
              <div class="messages-section">
                <h4>Echanges</h4>
                @if (selectedRequest()!.messages.length === 0) {
                  <p class="no-messages">Aucun message</p>
                } @else {
                  <div class="messages-list">
                    @for (message of selectedRequest()!.messages; track message._id) {
                      <div class="message" [class.admin]="message.senderRole === 'admin'">
                        <div class="message-bubble">
                          <p>{{ message.content }}</p>
                          <span class="time">{{ message.createdAt | date:'dd/MM HH:mm' }}</span>
                        </div>
                        <span class="sender">{{ message.senderRole === 'admin' ? 'Admin' : 'Client' }}</span>
                      </div>
                    }
                  </div>
                }

                @if (selectedRequest()!.status !== 'approved' && selectedRequest()!.status !== 'rejected') {
                  <form [formGroup]="messageForm" (ngSubmit)="sendMessage()" class="message-form">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Votre message</mat-label>
                      <textarea matInput formControlName="content" rows="2"></textarea>
                    </mat-form-field>
                    <button mat-raised-button color="primary" type="submit" [disabled]="messageForm.invalid || isSendingMessage()">
                      @if (isSendingMessage()) {
                        <mat-spinner diameter="20"></mat-spinner>
                      } @else {
                        <mat-icon>send</mat-icon>
                      }
                    </button>
                  </form>
                }
              </div>
            </div>

            @if (selectedRequest()!.status !== 'approved' && selectedRequest()!.status !== 'rejected') {
              <div class="modal-footer">
                <button mat-stroked-button color="warn" (click)="updateStatus('rejected')">
                  <mat-icon>cancel</mat-icon>
                  Rejeter
                </button>
                <button mat-stroked-button (click)="openRequestDocs(selectedRequest()!)">
                  <mat-icon>description</mat-icon>
                  Demander docs
                </button>
                <button mat-raised-button color="primary" (click)="updateStatus('approved')">
                  <mat-icon>check_circle</mat-icon>
                  Approuver
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Request Docs Modal -->
      @if (showRequestDocsModal()) {
        <div class="modal-overlay" (click)="showRequestDocsModal.set(false)">
          <div class="modal-content small" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Demander des documents</h2>
              <button mat-icon-button (click)="showRequestDocsModal.set(false)">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            <div class="modal-body">
              <p>Expliquez quels documents supplementaires vous avez besoin:</p>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Message</mat-label>
                <textarea matInput [(ngModel)]="requestDocsMessage" rows="4" placeholder="Veuillez nous fournir..."></textarea>
              </mat-form-field>
            </div>
            <div class="modal-footer">
              <button mat-button (click)="showRequestDocsModal.set(false)">Annuler</button>
              <button mat-raised-button color="primary" [disabled]="!requestDocsMessage" (click)="sendDocRequest()">
                Envoyer la demande
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .vendor-requests-container {
      padding: 24px;
    }

    .page-header {
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

        &.pending .stat-value { color: var(--warning); }
        &.review .stat-value { color: var(--primary); }
        &.docs .stat-value { color: var(--secondary); }

        .stat-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
      }
    }

    mat-tab-group {
      margin-bottom: 24px;
    }

    .filters-card {
      margin-bottom: 24px;
    }

    .filters-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;

      .search-field {
        flex: 1;
        min-width: 250px;
      }
    }

    .table-card {
      overflow: hidden;
    }

    table {
      width: 100%;
    }

    .request-number {
      font-family: monospace;
      color: var(--primary);
      font-weight: 500;
    }

    .user-cell {
      display: flex;
      flex-direction: column;

      .name {
        font-weight: 500;
      }

      .email {
        font-size: 0.85rem;
        color: var(--text-secondary);
      }
    }

    .shop-name {
      font-weight: 500;
    }

    .business-number {
      font-family: monospace;
      font-size: 0.9rem;
    }

    mat-chip {
      &.status-pending {
        background: var(--warning-light) !important;
        color: var(--warning) !important;
      }
      &.status-under_review {
        background: var(--primary-50) !important;
        color: var(--primary) !important;
      }
      &.status-documents_requested {
        background: var(--secondary-light) !important;
        color: var(--secondary) !important;
      }
      &.status-approved {
        background: var(--success-light) !important;
        color: var(--success) !important;
      }
      &.status-rejected {
        background: var(--bg-secondary) !important;
        color: var(--text-secondary) !important;
      }
    }

    .request-row {
      cursor: pointer;

      &:hover {
        background: var(--bg-secondary);
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

      h3 { margin: 16px 0 8px; }
      p { color: var(--text-secondary); }
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 24px;
    }

    .modal-content {
      background: var(--bg-primary);
      border-radius: 16px;
      width: 100%;
      max-width: 800px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      &.small {
        max-width: 500px;
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color);

      .request-number {
        font-size: 0.85rem;
      }

      h2 {
        margin: 4px 0 0;
        font-size: 1.25rem;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid var(--border-color);
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    .detail-section {
      h4 {
        font-size: 0.8rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        margin: 0 0 8px;
      }

      p {
        margin: 4px 0;
        display: flex;
        align-items: center;
        gap: 8px;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          color: var(--primary);
        }
      }
    }

    .description-section {
      background: var(--bg-secondary);
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;

      h4 {
        margin: 0 0 8px;
        color: var(--text-primary);
      }

      p {
        margin: 0;
        color: var(--text-secondary);
        line-height: 1.6;
      }
    }

    .documents-section {
      margin-bottom: 24px;

      h4 {
        margin: 0 0 12px;
      }
    }

    .documents-list {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .document-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: var(--bg-secondary);
      border-radius: 8px;
      text-decoration: none;
      color: var(--text-primary);
      transition: all 0.2s;

      &:hover {
        background: var(--gray-200);
      }

      mat-icon:first-child {
        color: var(--primary);
      }

      mat-icon:last-child {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: var(--text-secondary);
      }
    }

    .messages-section {
      h4 {
        margin: 0 0 12px;
      }

      .no-messages {
        color: var(--text-secondary);
        text-align: center;
        padding: 24px;
      }
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 300px;
      overflow-y: auto;
      padding: 8px 0;
      margin-bottom: 16px;
    }

    .message {
      display: flex;
      flex-direction: column;
      align-items: flex-start;

      &.admin {
        align-items: flex-end;

        .message-bubble {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: white;

          .time { color: rgba(255, 255, 255, 0.7); }
        }
      }
    }

    .message-bubble {
      max-width: 80%;
      padding: 10px 14px;
      background: var(--bg-secondary);
      border-radius: 12px;

      p { margin: 0 0 4px; }
      .time { font-size: 0.75rem; color: var(--text-secondary); }
    }

    .sender {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    .message-form {
      display: flex;
      gap: 12px;
      align-items: flex-end;

      mat-form-field { flex: 1; }
    }

    .full-width {
      width: 100%;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .details-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminVendorRequestsComponent implements OnInit {
  requests = signal<VendorRequest[]>([]);
  stats = signal<any>(null);
  pagination = signal<any>(null);
  isLoading = signal(true);
  isSendingMessage = signal(false);

  selectedRequest = signal<VendorRequest | null>(null);
  showRequestDocsModal = signal(false);
  requestDocsMessage = '';
  requestForDocs: VendorRequest | null = null;

  messageForm: FormGroup;

  displayedColumns = ['number', 'user', 'shop', 'business', 'status', 'date', 'actions'];

  searchQuery = '';
  currentTab = 0;

  private statusFilters = [undefined, 'pending', 'under_review', 'documents_requested', 'approved,rejected'];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.messageForm = this.fb.group({
      content: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadStats();
    this.loadRequests();
  }

  loadStats(): void {
    this.http.get<any>(`${environment.apiUrl}/admin/vendor-requests/stats`).subscribe({
      next: (response) => {
        if (response.success) {
          this.stats.set(response.data.stats);
        }
      }
    });
  }

  loadRequests(page = 1): void {
    this.isLoading.set(true);

    const params: any = { page, limit: 20 };
    if (this.searchQuery) params.search = this.searchQuery;
    const statusFilter = this.statusFilters[this.currentTab];
    if (statusFilter) params.status = statusFilter;

    this.http.get<any>(`${environment.apiUrl}/admin/vendor-requests`, { params }).subscribe({
      next: (response) => {
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

  onTabChange(index: number): void {
    this.currentTab = index;
    this.loadRequests();
  }

  onPageChange(event: PageEvent): void {
    this.loadRequests(event.pageIndex + 1);
  }

  openDetail(request: VendorRequest): void {
    this.selectedRequest.set(request);
  }

  closeDetail(): void {
    this.selectedRequest.set(null);
    this.messageForm.reset();
  }

  openRequestDocs(request: VendorRequest): void {
    this.requestForDocs = request;
    this.requestDocsMessage = '';
    this.showRequestDocsModal.set(true);
  }

  sendDocRequest(): void {
    if (!this.requestForDocs || !this.requestDocsMessage) return;

    this.http.put<any>(`${environment.apiUrl}/admin/vendor-requests/${this.requestForDocs._id}/status`, {
      status: 'documents_requested',
      message: this.requestDocsMessage
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.showRequestDocsModal.set(false);
          this.loadRequests();
          this.loadStats();
          if (this.selectedRequest()?._id === this.requestForDocs?._id) {
            this.selectedRequest.set(response.data.vendorRequest);
          }
        }
      }
    });
  }

  quickAction(request: VendorRequest, status: string): void {
    const messages: Record<string, string> = {
      approved: 'Voulez-vous approuver cette demande ?',
      rejected: 'Voulez-vous rejeter cette demande ?'
    };

    if (!confirm(messages[status])) return;

    this.http.put<any>(`${environment.apiUrl}/admin/vendor-requests/${request._id}/status`, {
      status
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadRequests();
          this.loadStats();
        }
      }
    });
  }

  updateStatus(status: string): void {
    if (!this.selectedRequest()) return;

    const messages: Record<string, string> = {
      approved: 'Voulez-vous approuver cette demande ? Une boutique sera creee.',
      rejected: 'Voulez-vous rejeter cette demande ?'
    };

    if (!confirm(messages[status])) return;

    this.http.put<any>(`${environment.apiUrl}/admin/vendor-requests/${this.selectedRequest()!._id}/status`, {
      status
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.selectedRequest.set(response.data.vendorRequest);
          this.loadRequests();
          this.loadStats();
        }
      }
    });
  }

  sendMessage(): void {
    if (this.messageForm.invalid || !this.selectedRequest()) return;

    this.isSendingMessage.set(true);

    this.http.post<any>(`${environment.apiUrl}/admin/vendor-requests/${this.selectedRequest()!._id}/message`, {
      content: this.messageForm.get('content')?.value
    }).subscribe({
      next: (response) => {
        this.isSendingMessage.set(false);
        if (response.success) {
          this.messageForm.reset();
          this.selectedRequest.set(response.data.vendorRequest);
        }
      },
      error: () => {
        this.isSendingMessage.set(false);
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      under_review: 'En examen',
      documents_requested: 'Docs requis',
      approved: 'Approuvee',
      rejected: 'Rejetee'
    };
    return labels[status] || status;
  }

  getRegistrationTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      siret: 'SIRET',
      rc: 'Registre du Commerce',
      other: 'Autre'
    };
    return labels[type] || type;
  }
}
