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
  template: `
    <div class="checkout-container container">
      <h1>Finaliser la commande</h1>

      @if (cartService.isLoading()) {
        <app-loading message="Chargement..."></app-loading>
      }

      @if (!cartService.isLoading() && (!cart() || cart()!.items.length === 0)) {
        <div class="empty-cart">
          <mat-icon>shopping_cart</mat-icon>
          <h2>Votre panier est vide</h2>
          <p>Ajoutez des articles à votre panier avant de passer commande.</p>
          <a routerLink="/catalog" mat-raised-button color="primary">
            Explorer le catalogue
          </a>
        </div>
      }

      @if (!cartService.isLoading() && cart() && cart()!.items.length > 0) {
        <div class="checkout-content">
          <mat-stepper linear #stepper>
            <!-- Step 1: Delivery Method -->
            <mat-step [stepControl]="deliveryForm" label="Mode de livraison">
              <form [formGroup]="deliveryForm">
                <h3>Comment souhaitez-vous recevoir votre commande ?</h3>

                <mat-radio-group formControlName="deliveryMethod" class="delivery-options">
                  <mat-card class="delivery-option" [class.selected]="deliveryForm.get('deliveryMethod')?.value === 'delivery'">
                    <mat-radio-button value="delivery">
                      <div class="option-content">
                        <mat-icon>local_shipping</mat-icon>
                        <div class="option-text">
                          <strong>Livraison à domicile</strong>
                          <span>Recevez votre commande à l'adresse de votre choix</span>
                          <span class="price">{{ getDeliveryFee() | ariary }}</span>
                        </div>
                      </div>
                    </mat-radio-button>
                  </mat-card>

                  <mat-card class="delivery-option" [class.selected]="deliveryForm.get('deliveryMethod')?.value === 'pickup'">
                    <mat-radio-button value="pickup">
                      <div class="option-content">
                        <mat-icon>store</mat-icon>
                        <div class="option-text">
                          <strong>Retrait en boutique</strong>
                          <span>Récupérez votre commande directement en magasin</span>
                          <span class="price free">Gratuit</span>
                        </div>
                      </div>
                    </mat-radio-button>
                  </mat-card>
                </mat-radio-group>

                <div class="step-actions">
                  <button mat-raised-button color="primary" matStepperNext [disabled]="deliveryForm.invalid">
                    Continuer
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Step 2: Address -->
            <mat-step [completed]="!isDelivery() || addressForm.valid || selectedAddressId !== 'new'" label="Adresse">
              <form [formGroup]="addressForm">
                @if (isDelivery()) {
                  <h3>Adresse de livraison</h3>

                  @if (savedAddresses().length > 0) {
                    <div class="saved-addresses">
                      <h4>Adresses enregistrées</h4>
                      <mat-radio-group [(ngModel)]="selectedAddressId" [ngModelOptions]="{standalone: true}" class="address-list">
                        @for (address of savedAddresses(); track address.label) {
                          <mat-card class="address-card" [class.selected]="selectedAddressId === address.label" (click)="selectAddress(address)">
                            <mat-radio-button [value]="address.label">
                              <strong>{{ address.label }}</strong>
                              <p>{{ address.street }}</p>
                              <p>{{ address.zipCode }} {{ address.city }}</p>
                            </mat-radio-button>
                          </mat-card>
                        }
                        <mat-card class="address-card new-address" [class.selected]="selectedAddressId === 'new'" (click)="selectedAddressId = 'new'">
                          <mat-radio-button value="new">
                            <mat-icon>add</mat-icon>
                            <span>Nouvelle adresse</span>
                          </mat-radio-button>
                        </mat-card>
                      </mat-radio-group>
                    </div>
                  }

                  @if (selectedAddressId === 'new' || savedAddresses().length === 0) {
                    <div class="address-form">
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Nom de l'adresse</mat-label>
                        <input matInput formControlName="label" placeholder="Ex: Maison, Bureau">
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Adresse</mat-label>
                        <input matInput formControlName="street">
                        @if (addressForm.get('street')?.hasError('required') && addressForm.get('street')?.touched) {
                          <mat-error>L'adresse est requise</mat-error>
                        }
                      </mat-form-field>

                      <div class="form-row">
                        <mat-form-field appearance="outline">
                          <mat-label>Code postal</mat-label>
                          <input matInput formControlName="zipCode">
                          @if (addressForm.get('zipCode')?.hasError('required') && addressForm.get('zipCode')?.touched) {
                            <mat-error>Requis</mat-error>
                          }
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                          <mat-label>Ville</mat-label>
                          <input matInput formControlName="city">
                          @if (addressForm.get('city')?.hasError('required') && addressForm.get('city')?.touched) {
                            <mat-error>Requis</mat-error>
                          }
                        </mat-form-field>
                      </div>

                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Téléphone</mat-label>
                        <input matInput formControlName="phone" type="tel">
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Instructions de livraison (optionnel)</mat-label>
                        <textarea matInput formControlName="instructions" rows="2"></textarea>
                      </mat-form-field>
                    </div>
                  }
                } @else {
                  <h3>Retrait en boutique</h3>
                  <p class="pickup-info">
                    Vous pourrez récupérer votre commande dans les boutiques concernées une fois qu'elle sera prête.
                    Vous recevrez un email avec les détails.
                  </p>
                }

                <div class="step-actions">
                  <button mat-button matStepperPrevious>Retour</button>
                  <button mat-raised-button color="primary" matStepperNext [disabled]="isDelivery() && addressForm.invalid && selectedAddressId === 'new'">
                    Continuer
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Step 3: Payment -->
            <mat-step [completed]="!isDelivery() || paymentForm.valid" label="Paiement">
              <form [formGroup]="paymentForm">
                <h3>Mode de paiement</h3>

                @if (isDelivery()) {
                  <mat-radio-group formControlName="paymentMethod" class="payment-options">
                    <mat-card class="payment-option" [class.selected]="paymentForm.get('paymentMethod')?.value === 'card'">
                      <mat-radio-button value="card">
                        <div class="option-content">
                          <mat-icon>credit_card</mat-icon>
                          <div class="option-text">
                            <strong>Carte bancaire</strong>
                            <span>Visa, Mastercard, CB</span>
                          </div>
                        </div>
                      </mat-radio-button>
                    </mat-card>

                    <mat-card class="payment-option" [class.selected]="paymentForm.get('paymentMethod')?.value === 'paypal'">
                      <mat-radio-button value="paypal">
                        <div class="option-content">
                          <mat-icon>account_balance_wallet</mat-icon>
                          <div class="option-text">
                            <strong>PayPal</strong>
                            <span>Paiement sécurisé via PayPal</span>
                          </div>
                        </div>
                      </mat-radio-button>
                    </mat-card>
                  </mat-radio-group>
                } @else {
                  <div class="pickup-payment-info">
                    <mat-card class="payment-option selected">
                      <div class="option-content">
                        <mat-icon>store</mat-icon>
                        <div class="option-text">
                          <strong>Paiement sur place</strong>
                          <span>Vous paierez lors du retrait de votre commande en boutique</span>
                          <span class="payment-methods-accepted">Espèces, Carte, Mobile Money acceptés</span>
                        </div>
                      </div>
                    </mat-card>
                  </div>
                }

                @if (isDelivery() && paymentForm.get('paymentMethod')?.value === 'card') {
                  <div class="card-form">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Numéro de carte</mat-label>
                      <input matInput formControlName="cardNumber" placeholder="1234 5678 9012 3456" maxlength="19">
                      <mat-icon matSuffix>credit_card</mat-icon>
                    </mat-form-field>

                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Date d'expiration</mat-label>
                        <input matInput formControlName="cardExpiry" placeholder="MM/YY" maxlength="5">
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>CVV</mat-label>
                        <input matInput formControlName="cardCvv" placeholder="123" maxlength="4" type="password">
                      </mat-form-field>
                    </div>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Nom sur la carte</mat-label>
                      <input matInput formControlName="cardName">
                    </mat-form-field>
                  </div>
                }

                <div class="step-actions">
                  <button mat-button matStepperPrevious>Retour</button>
                  <button mat-raised-button color="primary" matStepperNext [disabled]="isDelivery() && paymentForm.invalid">
                    Continuer
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Step 4: Review -->
            <mat-step label="Confirmation">
              <h3>Récapitulatif de votre commande</h3>

              <div class="order-review">
                <!-- Items -->
                <mat-card class="review-section">
                  <h4>Articles ({{ cart()!.itemCount }})</h4>
                  @for (item of cart()!.items; track item._id) {
                    <div class="review-item">
                      <img [src]="item.product?.images?.[0] || '/assets/placeholder.png'" [alt]="item.product?.name">
                      <div class="item-info">
                        <span class="item-name">{{ item.product?.name || 'Produit' }}</span>
                        <span class="item-qty">Qté: {{ item.quantity }}</span>
                      </div>
                      <span class="item-price">{{ item.unitPrice * item.quantity | ariary }}</span>
                    </div>
                  }
                </mat-card>

                <!-- Delivery -->
                <mat-card class="review-section">
                  <h4>{{ isDelivery() ? 'Livraison' : 'Retrait' }}</h4>
                  @if (isDelivery()) {
                    <p>
                      {{ getSelectedAddress()?.street }}<br>
                      {{ getSelectedAddress()?.zipCode }} {{ getSelectedAddress()?.city }}
                    </p>
                  } @else {
                    <p>Retrait en boutique</p>
                  }
                </mat-card>

                <!-- Payment -->
                <mat-card class="review-section">
                  <h4>Paiement</h4>
                  <p>
                    @if (!isDelivery()) {
                      Paiement sur place au retrait
                    } @else {
                      @switch (paymentForm.get('paymentMethod')?.value) {
                        @case ('card') { Carte bancaire }
                        @case ('paypal') { PayPal }
                      }
                    }
                  </p>
                </mat-card>

                <!-- Notes -->
                <mat-form-field appearance="outline" class="full-width notes-field">
                  <mat-label>Notes (optionnel)</mat-label>
                  <textarea matInput [(ngModel)]="orderNotes" rows="2" placeholder="Instructions spéciales..."></textarea>
                </mat-form-field>
              </div>

              <div class="step-actions">
                <button mat-button matStepperPrevious>Retour</button>
                <button
                  mat-raised-button
                  color="primary"
                  class="place-order-btn"
                  (click)="placeOrder()"
                  [disabled]="isProcessing()">
                  @if (isProcessing()) {
                    <mat-spinner diameter="20"></mat-spinner>
                    Traitement...
                  } @else {
                    Confirmer la commande - {{ calculateTotal() | ariary }}
                  }
                </button>
              </div>
            </mat-step>
          </mat-stepper>

          <!-- Order Summary Sidebar -->
          <div class="order-summary">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Récapitulatif</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="summary-row">
                  <span>Sous-total ({{ cart()!.itemCount }} articles)</span>
                  <span>{{ cart()!.subtotal | ariary }}</span>
                </div>
                @if (cart()!.discount && cart()!.discount! > 0) {
                  <div class="summary-row discount">
                    <span>Réduction</span>
                    <span>-{{ cart()!.discount | ariary }}</span>
                  </div>
                }
                <div class="summary-row">
                  <span>Livraison</span>
                  <span>{{ getDeliveryFee() | ariary }}</span>
                </div>
                <mat-divider></mat-divider>
                <div class="summary-row total">
                  <span>Total</span>
                  <span>{{ calculateTotal() | ariary }}</span>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Security badges -->
            <div class="security-info">
              <mat-icon>lock</mat-icon>
              <span>Paiement 100% sécurisé</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .checkout-container {
      padding: 24px 16px;
      min-height: calc(100vh - 64px - 200px);
    }

    h1 {
      font-size: 2rem;
      margin-bottom: 24px;
    }

    .empty-cart {
      text-align: center;
      padding: 80px 24px;
      background: var(--bg-primary);
      border-radius: 8px;

      mat-icon {
        font-size: 80px;
        width: 80px;
        height: 80px;
        color: var(--gray-300);
      }

      h2 {
        margin: 16px 0 8px;
      }

      p {
        color: var(--text-secondary);
        margin-bottom: 24px;
      }
    }

    .checkout-content {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 24px;
      align-items: start;
    }

    mat-stepper {
      background: var(--bg-primary);
      border-radius: 8px;
      padding: 24px;
    }

    h3 {
      margin: 0 0 24px;
      font-size: 1.25rem;
    }

    h4 {
      margin: 0 0 16px;
      font-size: 1rem;
      color: var(--text-secondary);
    }

    .delivery-options,
    .payment-options {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .delivery-option,
    .payment-option {
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      border: 2px solid transparent;

      &.selected {
        border-color: var(--primary);
        background: var(--primary-50);
      }

      &:hover:not(.selected) {
        background: var(--bg-secondary);
      }
    }

    .option-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 8px;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: var(--primary);
      }

      .option-text {
        display: flex;
        flex-direction: column;

        strong {
          font-size: 1rem;
        }

        span {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .price {
          font-weight: 600;
          color: var(--primary);
          margin-top: 4px;

          &.free {
            color: var(--success);
          }
        }
      }
    }

    .saved-addresses {
      margin-bottom: 24px;
    }

    .address-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    .address-card {
      cursor: pointer;
      padding: 16px;
      border: 2px solid transparent;

      &.selected {
        border-color: var(--primary);
        background: var(--primary-50);
      }

      p {
        margin: 4px 0;
        font-size: 0.9rem;
        color: var(--text-secondary);
      }

      &.new-address {
        display: flex;
        align-items: center;
        justify-content: center;

        mat-radio-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
      }
    }

    .pickup-info {
      background: var(--warning-light);
      padding: 16px;
      border-radius: 8px;
      color: var(--warning);
    }

    .pickup-payment-info {
      .payment-option {
        border: 2px solid var(--primary);
        background: var(--primary-50);

        .option-content {
          padding: 16px 8px;

          mat-icon {
            font-size: 40px;
            width: 40px;
            height: 40px;
            color: var(--primary);
          }

          .payment-methods-accepted {
            margin-top: 8px;
            font-size: 0.8rem;
            color: var(--success);
            font-weight: 500;
          }
        }
      }
    }

    .address-form,
    .card-form {
      margin-top: 24px;
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

    .step-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid var(--border-color);
    }

    .order-review {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .review-section {
      padding: 16px;

      h4 {
        margin-bottom: 12px;
      }

      p {
        margin: 0;
        color: var(--text-secondary);
      }
    }

    .review-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;

      img {
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 4px;
      }

      .item-info {
        flex: 1;
        display: flex;
        flex-direction: column;

        .item-name {
          font-weight: 500;
        }

        .item-qty {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
      }

      .item-price {
        font-weight: 500;
      }
    }

    .notes-field {
      margin-top: 16px;
    }

    .place-order-btn {
      height: 48px;
      min-width: 250px;
    }

    .order-summary {
      position: sticky;
      top: 88px;

      mat-card-header {
        margin-bottom: 16px;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;

        &.discount {
          color: var(--success);
        }

        &.total {
          font-size: 1.25rem;
          font-weight: 600;
          padding-top: 16px;
        }
      }

      mat-divider {
        margin: 8px 0;
      }
    }

    .security-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 16px;
      color: var(--success);
      font-size: 0.9rem;
      margin-top: 16px;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    @media (max-width: 768px) {
      .checkout-content {
        grid-template-columns: 1fr;
      }

      .order-summary {
        position: static;
        order: -1;
      }

      .form-row {
        flex-direction: column;
        gap: 0;
      }
    }
  `]
})
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
