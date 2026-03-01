import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { VendorRequestService, VendorRequest, VendorRequestData } from '@shared/services/vendor-request.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';

interface Category {
  _id: string;
  name: string;
}

@Component({
  selector: 'app-vendor-request',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    LoadingComponent
  ],
  templateUrl: './vendor-request.component.html',
  styleUrls: ['./vendor-request.component.scss'],})
export class VendorRequestComponent implements OnInit {
  isLoading = signal(true);
  isSubmitting = signal(false);
  isSendingMessage = signal(false);
  existingRequest = signal<VendorRequest | null>(null);
  categories = signal<Category[]>([]);

  // Form groups
  shopInfoForm: FormGroup;
  contactForm: FormGroup;
  businessForm: FormGroup;
  documentsForm: FormGroup;
  messageForm: FormGroup;

  // File uploads
  idDocumentFile = signal<File | null>(null);
  businessDocumentFile = signal<File | null>(null);

  acceptTerms = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private vendorRequestService: VendorRequestService,
    private router: Router
  ) {
    this.shopInfoForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      category: ['']
    });

    this.contactForm = this.fb.group({
      phone: ['', Validators.required],
      email: ['', Validators.email]
    });

    this.businessForm = this.fb.group({
      registrationType: ['siret'],
      registrationNumber: ['', Validators.required],
      street: ['', Validators.required],
      city: ['', Validators.required],
      zipCode: ['', Validators.required]
    });

    this.documentsForm = this.fb.group({});

    this.messageForm = this.fb.group({
      content: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    // Load categories
    this.http.get<any>(`${environment.apiUrl}/products/categories`).subscribe({
      next: (response) => {
        if (response.success) {
          this.categories.set(response.data.categories);
        }
      }
    });

    // Check for existing request
    this.vendorRequestService.getMyRequest().subscribe({
      next: (response) => {
        if (response.success) {
          this.existingRequest.set(response.data.vendorRequest);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onIdDocumentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.idDocumentFile.set(input.files[0]);
    }
  }

  removeIdDocument(): void {
    this.idDocumentFile.set(null);
  }

  onBusinessDocumentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.businessDocumentFile.set(input.files[0]);
    }
  }

  removeBusinessDocument(): void {
    this.businessDocumentFile.set(null);
  }

  submitRequest(): void {
    if (!this.acceptTerms || !this.idDocumentFile()) return;

    this.isSubmitting.set(true);

    const data: VendorRequestData = {
      shopInfo: {
        name: this.shopInfoForm.get('name')?.value,
        description: this.shopInfoForm.get('description')?.value,
        category: this.shopInfoForm.get('category')?.value
      },
      professionalContact: {
        phone: this.contactForm.get('phone')?.value,
        email: this.contactForm.get('email')?.value
      },
      businessInfo: {
        registrationNumber: this.businessForm.get('registrationNumber')?.value,
        registrationType: this.businessForm.get('registrationType')?.value
      },
      commercialAddress: {
        street: this.businessForm.get('street')?.value,
        city: this.businessForm.get('city')?.value,
        zipCode: this.businessForm.get('zipCode')?.value
      }
    };

    const formData = this.vendorRequestService.createFormData(
      data,
      this.idDocumentFile()!,
      this.businessDocumentFile() || undefined
    );

    this.vendorRequestService.submitRequest(formData).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        if (response.success) {
          this.existingRequest.set(response.data.vendorRequest);
        }
      },
      error: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  sendMessage(): void {
    if (this.messageForm.invalid || !this.existingRequest()) return;

    this.isSendingMessage.set(true);

    this.vendorRequestService.sendMessage(
      this.existingRequest()!._id,
      this.messageForm.get('content')?.value
    ).subscribe({
      next: (response) => {
        this.isSendingMessage.set(false);
        if (response.success) {
          this.messageForm.reset();
          this.existingRequest.set(response.data.vendorRequest);
        }
      },
      error: () => {
        this.isSendingMessage.set(false);
      }
    });
  }

  cancelRequest(): void {
    if (!this.existingRequest()) return;

    if (confirm('Etes-vous sur de vouloir annuler votre demande ?')) {
      this.vendorRequestService.cancelRequest(this.existingRequest()!._id).subscribe({
        next: (response) => {
          if (response.success) {
            this.existingRequest.set(null);
          }
        }
      });
    }
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      under_review: 'En cours d\'examen',
      documents_requested: 'Documents requis',
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

  isStatusReached(status: string): boolean {
    const order = ['pending', 'under_review', 'approved'];
    const currentIndex = order.indexOf(this.existingRequest()?.status || '');
    const statusIndex = order.indexOf(status);

    if (this.existingRequest()?.status === 'documents_requested') {
      return statusIndex <= 1;
    }

    return statusIndex <= currentIndex;
  }
}


