import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { environment } from '@env/environment';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { Category } from '@shared/models/product.model';

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
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
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

