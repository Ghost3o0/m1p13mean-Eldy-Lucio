import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ShopRequestService } from '@shared/services/shop-request.service';
import { BoxService } from '@shared/services/box.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';

@Component({
  selector: 'app-shop-requests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTabsModule,
    MatDividerModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    LoadingComponent
  ],
  template: `
    <div class="requests-container">
      <div class="page-header">
        <div>
          <h1>Mes Demandes</h1>
          <p class="subtitle">Soumettez et suivez vos demandes</p>
        </div>
      </div>

      <!-- Request Type Cards -->
      <div class="request-types">
        <mat-card class="type-card" (click)="showForm('box_change')" [class.active]="formType === 'box_change'">
          <mat-icon>swap_horiz</mat-icon>
          <h3>Changement de box</h3>
          <p>Demander un autre emplacement</p>
        </mat-card>

        <mat-card class="type-card" (click)="showForm('problem_report')" [class.active]="formType === 'problem_report'">
          <mat-icon>report_problem</mat-icon>
          <h3>Signaler un problème</h3>
          <p>Électricité, plomberie, etc.</p>
        </mat-card>

        <mat-card class="type-card" (click)="showForm('termination')" [class.active]="formType === 'termination'">
          <mat-icon>exit_to_app</mat-icon>
          <h3>Résiliation</h3>
          <p>Demander à quitter le box</p>
        </mat-card>
      </div>

      <!-- Box Change Form -->
      @if (formType === 'box_change') {
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>Demande de changement de box</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form (ngSubmit)="submitBoxChange()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nouveau box souhaité</mat-label>
                <mat-select [(ngModel)]="boxChangeForm.requestedBoxId" name="requestedBox" required>
                  @for (box of availableBoxes(); track box._id) {
                    <mat-option [value]="box._id">
                      {{ box.name }} - {{ box.location?.floor ? 'Étage ' + box.location.floor : '' }}
                      {{ box.location?.zone ? 'Zone ' + box.location.zone : '' }}
                      ({{ box.currentRent?.amount }} Ar/mois)
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Raison du changement</mat-label>
                <textarea matInput [(ngModel)]="boxChangeForm.reason" name="reason" rows="3"
                          placeholder="Expliquez pourquoi vous souhaitez changer de box..." required></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Date de déménagement souhaitée</mat-label>
                <input matInput [matDatepicker]="movePicker" [(ngModel)]="boxChangeForm.preferredMoveDate" name="moveDate">
                <mat-datepicker-toggle matIconSuffix [for]="movePicker"></mat-datepicker-toggle>
                <mat-datepicker #movePicker></mat-datepicker>
              </mat-form-field>

              <div class="form-actions">
                <button mat-button type="button" (click)="formType = null">Annuler</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="isSubmitting()">
                  Soumettre la demande
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <!-- Problem Report Form -->
      @if (formType === 'problem_report') {
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>Signaler un problème</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form (ngSubmit)="submitProblemReport()">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Type de problème</mat-label>
                  <mat-select [(ngModel)]="problemForm.problemType" name="problemType" required>
                    <mat-option value="electricity">Électricité</mat-option>
                    <mat-option value="plumbing">Plomberie</mat-option>
                    <mat-option value="ac_heating">Climatisation / Chauffage</mat-option>
                    <mat-option value="security">Sécurité</mat-option>
                    <mat-option value="pests">Nuisibles</mat-option>
                    <mat-option value="other">Autre</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Niveau d'urgence</mat-label>
                  <mat-select [(ngModel)]="problemForm.urgency" name="urgency" required>
                    <mat-option value="low">Faible - Peut attendre</mat-option>
                    <mat-option value="medium">Moyen - À traiter bientôt</mat-option>
                    <mat-option value="urgent">Urgent - Intervention rapide</mat-option>
                    <mat-option value="critical">Critique - Intervention immédiate</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description du problème</mat-label>
                <textarea matInput [(ngModel)]="problemForm.description" name="description" rows="4"
                          placeholder="Décrivez le problème en détail..." required></textarea>
              </mat-form-field>

              <div class="file-upload">
                <label>Photos (optionnel)</label>
                <input type="file" (change)="onPhotosSelect($event)" accept="image/*" multiple>
                @if (selectedPhotos.length) {
                  <span class="file-count">{{ selectedPhotos.length }} photo(s) sélectionnée(s)</span>
                }
              </div>

              <div class="form-actions">
                <button mat-button type="button" (click)="formType = null">Annuler</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="isSubmitting()">
                  Envoyer le signalement
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <!-- Termination Form -->
      @if (formType === 'termination') {
        <mat-card class="form-card warning">
          <mat-card-header>
            <mat-card-title>Demande de résiliation</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="warning-message">
              <mat-icon>warning</mat-icon>
              <p>Cette action est irréversible. Veuillez vous assurer que vous souhaitez vraiment résilier votre contrat.</p>
            </div>

            <form (ngSubmit)="submitTermination()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Date de départ souhaitée</mat-label>
                <input matInput [matDatepicker]="departurePicker" [(ngModel)]="terminationForm.departureDate"
                       name="departureDate" required [min]="minTerminationDate">
                <mat-datepicker-toggle matIconSuffix [for]="departurePicker"></mat-datepicker-toggle>
                <mat-datepicker #departurePicker></mat-datepicker>
                <mat-hint>Préavis minimum: 30 jours</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Raison de la résiliation</mat-label>
                <textarea matInput [(ngModel)]="terminationForm.reason" name="reason" rows="3"
                          placeholder="Expliquez la raison de votre départ..."></textarea>
              </mat-form-field>

              <div class="form-actions">
                <button mat-button type="button" (click)="formType = null">Annuler</button>
                <button mat-raised-button color="warn" type="submit" [disabled]="isSubmitting()">
                  Confirmer la résiliation
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <!-- Requests History -->
      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title>Historique des demandes</mat-card-title>
        </mat-card-header>

        @if (isLoading()) {
          <app-loading message="Chargement..."></app-loading>
        } @else {
          <table mat-table [dataSource]="requests()">
            <ng-container matColumnDef="requestNumber">
              <th mat-header-cell *matHeaderCellDef>N° Demande</th>
              <td mat-cell *matCellDef="let req">{{ req.requestNumber }}</td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let req">
                <mat-chip [class]="'type-' + req.type">
                  <mat-icon>{{ getTypeIcon(req.type) }}</mat-icon>
                  {{ getTypeLabel(req.type) }}
                </mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let req">
                <mat-chip [class]="'status-' + req.status">
                  {{ getStatusLabel(req.status) }}
                </mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let req">{{ req.createdAt | date:'dd/MM/yyyy' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let req">
                @if (req.status === 'pending') {
                  <button mat-icon-button color="warn" (click)="cancelRequest(req)">
                    <mat-icon>cancel</mat-icon>
                  </button>
                }
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          @if (requests().length === 0) {
            <div class="empty-state">
              <mat-icon>inbox</mat-icon>
              <p>Aucune demande</p>
            </div>
          }

          <mat-paginator
            [length]="pagination()?.total || 0"
            [pageSize]="pagination()?.limit || 10"
            [pageIndex]="(pagination()?.page || 1) - 1"
            [pageSizeOptions]="[10, 20]"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .requests-container {
      padding: 24px;
    }

    .page-header {
      margin-bottom: 24px;

      h1 {
        font-size: 2rem;
        margin: 0;
      }

      .subtitle {
        color: var(--text-secondary);
        margin: 4px 0 0 0;
      }
    }

    .request-types {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .type-card {
      padding: 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      &.active {
        border: 2px solid var(--primary);
        background: var(--primary-50);
      }

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--primary);
      }

      h3 {
        margin: 12px 0 4px;
      }

      p {
        color: var(--text-secondary);
        margin: 0;
      }
    }

    .form-card {
      margin-bottom: 24px;

      &.warning {
        border-left: 4px solid var(--error);
      }

      form {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px 0;
      }

      .form-row {
        display: flex;
        gap: 16px;

        mat-form-field {
          flex: 1;
        }
      }

      .full-width {
        width: 100%;
      }

      .file-upload {
        label {
          display: block;
          margin-bottom: 8px;
          color: var(--text-secondary);
        }

        .file-count {
          margin-left: 8px;
          color: var(--primary);
        }
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    }

    .warning-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: var(--warning-light);
      border-radius: 8px;
      margin-bottom: 16px;

      mat-icon {
        color: var(--warning);
      }

      p {
        margin: 0;
        color: var(--warning);
      }
    }

    .table-card {
      overflow: hidden;
    }

    table {
      width: 100%;
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
    }

    .empty-state {
      text-align: center;
      padding: 48px;
      color: var(--text-secondary);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }
    }

    mat-paginator {
      border-top: 1px solid var(--border-color);
    }

    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
      }
    }
  `]
})
export class ShopRequestsComponent implements OnInit {
  requests = signal([]);
  availableBoxes = signal([]);
  pagination = signal(null);
  isLoading = signal(true);
  isSubmitting = signal(false);

  formType = null;
  displayedColumns = ['requestNumber', 'type', 'status', 'date', 'actions'];

  boxChangeForm = {
    requestedBoxId: '',
    reason: '',
    preferredMoveDate: null
  };

  problemForm = {
    problemType: '',
    description: '',
    urgency: 'medium'
  };

  terminationForm = {
    departureDate: null,
    reason: ''
  };

  selectedPhotos = [];
  minTerminationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  constructor(
    private shopRequestService: ShopRequestService,
    private boxService: BoxService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadRequests();
    this.loadAvailableBoxes();
  }

  loadRequests(page = 1) {
    this.isLoading.set(true);

    this.shopRequestService.getShopRequests({ page, limit: 10 }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.requests.set(response.data.requests);
          this.pagination.set(response.data.pagination);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadAvailableBoxes() {
    this.boxService.getAvailableBoxes().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.availableBoxes.set(response.data.boxes);
        }
      }
    });
  }

  onPageChange(event) {
    this.loadRequests(event.pageIndex + 1);
  }

  showForm(type) {
    this.formType = this.formType === type ? null : type;
  }

  onPhotosSelect(event) {
    const files = event.target.files;
    if (files) {
      this.selectedPhotos = Array.from(files);
    }
  }

  submitBoxChange() {
    if (!this.boxChangeForm.requestedBoxId || !this.boxChangeForm.reason) return;

    this.isSubmitting.set(true);

    this.shopRequestService.createBoxChangeRequest({
      requestedBoxId: this.boxChangeForm.requestedBoxId,
      reason: this.boxChangeForm.reason,
      preferredMoveDate: this.boxChangeForm.preferredMoveDate?.toISOString()
    }).subscribe({
      next: () => {
        this.snackBar.open('Demande soumise avec succès', 'OK', { duration: 3000 });
        this.formType = null;
        this.boxChangeForm = { requestedBoxId: '', reason: '', preferredMoveDate: null };
        this.loadRequests();
        this.isSubmitting.set(false);
      },
      error: () => {
        this.snackBar.open('Erreur lors de la soumission', 'OK', { duration: 3000 });
        this.isSubmitting.set(false);
      }
    });
  }

  submitProblemReport() {
    if (!this.problemForm.problemType || !this.problemForm.description) return;

    this.isSubmitting.set(true);

    const photos = this.selectedPhotos.length > 0 ? this.selectedPhotos : undefined;

    this.shopRequestService.createProblemReport({
      problemType: this.problemForm.problemType,
      description: this.problemForm.description,
      urgency: this.problemForm.urgency
    }, photos).subscribe({
      next: () => {
        this.snackBar.open('Signalement envoyé avec succès', 'OK', { duration: 3000 });
        this.formType = null;
        this.problemForm = { problemType: '', description: '', urgency: 'medium' };
        this.selectedPhotos = [];
        this.loadRequests();
        this.isSubmitting.set(false);
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'envoi', 'OK', { duration: 3000 });
        this.isSubmitting.set(false);
      }
    });
  }

  submitTermination() {
    if (!this.terminationForm.departureDate) return;

    if (!confirm('Êtes-vous sûr de vouloir demander la résiliation de votre contrat ?')) return;

    this.isSubmitting.set(true);

    this.shopRequestService.createTerminationRequest({
      departureDate: this.terminationForm.departureDate.toISOString(),
      reason: this.terminationForm.reason
    }).subscribe({
      next: () => {
        this.snackBar.open('Demande de résiliation soumise', 'OK', { duration: 3000 });
        this.formType = null;
        this.terminationForm = { departureDate: null, reason: '' };
        this.loadRequests();
        this.isSubmitting.set(false);
      },
      error: () => {
        this.snackBar.open('Erreur lors de la soumission', 'OK', { duration: 3000 });
        this.isSubmitting.set(false);
      }
    });
  }

  cancelRequest(request) {
    if (!confirm('Voulez-vous annuler cette demande ?')) return;

    this.shopRequestService.cancelRequest(request._id).subscribe({
      next: () => {
        this.snackBar.open('Demande annulée', 'OK', { duration: 3000 });
        this.loadRequests();
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'annulation', 'OK', { duration: 3000 });
      }
    });
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
      box_change: 'Changement',
      problem_report: 'Signalement',
      termination: 'Résiliation'
    };
    return labels[type] || type;
  }

  getStatusLabel(status) {
    const labels = {
      pending: 'En attente',
      in_review: 'En cours',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      completed: 'Terminé'
    };
    return labels[status] || status;
  }
}
