import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Promotion } from '@shared/models/order.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';

@Component({
  selector: 'app-shop-promotions',
  standalone: true,
  imports: [
    AriaryPipe,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    LoadingComponent,
    AriaryPipe
  ],
  template: `
    <div class="promotions-container">
      <div class="promotions-header">
        <h1>Codes promo</h1>
        <button mat-raised-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon>
          Créer un code promo
        </button>
      </div>

      @if (isLoading()) {
        <app-loading message="Chargement des promotions..."></app-loading>
      }

      @if (!isLoading()) {
        <!-- Promotion Form -->
        @if (showForm()) {
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>{{ editingPromotion() ? 'Modifier' : 'Nouveau' }} code promo</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="promoForm" (ngSubmit)="savePromotion()">
                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Code</mat-label>
                    <input matInput formControlName="code" [readonly]="!!editingPromotion()">
                    <mat-hint>Le code que les clients utiliseront</mat-hint>
                    @if (promoForm.get('code')?.hasError('required') && promoForm.get('code')?.touched) {
                      <mat-error>Le code est requis</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Nom (optionnel)</mat-label>
                    <input matInput formControlName="name">
                  </mat-form-field>
                </div>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Description</mat-label>
                  <textarea matInput formControlName="description" rows="2"></textarea>
                </mat-form-field>

                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Type de réduction</mat-label>
                    <mat-select formControlName="type">
                      <mat-option value="percentage">Pourcentage (%)</mat-option>
                      <mat-option value="fixed">Montant fixe (€)</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Valeur</mat-label>
                    <input matInput type="number" formControlName="value" min="0">
                    <span matSuffix>{{ promoForm.get('type')?.value === 'percentage' ? '%' : '€' }}</span>
                    @if (promoForm.get('value')?.hasError('required') && promoForm.get('value')?.touched) {
                      <mat-error>La valeur est requise</mat-error>
                    }
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Achat minimum</mat-label>
                    <input matInput type="number" formControlName="minPurchase" min="0">
                    <span matSuffix>€</span>
                    <mat-hint>0 = pas de minimum</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Réduction max</mat-label>
                    <input matInput type="number" formControlName="maxDiscount" min="0">
                    <span matSuffix>€</span>
                    <mat-hint>0 = pas de limite</mat-hint>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Date de début</mat-label>
                    <input matInput [matDatepicker]="startPicker" formControlName="startDate">
                    <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                    <mat-datepicker #startPicker></mat-datepicker>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Date de fin</mat-label>
                    <input matInput [matDatepicker]="endPicker" formControlName="endDate">
                    <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                    <mat-datepicker #endPicker></mat-datepicker>
                  </mat-form-field>
                </div>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Limite d'utilisation</mat-label>
                  <input matInput type="number" formControlName="usageLimit" min="0">
                  <mat-hint>0 = illimité</mat-hint>
                </mat-form-field>

                <mat-slide-toggle formControlName="isActive" color="primary">
                  Code actif
                </mat-slide-toggle>

                <div class="form-actions">
                  <button mat-button type="button" (click)="closeForm()">Annuler</button>
                  <button
                    mat-raised-button
                    color="primary"
                    type="submit"
                    [disabled]="promoForm.invalid || isSaving()">
                    @if (isSaving()) {
                      <mat-spinner diameter="20"></mat-spinner>
                    } @else {
                      {{ editingPromotion() ? 'Enregistrer' : 'Créer' }}
                    }
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        }

        <!-- Promotions List -->
        <mat-card class="list-card">
          <table mat-table [dataSource]="promotions()">
            <!-- Code -->
            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef>Code</th>
              <td mat-cell *matCellDef="let promo">
                <strong>{{ promo.code }}</strong>
                @if (promo.name) {
                  <br><span class="promo-name">{{ promo.name }}</span>
                }
              </td>
            </ng-container>

            <!-- Discount -->
            <ng-container matColumnDef="discount">
              <th mat-header-cell *matHeaderCellDef>Réduction</th>
              <td mat-cell *matCellDef="let promo">
                @if (promo.type === 'percentage') {
                  {{ promo.value }}%
                } @else {
                  {{ promo.value | ariary }}
                }
              </td>
            </ng-container>

            <!-- Usage -->
            <ng-container matColumnDef="usage">
              <th mat-header-cell *matHeaderCellDef>Utilisation</th>
              <td mat-cell *matCellDef="let promo">
                {{ promo.usedCount }} / {{ promo.usageLimit || '∞' }}
              </td>
            </ng-container>

            <!-- Period -->
            <ng-container matColumnDef="period">
              <th mat-header-cell *matHeaderCellDef>Période</th>
              <td mat-cell *matCellDef="let promo">
                {{ promo.startDate | date:'dd/MM/yyyy' }} - {{ promo.endDate | date:'dd/MM/yyyy' }}
              </td>
            </ng-container>

            <!-- Status -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let promo">
                <mat-chip [class]="getStatusClass(promo)">
                  {{ getStatusLabel(promo) }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Actions -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let promo">
                <button mat-icon-button (click)="editPromotion(promo)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button (click)="toggleStatus(promo)">
                  <mat-icon>{{ promo.isActive ? 'pause' : 'play_arrow' }}</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deletePromotion(promo)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          @if (promotions().length === 0) {
            <div class="empty-state">
              <mat-icon>local_offer</mat-icon>
              <h3>Aucun code promo</h3>
              <p>Créez des codes promo pour attirer plus de clients.</p>
              <button mat-raised-button color="primary" (click)="openForm()">
                <mat-icon>add</mat-icon>
                Créer un code promo
              </button>
            </div>
          }
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .promotions-container {
      padding: 24px;
    }

    .promotions-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h1 {
        font-size: 2rem;
        margin: 0;
      }
    }

    .form-card {
      margin-bottom: 24px;
      padding: 16px;
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

    mat-slide-toggle {
      margin: 16px 0;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 16px;
    }

    .list-card {
      overflow: hidden;
    }

    table {
      width: 100%;
    }

    .promo-name {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    mat-chip {
      &.status-active {
        background: var(--success-light) !important;
        color: var(--success) !important;
      }

      &.status-inactive {
        background: var(--bg-secondary) !important;
        color: var(--text-secondary) !important;
      }

      &.status-expired {
        background: var(--error-light) !important;
        color: var(--error) !important;
      }

      &.status-scheduled {
        background: var(--primary-50) !important;
        color: var(--primary) !important;
      }
    }

    .empty-state {
      text-align: center;
      padding: 64px 24px;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: var(--gray-300);
      }

      h3 {
        margin: 16px 0 8px;
      }

      p {
        color: var(--text-secondary);
        margin-bottom: 24px;
      }
    }

    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
    }
  `]
})
export class ShopPromotionsComponent implements OnInit {
  promotions = signal<Promotion[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  showForm = signal(false);
  editingPromotion = signal<Promotion | null>(null);

  displayedColumns = ['code', 'discount', 'usage', 'period', 'status', 'actions'];

  promoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.promoForm = this.fb.group({
      code: ['', Validators.required],
      name: [''],
      description: [''],
      type: ['percentage', Validators.required],
      value: [10, [Validators.required, Validators.min(0)]],
      minPurchase: [0],
      maxDiscount: [0],
      startDate: [new Date(), Validators.required],
      endDate: [new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), Validators.required],
      usageLimit: [0],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadPromotions();
  }

  loadPromotions(): void {
    this.isLoading.set(true);

    this.http.get<any>(`${environment.apiUrl}/shop/promotions`).subscribe({
      next: (response) => {
        if (response.success) {
          this.promotions.set(response.data.promotions);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  openForm(): void {
    this.editingPromotion.set(null);
    this.promoForm.reset({
      type: 'percentage',
      value: 10,
      minPurchase: 0,
      maxDiscount: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usageLimit: 0,
      isActive: true
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingPromotion.set(null);
  }

  editPromotion(promo: Promotion): void {
    this.editingPromotion.set(promo);
    this.promoForm.patchValue({
      code: promo.code,
      name: promo.name,
      description: promo.description,
      type: promo.type,
      value: promo.value,
      minPurchase: promo.minPurchase || 0,
      maxDiscount: promo.maxDiscount || 0,
      startDate: new Date(promo.startDate),
      endDate: new Date(promo.endDate),
      usageLimit: promo.usageLimit || 0,
      isActive: promo.isActive
    });
    this.showForm.set(true);
  }

  savePromotion(): void {
    if (this.promoForm.invalid) return;

    this.isSaving.set(true);

    const data = this.promoForm.value;
    const editing = this.editingPromotion();

    const request = editing
      ? this.http.put<any>(`${environment.apiUrl}/shop/promotions/${editing._id}`, data)
      : this.http.post<any>(`${environment.apiUrl}/shop/promotions`, data);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.loadPromotions();
          this.closeForm();
        }
        this.isSaving.set(false);
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }

  toggleStatus(promo: Promotion): void {
    this.http.put<any>(`${environment.apiUrl}/shop/promotions/${promo._id}`, {
      isActive: !promo.isActive
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.promotions.update(promos =>
            promos.map(p => p._id === promo._id ? { ...p, isActive: !p.isActive } : p)
          );
        }
      }
    });
  }

  deletePromotion(promo: Promotion): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le code "${promo.code}" ?`)) {
      this.http.delete<any>(`${environment.apiUrl}/shop/promotions/${promo._id}`).subscribe({
        next: (response) => {
          if (response.success) {
            this.promotions.update(promos => promos.filter(p => p._id !== promo._id));
          }
        }
      });
    }
  }

  getStatusClass(promo: Promotion): string {
    const now = new Date();
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);

    if (!promo.isActive) return 'status-inactive';
    if (now > end) return 'status-expired';
    if (now < start) return 'status-scheduled';
    return 'status-active';
  }

  getStatusLabel(promo: Promotion): string {
    const now = new Date();
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);

    if (!promo.isActive) return 'Inactif';
    if (now > end) return 'Expiré';
    if (now < start) return 'Programmé';
    return 'Actif';
  }
}
