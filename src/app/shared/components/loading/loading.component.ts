import { Component, Input, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="loading-container" [class.overlay]="overlay" [class.fullscreen]="fullscreen">
      <mat-spinner [diameter]="diameter"></mat-spinner>
      @if (message) {
        <p class="loading-message">{{ message }}</p>
      }
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      gap: 16px;
    }

    .loading-message {
      color: var(--text-secondary);
      font-size: 14px;
    }

    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--bg-primary);
      opacity: 0.8;
      z-index: 100;
    }

    .fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--bg-primary);
      opacity: 0.9;
      z-index: 9999;
    }
  `]
})
export class LoadingComponent {
  @Input() diameter = 40;
  @Input() message?: string;
  @Input({ transform: booleanAttribute }) overlay = false;
  @Input({ transform: booleanAttribute }) fullscreen = false;
}
