import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { DeliveryZone } from '@shared/services/delivery.service';

@Component({
  selector: 'app-delivery-zone-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>{{ isEditing() ? 'Modifier' : 'Créer' }} une zone de livraison</h2>

      <form [formGroup]="zoneForm" (ngSubmit)="saveZone()">
        <mat-dialog-content>
          <!-- Zone Name -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nom de la zone</mat-label>
            <input matInput formControlName="name" placeholder="Ex: Zone Centre-ville">
            @if (zoneForm.get('name')?.hasError('required') && zoneForm.get('name')?.touched) {
              <mat-error>Le nom est requis</mat-error>
            }
          </mat-form-field>

          <!-- Zone Type -->
          <div class="zone-type-section">
            <label>Type de zone:</label>
            <mat-radio-group formControlName="type" (change)="onZoneTypeChange()">
              <mat-radio-button value="postal_codes">Codes postaux</mat-radio-button>
              <mat-radio-button value="cities">Villes</mat-radio-button>
              <mat-radio-button value="radius">Rayon (km)</mat-radio-button>
            </mat-radio-group>
          </div>

          <!-- Postal Codes -->
          @if (zoneForm.get('type')?.value === 'postal_codes') {
            <div class="postal-codes-section">
              <label>Codes postaux (un par ligne)</label>
              <textarea
                matInput
                formControlName="postalCodesInput"
                rows="5"
                placeholder="75001&#10;75002&#10;75003"
                class="full-width">
              </textarea>
              <mat-hint>Séparez chaque code postal par une nouvelle ligne</mat-hint>
            </div>
          }

          <!-- Cities -->
          @if (zoneForm.get('type')?.value === 'cities') {
            <div class="cities-section">
              <label>Villes (un par ligne)</label>
              <textarea
                matInput
                formControlName="citiesInput"
                rows="5"
                placeholder="Paris&#10;Lyon&#10;Marseille"
                class="full-width">
              </textarea>
              <mat-hint>Séparez chaque ville par une nouvelle ligne</mat-hint>
            </div>
          }

          <!-- Radius -->
          @if (zoneForm.get('type')?.value === 'radius') {
            <div class="radius-section">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Latitude du centre</mat-label>
                <input matInput type="number" formControlName="centerLat" step="0.0001">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Longitude du centre</mat-label>
                <input matInput type="number" formControlName="centerLng" step="0.0001">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Rayon (km)</mat-label>
                <input matInput type="number" formControlName="radiusKm" step="0.1">
              </mat-form-field>
            </div>
          }

          <!-- Delivery Fee -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Frais de livraison (€)</mat-label>
            <input matInput type="number" formControlName="deliveryFee" step="0.01">
          </mat-form-field>

          <!-- Min Order Amount -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Commande minimum (€)</mat-label>
            <input matInput type="number" formControlName="minOrderAmount" step="0.01">
            <mat-hint>Laisser vide s'il n'y a pas de minimum</mat-hint>
          </mat-form-field>

          <!-- Estimated Time -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Délai estimé</mat-label>
            <input matInput formControlName="estimatedTime" placeholder="30-45 min">
          </mat-form-field>

          <!-- Active -->
          <div class="active-section">
            <mat-slide-toggle formControlName="isActive">
              Zone active
            </mat-slide-toggle>
          </div>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
          <button mat-button (click)="onCancel()">Annuler</button>
          <button
            mat-raised-button
            color="primary"
            type="submit"
            [disabled]="zoneForm.invalid || isSaving()">
            {{ isEditing() ? 'Modifier' : 'Créer' }}
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    .dialog-container {
      width: 100%;
      max-width: 600px;
    }

    mat-dialog-content {
      padding: 24px 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .zone-type-section,
    .postal-codes-section,
    .cities-section,
    .radius-section,
    .active-section {
      display: flex;
      flex-direction: column;
      gap: 12px;

      label {
        font-weight: 500;
        color: var(--text-primary);
      }

      mat-radio-button {
        margin-bottom: 8px;
      }

      textarea {
        padding: 8px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        font-family: monospace;
        font-size: 14px;
        background: var(--bg-primary);
        color: var(--text-primary);

        &:focus {
          outline: none;
          border-color: var(--primary);
        }
      }
    }

    mat-hint {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    mat-dialog-actions {
      gap: 8px;
    }
  `]
})
export class DeliveryZoneDialogComponent {
  dialogRef = inject(MatDialogRef<DeliveryZoneDialogComponent>);
  data: DeliveryZone | null = inject(MAT_DIALOG_DATA);

  fb = inject(FormBuilder);
  zoneForm: FormGroup;
  isEditing = signal(false);
  isSaving = signal(false);

  constructor() {
    this.isEditing.set(!!this.data);

    this.zoneForm = this.fb.group({
      name: ['', Validators.required],
      type: ['postal_codes', Validators.required],
      postalCodesInput: [''],
      citiesInput: [''],
      centerLat: [null],
      centerLng: [null],
      radiusKm: [null],
      deliveryFee: [0, [Validators.required, Validators.min(0)]],
      minOrderAmount: [0, [Validators.required, Validators.min(0)]],
      estimatedTime: ['', Validators.required],
      isActive: [true]
    });

    if (this.data) {
      this.zoneForm.patchValue({
        name: this.data.name,
        type: this.data.type,
        deliveryFee: this.data.deliveryFee,
        minOrderAmount: this.data.minOrderAmount,
        estimatedTime: this.data.estimatedTime,
        isActive: this.data.isActive
      });

      if (this.data.type === 'postal_codes') {
        this.zoneForm.patchValue({
          postalCodesInput: this.data.postalCodes.join('\n')
        });
      } else if (this.data.type === 'cities') {
        this.zoneForm.patchValue({
          citiesInput: this.data.cities.join('\n')
        });
      } else if (this.data.type === 'radius' && this.data.centerCoordinates) {
        this.zoneForm.patchValue({
          centerLat: this.data.centerCoordinates.lat,
          centerLng: this.data.centerCoordinates.lng,
          radiusKm: this.data.radiusKm
        });
      }
    }
  }

  onZoneTypeChange(): void {
    // Update validators based on type
    const type = this.zoneForm.get('type')?.value;

    this.zoneForm.get('centerLat')?.clearValidators();
    this.zoneForm.get('centerLng')?.clearValidators();
    this.zoneForm.get('radiusKm')?.clearValidators();

    if (type === 'radius') {
      this.zoneForm.get('centerLat')?.setValidators([Validators.required, Validators.min(-90), Validators.max(90)]);
      this.zoneForm.get('centerLng')?.setValidators([Validators.required, Validators.min(-180), Validators.max(180)]);
      this.zoneForm.get('radiusKm')?.setValidators([Validators.required, Validators.min(0.1)]);
    }

    this.zoneForm.get('centerLat')?.updateValueAndValidity();
    this.zoneForm.get('centerLng')?.updateValueAndValidity();
    this.zoneForm.get('radiusKm')?.updateValueAndValidity();
  }

  saveZone(): void {
    if (this.zoneForm.invalid) return;

    this.isSaving.set(true);

    const formValue = this.zoneForm.value;
    const zone: DeliveryZone = {
      _id: this.data?._id,
      name: formValue.name,
      type: formValue.type,
      postalCodes: formValue.type === 'postal_codes' 
        ? formValue.postalCodesInput.split('\n').filter((s: string) => s.trim())
        : [],
      cities: formValue.type === 'cities'
        ? formValue.citiesInput.split('\n').filter((s: string) => s.trim())
        : [],
      deliveryFee: formValue.deliveryFee,
      minOrderAmount: formValue.minOrderAmount,
      estimatedTime: formValue.estimatedTime,
      isActive: formValue.isActive
    };

    if (formValue.type === 'radius') {
      zone.centerCoordinates = {
        lat: formValue.centerLat,
        lng: formValue.centerLng
      };
      zone.radiusKm = formValue.radiusKm;
    }

    this.dialogRef.close(zone);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
