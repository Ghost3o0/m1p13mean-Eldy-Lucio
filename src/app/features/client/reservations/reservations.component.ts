import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReservationService } from '@shared/services/reservation.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';

@Component({
  selector: 'app-client-reservations',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatChipsModule,
    MatTabsModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
    LoadingComponent
  ],
  templateUrl: './reservations.component.html',
  styleUrls: ['./reservations.component.scss'],})
export class ClientReservationsComponent implements OnInit {
  reservations = signal([]);
  pagination = signal(null);
  isLoading = signal(true);

  currentTab = 0;

  private statusFilters = [undefined, 'pending', 'confirmed', 'ready', 'collected,cancelled,expired'];

  constructor(
    private reservationService: ReservationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadReservations();
  }

  loadReservations(page = 1) {
    this.isLoading.set(true);

    const filters = { page, limit: 10 };
    const statusFilter = this.statusFilters[this.currentTab];
    if (statusFilter) filters['status'] = statusFilter;

    this.reservationService.getUserReservations(filters).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.reservations.set(response.data.reservations);
          this.pagination.set(response.data.pagination);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onTabChange(index) {
    this.currentTab = index;
    this.loadReservations();
  }

  onPageChange(event) {
    this.loadReservations(event.pageIndex + 1);
  }

  getShopName(shop) {
    if (typeof shop === 'object' && shop?.name) {
      return shop.name;
    }
    return 'Boutique';
  }

  getStatusLabel(status) {
    const labels = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      ready: 'Prête',
      collected: 'Récupérée',
      cancelled: 'Annulée',
      expired: 'Expirée'
    };
    return labels[status] || status;
  }

  cancelReservation(reservation) {
    const reason = prompt('Raison de l\'annulation (optionnel):');
    if (reason === null) return;

    this.reservationService.cancelUserReservation(reservation._id, reason || undefined).subscribe({
      next: () => {
        this.snackBar.open('Réservation annulée', 'OK', { duration: 3000 });
        this.loadReservations();
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'annulation', 'OK', { duration: 3000 });
      }
    });
  }
}


