import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CartService } from '@shared/services/cart.service';
import { OrderService } from '@shared/services/order.service';
import { DeliveryService } from '@shared/services/delivery.service';
import { AuthService } from '@core/services/auth.service';
import { Cart, Address } from '@shared/models/order.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AriaryPipe } from '@shared/pipes/ariary.pipe';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    AriaryPipe,
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatStepperModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    LoadingComponent,
    AriaryPipe
  ],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],})
export class CheckoutComponent implements OnInit {
  deliveryForm: FormGroup;
  addressForm: FormGroup;
  paymentForm: FormGroup;

  isProcessing = signal(false);
  savedAddresses = signal<Address[]>([]);
  selectedAddressId: string | null = null;
  orderNotes = '';
  
  deliveryFees = signal<Map<string, number>>(new Map()); // shopId -> fee
  deliveryInfo = signal<any>(null);
  isCalculatingDelivery = signal(false);

  cart = computed(() => this.cartService.cart());

  constructor(
    private fb: FormBuilder,
    public cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private deliveryService: DeliveryService,
    private router: Router
  ) {
    this.deliveryForm = this.fb.group({
      deliveryMethod: ['delivery', Validators.required]
    });

    this.addressForm = this.fb.group({
      label: [''],
      street: ['', Validators.required],
      city: ['', Validators.required],
      zipCode: ['', Validators.required],
      phone: [''],
      instructions: ['']
    });

    this.paymentForm = this.fb.group({
      paymentMethod: ['card', Validators.required],
      cardNumber: [''],
      cardExpiry: [''],
      cardCvv: [''],
      cardName: ['']
    });

    // Add card validators when card is selected
    this.paymentForm.get('paymentMethod')?.valueChanges.subscribe(method => {
      if (method === 'card' && this.isDelivery()) {
        this.paymentForm.get('cardNumber')?.setValidators([Validators.required]);
        this.paymentForm.get('cardExpiry')?.setValidators([Validators.required]);
        this.paymentForm.get('cardCvv')?.setValidators([Validators.required]);
        this.paymentForm.get('cardName')?.setValidators([Validators.required]);
      } else {
        this.paymentForm.get('cardNumber')?.clearValidators();
        this.paymentForm.get('cardExpiry')?.clearValidators();
        this.paymentForm.get('cardCvv')?.clearValidators();
        this.paymentForm.get('cardName')?.clearValidators();
      }
      this.paymentForm.get('cardNumber')?.updateValueAndValidity();
      this.paymentForm.get('cardExpiry')?.updateValueAndValidity();
      this.paymentForm.get('cardCvv')?.updateValueAndValidity();
      this.paymentForm.get('cardName')?.updateValueAndValidity();
    });

    // Handle delivery method changes - set payment to cash for pickup
    this.deliveryForm.get('deliveryMethod')?.valueChanges.subscribe(method => {
      if (method === 'pickup') {
        // For pickup, payment is done at the store - set to cash and clear all validators
        this.paymentForm.patchValue({ paymentMethod: 'cash' });
        this.paymentForm.get('cardNumber')?.clearValidators();
        this.paymentForm.get('cardExpiry')?.clearValidators();
        this.paymentForm.get('cardCvv')?.clearValidators();
        this.paymentForm.get('cardName')?.clearValidators();
        this.paymentForm.get('cardNumber')?.setValue('');
        this.paymentForm.get('cardExpiry')?.setValue('');
        this.paymentForm.get('cardCvv')?.setValue('');
        this.paymentForm.get('cardName')?.setValue('');
      } else {
        this.paymentForm.patchValue({ paymentMethod: 'card' });
      }
      // Update validity of all controls and the form itself
      this.paymentForm.get('cardNumber')?.updateValueAndValidity();
      this.paymentForm.get('cardExpiry')?.updateValueAndValidity();
      this.paymentForm.get('cardCvv')?.updateValueAndValidity();
      this.paymentForm.get('cardName')?.updateValueAndValidity();
      this.paymentForm.updateValueAndValidity();
    });

    // Watch address changes to recalculate delivery fees
    this.addressForm.get('zipCode')?.valueChanges.subscribe(() => {
      if (this.isDelivery() && this.cart()?.items.length! > 0) {
        this.calculateDeliveryFees();
      }
    });
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }

    this.cartService.loadCart().subscribe();
    this.loadSavedAddresses();
  }

  loadSavedAddresses(): void {
    const user = this.authService.currentUser();
    if (user?.addresses && user.addresses.length > 0) {
      this.savedAddresses.set(user.addresses);
      const defaultAddress = user.addresses.find((a: any) => a.isDefault) || user.addresses[0];
      this.selectedAddressId = defaultAddress.label || 'new';
    } else {
      this.selectedAddressId = 'new';
    }
  }

  isDelivery(): boolean {
    return this.deliveryForm.get('deliveryMethod')?.value === 'delivery';
  }

  selectAddress(address: Address): void {
    this.selectedAddressId = address.label || null;
    this.addressForm.patchValue(address);
    if (this.isDelivery() && this.cart()?.items.length! > 0) {
      this.calculateDeliveryFees();
    }
  }

  getSelectedAddress(): Address | null {
    if (this.selectedAddressId === 'new') {
      return this.addressForm.value;
    }
    return this.savedAddresses().find(a => a.label === this.selectedAddressId) || null;
  }

  calculateDeliveryFees(): void {
    const c = this.cart();
    if (!c || c.items.length === 0) return;

    const zipCode = this.addressForm.get('zipCode')?.value;
    if (!zipCode) return;

    this.isCalculatingDelivery.set(true);

    // Get unique shop IDs from cart items (normalize Shop object to its _id)
    const shopIds: string[] = Array.from(
      new Set(
        c.items.map(item => (typeof item.shopId === 'string' ? item.shopId : item.shopId._id))
      )
    );

    this.deliveryService.calculateDeliveryFee(shopIds, { postalCode: zipCode }).subscribe({
      next: (response: any) => {
        if (response.success) {
          const fees = new Map<string, number>();
          
          // Store fees per shop
          if (Array.isArray(response.data.deliveryInfo)) {
            response.data.deliveryInfo.forEach((delivery: any) => {
              fees.set(delivery.shopId, delivery.deliveryFee || 0);
            });
          }

          this.deliveryFees.set(fees);
          this.deliveryInfo.set(response.data);
        }
        this.isCalculatingDelivery.set(false);
      },
      error: (error) => {
        console.error('Error calculating delivery fees:', error);
        this.isCalculatingDelivery.set(false);
      }
    });
  }

  getDeliveryFee(): number {
    if (!this.isDelivery()) return 0;

    const c = this.cart();
    if (!c || c.items.length === 0) return 0;

    // Sum up delivery fees for all shops in cart
    let totalFee = 0;
    const fees = this.deliveryFees();
    
    const shopIds: string[] = Array.from(
      new Set(
        c.items.map(item => (typeof item.shopId === 'string' ? item.shopId : item.shopId._id))
      )
    );

    shopIds.forEach(shopId => {
      const fee = fees.get(shopId) || 0;
      totalFee += fee;
    });

    return totalFee;
  }

  calculateTotal(): number {
    const c = this.cart();
    if (!c) return 0;
    return c.subtotal - (c.discount || 0) + this.getDeliveryFee();
  }

  placeOrder(): void {
    this.isProcessing.set(true);

    const address = this.getSelectedAddress();
    const orderData = {
      deliveryMethod: this.deliveryForm.get('deliveryMethod')?.value as 'pickup' | 'delivery',
      deliveryAddress: this.isDelivery() && address ? {
        street: address.street,
        city: address.city,
        zipCode: address.zipCode,
        country: address.country,
        phone: address.phone
      } : undefined,
      paymentMethod: this.paymentForm.get('paymentMethod')?.value as 'card' | 'cash' | 'paypal',
      notes: this.orderNotes || undefined
    };

    this.orderService.checkout(orderData).subscribe({
      next: (response: any) => {
        this.isProcessing.set(false);
        if (response.success) {
          this.cartService.resetCart();
          this.router.navigate(['/orders', response.data.order._id], {
            queryParams: { success: true }
          });
        }
      },
      error: (_error: any) => {
        this.isProcessing.set(false);
        // Show error notification
      }
    });
  }
}


