import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Product, Category } from '@shared/models/product.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    LoadingComponent
  ],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  isEditMode = false;
  productId: string | null = null;

  categories = signal<Category[]>([]);
  images = signal<string[]>([]);
  tags = signal<string[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      shortDescription: ['', Validators.maxLength(200)],
      description: [''],
      basePrice: [0, [Validators.required, Validators.min(0)]],
      compareAtPrice: [null],
      stock: [0, [Validators.required, Validators.min(0)]],
      sku: [''],
      isActive: [true],
      isFeatured: [false],
      categories: [[]],
      variations: this.fb.array([])
    });
  }

  get variations(): FormArray {
    return this.productForm.get('variations') as FormArray;
  }

  getVariationOptions(variationIndex: number): FormArray {
    return this.variations.at(variationIndex).get('options') as FormArray;
  }

  ngOnInit(): void {
    this.loadCategories();

    this.route.params.subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.isEditMode = true;
        this.productId = params['id'];
        this.loadProduct(params['id']);
      }
    });
  }

  loadCategories(): void {
    this.http.get<any>(`${environment.apiUrl}/products/categories`).subscribe({
      next: (response) => {
        if (response.success) {
          this.categories.set(response.data.categories);
        }
      }
    });
  }

  loadProduct(id: string): void {
    this.isLoading.set(true);

    this.http.get<any>(`${environment.apiUrl}/shop/products/${id}`).subscribe({
      next: (response) => {
        if (response.success) {
          const product = response.data.product;

          this.productForm.patchValue({
            name: product.name,
            shortDescription: product.shortDescription,
            description: product.description,
            basePrice: product.basePrice,
            compareAtPrice: product.compareAtPrice,
            stock: product.stock,
            sku: product.sku,
            isActive: product.isActive,
            isFeatured: product.isFeatured,
            categories: product.categories?.map((c: any) => typeof c === 'string' ? c : c._id) || []
          });

          this.images.set(product.images || []);
          this.tags.set(product.tags || []);

          // Load variations
          if (product.variations) {
            product.variations.forEach((v: any) => {
              const variationGroup = this.fb.group({
                name: [v.name],
                options: this.fb.array(
                  v.options.map((o: any) => this.fb.group({
                    value: [o.value],
                    priceModifier: [o.priceModifier || 0],
                    stock: [o.stock || 0]
                  }))
                )
              });
              this.variations.push(variationGroup);
            });
          }
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  addVariation(): void {
    const variationGroup = this.fb.group({
      name: [''],
      options: this.fb.array([])
    });
    this.variations.push(variationGroup);
  }

  removeVariation(index: number): void {
    this.variations.removeAt(index);
  }

  addOption(variationIndex: number): void {
    const options = this.getVariationOptions(variationIndex);
    options.push(this.fb.group({
      value: [''],
      priceModifier: [0],
      stock: [0]
    }));
  }

  removeOption(variationIndex: number, optionIndex: number): void {
    const options = this.getVariationOptions(variationIndex);
    options.removeAt(optionIndex);
  }

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      // Convert images to Base64 client-side
      Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          this.images.update(images => [...images, base64]);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeImage(index: number): void {
    this.images.update(images => images.filter((_, i) => i !== index));
  }

  addTag(event: any): void {
    const value = (event.value || '').trim();
    if (value && !this.tags().includes(value)) {
      this.tags.update(tags => [...tags, value]);
    }
    event.chipInput?.clear();
  }

  removeTag(tag: string): void {
    this.tags.update(tags => tags.filter(t => t !== tag));
  }

  onSubmit(): void {
    if (this.productForm.invalid) return;

    this.isSaving.set(true);

    const productData = {
      ...this.productForm.value,
      images: this.images(),
      tags: this.tags()
    };

    const request = this.isEditMode
      ? this.http.put<any>(`${environment.apiUrl}/shop/products/${this.productId}`, productData)
      : this.http.post<any>(`${environment.apiUrl}/shop/products`, productData);

    request.subscribe({
      next: (response) => {
        this.isSaving.set(false);
        if (response.success) {
          this.router.navigate(['/shop-manager/products']);
        }
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }
}


