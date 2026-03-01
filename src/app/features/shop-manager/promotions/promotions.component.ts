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
  templateUrl: './promotions.component.html',
  styleUrls: ['./promotions.component.scss'],})
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


