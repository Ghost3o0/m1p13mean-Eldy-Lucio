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
  templateUrl: './delivery-zone-dialog.component.html',
  styleUrls: ['./delivery-zone-dialog.component.scss'],})
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


