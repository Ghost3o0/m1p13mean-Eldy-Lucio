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
  template: `
    <h2 mat-dialog-title>{{ data.box ? 'Modifier le box' : 'Nouveau box' }}</h2>
    <mat-dialog-content>
      <form class="box-form">
        <!-- Basic Info -->
        <div class="form-section">
          <h3>Informations générales</h3>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nom du box</mat-label>
            <input matInput [(ngModel)]="formData.name" name="name" required placeholder="Ex: Box A-101">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description</mat-label>
            <textarea matInput [(ngModel)]="formData.description" name="description" rows="3"
                      placeholder="Description du box..."></textarea>
          </mat-form-field>
        </div>

        <mat-divider></mat-divider>

        <!-- Location -->
        <div class="form-section">
          <h3>Emplacement</h3>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Étage</mat-label>
              <mat-select [(ngModel)]="formData.location.floor" name="floor">
                <mat-option value="RDC">RDC</mat-option>
                <mat-option value="1">1er étage</mat-option>
                <mat-option value="2">2ème étage</mat-option>
                <mat-option value="3">3ème étage</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Zone</mat-label>
              <mat-select [(ngModel)]="formData.location.zone" name="zone">
                <mat-option value="A">Zone A</mat-option>
                <mat-option value="B">Zone B</mat-option>
                <mat-option value="C">Zone C</mat-option>
                <mat-option value="D">Zone D</mat-option>
                <mat-option value="E">Zone E</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Position</mat-label>
              <input matInput [(ngModel)]="formData.location.position" name="position" placeholder="Ex: 101">
            </mat-form-field>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Dimensions -->
        <div class="form-section">
          <h3>Dimensions</h3>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Surface (m²)</mat-label>
              <input matInput type="number" [(ngModel)]="formData.dimensions.area" name="area" min="0">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Longueur (m)</mat-label>
              <input matInput type="number" [(ngModel)]="formData.dimensions.length" name="length" min="0">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Largeur (m)</mat-label>
              <input matInput type="number" [(ngModel)]="formData.dimensions.width" name="width" min="0">
            </mat-form-field>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Rent -->
        <div class="form-section">
          <h3>Loyer</h3>
          <div class="form-row">
            <mat-form-field appearance="outline" class="rent-field">
              <mat-label>Montant mensuel</mat-label>
              <input matInput type="number" [(ngModel)]="formData.currentRent.amount" name="rentAmount" min="0" required>
              <span matTextSuffix>Ar</span>
            </mat-form-field>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Equipment -->
        <div class="form-section">
          <h3>Équipements</h3>
          <div class="equipment-grid">
            @for (eq of equipmentOptions; track eq.value) {
              <mat-checkbox
                [checked]="formData.equipment.includes(eq.value)"
                (change)="toggleEquipment(eq.value, $event.checked)">
                <mat-icon class="eq-icon">{{ eq.icon }}</mat-icon>
                {{ eq.label }}
              </mat-checkbox>
            }
          </div>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="isSaving() || !formData.name">
        @if (isSaving()) {
          Enregistrement...
        } @else {
          {{ data.box ? 'Modifier' : 'Créer' }}
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 500px;
    }

    .box-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-section {
      padding: 16px 0;

      h3 {
        margin: 0 0 16px 0;
        font-size: 1rem;
        color: var(--text-secondary);
      }
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

    .rent-field {
      max-width: 200px;
    }

    .equipment-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;

      mat-checkbox {
        .eq-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          margin-right: 4px;
          vertical-align: middle;
        }
      }
    }

    mat-divider {
      margin: 8px 0;
    }

    @media (max-width: 600px) {
      mat-dialog-content {
        min-width: auto;
      }

      .form-row {
        flex-direction: column;
      }

      .equipment-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class BoxFormDialogComponent implements OnInit {
  isSaving = signal(false);

  formData = {
    name: '',
    description: '',
    location: { floor: '', zone: '', position: '' },
    dimensions: { area: null, length: null, width: null },
    currentRent: { amount: 0, currency: 'Ar' },
    equipment: []
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
    @Inject(MAT_DIALOG_DATA) public data,
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

  toggleEquipment(value, checked) {
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
