import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { BoxService } from '@shared/services/box.service';

@Component({
  selector: 'app-box-assign-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Assigner une boutique</h2>
    <mat-dialog-content>
      <div class="assign-content">
        <p class="box-info">
          <mat-icon>business</mat-icon>
          <strong>{{ data.box.name }}</strong>
          @if (data.box.location?.floor || data.box.location?.zone) {
            <span class="location">
              (Étage {{ data.box.location?.floor }}, Zone {{ data.box.location?.zone }})
            </span>
          }
        </p>

        @if (isLoading()) {
          <div class="loading">
            <mat-spinner diameter="40"></mat-spinner>
            <span>Chargement des boutiques...</span>
          </div>
        } @else {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Sélectionner une boutique</mat-label>
            <mat-select [(ngModel)]="selectedShopId">
              @for (shop of shops(); track shop._id) {
                <mat-option [value]="shop._id">
                  <div class="shop-option">
                    <span class="shop-name">{{ shop.name }}</span>
                    @if (shop.boxId) {
                      <span class="has-box">(déjà un box)</span>
                    }
                  </div>
                </mat-option>
              }
            </mat-select>
            <mat-hint>Seules les boutiques approuvées sont affichées</mat-hint>
          </mat-form-field>

          @if (shops().length === 0) {
            <div class="no-shops">
              <mat-icon>info</mat-icon>
              <p>Aucune boutique disponible pour l'assignation.</p>
            </div>
          }
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-raised-button color="primary" (click)="assign()"
              [disabled]="isSaving() || !selectedShopId">
        @if (isSaving()) {
          Assignation...
        } @else {
          Assigner
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { min-width: 400px; }
    .assign-content { padding: 16px 0; }
    .box-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: var(--bg-secondary);
      border-radius: 8px;
      margin-bottom: 24px;
      mat-icon { color: var(--primary); }
      .location { color: var(--text-secondary); font-size: 0.9rem; }
    }
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 32px;
      color: var(--text-secondary);
    }
    .full-width { width: 100%; }
    .shop-option {
      display: flex;
      align-items: center;
      gap: 8px;
      .shop-name { font-weight: 500; }
      .has-box { font-size: 0.85rem; color: var(--warning); }
    }
    .no-shops {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: var(--warning-light);
      border-radius: 8px;
      color: var(--warning);
      mat-icon { color: var(--warning); }
    }
    @media (max-width: 600px) {
      mat-dialog-content { min-width: auto; }
    }
  `]
})
export class BoxAssignDialogComponent implements OnInit {
  isLoading = signal(true);
  isSaving = signal(false);
  shops = signal([]);
  selectedShopId = null;

  constructor(
    private dialogRef: MatDialogRef<BoxAssignDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    private boxService: BoxService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadShops();
  }

  loadShops() {
    this.http.get(`${environment.apiUrl}/admin/shops`, {
      params: { status: 'approved', limit: '100' }
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.shops.set(response.data.shops || []);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  assign() {
    if (!this.selectedShopId) return;

    this.isSaving.set(true);

    this.boxService.assignToShop(this.data.box._id, this.selectedShopId).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }
}
