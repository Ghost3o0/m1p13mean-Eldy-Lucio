import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AuthService } from '@core/services/auth.service';
import { Address } from '@shared/models/order.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';

@Component({
  selector: 'app-profile',
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
    MatTabsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    LoadingComponent
  ],
  template: `
    <div class="profile-container container">
      <h1>Mon profil</h1>

      <mat-tab-group>
        <!-- Personal Info Tab -->
        <mat-tab label="Informations personnelles">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Informations de base</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <form [formGroup]="profileForm" (ngSubmit)="updateProfile()">
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Prénom</mat-label>
                      <input matInput formControlName="firstName">
                      @if (profileForm.get('firstName')?.hasError('required') && profileForm.get('firstName')?.touched) {
                        <mat-error>Requis</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Nom</mat-label>
                      <input matInput formControlName="lastName">
                      @if (profileForm.get('lastName')?.hasError('required') && profileForm.get('lastName')?.touched) {
                        <mat-error>Requis</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Email</mat-label>
                    <input matInput formControlName="email" type="email">
                    <mat-icon matSuffix>email</mat-icon>
                    @if (profileForm.get('email')?.hasError('required') && profileForm.get('email')?.touched) {
                      <mat-error>L'email est requis</mat-error>
                    }
                    @if (profileForm.get('email')?.hasError('email') && profileForm.get('email')?.touched) {
                      <mat-error>Email invalide</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Téléphone</mat-label>
                    <input matInput formControlName="phone" type="tel">
                    <mat-icon matSuffix>phone</mat-icon>
                  </mat-form-field>

                  <div class="form-actions">
                    <button
                      mat-raised-button
                      color="primary"
                      type="submit"
                      [disabled]="profileForm.invalid || isSavingProfile()">
                      @if (isSavingProfile()) {
                        <mat-spinner diameter="20"></mat-spinner>
                      } @else {
                        Enregistrer
                      }
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Addresses Tab -->
        <mat-tab label="Adresses">
          <div class="tab-content">
            <div class="addresses-header">
              <h3>Mes adresses</h3>
              <button mat-raised-button color="primary" (click)="showAddressForm = true">
                <mat-icon>add</mat-icon>
                Ajouter une adresse
              </button>
            </div>

            @if (showAddressForm) {
              <mat-card class="address-form-card">
                <mat-card-header>
                  <mat-card-title>{{ editingAddressIndex !== null ? 'Modifier' : 'Nouvelle' }} adresse</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <form [formGroup]="addressForm" (ngSubmit)="saveAddress()">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Nom de l'adresse</mat-label>
                      <input matInput formControlName="label" placeholder="Ex: Maison, Bureau">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Adresse</mat-label>
                      <input matInput formControlName="street">
                      @if (addressForm.get('street')?.hasError('required') && addressForm.get('street')?.touched) {
                        <mat-error>L'adresse est requise</mat-error>
                      }
                    </mat-form-field>

                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Code postal</mat-label>
                        <input matInput formControlName="zipCode">
                        @if (addressForm.get('zipCode')?.hasError('required') && addressForm.get('zipCode')?.touched) {
                          <mat-error>Requis</mat-error>
                        }
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Ville</mat-label>
                        <input matInput formControlName="city">
                        @if (addressForm.get('city')?.hasError('required') && addressForm.get('city')?.touched) {
                          <mat-error>Requis</mat-error>
                        }
                      </mat-form-field>
                    </div>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Téléphone</mat-label>
                      <input matInput formControlName="phone" type="tel">
                    </mat-form-field>

                    <div class="form-actions">
                      <button mat-button type="button" (click)="cancelAddressEdit()">Annuler</button>
                      <button
                        mat-raised-button
                        color="primary"
                        type="submit"
                        [disabled]="addressForm.invalid || isSavingAddress()">
                        @if (isSavingAddress()) {
                          <mat-spinner diameter="20"></mat-spinner>
                        } @else {
                          Enregistrer
                        }
                      </button>
                    </div>
                  </form>
                </mat-card-content>
              </mat-card>
            }

            <div class="addresses-list">
              @for (address of addresses(); track address.label; let i = $index) {
                <mat-card class="address-card">
                  <mat-card-content>
                    <div class="address-header">
                      <strong>{{ address.label || 'Adresse ' + (i + 1) }}</strong>
                      @if (address.isDefault) {
                        <span class="default-badge">Par défaut</span>
                      }
                    </div>
                    <p>{{ address.street }}</p>
                    <p>{{ address.zipCode }} {{ address.city }}</p>
                    @if (address.phone) {
                      <p>Tél: {{ address.phone }}</p>
                    }
                  </mat-card-content>
                  <mat-card-actions>
                    @if (!address.isDefault) {
                      <button mat-button (click)="setDefaultAddress(i)">Définir par défaut</button>
                    }
                    <button mat-button (click)="editAddress(i)">Modifier</button>
                    <button mat-button color="warn" (click)="deleteAddress(i)">Supprimer</button>
                  </mat-card-actions>
                </mat-card>
              } @empty {
                <div class="empty-addresses">
                  <mat-icon>location_off</mat-icon>
                  <p>Aucune adresse enregistrée</p>
                </div>
              }
            </div>
          </div>
        </mat-tab>

        <!-- Security Tab -->
        <mat-tab label="Sécurité">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Changer le mot de passe</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <form [formGroup]="passwordForm" (ngSubmit)="updatePassword()">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Mot de passe actuel</mat-label>
                    <input matInput formControlName="currentPassword" type="password">
                    @if (passwordForm.get('currentPassword')?.hasError('required') && passwordForm.get('currentPassword')?.touched) {
                      <mat-error>Requis</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Nouveau mot de passe</mat-label>
                    <input matInput formControlName="newPassword" type="password">
                    @if (passwordForm.get('newPassword')?.hasError('required') && passwordForm.get('newPassword')?.touched) {
                      <mat-error>Requis</mat-error>
                    }
                    @if (passwordForm.get('newPassword')?.hasError('minlength') && passwordForm.get('newPassword')?.touched) {
                      <mat-error>Minimum 6 caractères</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Confirmer le nouveau mot de passe</mat-label>
                    <input matInput formControlName="confirmPassword" type="password">
                    @if (passwordForm.get('confirmPassword')?.hasError('required') && passwordForm.get('confirmPassword')?.touched) {
                      <mat-error>Requis</mat-error>
                    }
                  </mat-form-field>

                  @if (passwordError()) {
                    <div class="error-message">
                      <mat-icon>error</mat-icon>
                      {{ passwordError() }}
                    </div>
                  }

                  <div class="form-actions">
                    <button
                      mat-raised-button
                      color="primary"
                      type="submit"
                      [disabled]="passwordForm.invalid || isSavingPassword()">
                      @if (isSavingPassword()) {
                        <mat-spinner diameter="20"></mat-spinner>
                      } @else {
                        Modifier le mot de passe
                      }
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>

            <mat-card class="danger-zone">
              <mat-card-header>
                <mat-card-title>Zone dangereuse</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>La suppression de votre compte est irréversible. Toutes vos données seront perdues.</p>
                <button mat-stroked-button color="warn" (click)="deleteAccount()">
                  Supprimer mon compte
                </button>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .profile-container {
      padding: 24px 16px;
      min-height: calc(100vh - 64px - 200px);
    }

    h1 {
      font-size: 2rem;
      margin-bottom: 24px;
    }

    .tab-content {
      padding: 24px 0;
    }

    mat-card {
      margin-bottom: 16px;
    }

    mat-card-header {
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    .form-row {
      display: flex;
      gap: 16px;

      mat-form-field {
        flex: 1;
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 16px;
    }

    .addresses-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h3 {
        margin: 0;
      }
    }

    .address-form-card {
      margin-bottom: 24px;
    }

    .addresses-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .address-card {
      .address-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .default-badge {
        background: #e8f5e9;
        color: #1b5e20;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
      }

      p {
        margin: 4px 0;
        color: #666;
      }
    }

    .empty-addresses {
      text-align: center;
      padding: 48px;
      background: #f5f5f5;
      border-radius: 8px;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #ccc;
      }

      p {
        color: #666;
        margin-top: 16px;
      }
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #ffebee;
      color: #c62828;
      border-radius: 4px;
      margin-bottom: 16px;
    }

    .danger-zone {
      border: 1px solid #f44336;

      mat-card-title {
        color: #c62828;
      }

      p {
        color: #666;
        margin-bottom: 16px;
      }
    }

    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }

      .addresses-list {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  addressForm: FormGroup;
  passwordForm: FormGroup;

  addresses = signal<(Address & { isDefault?: boolean })[]>([]);
  showAddressForm = false;
  editingAddressIndex: number | null = null;

  isSavingProfile = signal(false);
  isSavingAddress = signal(false);
  isSavingPassword = signal(false);
  passwordError = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['']
    });

    this.addressForm = this.fb.group({
      label: [''],
      street: ['', Validators.required],
      city: ['', Validators.required],
      zipCode: ['', Validators.required],
      phone: [''],
      isDefault: [false]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || ''
      });

      if (user.addresses) {
        this.addresses.set(user.addresses);
      }
    }
  }

  updateProfile(): void {
    if (this.profileForm.invalid) return;

    this.isSavingProfile.set(true);

    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.isSavingProfile.set(false);
        // Show success notification
      },
      error: () => {
        this.isSavingProfile.set(false);
        // Show error notification
      }
    });
  }

  editAddress(index: number): void {
    const address = this.addresses()[index];
    this.addressForm.patchValue(address);
    this.editingAddressIndex = index;
    this.showAddressForm = true;
  }

  cancelAddressEdit(): void {
    this.addressForm.reset();
    this.editingAddressIndex = null;
    this.showAddressForm = false;
  }

  saveAddress(): void {
    if (this.addressForm.invalid) return;

    this.isSavingAddress.set(true);

    const addressData = this.addressForm.value;

    if (this.editingAddressIndex !== null) {
      this.authService.updateAddress(this.editingAddressIndex, addressData).subscribe({
        next: () => {
          this.isSavingAddress.set(false);
          this.loadUserData();
          this.cancelAddressEdit();
        },
        error: () => {
          this.isSavingAddress.set(false);
        }
      });
    } else {
      this.authService.addAddress(addressData).subscribe({
        next: () => {
          this.isSavingAddress.set(false);
          this.loadUserData();
          this.cancelAddressEdit();
        },
        error: () => {
          this.isSavingAddress.set(false);
        }
      });
    }
  }

  setDefaultAddress(index: number): void {
    this.authService.setDefaultAddress(index).subscribe({
      next: () => {
        this.loadUserData();
      }
    });
  }

  deleteAddress(index: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette adresse ?')) {
      this.authService.deleteAddress(index).subscribe({
        next: () => {
          this.loadUserData();
        }
      });
    }
  }

  updatePassword(): void {
    if (this.passwordForm.invalid) return;

    const { newPassword, confirmPassword } = this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      this.passwordError.set('Les mots de passe ne correspondent pas');
      return;
    }

    this.passwordError.set(null);
    this.isSavingPassword.set(true);

    this.authService.updatePassword(
      this.passwordForm.get('currentPassword')?.value,
      this.passwordForm.get('newPassword')?.value
    ).subscribe({
      next: () => {
        this.isSavingPassword.set(false);
        this.passwordForm.reset();
        // Show success notification
      },
      error: (error) => {
        this.isSavingPassword.set(false);
        this.passwordError.set(error.message || 'Erreur lors du changement de mot de passe');
      }
    });
  }

  deleteAccount(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      this.authService.deleteAccount().subscribe({
        next: () => {
          this.router.navigate(['/']);
        }
      });
    }
  }
}
