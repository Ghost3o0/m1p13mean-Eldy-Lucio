import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { BoxService } from '@shared/services/box.service';

@Component({
  selector: 'app-box-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './box-form-dialog.component.html',
  styleUrls: ['./box-form-dialog.component.scss']
})
export class BoxFormDialogComponent implements OnInit {
  isSaving = signal(false);

  formData = {
    name: '',
    description: '',
    location: { floor: '', zone: '', position: '' },
    dimensions: { area: null, length: null, width: null },
    currentRent: { amount: 0, currency: 'Ar' },
    equipment: [] as string[]
  };

  equipmentOptions = [
    { value: 'electricity', label: 'Électricité', icon: 'bolt' },
    { value: 'water', label: 'Eau', icon: 'water_drop' },
    { value: 'ac', label: 'Climatisation', icon: 'ac_unit' },
    { value: 'heating', label: 'Chauffage', icon: 'thermostat' },
    { value: 'internet', label: 'Internet', icon: 'wifi' },
    { value: 'security_camera', label: 'Caméra', icon: 'videocam' },
    { value: 'fire_alarm', label: 'Alarme incendie', icon: 'local_fire_department' },
    { value: 'parking', label: 'Parking', icon: 'local_parking' },
    { value: 'storage', label: 'Stockage', icon: 'inventory_2' }
  ];

  constructor(
    private dialogRef: MatDialogRef<BoxFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private boxService: BoxService
  ) {}

  ngOnInit() {
    if (this.data.box) {
      this.formData = {
        name: this.data.box.name || '',
        description: this.data.box.description || '',
        location: {
          floor: this.data.box.location?.floor || '',
          zone: this.data.box.location?.zone || '',
          position: this.data.box.location?.position || ''
        },
        dimensions: {
          area: this.data.box.dimensions?.area || null,
          length: this.data.box.dimensions?.length || null,
          width: this.data.box.dimensions?.width || null
        },
        currentRent: {
          amount: this.data.box.currentRent?.amount || 0,
          currency: this.data.box.currentRent?.currency || 'Ar'
        },
        equipment: [...(this.data.box.equipment || [])]
      };
    }
  }

  toggleEquipment(value: string, checked: boolean) {
    if (checked) {
      if (!this.formData.equipment.includes(value)) {
        this.formData.equipment.push(value);
      }
    } else {
      this.formData.equipment = this.formData.equipment.filter(e => e !== value);
    }
  }

  save() {
    if (!this.formData.name) return;

    this.isSaving.set(true);

    const payload = {
      name: this.formData.name,
      description: this.formData.description || undefined,
      location: this.formData.location,
      dimensions: this.formData.dimensions,
      currentRent: this.formData.currentRent,
      equipment: this.formData.equipment
    };

    const request = this.data.box
      ? this.boxService.updateBox(this.data.box._id, payload)
      : this.boxService.createBox(payload);

    request.subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }
}

