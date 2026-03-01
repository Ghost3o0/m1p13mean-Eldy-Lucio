import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BoxService } from '@shared/services/box.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { BoxFormDialogComponent } from './box-form-dialog.component';
import { BoxAssignDialogComponent } from './box-assign-dialog.component';

@Component({
  selector: 'app-admin-boxes',
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
    MatMenuModule,
    MatTabsModule,
    MatDividerModule,
    MatDialogModule,
    MatTooltipModule,
    LoadingComponent
  ],
  templateUrl: './boxes.component.html',
  styleUrls: ['./boxes.component.scss']
})
export class AdminBoxesComponent implements OnInit {
  boxes = signal([]);
  stats = signal(null);
  pagination = signal(null);
  isLoading = signal(true);

  displayedColumns = ['name', 'location', 'dimensions', 'rent', 'shop', 'status', 'equipment', 'actions'];

  searchQuery = '';
  selectedStatus = ''; // added for status filter
  selectedFloor = null;
  selectedZone = null;
  currentTab = 0;

  floors = ['RDC', '1', '2', '3'];
  zones = ['A', 'B', 'C', 'D', 'E'];

  equipmentLabels = {
    electricity: 'Électricité',
    water: 'Eau',
    ac: 'Climatisation',
    heating: 'Chauffage',
    internet: 'Internet',
    security_camera: 'Caméra de sécurité',
    fire_alarm: 'Alarme incendie',
    parking: 'Parking',
    storage: 'Stockage'
  };

  equipmentIcons = {
    electricity: 'bolt',
    water: 'water_drop',
    ac: 'ac_unit',
    heating: 'thermostat',
    internet: 'wifi',
    security_camera: 'videocam',
    fire_alarm: 'local_fire_department',
    parking: 'local_parking',
    storage: 'inventory_2'
  };

  constructor(
    private boxService: BoxService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadStats();
    this.loadBoxes();
  }

  loadStats() {
    this.boxService.getStatistics().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.stats.set(response.data);
        }
      }
    });
  }

  loadBoxes(page = 1) {
    this.isLoading.set(true);

    const filters: any = { page, limit: 20 };
    if (this.searchQuery) filters.search = this.searchQuery;
    if (this.selectedStatus) {
      // map status select values to API filters
      if (this.selectedStatus === 'available') {
        filters.occupied = false;
        filters.status = 'usable';
      } else if (this.selectedStatus === 'occupied') {
        filters.occupied = true;
      } else if (this.selectedStatus === 'unavailable') {
        filters.status = 'not_usable';
      }
    }
    if (this.selectedFloor) filters.floor = this.selectedFloor;
    if (this.selectedZone) filters.zone = this.selectedZone;

    if (this.currentTab === 1) filters.occupied = true;
    if (this.currentTab === 2) { filters.occupied = false; filters.status = 'usable'; }
    if (this.currentTab === 3) filters.status = 'not_usable';

    this.boxService.getBoxes(filters).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.boxes.set(response.data.boxes);
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
    this.loadBoxes();
  }

  applyFilters() {
    this.loadBoxes();
  }

  // alias used by template
  filterBoxes() {
    this.applyFilters();
  }

  // template name difference
  openAddBoxDialog() {
    this.openCreateDialog();
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedFloor = null;
    this.selectedZone = null;
    this.loadBoxes();
  }

  onPageChange(event) {
    this.loadBoxes(event.pageIndex + 1);
  }

  getShopName(shop) {
    if (typeof shop === 'object' && shop?.name) {
      return shop.name;
    }
    return 'Boutique';
  }

  getStatusClass(box) {
    if (box.availability?.status === 'not_usable') return 'status-unavailable';
    if (box.currentShopId) return 'status-occupied';
    return 'status-available';
  }

  getStatusLabel(box) {
    if (box.availability?.status === 'not_usable') return 'Indisponible';
    if (box.currentShopId) return 'Occupé';
    return 'Disponible';
  }

  getEquipmentLabel(eq) {
    return this.equipmentLabels[eq] || eq;
  }

  getEquipmentIcon(eq) {
    return this.equipmentIcons[eq] || 'check';
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(BoxFormDialogComponent, {
      width: '600px',
      data: { box: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBoxes();
        this.loadStats();
      }
    });
  }

  openEditDialog(box) {
    const dialogRef = this.dialog.open(BoxFormDialogComponent, {
      width: '600px',
      data: { box }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBoxes();
        this.loadStats();
      }
    });
  }

  openRentDialog(box) {
    const newRent = prompt('Nouveau loyer (Ar):', String(box.currentRent?.amount || 0));
    if (newRent !== null) {
      const amount = parseFloat(newRent);
      if (!isNaN(amount) && amount >= 0) {
        const reason = prompt('Raison du changement:');
        this.boxService.updateRent(box._id, { amount, reason: reason || undefined }).subscribe({
          next: () => {
            this.loadBoxes();
            this.loadStats();
          }
        });
      }
    }
  }

  openAssignDialog(box) {
    const dialogRef = this.dialog.open(BoxAssignDialogComponent, {
      width: '500px',
      data: { box }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBoxes();
        this.loadStats();
      }
    });
  }

  unassignBox(box) {
    if (!confirm('Voulez-vous retirer la boutique de ce box ?')) return;

    this.boxService.unassignFromShop(box._id).subscribe({
      next: () => {
        this.loadBoxes();
        this.loadStats();
      }
    });
  }

  setUnavailable(box) {
    const reason = prompt('Raison de l\'indisponibilité:', 'maintenance');
    if (reason !== null) {
      this.boxService.updateAvailability(box._id, {
        status: 'not_usable',
        reason: reason || 'other'
      }).subscribe({
        next: () => {
          this.loadBoxes();
          this.loadStats();
        }
      });
    }
  }

  setAvailable(box) {
    this.boxService.updateAvailability(box._id, {
      status: 'usable'
    }).subscribe({
      next: () => {
        this.loadBoxes();
        this.loadStats();
      }
    });
  }

  deleteBox(box) {
    if (!confirm(`Voulez-vous vraiment supprimer le box "${box.name}" ?`)) return;

    this.boxService.deleteBox(box._id).subscribe({
      next: () => {
        this.loadBoxes();
        this.loadStats();
      }
    });
  }
}
