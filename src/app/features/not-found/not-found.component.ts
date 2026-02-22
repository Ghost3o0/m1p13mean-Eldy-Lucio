import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="not-found-container">
      <div class="content">
        <span class="error-code">404</span>
        <h1>Page non trouvée</h1>
        <p>La page que vous recherchez n'existe pas ou a été déplacée.</p>
        <div class="actions">
          <a routerLink="/" mat-raised-button color="primary">
            <mat-icon>home</mat-icon>
            Retour à l'accueil
          </a>
          <a routerLink="/catalog" mat-stroked-button>
            <mat-icon>store</mat-icon>
            Explorer le catalogue
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      min-height: calc(100vh - 64px);
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .content {
      text-align: center;
      color: white;
      padding: 48px;
    }

    .error-code {
      font-size: 8rem;
      font-weight: 700;
      opacity: 0.3;
      display: block;
      line-height: 1;
    }

    h1 {
      font-size: 2rem;
      margin: 0 0 16px;
    }

    p {
      font-size: 1.1rem;
      opacity: 0.9;
      margin-bottom: 32px;
    }

    .actions {
      display: flex;
      gap: 16px;
      justify-content: center;
    }

    @media (max-width: 768px) {
      .error-code {
        font-size: 5rem;
      }

      .actions {
        flex-direction: column;
      }
    }
  `]
})
export class NotFoundComponent {}
