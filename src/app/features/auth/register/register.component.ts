import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatStepperModule
  ],
  template: `
    <div class="auth-page">
      <div class="auth-container">
        <!-- Left Side - Branding -->
        <div class="auth-branding">
          <div class="branding-content">
            <div class="logo">
              <mat-icon>storefront</mat-icon>
              <span>Bazar'Be</span>
            </div>
            <h1>Rejoignez notre communauté</h1>
            <p>Créez votre compte et accédez à des milliers de produits, des offres exclusives et une expérience shopping unique.</p>
            <div class="benefits">
              <div class="benefit">
                <div class="benefit-icon">
                  <mat-icon>rocket_launch</mat-icon>
                </div>
                <div class="benefit-text">
                  <h4>Inscription rapide</h4>
                  <p>Créez votre compte en moins de 2 minutes</p>
                </div>
              </div>
              <div class="benefit">
                <div class="benefit-icon">
                  <mat-icon>security</mat-icon>
                </div>
                <div class="benefit-text">
                  <h4>100% Sécurisé</h4>
                  <p>Vos données sont protégées et confidentielles</p>
                </div>
              </div>
              <div class="benefit">
                <div class="benefit-icon">
                  <mat-icon>card_giftcard</mat-icon>
                </div>
                <div class="benefit-text">
                  <h4>Offre de bienvenue</h4>
                  <p>-10% sur votre première commande</p>
                </div>
              </div>
            </div>
          </div>
          <div class="decoration">
            <div class="circle circle-1"></div>
            <div class="circle circle-2"></div>
          </div>
        </div>

        <!-- Right Side - Form -->
        <div class="auth-form-container">
          <div class="auth-form-wrapper">
            <div class="form-header">
              <h2>Créer un compte</h2>
              <p>Remplissez le formulaire pour commencer</p>
            </div>

            @if (errorMessage()) {
              <div class="error-alert">
                <mat-icon>error_outline</mat-icon>
                <span>{{ errorMessage() }}</span>
                <button (click)="errorMessage.set(null)">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            }

            <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
              <!-- Name Fields -->
              <div class="form-row">
                <div class="form-group">
                  <label for="firstName">Prénom</label>
                  <div class="input-wrapper" [class.error]="registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched">
                    <mat-icon>person</mat-icon>
                    <input
                      id="firstName"
                      type="text"
                      formControlName="firstName"
                      placeholder="Votre prénom">
                  </div>
                  @if (registerForm.get('firstName')?.hasError('required') && registerForm.get('firstName')?.touched) {
                    <span class="error-text">Le prénom est requis</span>
                  }
                </div>

                <div class="form-group">
                  <label for="lastName">Nom</label>
                  <div class="input-wrapper" [class.error]="registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched">
                    <mat-icon>person</mat-icon>
                    <input
                      id="lastName"
                      type="text"
                      formControlName="lastName"
                      placeholder="Votre nom">
                  </div>
                  @if (registerForm.get('lastName')?.hasError('required') && registerForm.get('lastName')?.touched) {
                    <span class="error-text">Le nom est requis</span>
                  }
                </div>
              </div>

              <!-- Email -->
              <div class="form-group">
                <label for="email">Adresse email</label>
                <div class="input-wrapper" [class.error]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched">
                  <mat-icon>email</mat-icon>
                  <input
                    id="email"
                    type="email"
                    formControlName="email"
                    placeholder="votre@email.com">
                </div>
                @if (registerForm.get('email')?.hasError('required') && registerForm.get('email')?.touched) {
                  <span class="error-text">L'email est requis</span>
                }
                @if (registerForm.get('email')?.hasError('email') && registerForm.get('email')?.touched) {
                  <span class="error-text">Email invalide</span>
                }
              </div>

              <!-- Phone -->
              <div class="form-group">
                <label for="phone">Téléphone <span class="optional">(optionnel)</span></label>
                <div class="input-wrapper">
                  <mat-icon>phone</mat-icon>
                  <input
                    id="phone"
                    type="tel"
                    formControlName="phone"
                    placeholder="06 12 34 56 78">
                </div>
              </div>

              <!-- Password -->
              <div class="form-group">
                <label for="password">Mot de passe</label>
                <div class="input-wrapper" [class.error]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched">
                  <mat-icon>lock</mat-icon>
                  <input
                    id="password"
                    [type]="hidePassword() ? 'password' : 'text'"
                    formControlName="password"
                    placeholder="Minimum 6 caractères">
                  <button type="button" class="toggle-password" (click)="hidePassword.set(!hidePassword())">
                    <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                </div>
                @if (registerForm.get('password')?.hasError('required') && registerForm.get('password')?.touched) {
                  <span class="error-text">Le mot de passe est requis</span>
                }
                @if (registerForm.get('password')?.hasError('minlength') && registerForm.get('password')?.touched) {
                  <span class="error-text">Minimum 6 caractères</span>
                }
              </div>

              <!-- Terms -->
              <div class="terms">
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="acceptTerms">
                  <span class="checkmark"></span>
                  <span class="terms-text">
                    J'accepte les <a href="#">conditions d'utilisation</a> et la <a href="#">politique de confidentialité</a>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                class="submit-btn"
                [disabled]="registerForm.invalid || isLoading()">
                @if (isLoading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                  <span>Création en cours...</span>
                } @else {
                  <span>Créer mon compte</span>
                  <mat-icon>arrow_forward</mat-icon>
                }
              </button>
            </form>

            <p class="login-link">
              Déjà un compte ?
              <a routerLink="/auth/login">Se connecter</a>
            </p>

            <a routerLink="/" class="back-to-site">
              <mat-icon>arrow_back</mat-icon>
              <span>Retour au site</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      background: var(--bg-secondary);
    }

    .auth-container {
      display: flex;
      min-height: 100vh;
    }

    /* Branding Side */
    .auth-branding {
      flex: 1;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      padding: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    .branding-content {
      position: relative;
      z-index: 2;
      max-width: 480px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 48px;

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: #667eea;
      }

      span {
        font-size: 1.5rem;
        font-weight: 700;
        color: white;
      }
    }

    .branding-content h1 {
      font-size: 2.75rem;
      font-weight: 800;
      color: white;
      line-height: 1.2;
      margin: 0 0 20px;
    }

    .branding-content > p {
      font-size: 1.1rem;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.6;
      margin: 0 0 40px;
    }

    .benefits {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .benefit {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .benefit-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(102, 126, 234, 0.2);
      border-radius: 12px;
      flex-shrink: 0;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: #667eea;
      }
    }

    .benefit-text h4 {
      font-size: 1rem;
      font-weight: 600;
      color: white;
      margin: 0 0 4px;
    }

    .benefit-text p {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.6);
      margin: 0;
    }

    .decoration {
      position: absolute;
      inset: 0;
      overflow: hidden;
    }

    .circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(102, 126, 234, 0.1);
    }

    .circle-1 {
      width: 500px;
      height: 500px;
      top: -150px;
      right: -150px;
    }

    .circle-2 {
      width: 400px;
      height: 400px;
      bottom: -100px;
      left: -100px;
    }

    /* Form Side */
    .auth-form-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
      overflow-y: auto;
    }

    .back-to-site {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 24px;
      padding: 12px 20px;
      background: transparent;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s ease;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &:hover {
        background: var(--bg-secondary);
        color: var(--primary);
        border-color: var(--primary);
      }
    }

    .auth-form-wrapper {
      width: 100%;
      max-width: 480px;
    }

    .form-header {
      margin-bottom: 28px;

      h2 {
        font-size: 2rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 8px;
      }

      p {
        color: var(--text-secondary);
        margin: 0;
      }
    }

    .error-alert {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: var(--error-light);
      border: 1px solid var(--error);
      border-radius: 12px;
      margin-bottom: 24px;

      mat-icon {
        color: var(--error);
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      span {
        flex: 1;
        color: var(--error);
        font-size: 0.9rem;
      }

      button {
        padding: 4px;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-secondary);
        display: flex;

        &:hover {
          color: var(--text-primary);
        }

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: inherit;
        }
      }
    }

    /* Form Fields */
    .form-row {
      display: flex;
      gap: 16px;

      .form-group {
        flex: 1;
      }
    }

    .form-group {
      margin-bottom: 18px;

      label {
        display: block;
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 8px;

        .optional {
          color: var(--text-secondary);
          font-weight: 400;
        }
      }
    }

    .input-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      border-radius: 10px;
      transition: all 0.3s ease;

      &:focus-within {
        background: var(--bg-primary);
        border-color: var(--primary);
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
      }

      &.error {
        border-color: var(--error);
        background: var(--error-light);
      }

      mat-icon {
        color: var(--text-secondary);
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      input {
        flex: 1;
        border: none;
        background: transparent;
        font-size: 0.95rem;
        outline: none;
        color: var(--text-primary);

        &::placeholder {
          color: var(--text-secondary);
        }
      }

      .toggle-password {
        padding: 4px;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-secondary);
        display: flex;

        &:hover {
          color: var(--primary);
        }

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          color: inherit;
        }
      }
    }

    .error-text {
      display: block;
      font-size: 0.8rem;
      color: var(--error);
      margin-top: 6px;
    }

    /* Terms */
    .terms {
      margin-bottom: 24px;
    }

    .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;

      input {
        display: none;

        &:checked + .checkmark {
          background: var(--primary);
          border-color: var(--primary);

          &::after {
            display: block;
          }
        }
      }

      .checkmark {
        width: 20px;
        height: 20px;
        border: 2px solid var(--border-color);
        border-radius: 4px;
        position: relative;
        flex-shrink: 0;
        margin-top: 2px;
        transition: all 0.2s ease;

        &::after {
          content: '';
          position: absolute;
          display: none;
          left: 6px;
          top: 2px;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
      }

      .terms-text {
        font-size: 0.85rem;
        color: var(--text-secondary);
        line-height: 1.5;

        a {
          color: var(--primary);
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }

    .submit-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .login-link {
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.95rem;
      margin: 24px 0 0;

      a {
        color: var(--primary);
        text-decoration: none;
        font-weight: 600;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .auth-branding {
        display: none;
      }

      .auth-form-container {
        padding: 24px;
      }
    }

    @media (max-width: 480px) {
      .auth-form-wrapper {
        max-width: 100%;
      }

      .form-header h2 {
        font-size: 1.75rem;
      }

      .form-row {
        flex-direction: column;
        gap: 0;
      }
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  hidePassword = signal(true);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      acceptTerms: [false, Validators.requiredTrue]
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.register(this.registerForm.value).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          const redirectUrl = this.authService.getRedirectUrl();
          this.router.navigateByUrl(redirectUrl);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Erreur lors de l\'inscription');
      }
    });
  }
}
