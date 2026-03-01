import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { ProductService } from '@shared/services/product.service';
import { CartService } from '@shared/services/cart.service';
import { Product, Shop, Variation, VariationOption } from '@shared/models/product.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    AriaryPipe,
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
    MatDividerModule,
    LoadingComponent,
    AriaryPipe
  ],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],})
export class ProductDetailComponent implements OnInit {
  product = signal<Product | null>(null);
  relatedProducts = signal<Product[]>([]);
  isLoading = signal(true);
  isAddingToCart = signal(false);

  selectedImage = signal<string>('');
  selectedVariations = signal<Record<string, string>>({});
  quantity = signal(1);

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const productId = params['id'];
      if (productId) {
        this.loadProduct(productId);
      }
    });
  }

  loadProduct(id: string): void {
    this.isLoading.set(true);
    this.quantity.set(1);
    this.selectedVariations.set({});

    this.productService.getProduct(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.product.set(response.data.product);
          this.relatedProducts.set(response.data.relatedProducts || []);

          if (response.data.product.images.length > 0) {
            this.selectedImage.set(response.data.product.images[0]);
          }

          // Pre-select first option for each variation
          if (response.data.product.variations) {
            const selections: Record<string, string> = {};
            response.data.product.variations.forEach(v => {
              const availableOption = v.options.find(o => o.stock > 0);
              if (availableOption) {
                selections[v.name] = availableOption.value;
              }
            });
            this.selectedVariations.set(selections);
          }
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.product.set(null);
      }
    });
  }

  getShop(): Shop | null {
    const shopId = this.product()?.shopId;
    if (typeof shopId === 'object' && shopId) {
      return shopId;
    }
    return null;
  }

  getDiscountPercent(): number {
    const p = this.product();
    if (!p || !p.compareAtPrice || p.compareAtPrice <= p.basePrice) return 0;
    return Math.round((1 - p.basePrice / p.compareAtPrice) * 100);
  }

  calculatePrice(): number {
    const p = this.product();
    if (!p) return 0;

    let price = p.basePrice;

    if (p.variations) {
      const selections = this.selectedVariations();
      p.variations.forEach(v => {
        const selectedValue = selections[v.name];
        if (selectedValue) {
          const option = v.options.find(o => o.value === selectedValue);
          if (option) {
            price += option.priceModifier;
          }
        }
      });
    }

    return price;
  }

  getMaxStock(): number {
    const p = this.product();
    if (!p) return 0;

    if (p.variations && p.variations.length > 0) {
      const selections = this.selectedVariations();
      let minStock = Infinity;

      p.variations.forEach(v => {
        const selectedValue = selections[v.name];
        if (selectedValue) {
          const option = v.options.find(o => o.value === selectedValue);
          if (option) {
            minStock = Math.min(minStock, option.stock);
          }
        }
      });

      return minStock === Infinity ? 0 : minStock;
    }

    return p.stock;
  }

  selectVariation(name: string, value: string): void {
    const current = this.selectedVariations();
    this.selectedVariations.set({ ...current, [name]: value });

    // Reset quantity if it exceeds new stock
    if (this.quantity() > this.getMaxStock()) {
      this.quantity.set(Math.max(1, this.getMaxStock()));
    }
  }

  increaseQuantity(): void {
    if (this.quantity() < this.getMaxStock()) {
      this.quantity.update(q => q + 1);
    }
  }

  decreaseQuantity(): void {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  addToCart(): void {
    const p = this.product();
    if (!p || this.getMaxStock() <= 0) return;

    this.isAddingToCart.set(true);

    const variation = Object.keys(this.selectedVariations()).length > 0
      ? this.selectedVariations()
      : undefined;

    this.cartService.addToCart(p._id, this.quantity(), variation).subscribe({
      next: () => {
        this.isAddingToCart.set(false);
        // Show success notification
      },
      error: () => {
        this.isAddingToCart.set(false);
        // Show error notification
      }
    });
  }

  getVariationValues(variation: Variation): string {
    return variation.options.map(o => o.value).join(', ');
  }
}


