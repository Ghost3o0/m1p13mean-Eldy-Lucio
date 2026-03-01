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
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],})
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


