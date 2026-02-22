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
  template: `
    <div class="boxes-container">
      <div class="boxes-header">
        <h1>Gestion des Boxes</h1>
        <div class="header-stats">
          <div class="stat">
            <span class="stat-value">{{ stats()?.totalBoxes || 0 }}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="stat occupied">
            <span class="stat-value">{{ stats()?.occupiedBoxes || 0 }}</span>
            <span class="stat-label">Occupés</span>
          </div>
          <div class="stat available">
            <span class="stat-value">{{ stats()?.usableBoxes || 0 }}</span>
            <span class="stat-label">Disponibles</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ stats()?.occupancyRate || '0%' }}</span>
            <span class="stat-label">Taux d'occupation</span>
          </div>
        </div>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Nouveau Box
        </button>
      </div>

      <mat-tab-group (selectedTabChange)="onTabChange($event.index)">
        <mat-tab label="Tous"></mat-tab>
        <mat-tab label="Occupés"></mat-tab>
        <mat-tab label="Disponibles"></mat-tab>
        <mat-tab label="Indisponibles"></mat-tab>
      </mat-tab-group>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Rechercher</mat-label>
              <input matInput [(ngModel)]="searchQuery" (keyup.enter)="applyFilters()" placeholder="Nom du box...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Étage</mat-label>
              <mat-select [(ngModel)]="selectedFloor" (selectionChange)="applyFilters()">
                <mat-option [value]="null">Tous</mat-option>
                @for (floor of floors; track floor) {
                  <mat-option [value]="floor">{{ floor }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Zone</mat-label>
              <mat-select [(ngModel)]="selectedZone" (selectionChange)="applyFilters()">
                <mat-option [value]="null">Toutes</mat-option>
                @for (zone of zones; track zone) {
                  <mat-option [value]="zone">{{ zone }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <button mat-icon-button (click)="clearFilters()" matTooltip="Réinitialiser">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      @if (isLoading()) {
        <app-loading message="Chargement des boxes..."></app-loading>
      }

      @if (!isLoading()) {
        <mat-card class="table-card">
          <table mat-table [dataSource]="boxes()">
            <!-- Name -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Box</th>
              <td mat-cell *matCellDef="let box">
                <div class="box-name-cell">
                  <span class="name">{{ box.name }}</span>
                  @if (box.description) {
                    <span class="description">{{ box.description | slice:0:50 }}...</span>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Location -->
            <ng-container matColumnDef="location">
              <th mat-header-cell *matHeaderCellDef>Emplacement</th>
              <td mat-cell *matCellDef="let box">
                <div class="location-cell">
                  @if (box.location?.floor) {
                    <span>Étage {{ box.location.floor }}</span>
                  }
                  @if (box.location?.zone) {
                    <span>Zone {{ box.location.zone }}</span>
                  }
                  @if (box.location?.position) {
                    <span class="position">{{ box.location.position }}</span>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Dimensions -->
            <ng-container matColumnDef="dimensions">
              <th mat-header-cell *matHeaderCellDef>Surface</th>
              <td mat-cell *matCellDef="let box">
                @if (box.dimensions?.area) {
                  {{ box.dimensions.area }} m²
                } @else if (box.dimensions?.length && box.dimensions?.width) {
                  {{ box.dimensions.length }}m x {{ box.dimensions.width }}m
                } @else {
                  -
                }
              </td>
            </ng-container>

            <!-- Rent -->
            <ng-container matColumnDef="rent">
              <th mat-header-cell *matHeaderCellDef>Loyer</th>
              <td mat-cell *matCellDef="let box">
                <span class="rent-amount">{{ box.currentRent?.amount | number:'1.0-0' }} {{ box.currentRent?.currency || 'Ar' }}</span>
              </td>
            </ng-container>

            <!-- Shop -->
            <ng-container matColumnDef="shop">
              <th mat-header-cell *matHeaderCellDef>Boutique</th>
              <td mat-cell *matCellDef="let box">
                @if (box.currentShopId) {
                  <span class="shop-name">{{ getShopName(box.currentShopId) }}</span>
                } @else {
                  <span class="vacant">Vacant</span>
                }
              </td>
            </ng-container>

            <!-- Status -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let box">
                <mat-chip [class]="getStatusClass(box)">
                  {{ getStatusLabel(box) }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Equipment -->
            <ng-container matColumnDef="equipment">
              <th mat-header-cell *matHeaderCellDef>Équipements</th>
              <td mat-cell *matCellDef="let box">
                <div class="equipment-icons">
                  @for (eq of box.equipment?.slice(0, 4); track eq) {
                    <mat-icon [matTooltip]="getEquipmentLabel(eq)" class="equipment-icon">
                      {{ getEquipmentIcon(eq) }}
                    </mat-icon>
                  }
                  @if (box.equipment?.length > 4) {
                    <span class="more-equipment">+{{ box.equipment.length - 4 }}</span>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Actions -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let box">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="openEditDialog(box)">
                    <mat-icon>edit</mat-icon>
                    <span>Modifier</span>
                  </button>
                  <button mat-menu-item (click)="openRentDialog(box)">
                    <mat-icon>payments</mat-icon>
                    <span>Modifier le loyer</span>
                  </button>
                  <mat-divider></mat-divider>
                  @if (!box.currentShopId) {
                    <button mat-menu-item (click)="openAssignDialog(box)">
                      <mat-icon>store</mat-icon>
                      <span>Assigner à une boutique</span>
                    </button>
                  } @else {
                    <button mat-menu-item (click)="unassignBox(box)">
                      <mat-icon>store_mall_directory</mat-icon>
                      <span>Retirer la boutique</span>
                    </button>
                  }
                  <mat-divider></mat-divider>
                  @if (box.availability?.status === 'usable') {
                    <button mat-menu-item (click)="setUnavailable(box)">
                      <mat-icon color="warn">block</mat-icon>
                      <span>Marquer indisponible</span>
                    </button>
                  } @else {
                    <button mat-menu-item (click)="setAvailable(box)">
                      <mat-icon>check_circle</mat-icon>
                      <span>Marquer disponible</span>
                    </button>
                  }
                  <mat-divider></mat-divider>
                  <button mat-menu-item (click)="deleteBox(box)" class="delete-item">
                    <mat-icon color="warn">delete</mat-icon>
                    <span>Supprimer</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="box-row"></tr>
          </table>

          @if (boxes().length === 0) {
            <div class="empty-state">
              <mat-icon>business</mat-icon>
              <h3>Aucun box</h3>
              <p>Aucun box ne correspond à vos critères.</p>
              <button mat-raised-button color="primary" (click)="openCreateDialog()">
                <mat-icon>add</mat-icon>
                Créer un box
              </button>
            </div>
          }

          <mat-paginator
            [length]="pagination()?.total || 0"
            [pageSize]="pagination()?.limit || 20"
            [pageIndex]="(pagination()?.page || 1) - 1"
            [pageSizeOptions]="[10, 20, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .boxes-container {
      padding: 24px;
    }

    .boxes-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;

      h1 {
        font-size: 2rem;
        margin: 0;
      }

      .header-stats {
        display: flex;
        gap: 32px;

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;

          .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--primary);
          }

          &.occupied .stat-value {
            color: var(--warning);
          }

          &.available .stat-value {
            color: var(--success);
          }

          .stat-label {
            font-size: 0.85rem;
            color: var(--text-secondary);
          }
        }
      }
    }

    mat-tab-group {
      margin-bottom: 24px;
    }

    .filters-card {
      margin-bottom: 24px;
    }

    .filters-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      flex-wrap: wrap;

      .search-field {
        flex: 1;
        min-width: 250px;
      }
    }

    .table-card {
      overflow: hidden;
    }

    table {
      width: 100%;
    }

    .box-name-cell {
      display: flex;
      flex-direction: column;

      .name {
        font-weight: 500;
      }

      .description {
        font-size: 0.85rem;
        color: var(--text-secondary);
      }
    }

    .location-cell {
      display: flex;
      flex-direction: column;
      font-size: 0.9rem;

      .position {
        color: var(--text-secondary);
      }
    }

    .rent-amount {
      font-weight: 500;
      color: var(--success);
    }

    .shop-name {
      font-weight: 500;
      color: var(--primary);
    }

    .vacant {
      color: var(--text-secondary);
      font-style: italic;
    }

    mat-chip {
      &.status-occupied {
        background: var(--warning-light) !important;
        color: var(--warning) !important;
      }
      &.status-available {
        background: var(--success-light) !important;
        color: var(--success) !important;
      }
      &.status-unavailable {
        background: var(--error-light) !important;
        color: var(--error) !important;
      }
    }

    .equipment-icons {
      display: flex;
      gap: 4px;
      align-items: center;

      .equipment-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--text-secondary);
      }

      .more-equipment {
        font-size: 0.85rem;
        color: var(--text-secondary);
      }
    }

    .box-row {
      cursor: pointer;

      &:hover {
        background: var(--bg-secondary);
      }
    }

    .empty-state {
      text-align: center;
      padding: 64px 24px;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: var(--gray-300);
      }

      h3 {
        margin: 16px 0 8px;
      }

      p {
        color: var(--text-secondary);
        margin-bottom: 16px;
      }
    }

    mat-paginator {
      border-top: 1px solid var(--border-color);
    }

    .delete-item {
      color: var(--error);
    }

    @media (max-width: 768px) {
      .boxes-header {
        flex-direction: column;
        align-items: flex-start;

        h1 {
          font-size: 1.5rem;
        }
      }

      .header-stats {
        width: 100%;
        justify-content: space-between;

        .stat .stat-value {
          font-size: 1.25rem;
        }

        .stat .stat-label {
          font-size: 0.75rem;
        }
      }

      .filters-row {
        .search-field {
          min-width: 100%;
        }
      }

      .table-card {
        overflow-x: auto;
      }
    }

    @media (max-width: 480px) {
      .boxes-container {
        padding: 16px 12px;
      }

      .boxes-header {
        h1 {
          font-size: 1.25rem;
        }

        button {
          width: 100%;
        }
      }

      .header-stats {
        flex-wrap: wrap;
        gap: 12px;

        .stat {
          min-width: 45%;

          .stat-value {
            font-size: 1.1rem;
          }
        }
      }

      .filters-card {
        mat-card-content {
          padding: 12px;
        }
      }

      .filters-row {
        gap: 12px;

        mat-form-field {
          width: 100%;
        }
      }

      .empty-state {
        padding: 40px 16px;

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
        }

        h3 {
          font-size: 1.1rem;
        }
      }
    }
  `]
})
export class AdminBoxesComponent implements OnInit {
  boxes = signal([]);
  stats = signal(null);
  pagination = signal(null);
  isLoading = signal(true);

  displayedColumns = ['name', 'location', 'dimensions', 'rent', 'shop', 'status', 'equipment', 'actions'];

  searchQuery = '';
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
