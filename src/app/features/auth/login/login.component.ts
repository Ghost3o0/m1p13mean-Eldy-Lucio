import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
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
    MatProgressSpinnerModule
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
            <h1>Bon retour parmi nous !</h1>
            <p>Connectez-vous pour accéder à votre espace personnel et profiter de toutes nos offres exclusives.</p>
            <div class="features">
              <div class="feature">
                <mat-icon>local_offer</mat-icon>
                <span>Offres personnalisées</span>
              </div>
              <div class="feature">
                <mat-icon>history</mat-icon>
                <span>Suivi de commandes</span>
              </div>
              <div class="feature">
                <mat-icon>favorite</mat-icon>
                <span>Liste de favoris</span>
              </div>
            </div>
          </div>
          <div class="decoration">
            <div class="circle circle-1"></div>
            <div class="circle circle-2"></div>
            <div class="circle circle-3"></div>
          </div>
        </div>

        <!-- Right Side - Form -->
        <div class="auth-form-container">
          <div class="auth-form-wrapper">
            <div class="form-header">
              <h2>Connexion</h2>
              <p>Entrez vos identifiants pour continuer</p>
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

            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label for="email">Adresse email</label>
                <div class="input-wrapper" [class.error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
                  <mat-icon>email</mat-icon>
                  <input
                    id="email"
                    type="email"
                    formControlName="email"
                    placeholder="votre@email.com">
                </div>
                @if (loginForm.get('email')?.hasError('required') && loginForm.get('email')?.touched) {
                  <span class="error-text">L'email est requis</span>
                }
                @if (loginForm.get('email')?.hasError('email') && loginForm.get('email')?.touched) {
                  <span class="error-text">Email invalide</span>
                }
              </div>

              <div class="form-group">
                <label for="password">Mot de passe</label>
                <div class="input-wrapper" [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
                  <mat-icon>lock</mat-icon>
                  <input
                    id="password"
                    [type]="hidePassword() ? 'password' : 'text'"
                    formControlName="password"
                    placeholder="Votre mot de passe">
                  <button type="button" class="toggle-password" (click)="hidePassword.set(!hidePassword())">
                    <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                </div>
                @if (loginForm.get('password')?.hasError('required') && loginForm.get('password')?.touched) {
                  <span class="error-text">Le mot de passe est requis</span>
                }
              </div>

              <div class="form-extras">
                <label class="remember-me">
                  <input type="checkbox">
                  <span class="checkmark"></span>
                  <span>Se souvenir de moi</span>
                </label>
                <a routerLink="/auth/forgot-password" class="forgot-link">Mot de passe oublié ?</a>
              </div>

              <button
                type="submit"
                class="submit-btn"
                [disabled]="loginForm.invalid || isLoading()">
                @if (isLoading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                  <span>Connexion en cours...</span>
                } @else {
                  <span>Se connecter</span>
                  <mat-icon>arrow_forward</mat-icon>
                }
              </button>
            </form>

            <div class="divider">
              <span>ou</span>
            </div>

            <div class="social-login">
              <button class="social-btn google">
                <svg viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continuer avec Google</span>
              </button>
            </div>

            <p class="register-link">
              Pas encore de compte ?
              <a routerLink="/auth/register">Créer un compte</a>
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
      font-size: 3rem;
      font-weight: 800;
      color: white;
      line-height: 1.2;
      margin: 0 0 20px;
    }

    .branding-content p {
      font-size: 1.1rem;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.6;
      margin: 0 0 40px;
    }

    .features {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 12px;
      color: rgba(255, 255, 255, 0.8);

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: #667eea;
      }
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
      width: 400px;
      height: 400px;
      top: -100px;
      right: -100px;
    }

    .circle-2 {
      width: 300px;
      height: 300px;
      bottom: -50px;
      left: -50px;
    }

    .circle-3 {
      width: 200px;
      height: 200px;
      top: 50%;
      left: 50%;
      background: rgba(255, 107, 107, 0.1);
    }

    /* Form Side */
    .auth-form-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
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
      max-width: 420px;
    }

    .form-header {
      margin-bottom: 32px;

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
        align-items: center;

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

    .form-group {
      margin-bottom: 20px;

      label {
        display: block;
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 8px;
      }
    }

    .input-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      border-radius: 12px;
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
        font-size: 1rem;
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
        align-items: center;

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

    .form-extras {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .remember-me {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      color: var(--text-secondary);

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
        width: 18px;
        height: 18px;
        border: 2px solid var(--border-color);
        border-radius: 4px;
        position: relative;
        transition: all 0.2s ease;

        &::after {
          content: '';
          position: absolute;
          display: none;
          left: 5px;
          top: 2px;
          width: 4px;
          height: 8px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
      }
    }

    .forgot-link {
      font-size: 0.9rem;
      color: var(--primary);
      text-decoration: none;
      font-weight: 500;

      &:hover {
        text-decoration: underline;
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

    .divider {
      display: flex;
      align-items: center;
      margin: 28px 0;

      &::before,
      &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--border-color);
      }

      span {
        padding: 0 16px;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }
    }

    .social-login {
      margin-bottom: 28px;
    }

    .social-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      padding: 14px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: var(--bg-secondary);
        border-color: var(--gray-300);
      }

      svg {
        width: 20px;
        height: 20px;
      }
    }

    .register-link {
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.95rem;
      margin: 0;

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

      .form-extras {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
      }
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  hidePassword = signal(true);

  private returnUrl: string = '/';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          // Navigate based on role
          const redirectUrl = this.authService.getRedirectUrl();
          this.router.navigateByUrl(this.returnUrl !== '/' ? this.returnUrl : redirectUrl);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Erreur de connexion');
      }
    });
  }
}
