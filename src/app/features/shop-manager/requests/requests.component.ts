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
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.scss'],})
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


