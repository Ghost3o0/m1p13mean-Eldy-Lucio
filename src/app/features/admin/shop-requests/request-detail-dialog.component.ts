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
  templateUrl: './request-detail-dialog.component.html',
  styleUrls: ['./request-detail-dialog.component.scss'],
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

