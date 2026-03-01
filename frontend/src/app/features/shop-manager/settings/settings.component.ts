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
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],})
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


