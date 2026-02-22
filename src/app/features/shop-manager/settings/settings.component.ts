import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Shop } from '@shared/models/product.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { DeliveryService, DeliveryZone } from '@shared/services/delivery.service';
import { DeliveryZoneDialogComponent } from './delivery-zone-dialog.component';

@Component({
  selector: 'app-shop-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTableModule,
    MatButtonToggleModule,
    LoadingComponent
  ],
  template: `
    <div class="settings-container">
      <h1>Paramètres de la boutique</h1>

      @if (isLoading()) {
        <app-loading message="Chargement..."></app-loading>
      }

      @if (!isLoading()) {
        <mat-tab-group>
          <!-- General Info -->
          <mat-tab label="Informations générales">
            <div class="tab-content">
              <mat-card>
                <form [formGroup]="generalForm" (ngSubmit)="saveGeneral()">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Nom de la boutique</mat-label>
                    <input matInput formControlName="name">
                    @if (generalForm.get('name')?.hasError('required') && generalForm.get('name')?.touched) {
                      <mat-error>Le nom est requis</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Description courte</mat-label>
                    <textarea matInput formControlName="shortDescription" rows="2"></textarea>
                    <mat-hint>{{ generalForm.get('shortDescription')?.value?.length || 0 }}/200</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Description complète</mat-label>
                    <textarea matInput formControlName="description" rows="4"></textarea>
                  </mat-form-field>

                  <!-- Logo & Banner -->
                  <div class="images-section">
                    <div class="image-upload">
                      <label>Logo</label>
                      <div class="image-preview" [class.has-image]="logoPreview()">
                        @if (logoPreview()) {
                          <img [src]="logoPreview()" alt="Logo">
                        } @else {
                          <mat-icon>store</mat-icon>
                        }
                        <label class="upload-overlay">
                          <input type="file" accept="image/*" (change)="onLogoSelect($event)" hidden>
                          <mat-icon>camera_alt</mat-icon>
                        </label>
                      </div>
                    </div>

                    <div class="image-upload banner">
                      <label>Bannière</label>
                      <div class="image-preview" [class.has-image]="bannerPreview()">
                        @if (bannerPreview()) {
                          <img [src]="bannerPreview()" alt="Banner">
                        } @else {
                          <mat-icon>image</mat-icon>
                        }
                        <label class="upload-overlay">
                          <input type="file" accept="image/*" (change)="onBannerSelect($event)" hidden>
                          <mat-icon>camera_alt</mat-icon>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div class="form-actions">
                    <button
                      mat-raised-button
                      color="primary"
                      type="submit"
                      [disabled]="generalForm.invalid || isSaving()">
                      @if (isSaving()) {
                        <mat-spinner diameter="20"></mat-spinner>
                      } @else {
                        Enregistrer
                      }
                    </button>
                  </div>
                </form>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Contact Info -->
          <mat-tab label="Contact">
            <div class="tab-content">
              <mat-card>
                <form [formGroup]="contactForm" (ngSubmit)="saveContact()">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Email</mat-label>
                    <input matInput type="email" formControlName="email">
                    <mat-icon matSuffix>email</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Téléphone</mat-label>
                    <input matInput type="tel" formControlName="phone">
                    <mat-icon matSuffix>phone</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Site web</mat-label>
                    <input matInput formControlName="website">
                    <mat-icon matSuffix>language</mat-icon>
                  </mat-form-field>

                  <mat-divider></mat-divider>

                  <h3>Adresse</h3>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Emplacement dans le centre</mat-label>
                    <input matInput formControlName="location">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Étage</mat-label>
                    <input matInput formControlName="floor">
                  </mat-form-field>

                  <div class="form-actions">
                    <button
                      mat-raised-button
                      color="primary"
                      type="submit"
                      [disabled]="contactForm.invalid || isSaving()">
                      Enregistrer
                    </button>
                  </div>
                </form>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Opening Hours -->
          <mat-tab label="Horaires">
            <div class="tab-content">
              <mat-card>
                <form [formGroup]="hoursForm" (ngSubmit)="saveHours()">
                  <div formArrayName="hours" class="hours-list">
                    @for (day of daysOfWeek; track day; let i = $index) {
                      <div class="hour-row" [formGroupName]="i">
                        <span class="day-name">{{ day }}</span>
                        <mat-slide-toggle formControlName="isClosed">Fermé</mat-slide-toggle>
                        @if (!hoursArray.at(i).get('isClosed')?.value) {
                          <mat-form-field appearance="outline">
                            <mat-label>Ouverture</mat-label>
                            <input matInput type="time" formControlName="open">
                          </mat-form-field>
                          <mat-form-field appearance="outline">
                            <mat-label>Fermeture</mat-label>
                            <input matInput type="time" formControlName="close">
                          </mat-form-field>
                        }
                      </div>
                    }
                  </div>

                  <div class="form-actions">
                    <button
                      mat-raised-button
                      color="primary"
                      type="submit"
                      [disabled]="isSaving()">
                      Enregistrer
                    </button>
                  </div>
                </form>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Notifications -->
          <mat-tab label="Notifications">
            <div class="tab-content">
              <mat-card>
                <form [formGroup]="notificationsForm" (ngSubmit)="saveNotifications()">
                  <h3>Notifications par email</h3>
                  <mat-slide-toggle formControlName="newOrder">
                    Nouvelle commande
                  </mat-slide-toggle>

                  <mat-slide-toggle formControlName="lowStock">
                    Stock faible
                  </mat-slide-toggle>

                  <mat-slide-toggle formControlName="newReview">
                    Nouvel avis
                  </mat-slide-toggle>

                  <mat-slide-toggle formControlName="weeklyReport">
                    Rapport hebdomadaire
                  </mat-slide-toggle>

                  <div class="form-actions">
                    <button
                      mat-raised-button
                      color="primary"
                      type="submit"
                      [disabled]="isSaving()">
                      Enregistrer
                    </button>
                  </div>
                </form>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Delivery Zones -->
          <mat-tab label="Livraison">
            <div class="tab-content">
              <mat-card>
                <h3>Paramètres de livraison</h3>
                <form [formGroup]="deliveryForm" (ngSubmit)="saveDeliverySettings()">
                  <div class="checkbox-group">
                    <mat-slide-toggle formControlName="offersPickup">
                      Retrait en boutique
                    </mat-slide-toggle>
                    <mat-slide-toggle formControlName="offersDelivery">
                      Livraison à domicile
                    </mat-slide-toggle>
                  </div>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Frais de livraison par défaut (€)</mat-label>
                    <input matInput type="number" formControlName="defaultDeliveryFee" step="0.01">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Livraison gratuite à partir de (€)</mat-label>
                    <input matInput type="number" formControlName="freeDeliveryThreshold" step="0.01">
                    <mat-hint>Laisser vide si pas de livraison gratuite</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Distance de livraison maximale (km)</mat-label>
                    <input matInput type="number" formControlName="maxDeliveryDistance" step="0.1">
                  </mat-form-field>

                  <div class="form-actions">
                    <button
                      mat-raised-button
                      color="primary"
                      type="submit"
                      [disabled]="deliveryForm.invalid || isSaving()">
                      Enregistrer
                    </button>
                  </div>
                </form>

                <mat-divider></mat-divider>

                <h3>Zones de livraison</h3>
                <div class="zones-section">
                  <button mat-raised-button color="accent" (click)="openZoneDialog()">
                    <mat-icon>add</mat-icon>
                    Ajouter une zone
                  </button>

                  @if (deliveryZones().length > 0) {
                    <div class="zones-table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Nom</th>
                            <th>Type</th>
                            <th>Tarif (€)</th>
                            <th>Statut</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (zone of deliveryZones(); track zone._id) {
                            <tr>
                              <td>{{ zone.name }}</td>
                              <td>{{ getZoneTypeName(zone.type) }}</td>
                              <td>{{ zone.deliveryFee }}€</td>
                              <td>
                                <span [class.status-active]="zone.isActive" [class.status-inactive]="!zone.isActive">
                                  {{ zone.isActive ? '✓ Actif' : '✗ Inactif' }}
                                </span>
                              </td>
                              <td class="actions">
                                <button mat-icon-button color="primary" (click)="openZoneDialog(zone)">
                                  <mat-icon>edit</mat-icon>
                                </button>
                                <button mat-icon-button color="warn" (click)="deleteZone(zone._id)">
                                  <mat-icon>delete</mat-icon>
                                </button>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  } @else {
                    <p class="empty-message">Aucune zone de livraison configurée</p>
                  }
                </div>
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

      h1 {
        font-size: 2rem;
        margin-bottom: 24px;
      }
    }

    .tab-content {
      padding: 24px 0;
    }

    mat-card {
      max-width: 800px;
      padding: 24px;
    }

    .full-width {
      width: 100%;
    }

    h3 {
      margin: 24px 0 16px;
      color: var(--text-secondary);
    }

    .images-section {
      display: flex;
      gap: 32px;
      margin: 24px 0;
    }

    .image-upload {
      label:first-child {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
      }

      .image-preview {
        width: 120px;
        height: 120px;
        border: 2px dashed var(--gray-300);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        background: var(--bg-secondary);

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: var(--gray-300);
        }

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .upload-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
          cursor: pointer;

          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
            color: white;
          }
        }

        &:hover .upload-overlay {
          opacity: 1;
        }

        &.has-image {
          border-style: solid;
          border-color: var(--primary);
        }
      }

      &.banner .image-preview {
        width: 300px;
        height: 120px;
      }
    }

    .hours-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .hour-row {
      display: flex;
      align-items: center;
      gap: 16px;

      .day-name {
        width: 100px;
        font-weight: 500;
      }

      mat-form-field {
        width: 140px;
      }
    }

    mat-slide-toggle {
      display: block;
      margin: 12px 0;
    }

    .form-actions {
      margin-top: 24px;
      display: flex;
      justify-content: flex-end;
    }

    .checkbox-group {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;

      mat-slide-toggle {
        display: block;
      }
    }

    .zones-section {
      margin-top: 24px;

      button {
        margin-bottom: 16px;
      }

      .zones-table-container {
        overflow-x: auto;
        margin-top: 16px;

        table {
          width: 100%;
          border-collapse: collapse;

          thead {
            background-color: var(--bg-secondary);

            th {
              padding: 12px;
              text-align: left;
              font-weight: 600;
              border-bottom: 2px solid var(--border-color);
            }
          }

          tbody {
            tr {
              border-bottom: 1px solid var(--border-color);

              td {
                padding: 12px;
              }
            }
          }

          .status-active {
            color: var(--success);
            font-weight: 500;
          }

          .status-inactive {
            color: var(--error);
            font-weight: 500;
          }

          .actions {
            display: flex;
            gap: 8px;
          }
        }
      }

      .empty-message {
        text-align: center;
        color: var(--text-secondary);
        padding: 24px;
      }
    }

    @media (max-width: 768px) {
      .images-section {
        flex-direction: column;
      }

      .hour-row {
        flex-wrap: wrap;
      }

      .checkbox-group {
        flex-direction: column;
      }

      .zones-table-container {
        table {
          thead {
            display: none;
          }

          tbody {
            tr {
              display: block;
              margin-bottom: 16px;
              border: 1px solid #ddd;
              border-radius: 4px;
            }

            td {
              display: flex;
              justify-content: space-between;
              padding: 8px;
              border: none;

              &::before {
                content: attr(data-label);
                font-weight: 600;
                min-width: 100px;
              }
            }
          }
        }
      }
    }
  `]
})
export class ShopSettingsComponent implements OnInit {
  generalForm: FormGroup;
  contactForm: FormGroup;
  hoursForm: FormGroup;
  notificationsForm: FormGroup;
  deliveryForm: FormGroup;

  isLoading = signal(true);
  isSaving = signal(false);
  logoPreview = signal<string | null>(null);
  bannerPreview = signal<string | null>(null);
  deliveryZones = signal<DeliveryZone[]>([]);

  daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private deliveryService: DeliveryService,
    private dialog: MatDialog
  ) {
    this.generalForm = this.fb.group({
      name: ['', Validators.required],
      shortDescription: ['', Validators.maxLength(200)],
      description: ['']
    });

    this.contactForm = this.fb.group({
      email: [''],
      phone: [''],
      website: [''],
      location: [''],
      floor: ['']
    });

    this.hoursForm = this.fb.group({
      hours: this.fb.array([])
    });

    this.notificationsForm = this.fb.group({
      newOrder: [true],
      lowStock: [true],
      newReview: [true],
      weeklyReport: [false]
    });

    this.deliveryForm = this.fb.group({
      offersDelivery: [false],
      offersPickup: [true],
      defaultDeliveryFee: [0, [Validators.required, Validators.min(0)]],
      freeDeliveryThreshold: [null],
      maxDeliveryDistance: [null]
    });

    // Initialize hours array
    for (let i = 0; i < 7; i++) {
      this.hoursArray.push(this.fb.group({
        day: [i],
        open: ['09:00'],
        close: ['19:00'],
        isClosed: [i === 6] // Sunday closed by default
      }));
    }
  }

  get hoursArray(): FormArray {
    return this.hoursForm.get('hours') as FormArray;
  }

  ngOnInit(): void {
    this.loadShopData();
  }

  loadShopData(): void {
    this.isLoading.set(true);

    this.http.get<any>(`${environment.apiUrl}/shop/profile`).subscribe({
      next: (response) => {
        if (response.success) {
          const shop = response.data.shop;

          this.generalForm.patchValue({
            name: shop.name,
            shortDescription: shop.shortDescription,
            description: shop.description
          });

          this.contactForm.patchValue({
            email: shop.contact?.email,
            phone: shop.contact?.phone,
            website: shop.contact?.website,
            location: shop.address?.location,
            floor: shop.address?.floor
          });

          if (shop.logo) this.logoPreview.set(shop.logo);
          if (shop.banner) this.bannerPreview.set(shop.banner);

          if (shop.hours) {
            shop.hours.forEach((h: any) => {
              const control = this.hoursArray.at(h.day);
              if (control) {
                control.patchValue({
                  open: h.open,
                  close: h.close,
                  isClosed: h.isClosed
                });
              }
            });
          }

          // Load delivery settings
          if (shop.deliverySettings) {
            this.deliveryForm.patchValue(shop.deliverySettings);
          }

          if (shop.deliveryZones) {
            this.deliveryZones.set(shop.deliveryZones);
          }
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onLogoSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.uploadImage(input.files[0], 'logo');
    }
  }

  onBannerSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.uploadImage(input.files[0], 'banner');
    }
  }

  uploadImage(file: File, type: 'logo' | 'banner'): void {
    const formData = new FormData();
    formData.append(type, file);

    this.http.post<any>(`${environment.apiUrl}/shop/upload-${type}`, formData).subscribe({
      next: (response) => {
        if (response.success) {
          if (type === 'logo') {
            this.logoPreview.set(response.data.url);
          } else {
            this.bannerPreview.set(response.data.url);
          }
        }
      }
    });
  }

  saveGeneral(): void {
    if (this.generalForm.invalid) return;
    this.saveProfile({ ...this.generalForm.value });
  }

  saveContact(): void {
    const data = {
      contact: {
        email: this.contactForm.get('email')?.value,
        phone: this.contactForm.get('phone')?.value,
        website: this.contactForm.get('website')?.value
      },
      address: {
        location: this.contactForm.get('location')?.value,
        floor: this.contactForm.get('floor')?.value
      }
    };
    this.saveProfile(data);
  }

  saveHours(): void {
    const hours = this.hoursArray.value.map((h: any) => ({
      day: h.day,
      open: h.open,
      close: h.close,
      isClosed: h.isClosed
    }));
    this.saveProfile({ hours });
  }

  saveNotifications(): void {
    this.saveProfile({ notifications: this.notificationsForm.value });
  }

  saveDeliverySettings(): void {
    if (this.deliveryForm.invalid) return;
    
    const data = {
      deliverySettings: this.deliveryForm.value
    };
    this.saveProfile(data);
  }

  openZoneDialog(zone?: DeliveryZone): void {
    const dialogRef = this.dialog.open(DeliveryZoneDialogComponent, {
      width: '600px',
      data: zone || null
    });

    dialogRef.afterClosed().subscribe((result: DeliveryZone | undefined) => {
      if (result) {
        if (zone && zone._id) {
          // Edit existing zone
          this.deliveryService.updateDeliveryZone(zone._id, result).subscribe({
            next: () => {
              this.loadDeliveryZones();
            },
            error: (error) => {
              console.error('Error updating zone:', error);
            }
          });
        } else {
          // Create new zone
          this.deliveryService.createDeliveryZone(result).subscribe({
            next: () => {
              this.loadDeliveryZones();
            },
            error: (error) => {
              console.error('Error creating zone:', error);
            }
          });
        }
      }
    });
  }

  deleteZone(zoneId: string | undefined): void {
    if (!zoneId) return;
    
    if (confirm('Êtes-vous sûr de vouloir supprimer cette zone ?')) {
      this.deliveryService.deleteZone(zoneId).subscribe({
        next: () => {
          this.loadDeliveryZones();
        },
        error: (error) => {
          console.error('Error deleting zone:', error);
        }
      });
    }
  }

  getZoneTypeName(type: string): string {
    const typeMap: { [key: string]: string } = {
      'postal_codes': 'Codes postaux',
      'cities': 'Villes',
      'radius': 'Rayon (km)'
    };
    return typeMap[type] || type;
  }

  loadDeliveryZones(): void {
    this.deliveryService.getZones().subscribe({
      next: (zones) => {
        this.deliveryZones.set(zones);
      },
      error: (error) => {
        console.error('Error loading zones:', error);
      }
    });
  }

  private saveProfile(data: any): void {
    this.isSaving.set(true);

    this.http.put<any>(`${environment.apiUrl}/shop/profile`, data).subscribe({
      next: () => {
        this.isSaving.set(false);
        // Show success notification
        this.loadDeliveryZones();
      },
      error: () => {
        this.isSaving.set(false);
        // Show error notification
      }
    });
  }
}
