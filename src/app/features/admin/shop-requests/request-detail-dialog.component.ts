import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-request-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <h2 mat-dialog-title>Détails de la demande</h2>
    <mat-dialog-content>
      <div class="request-details">
        <!-- Header -->
        <div class="detail-header">
          <div class="header-left">
            <span class="request-number">{{ data.request.requestNumber }}</span>
            <mat-chip [class]="'type-' + data.request.type">
              <mat-icon>{{ getTypeIcon(data.request.type) }}</mat-icon>
              {{ getTypeLabel(data.request.type) }}
            </mat-chip>
          </div>
          <mat-chip [class]="'status-' + data.request.status">
            {{ getStatusLabel(data.request.status) }}
          </mat-chip>
        </div>

        <mat-divider></mat-divider>

        <!-- Shop Info -->
        <div class="detail-section">
          <h3>Boutique</h3>
          <div class="detail-row">
            <mat-icon>store</mat-icon>
            <span>{{ getShopName(data.request.shopId) }}</span>
          </div>
          <div class="detail-row">
            <mat-icon>event</mat-icon>
            <span>Soumise le {{ data.request.createdAt | date:'dd/MM/yyyy à HH:mm' }}</span>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Box Change Details -->
        @if (data.request.type === 'box_change' && data.request.boxChange) {
          <div class="detail-section">
            <h3>Détails du changement</h3>
            @if (data.request.boxChange.currentBoxId) {
              <div class="detail-row">
                <mat-icon>business</mat-icon>
                <span>Box actuel: {{ getBoxName(data.request.boxChange.currentBoxId) }}</span>
              </div>
            }
            @if (data.request.boxChange.requestedBoxId) {
              <div class="detail-row">
                <mat-icon>arrow_forward</mat-icon>
                <span>Box demandé: {{ getBoxName(data.request.boxChange.requestedBoxId) }}</span>
              </div>
            }
            @if (data.request.boxChange.reason) {
              <div class="detail-row">
                <mat-icon>comment</mat-icon>
                <span>{{ data.request.boxChange.reason }}</span>
              </div>
            }
            @if (data.request.boxChange.preferredMoveDate) {
              <div class="detail-row">
                <mat-icon>calendar_today</mat-icon>
                <span>Date souhaitée: {{ data.request.boxChange.preferredMoveDate | date:'dd/MM/yyyy' }}</span>
              </div>
            }
          </div>
        }

        <!-- Problem Report Details -->
        @if (data.request.type === 'problem_report' && data.request.problemReport) {
          <div class="detail-section">
            <h3>Détails du problème</h3>
            @if (data.request.problemReport.boxId) {
              <div class="detail-row">
                <mat-icon>business</mat-icon>
                <span>Box concerné: {{ getBoxName(data.request.problemReport.boxId) }}</span>
              </div>
            }
            <div class="detail-row">
              <mat-icon>category</mat-icon>
              <span>Type: {{ getProblemTypeLabel(data.request.problemReport.problemType) }}</span>
            </div>
            @if (data.request.problemReport.urgency) {
              <div class="detail-row">
                <mat-icon>priority_high</mat-icon>
                <mat-chip [class]="'urgency-' + data.request.problemReport.urgency">
                  {{ getUrgencyLabel(data.request.problemReport.urgency) }}
                </mat-chip>
              </div>
            }
            @if (data.request.problemReport.description) {
              <div class="description-box">
                <p>{{ data.request.problemReport.description }}</p>
              </div>
            }
            @if (data.request.problemReport.photos?.length) {
              <div class="photos-section">
                <h4>Photos</h4>
                <div class="photos-grid">
                  @for (photo of data.request.problemReport.photos; track photo) {
                    <img [src]="photo" alt="Photo du problème" (click)="openPhoto(photo)">
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Termination Details -->
        @if (data.request.type === 'termination' && data.request.termination) {
          <div class="detail-section">
            <h3>Détails de la résiliation</h3>
            @if (data.request.termination.boxId) {
              <div class="detail-row">
                <mat-icon>business</mat-icon>
                <span>Box: {{ getBoxName(data.request.termination.boxId) }}</span>
              </div>
            }
            @if (data.request.termination.departureDate) {
              <div class="detail-row">
                <mat-icon>event_busy</mat-icon>
                <span>Date de départ souhaitée: {{ data.request.termination.departureDate | date:'dd/MM/yyyy' }}</span>
              </div>
            }
            @if (data.request.termination.reason) {
              <div class="description-box">
                <p>{{ data.request.termination.reason }}</p>
              </div>
            }
          </div>
        }

        <!-- Admin Response -->
        @if (data.request.adminResponse?.decision) {
          <mat-divider></mat-divider>
          <div class="detail-section">
            <h3>Réponse de l'administration</h3>
            <div class="detail-row">
              <mat-icon>gavel</mat-icon>
              <span>Décision: {{ data.request.adminResponse?.decision }}</span>
            </div>
            @if (data.request.adminResponse?.reason) {
              <div class="detail-row">
                <mat-icon>info</mat-icon>
                <span>{{ data.request.adminResponse?.reason }}</span>
              </div>
            }
            @if (data.request.adminResponse?.notes) {
              <div class="description-box">
                <p>{{ data.request.adminResponse?.notes }}</p>
              </div>
            }
            @if (data.request.adminResponse?.respondedAt) {
              <div class="detail-row muted">
                <mat-icon>schedule</mat-icon>
                <span>{{ data.request.adminResponse?.respondedAt | date:'dd/MM/yyyy à HH:mm' }}</span>
              </div>
            }
          </div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Fermer</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 500px;
    }

    .request-details {
      padding: 8px 0;
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .request-number {
          font-family: monospace;
          font-size: 1.1rem;
          font-weight: 600;
        }
      }
    }

    .detail-section {
      padding: 16px 0;

      h3 {
        margin: 0 0 12px 0;
        font-size: 0.9rem;
        color: var(--text-secondary);
        text-transform: uppercase;
      }

      h4 {
        margin: 16px 0 8px 0;
        font-size: 0.85rem;
        color: var(--text-secondary);
      }
    }

    .detail-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;

      mat-icon {
        color: var(--text-secondary);
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      &.muted {
        color: var(--text-secondary);

        mat-icon {
          color: var(--text-secondary);
        }
      }
    }

    .description-box {
      background: var(--bg-secondary);
      border-radius: 8px;
      padding: 16px;
      margin-top: 8px;

      p {
        margin: 0;
        white-space: pre-wrap;
      }
    }

    .photos-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;

      img {
        width: 100%;
        height: 100px;
        object-fit: cover;
        border-radius: 8px;
        cursor: pointer;
        transition: transform 0.2s;

        &:hover {
          transform: scale(1.05);
        }
      }
    }

    mat-chip {
      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        margin-right: 4px;
      }

      &.type-box_change {
        background: var(--primary-50) !important;
        color: var(--primary) !important;
      }
      &.type-problem_report {
        background: var(--warning-light) !important;
        color: var(--warning) !important;
      }
      &.type-termination {
        background: var(--error-light) !important;
        color: var(--error) !important;
      }

      &.status-pending {
        background: var(--warning-light) !important;
        color: var(--warning) !important;
      }
      &.status-in_review {
        background: var(--primary-50) !important;
        color: var(--primary) !important;
      }
      &.status-approved {
        background: var(--success-light) !important;
        color: var(--success) !important;
      }
      &.status-rejected {
        background: var(--error-light) !important;
        color: var(--error) !important;
      }
      &.status-completed {
        background: var(--bg-secondary) !important;
        color: var(--text-secondary) !important;
      }

      &.urgency-low {
        background: var(--success-light) !important;
        color: var(--success) !important;
      }
      &.urgency-medium {
        background: var(--warning-light) !important;
        color: var(--warning) !important;
      }
      &.urgency-urgent {
        background: var(--error-light) !important;
        color: var(--error) !important;
      }
      &.urgency-critical {
        background: var(--error) !important;
        color: var(--bg-primary) !important;
      }
    }

    mat-divider {
      margin: 8px 0;
    }

    @media (max-width: 600px) {
      mat-dialog-content {
        min-width: auto;
      }

      .photos-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class RequestDetailDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<RequestDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  getShopName(shop) {
    if (typeof shop === 'object' && shop?.name) {
      return shop.name;
    }
    return 'Boutique';
  }

  getBoxName(box) {
    if (typeof box === 'object' && box?.name) {
      return box.name;
    }
    return 'Box';
  }

  getTypeIcon(type) {
    const icons = {
      box_change: 'swap_horiz',
      problem_report: 'report_problem',
      termination: 'exit_to_app'
    };
    return icons[type] || 'help';
  }

  getTypeLabel(type) {
    const labels = {
      box_change: 'Changement de box',
      problem_report: 'Signalement',
      termination: 'Résiliation'
    };
    return labels[type] || type;
  }

  getStatusLabel(status) {
    const labels = {
      pending: 'En attente',
      in_review: 'En cours d\'examen',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      completed: 'Terminé'
    };
    return labels[status] || status;
  }

  getUrgencyLabel(urgency) {
    const labels = {
      low: 'Faible',
      medium: 'Moyenne',
      urgent: 'Urgente',
      critical: 'Critique'
    };
    return labels[urgency] || urgency;
  }

  getProblemTypeLabel(problemType) {
    if (!problemType) return '-';
    const labels = {
      electricity: 'Électricité',
      plumbing: 'Plomberie',
      ac_heating: 'Climatisation/Chauffage',
      security: 'Sécurité',
      pests: 'Nuisibles',
      other: 'Autre'
    };
    return labels[problemType] || problemType || '-';
  }

  openPhoto(url) {
    window.open(url, '_blank');
  }
}
