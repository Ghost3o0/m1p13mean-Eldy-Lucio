import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Category } from '@shared/models/product.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    LoadingComponent
  ],
  template: `
    <div class="categories-container">
      <div class="categories-header">
        <h1>Gestion des catégories</h1>
        <button mat-raised-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon>
          Ajouter une catégorie
        </button>
      </div>

      @if (isLoading()) {
        <app-loading message="Chargement des catégories..."></app-loading>
      }

      @if (!isLoading()) {
        <!-- Category Form -->
        @if (showForm()) {
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>{{ editingCategory() ? 'Modifier' : 'Nouvelle' }} catégorie</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="categoryForm" (ngSubmit)="saveCategory()">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Nom</mat-label>
                  <input matInput formControlName="name">
                  @if (categoryForm.get('name')?.hasError('required') && categoryForm.get('name')?.touched) {
                    <mat-error>Le nom est requis</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Description</mat-label>
                  <textarea matInput formControlName="description" rows="2"></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Catégorie parente</mat-label>
                  <mat-select formControlName="parentId">
                    <mat-option [value]="null">Aucune (catégorie principale)</mat-option>
                    @for (category of getParentCategoryOptions(); track category._id) {
                      <mat-option [value]="category._id">{{ category.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <div class="image-upload">
                  <label>Image de la catégorie</label>
                  <div class="image-preview" [class.has-image]="imagePreview()">
                    @if (imagePreview()) {
                      <img [src]="imagePreview()" alt="Category image">
                    } @else {
                      <mat-icon>image</mat-icon>
                    }
                    <label class="upload-overlay">
                      <input type="file" accept="image/*" (change)="onImageSelect($event)" hidden>
                      <mat-icon>camera_alt</mat-icon>
                    </label>
                  </div>
                </div>

                <mat-slide-toggle formControlName="isActive" color="primary">
                  Catégorie active
                </mat-slide-toggle>

                <mat-slide-toggle formControlName="isFeatured" color="accent">
                  Catégorie en vedette
                </mat-slide-toggle>

                <div class="form-actions">
                  <button mat-button type="button" (click)="closeForm()">Annuler</button>
                  <button
                    mat-raised-button
                    color="primary"
                    type="submit"
                    [disabled]="categoryForm.invalid || isSaving()">
                    @if (isSaving()) {
                      <mat-spinner diameter="20"></mat-spinner>
                    } @else {
                      {{ editingCategory() ? 'Enregistrer' : 'Créer' }}
                    }
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        }

        <!-- Categories Table -->
        <mat-card class="table-card">
          <table mat-table [dataSource]="categories()">
            <!-- Image -->
            <ng-container matColumnDef="image">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let category">
                <div class="category-image">
                  @if (category.image) {
                    <img [src]="category.image" [alt]="category.name">
                  } @else {
                    <mat-icon>category</mat-icon>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Name -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nom</th>
              <td mat-cell *matCellDef="let category">
                <div class="category-name-cell">
                  @if (category.parentId) {
                    <span class="parent-indicator">↳</span>
                  }
                  <span class="name">{{ category.name }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Parent -->
            <ng-container matColumnDef="parent">
              <th mat-header-cell *matHeaderCellDef>Parent</th>
              <td mat-cell *matCellDef="let category">
                {{ getParentName(category.parentId) }}
              </td>
            </ng-container>

            <!-- Products Count -->
            <ng-container matColumnDef="products">
              <th mat-header-cell *matHeaderCellDef>Produits</th>
              <td mat-cell *matCellDef="let category">
                {{ category.productCount || 0 }}
              </td>
            </ng-container>

            <!-- Status -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let category">
                <mat-slide-toggle
                  [checked]="category.isActive"
                  (change)="toggleActive(category)"
                  color="primary">
                </mat-slide-toggle>
              </td>
            </ng-container>

            <!-- Featured -->
            <ng-container matColumnDef="featured">
              <th mat-header-cell *matHeaderCellDef>Vedette</th>
              <td mat-cell *matCellDef="let category">
                <mat-icon [class.featured]="category.isFeatured">
                  {{ category.isFeatured ? 'star' : 'star_border' }}
                </mat-icon>
              </td>
            </ng-container>

            <!-- Actions -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let category">
                <button mat-icon-button (click)="editCategory(category)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteCategory(category)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          @if (categories().length === 0) {
            <div class="empty-state">
              <mat-icon>category</mat-icon>
              <h3>Aucune catégorie</h3>
              <p>Créez des catégories pour organiser vos produits.</p>
              <button mat-raised-button color="primary" (click)="openForm()">
                <mat-icon>add</mat-icon>
                Ajouter une catégorie
              </button>
            </div>
          }
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .categories-container {
      padding: 24px;
    }

    .categories-header {
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
      max-width: 600px;
    }

    mat-card-header {
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    .image-upload {
      margin: 16px 0;

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
    }

    mat-slide-toggle {
      display: block;
      margin: 12px 0;
    }

    .form-actions {
      margin-top: 24px;
      display: flex;
      justify-content: flex-end;
      gap: 16px;
    }

    .table-card {
      overflow: hidden;
    }

    table {
      width: 100%;
    }

    .category-image {
      width: 50px;
      height: 50px;
      border-radius: 8px;
      background: var(--bg-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      mat-icon {
        color: var(--gray-300);
      }
    }

    .category-name-cell {
      display: flex;
      align-items: center;
      gap: 8px;

      .parent-indicator {
        color: var(--text-secondary);
      }

      .name {
        font-weight: 500;
      }
    }

    mat-icon.featured {
      color: var(--warning);
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
      .categories-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;

        h1 {
          font-size: 1.5rem;
        }

        button {
          width: 100%;
        }
      }

      .form-card {
        max-width: 100%;
      }

      .table-card {
        overflow-x: auto;
      }
    }

    @media (max-width: 480px) {
      .categories-container {
        padding: 16px 12px;
      }

      .categories-header h1 {
        font-size: 1.25rem;
      }

      .form-card {
        padding: 12px;
      }

      .image-upload .image-preview {
        width: 100px;
        height: 100px;

        mat-icon {
          font-size: 36px;
          width: 36px;
          height: 36px;
        }
      }

      .form-actions {
        flex-direction: column;

        button {
          width: 100%;
        }
      }

      .category-image {
        width: 40px;
        height: 40px;
      }

      .empty-state {
        padding: 40px 16px;

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
        }

        h3 {
          font-size: 1.1rem;
        }
      }
    }
  `]
})
export class AdminCategoriesComponent implements OnInit {
  categories = signal<Category[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  showForm = signal(false);
  editingCategory = signal<Category | null>(null);
  imagePreview = signal<string | null>(null);

  displayedColumns = ['image', 'name', 'parent', 'products', 'status', 'featured', 'actions'];

  categoryForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      parentId: [null],
      isActive: [true],
      isFeatured: [false]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);

    this.http.get<any>(`${environment.apiUrl}/admin/categories`).subscribe({
      next: (response) => {
        if (response.success) {
          this.categories.set(response.data.categories);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  openForm(): void {
    this.editingCategory.set(null);
    this.imagePreview.set(null);
    this.categoryForm.reset({
      isActive: true,
      isFeatured: false
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingCategory.set(null);
    this.imagePreview.set(null);
  }

  editCategory(category: Category): void {
    this.editingCategory.set(category);
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description,
      parentId: category.parentId,
      isActive: category.isActive,
      isFeatured: category.isFeatured
    });
    this.imagePreview.set(category.image || null);
    this.showForm.set(true);
  }

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      const formData = new FormData();
      formData.append('image', input.files[0]);

      this.http.post<any>(`${environment.apiUrl}/admin/upload-image`, formData).subscribe({
        next: (response) => {
          if (response.success) {
            this.imagePreview.set(response.data.url);
          }
        }
      });
    }
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) return;

    this.isSaving.set(true);

    const data = {
      ...this.categoryForm.value,
      image: this.imagePreview()
    };

    const editing = this.editingCategory();
    const request = editing
      ? this.http.put<any>(`${environment.apiUrl}/admin/categories/${editing._id}`, data)
      : this.http.post<any>(`${environment.apiUrl}/admin/categories`, data);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.loadCategories();
          this.closeForm();
        }
        this.isSaving.set(false);
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }

  toggleActive(category: Category): void {
    this.http.put<any>(`${environment.apiUrl}/admin/categories/${category._id}`, {
      isActive: !category.isActive
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.categories.update(cats =>
            cats.map(c => c._id === category._id ? { ...c, isActive: !c.isActive } : c)
          );
        }
      }
    });
  }

  deleteCategory(category: Category): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`)) {
      this.http.delete<any>(`${environment.apiUrl}/admin/categories/${category._id}`).subscribe({
        next: (response) => {
          if (response.success) {
            this.categories.update(cats => cats.filter(c => c._id !== category._id));
          }
        }
      });
    }
  }

  getParentName(parentId: string | undefined): string {
    if (!parentId) return '-';
    const parent = this.categories().find(c => c._id === parentId);
    return parent?.name || '-';
  }

  getParentCategoryOptions(): Category[] {
    const editingId = this.editingCategory()?._id;
    return this.categories().filter(c => c._id !== editingId);
  }
}
