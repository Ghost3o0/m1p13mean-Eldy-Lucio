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
  template: `
    <div class="settings-container">
      <h1>Paramètres de la plateforme</h1>

      @if (isLoading()) {
        <app-loading message="Chargement des paramètres..."></app-loading>
      } @else {
        <mat-tab-group>
          <!-- General Settings -->
          <mat-tab label="Général">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Informations générales</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <form [formGroup]="generalForm">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Nom de la plateforme</mat-label>
                      <input matInput formControlName="platformName">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Description</mat-label>
                      <textarea matInput formControlName="description" rows="3"></textarea>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Email de contact</mat-label>
                      <input matInput formControlName="contactEmail" type="email">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Téléphone</mat-label>
                      <input matInput formControlName="contactPhone">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Adresse</mat-label>
                      <textarea matInput formControlName="address" rows="2"></textarea>
                    </mat-form-field>

                    <div class="form-actions">
                      <button mat-raised-button color="primary" (click)="saveGeneralSettings()" [disabled]="isSaving()">
                        @if (isSaving()) {
                          <mat-spinner diameter="20"></mat-spinner>
                        } @else {
                          <mat-icon>save</mat-icon>
                          Enregistrer
                        }
                      </button>
                    </div>
                  </form>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Commission Settings -->
          <mat-tab label="Commissions">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Taux de commission</mat-card-title>
                  <mat-card-subtitle>
                    Commission prélevée sur les ventes des boutiques
                  </mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <form [formGroup]="commissionForm">
                    <mat-form-field appearance="outline">
                      <mat-label>Commission par défaut (%)</mat-label>
                      <input matInput type="number" formControlName="defaultCommission" min="0" max="100">
                      <span matSuffix>%</span>
                    </mat-form-field>

                    <p class="info-text">
                      Cette commission sera appliquée à toutes les nouvelles boutiques.
                      Vous pouvez définir une commission personnalisée pour chaque boutique.
                    </p>

                    <mat-divider></mat-divider>

                    <h3>Commissions par catégorie</h3>
                    <div class="category-commissions">
                      @for (category of categories(); track category._id) {
                        <div class="category-row">
                          <span class="category-name">{{ category.name }}</span>
                          <mat-form-field appearance="outline" class="commission-field">
                            <input matInput type="number"
                                   [value]="getCategoryCommission(category._id)"
                                   (change)="setCategoryCommission(category._id, $event)"
                                   min="0" max="100">
                            <span matSuffix>%</span>
                          </mat-form-field>
                        </div>
                      }
                    </div>

                    <div class="form-actions">
                      <button mat-raised-button color="primary" (click)="saveCommissionSettings()" [disabled]="isSaving()">
                        @if (isSaving()) {
                          <mat-spinner diameter="20"></mat-spinner>
                        } @else {
                          <mat-icon>save</mat-icon>
                          Enregistrer
                        }
                      </button>
                    </div>
                  </form>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Delivery Settings -->
          <mat-tab label="Livraison">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Options de livraison</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <form [formGroup]="deliveryForm">
                    <mat-slide-toggle formControlName="enableDelivery" color="primary">
                      Activer la livraison à domicile
                    </mat-slide-toggle>

                    <mat-slide-toggle formControlName="enablePickup" color="primary">
                      Activer le retrait en boutique
                    </mat-slide-toggle>

                    <mat-divider></mat-divider>

                    <h3>Frais de livraison</h3>

                    <mat-form-field appearance="outline">
                      <mat-label>Frais de livraison standard</mat-label>
                      <input matInput type="number" formControlName="standardDeliveryFee" min="0">
                      <span matPrefix>EUR&nbsp;</span>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Livraison gratuite à partir de</mat-label>
                      <input matInput type="number" formControlName="freeDeliveryThreshold" min="0">
                      <span matPrefix>EUR&nbsp;</span>
                    </mat-form-field>

                    <div class="form-actions">
                      <button mat-raised-button color="primary" (click)="saveDeliverySettings()" [disabled]="isSaving()">
                        @if (isSaving()) {
                          <mat-spinner diameter="20"></mat-spinner>
                        } @else {
                          <mat-icon>save</mat-icon>
                          Enregistrer
                        }
                      </button>
                    </div>
                  </form>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Features Settings -->
          <mat-tab label="Fonctionnalités">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Fonctionnalités de la plateforme</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <form [formGroup]="featuresForm">
                    <div class="feature-item">
                      <div class="feature-info">
                        <span class="feature-name">Inscription des boutiques</span>
                        <span class="feature-description">Permettre aux utilisateurs de créer une boutique</span>
                      </div>
                      <mat-slide-toggle formControlName="allowShopRegistration" color="primary"></mat-slide-toggle>
                    </div>

                    <mat-divider></mat-divider>

                    <div class="feature-item">
                      <div class="feature-info">
                        <span class="feature-name">Approbation automatique</span>
                        <span class="feature-description">Approuver automatiquement les nouvelles boutiques</span>
                      </div>
                      <mat-slide-toggle formControlName="autoApproveShops" color="primary"></mat-slide-toggle>
                    </div>

                    <mat-divider></mat-divider>

                    <div class="feature-item">
                      <div class="feature-info">
                        <span class="feature-name">Avis clients</span>
                        <span class="feature-description">Permettre aux clients de laisser des avis</span>
                      </div>
                      <mat-slide-toggle formControlName="enableReviews" color="primary"></mat-slide-toggle>
                    </div>

                    <mat-divider></mat-divider>

                    <div class="feature-item">
                      <div class="feature-info">
                        <span class="feature-name">Chat en direct</span>
                        <span class="feature-description">Activer le chat entre clients et boutiques</span>
                      </div>
                      <mat-slide-toggle formControlName="enableChat" color="primary"></mat-slide-toggle>
                    </div>

                    <mat-divider></mat-divider>

                    <div class="feature-item">
                      <div class="feature-info">
                        <span class="feature-name">Notifications push</span>
                        <span class="feature-description">Envoyer des notifications push aux utilisateurs</span>
                      </div>
                      <mat-slide-toggle formControlName="enablePushNotifications" color="primary"></mat-slide-toggle>
                    </div>

                    <div class="form-actions">
                      <button mat-raised-button color="primary" (click)="saveFeaturesSettings()" [disabled]="isSaving()">
                        @if (isSaving()) {
                          <mat-spinner diameter="20"></mat-spinner>
                        } @else {
                          <mat-icon>save</mat-icon>
                          Enregistrer
                        }
                      </button>
                    </div>
                  </form>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Email Settings -->
          <mat-tab label="Emails">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Configuration des emails</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <form [formGroup]="emailForm">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Serveur SMTP</mat-label>
                      <input matInput formControlName="smtpHost">
                    </mat-form-field>

                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Port</mat-label>
                        <input matInput type="number" formControlName="smtpPort">
                      </mat-form-field>

                      <mat-slide-toggle formControlName="smtpSecure" color="primary">
                        SSL/TLS
                      </mat-slide-toggle>
                    </div>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Utilisateur SMTP</mat-label>
                      <input matInput formControlName="smtpUser">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Mot de passe SMTP</mat-label>
                      <input matInput type="password" formControlName="smtpPassword">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Email expéditeur</mat-label>
                      <input matInput formControlName="fromEmail" type="email">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Nom expéditeur</mat-label>
                      <input matInput formControlName="fromName">
                    </mat-form-field>

                    <div class="form-actions">
                      <button mat-stroked-button (click)="testEmail()" [disabled]="isTesting()">
                        @if (isTesting()) {
                          <mat-spinner diameter="20"></mat-spinner>
                        } @else {
                          <mat-icon>send</mat-icon>
                          Tester
                        }
                      </button>
                      <button mat-raised-button color="primary" (click)="saveEmailSettings()" [disabled]="isSaving()">
                        @if (isSaving()) {
                          <mat-spinner diameter="20"></mat-spinner>
                        } @else {
                          <mat-icon>save</mat-icon>
                          Enregistrer
                        }
                      </button>
                    </div>
                  </form>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 24px;
    }

    h1 {
      font-size: 2rem;
      margin-bottom: 24px;
    }

    .tab-content {
      padding: 24px 0;
    }

    mat-card {
      max-width: 700px;
    }

    mat-card-header {
      margin-bottom: 24px;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      margin-bottom: 16px;
    }

    mat-slide-toggle {
      display: block;
      margin: 16px 0;
    }

    mat-divider {
      margin: 24px 0;
    }

    h3 {
      margin: 16px 0;
      font-size: 1.1rem;
    }

    .info-text {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin: 16px 0;
    }

    .category-commissions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .category-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .category-name {
      flex: 1;
      font-weight: 500;
    }

    .commission-field {
      width: 120px;
    }

    .feature-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
    }

    .feature-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .feature-name {
      font-weight: 500;
    }

    .feature-description {
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .form-row {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .form-actions {
      margin-top: 24px;
      display: flex;
      gap: 16px;
      justify-content: flex-end;
    }

    @media (max-width: 768px) {
      .feature-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .form-row {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
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
