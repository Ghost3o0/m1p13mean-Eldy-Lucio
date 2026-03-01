import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { LoadingComponent } from '@shared/components/loading/loading.component';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    LoadingComponent
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class AdminSettingsComponent implements OnInit {
  isLoading = signal(true);
  isSaving = signal(false);
  isTesting = signal(false);
  categories = signal<any[]>([]);
  categoryCommissions = signal<Record<string, number>>({});

  generalForm: FormGroup;
  commissionForm: FormGroup;
  deliveryForm: FormGroup;
  featuresForm: FormGroup;
  emailForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.generalForm = this.fb.group({
      platformName: ['', Validators.required],
      description: [''],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone: [''],
      address: ['']
    });

    this.commissionForm = this.fb.group({
      defaultCommission: [10, [Validators.required, Validators.min(0), Validators.max(100)]]
    });

    this.deliveryForm = this.fb.group({
      enableDelivery: [true],
      enablePickup: [true],
      standardDeliveryFee: [5],
      freeDeliveryThreshold: [50]
    });

    this.featuresForm = this.fb.group({
      allowShopRegistration: [true],
      autoApproveShops: [false],
      enableReviews: [true],
      enableChat: [false],
      enablePushNotifications: [true]
    });

    this.emailForm = this.fb.group({
      smtpHost: [''],
      smtpPort: [587],
      smtpSecure: [false],
      smtpUser: [''],
      smtpPassword: [''],
      fromEmail: [''],
      fromName: ['']
    });
  }

  ngOnInit(): void {
    this.loadSettings();
    this.loadCategories();
  }

  loadSettings(): void {
    this.isLoading.set(true);

    this.http.get<any>(`${environment.apiUrl}/admin/settings`).subscribe({
      next: (response) => {
        if (response.success) {
          const settings = response.data.settings;

          if (settings.general) {
            this.generalForm.patchValue(settings.general);
          }
          if (settings.commission) {
            this.commissionForm.patchValue(settings.commission);
            this.categoryCommissions.set(settings.commission.categoryCommissions || {});
          }
          if (settings.delivery) {
            this.deliveryForm.patchValue(settings.delivery);
          }
          if (settings.features) {
            this.featuresForm.patchValue(settings.features);
          }
          if (settings.email) {
            this.emailForm.patchValue(settings.email);
          }
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadCategories(): void {
    this.http.get<any>(`${environment.apiUrl}/products/categories`).subscribe({
      next: (response) => {
        if (response.success) {
          this.categories.set(response.data.categories);
        }
      }
    });
  }

  getCategoryCommission(categoryId: string): number {
    return this.categoryCommissions()[categoryId] ?? this.commissionForm.get('defaultCommission')?.value ?? 10;
  }

  setCategoryCommission(categoryId: string, event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.categoryCommissions.update(current => ({
      ...current,
      [categoryId]: value
    }));
  }

  saveGeneralSettings(): void {
    if (this.generalForm.invalid) return;

    this.isSaving.set(true);
    this.http.put<any>(`${environment.apiUrl}/admin/settings/general`, this.generalForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess('Paramètres généraux enregistrés');
        }
        this.isSaving.set(false);
      },
      error: () => {
        this.showError('Erreur lors de l\'enregistrement');
        this.isSaving.set(false);
      }
    });
  }

  saveCommissionSettings(): void {
    this.isSaving.set(true);
    const data = {
      ...this.commissionForm.value,
      categoryCommissions: this.categoryCommissions()
    };

    this.http.put<any>(`${environment.apiUrl}/admin/settings/commission`, data).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess('Commissions enregistrées');
        }
        this.isSaving.set(false);
      },
      error: () => {
        this.showError('Erreur lors de l\'enregistrement');
        this.isSaving.set(false);
      }
    });
  }

  saveDeliverySettings(): void {
    this.isSaving.set(true);
    this.http.put<any>(`${environment.apiUrl}/admin/settings/delivery`, this.deliveryForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess('Paramètres de livraison enregistrés');
        }
        this.isSaving.set(false);
      },
      error: () => {
        this.showError('Erreur lors de l\'enregistrement');
        this.isSaving.set(false);
      }
    });
  }

  saveFeaturesSettings(): void {
    this.isSaving.set(true);
    this.http.put<any>(`${environment.apiUrl}/admin/settings/features`, this.featuresForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess('Fonctionnalités enregistrées');
        }
        this.isSaving.set(false);
      },
      error: () => {
        this.showError('Erreur lors de l\'enregistrement');
        this.isSaving.set(false);
      }
    });
  }

  saveEmailSettings(): void {
    this.isSaving.set(true);
    this.http.put<any>(`${environment.apiUrl}/admin/settings/email`, this.emailForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess('Configuration email enregistrée');
        }
        this.isSaving.set(false);
      },
      error: () => {
        this.showError('Erreur lors de l\'enregistrement');
        this.isSaving.set(false);
      }
    });
  }

  testEmail(): void {
    this.isTesting.set(true);
    this.http.post<any>(`${environment.apiUrl}/admin/settings/test-email`, this.emailForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess('Email de test envoyé');
        } else {
          this.showError('Échec de l\'envoi');
        }
        this.isTesting.set(false);
      },
      error: () => {
        this.showError('Erreur lors de l\'envoi');
        this.isTesting.set(false);
      }
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 3000 });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fermer', { duration: 5000, panelClass: 'error-snackbar' });
  }
}
