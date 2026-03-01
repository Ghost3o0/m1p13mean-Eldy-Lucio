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
  templateUrl: './vendor-requests.component.html',
  styleUrls: ['./vendor-requests.component.scss']
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
