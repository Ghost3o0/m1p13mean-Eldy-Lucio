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
  template: `
    <div class="product-form-container">
      <div class="form-header">
        <a routerLink="/shop-manager/products" class="back-link">
          <mat-icon>arrow_back</mat-icon>
          Retour aux produits
        </a>
        <h1>{{ isEditMode ? 'Modifier le produit' : 'Nouveau produit' }}</h1>
      </div>

      @if (isLoading()) {
        <app-loading message="Chargement..."></app-loading>
      }

      @if (!isLoading()) {
        <form [formGroup]="productForm" (ngSubmit)="onSubmit()">
          <div class="form-content">
            <div class="main-column">
              <!-- Basic Info -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Informations de base</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Nom du produit</mat-label>
                    <input matInput formControlName="name">
                    @if (productForm.get('name')?.hasError('required') && productForm.get('name')?.touched) {
                      <mat-error>Le nom est requis</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Description courte</mat-label>
                    <textarea matInput formControlName="shortDescription" rows="2"></textarea>
                    <mat-hint>{{ productForm.get('shortDescription')?.value?.length || 0 }}/200</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Description complète</mat-label>
                    <textarea matInput formControlName="description" rows="6"></textarea>
                  </mat-form-field>
                </mat-card-content>
              </mat-card>

              <!-- Images -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Images</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="images-section">
                    <div class="images-grid">
                      @for (image of images(); track image; let i = $index) {
                        <div class="image-item">
                          <img [src]="image" alt="Product image">
                          <button mat-icon-button class="remove-btn" (click)="removeImage(i)">
                            <mat-icon>close</mat-icon>
                          </button>
                          @if (i === 0) {
                            <span class="main-badge">Principale</span>
                          }
                        </div>
                      }
                      <label class="add-image-btn">
                        <input type="file" accept="image/*" multiple (change)="onImageSelect($event)" hidden>
                        <mat-icon>add_photo_alternate</mat-icon>
                        <span>Ajouter</span>
                      </label>
                    </div>
                    <p class="hint">La première image sera l'image principale. Vous pouvez réordonner les images en les glissant.</p>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Pricing -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Prix et stock</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="price-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Prix</mat-label>
                      <input matInput type="number" formControlName="basePrice" min="0" step="0.01">
                      <span matSuffix>€</span>
                      @if (productForm.get('basePrice')?.hasError('required') && productForm.get('basePrice')?.touched) {
                        <mat-error>Le prix est requis</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Prix barré</mat-label>
                      <input matInput type="number" formControlName="compareAtPrice" min="0" step="0.01">
                      <span matSuffix>€</span>
                      <mat-hint>Pour afficher une promotion</mat-hint>
                    </mat-form-field>
                  </div>

                  <div class="price-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Stock</mat-label>
                      <input matInput type="number" formControlName="stock" min="0">
                      @if (productForm.get('stock')?.hasError('required') && productForm.get('stock')?.touched) {
                        <mat-error>Le stock est requis</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>SKU / Référence</mat-label>
                      <input matInput formControlName="sku">
                    </mat-form-field>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Variations -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Variations</mat-card-title>
                  <button mat-button type="button" (click)="addVariation()">
                    <mat-icon>add</mat-icon>
                    Ajouter une variation
                  </button>
                </mat-card-header>
                <mat-card-content>
                  @if (variations.length === 0) {
                    <p class="hint">Ajoutez des variations si votre produit existe en plusieurs tailles, couleurs, etc.</p>
                  }

                  @for (variation of variations.controls; track variation; let i = $index) {
                    <mat-expansion-panel [formGroupName]="i" class="variation-panel">
                      <mat-expansion-panel-header>
                        <mat-panel-title>
                          {{ variation.get('name')?.value || 'Nouvelle variation' }}
                        </mat-panel-title>
                        <mat-panel-description>
                          {{ getVariationOptions(i).length }} options
                        </mat-panel-description>
                      </mat-expansion-panel-header>

                      <div class="variation-content">
                        <mat-form-field appearance="outline" class="full-width">
                          <mat-label>Nom de la variation</mat-label>
                          <input matInput formControlName="name" placeholder="Ex: Taille, Couleur">
                        </mat-form-field>

                        <h4>Options</h4>
                        <div formArrayName="options" class="options-list">
                          @for (option of getVariationOptions(i).controls; track option; let j = $index) {
                            <div [formGroupName]="j" class="option-row">
                              <mat-form-field appearance="outline">
                                <mat-label>Valeur</mat-label>
                                <input matInput formControlName="value" placeholder="Ex: S, M, L">
                              </mat-form-field>

                              <mat-form-field appearance="outline">
                                <mat-label>Modificateur prix</mat-label>
                                <input matInput type="number" formControlName="priceModifier" step="0.01">
                                <span matSuffix>€</span>
                              </mat-form-field>

                              <mat-form-field appearance="outline">
                                <mat-label>Stock</mat-label>
                                <input matInput type="number" formControlName="stock" min="0">
                              </mat-form-field>

                              <button mat-icon-button type="button" (click)="removeOption(i, j)">
                                <mat-icon>delete</mat-icon>
                              </button>
                            </div>
                          }
                        </div>

                        <button mat-button type="button" (click)="addOption(i)">
                          <mat-icon>add</mat-icon>
                          Ajouter une option
                        </button>
                      </div>

                      <mat-action-row>
                        <button mat-button type="button" color="warn" (click)="removeVariation(i)">Supprimer la variation</button>
                      </mat-action-row>
                    </mat-expansion-panel>
                  }
                </mat-card-content>
              </mat-card>
            </div>

            <div class="side-column">
              <!-- Status -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Statut</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-slide-toggle formControlName="isActive" color="primary">
                    Produit actif
                  </mat-slide-toggle>
                  <p class="hint">Un produit inactif ne sera pas visible par les clients.</p>

                  <mat-slide-toggle formControlName="isFeatured" color="accent">
                    Produit en vedette
                  </mat-slide-toggle>
                  <p class="hint">Les produits en vedette sont mis en avant sur la page d'accueil.</p>
                </mat-card-content>
              </mat-card>

              <!-- Categories -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Catégories</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Catégories</mat-label>
                    <mat-select formControlName="categories" multiple>
                      @for (category of categories(); track category._id) {
                        <mat-option [value]="category._id">{{ category.name }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </mat-card-content>
              </mat-card>

              <!-- Tags -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Tags</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Tags</mat-label>
                    <mat-chip-grid #chipGrid>
                      @for (tag of tags(); track tag) {
                        <mat-chip-row (removed)="removeTag(tag)">
                          {{ tag }}
                          <mat-icon matChipRemove>cancel</mat-icon>
                        </mat-chip-row>
                      }
                    </mat-chip-grid>
                    <input
                      matInput
                      placeholder="Ajouter un tag..."
                      [matChipInputFor]="chipGrid"
                      (matChipInputTokenEnd)="addTag($event)">
                  </mat-form-field>
                  <p class="hint">Appuyez sur Entrée pour ajouter un tag.</p>
                </mat-card-content>
              </mat-card>

              <!-- Actions -->
              <div class="form-actions">
                <button mat-stroked-button type="button" routerLink="/shop-manager/products">
                  Annuler
                </button>
                <button
                  mat-raised-button
                  color="primary"
                  type="submit"
                  [disabled]="productForm.invalid || isSaving()">
                  @if (isSaving()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    {{ isEditMode ? 'Enregistrer' : 'Créer le produit' }}
                  }
                </button>
              </div>
            </div>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .product-form-container {
      padding: 24px;
    }

    .form-header {
      margin-bottom: 24px;

      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--primary);
        text-decoration: none;
        margin-bottom: 8px;

        &:hover {
          text-decoration: underline;
        }

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      h1 {
        font-size: 2rem;
        margin: 0;
      }
    }

    .form-content {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 24px;
      align-items: start;
    }

    .main-column,
    .side-column {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    mat-card {
      padding: 16px;
    }

    mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    .price-row {
      display: flex;
      gap: 16px;

      mat-form-field {
        flex: 1;
      }
    }

    .images-section {
      .images-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-bottom: 16px;
      }

      .image-item {
        position: relative;
        width: 120px;
        height: 120px;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 8px;
        }

        .remove-btn {
          position: absolute;
          top: -8px;
          right: -8px;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .main-badge {
          position: absolute;
          bottom: 4px;
          left: 4px;
          background: var(--primary);
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
        }
      }

      .add-image-btn {
        width: 120px;
        height: 120px;
        border: 2px dashed var(--border-color);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        cursor: pointer;
        color: var(--text-secondary);
        transition: border-color 0.2s, color 0.2s;

        &:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
      }
    }

    .variation-panel {
      margin-bottom: 16px;
    }

    .variation-content {
      padding: 16px 0;
    }

    .options-list {
      margin-bottom: 16px;
    }

    .option-row {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      margin-bottom: 8px;

      mat-form-field {
        flex: 1;
      }
    }

    .hint {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin: 8px 0;
    }

    mat-slide-toggle {
      margin-bottom: 8px;
    }

    .form-actions {
      display: flex;
      gap: 16px;
      justify-content: flex-end;

      button {
        min-width: 140px;
      }
    }

    @media (max-width: 768px) {
      .form-content {
        grid-template-columns: 1fr;
      }

      .price-row {
        flex-direction: column;
        gap: 0;
      }

      .option-row {
        flex-wrap: wrap;
      }
    }
  `]
})
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
