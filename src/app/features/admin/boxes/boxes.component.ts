import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BoxService } from '@shared/services/box.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { BoxAssignDialogComponent } from './box-assign-dialog.component';

@Component({
  selector: 'app-admin-boxes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
    MatCheckboxModule,
    MatProgressSpinnerModule,
    LoadingComponent
  ],
  templateUrl: './boxes.component.html',
  styleUrls: ['./boxes.component.scss']
})
export class AdminBoxesComponent implements OnInit {
  boxes = signal<any[]>([]);
  stats = signal<any>(null);
  pagination = signal<any>(null);
  isLoading = signal(true);
  showForm = signal(false);
  editingBox = signal<any>(null);
  isSaving = signal(false);

  boxForm: FormGroup;

  displayedColumns = ['name', 'location', 'dimensions', 'rent', 'shop', 'status', 'equipment', 'actions'];

  searchQuery = '';
  selectedStatus = '';
  selectedFloor = null;
  selectedZone = null;
  currentTab = 0;

  floors = ['RDC', '1', '2', '3'];
  zones = ['A', 'B', 'C', 'D', 'E'];

  equipmentOptions = [
    { value: 'electricity', label: 'Électricité', icon: 'bolt' },
    { value: 'water', label: 'Eau', icon: 'water_drop' },
    { value: 'ac', label: 'Climatisation', icon: 'ac_unit' },
    { value: 'heating', label: 'Chauffage', icon: 'thermostat' },
    { value: 'internet', label: 'Internet', icon: 'wifi' },
    { value: 'security_camera', label: 'Caméra', icon: 'videocam' },
    { value: 'fire_alarm', label: 'Alarme incendie', icon: 'local_fire_department' },
    { value: 'parking', label: 'Parking', icon: 'local_parking' },
    { value: 'storage', label: 'Stockage', icon: 'inventory_2' }
  ];

  equipmentLabels: Record<string, string> = {
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

  equipmentIcons: Record<string, string> = {
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

  selectedEquipment: string[] = [];

  constructor(
    private boxService: BoxService,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.boxForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      floor: ['RDC'],
      zone: ['A'],
      position: [''],
      area: [0, [Validators.min(0)]],
      length: [0, [Validators.min(0)]],
      width: [0, [Validators.min(0)]],
      rentAmount: [0, [Validators.required, Validators.min(0)]]
    });
  }

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

  // Form methods
  openForm(box?: any) {
    if (box) {
      this.editingBox.set(box);
      this.boxForm.patchValue({
        name: box.name || '',
        description: box.description || '',
        floor: box.location?.floor || 'RDC',
        zone: box.location?.zone || 'A',
        position: box.location?.position || '',
        area: box.dimensions?.area || 0,
        length: box.dimensions?.length || 0,
        width: box.dimensions?.width || 0,
        rentAmount: box.currentRent?.amount || 0
      });
      this.selectedEquipment = box.equipment || [];
    } else {
      this.editingBox.set(null);
      this.boxForm.reset({
        name: '',
        description: '',
        floor: 'RDC',
        zone: 'A',
        position: '',
        area: 0,
        length: 0,
        width: 0,
        rentAmount: 0
      });
      this.selectedEquipment = [];
    }
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingBox.set(null);
    this.boxForm.reset();
    this.selectedEquipment = [];
  }

  toggleEquipment(value: string, checked: boolean) {
    if (checked) {
      if (!this.selectedEquipment.includes(value)) {
        this.selectedEquipment = [...this.selectedEquipment, value];
      }
    } else {
      this.selectedEquipment = this.selectedEquipment.filter(e => e !== value);
    }
  }

  isEquipmentSelected(value: string): boolean {
    return this.selectedEquipment.includes(value);
  }

  saveBox() {
    if (this.boxForm.invalid) return;

    this.isSaving.set(true);
    const formValue = this.boxForm.value;

    const boxData = {
      name: formValue.name,
      description: formValue.description,
      location: {
        floor: formValue.floor,
        zone: formValue.zone,
        position: formValue.position
      },
      dimensions: {
        area: formValue.area,
        length: formValue.length,
        width: formValue.width
      },
      currentRent: {
        amount: formValue.rentAmount
      },
      equipment: this.selectedEquipment
    };

    const request = this.editingBox()
      ? this.boxService.updateBox(this.editingBox()._id, boxData)
      : this.boxService.createBox(boxData);

    request.subscribe({
      next: () => {
        this.closeForm();
        this.loadBoxes();
        this.loadStats();
        this.isSaving.set(false);
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }

  onTabChange(index: number) {
    this.currentTab = index;
    this.loadBoxes();
  }

  applyFilters() {
    this.loadBoxes();
  }

  filterBoxes() {
    this.applyFilters();
  }

  openAddBoxDialog() {
    this.openForm();
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedFloor = null;
    this.selectedZone = null;
    this.loadBoxes();
  }

  onPageChange(event: any) {
    this.loadBoxes(event.pageIndex + 1);
  }

  getShopName(shop: any) {
    if (typeof shop === 'object' && shop?.name) {
      return shop.name;
    }
    return 'Boutique';
  }

  getStatusClass(box: any) {
    if (box.availability?.status === 'not_usable') return 'status-unavailable';
    if (box.currentShopId) return 'status-occupied';
    return 'status-available';
  }

  getStatusLabel(status: string) {
    if (status === 'unavailable') return 'Indisponible';
    if (status === 'occupied') return 'Occupé';
    return 'Disponible';
  }

  getBoxStatusLabel(box: any) {
    if (box.availability?.status === 'not_usable') return 'Indisponible';
    if (box.currentShopId) return 'Occupé';
    return 'Disponible';
  }

  getEquipmentLabel(eq: string) {
    return this.equipmentLabels[eq] || eq;
  }

  getEquipmentIcon(eq: string) {
    return this.equipmentIcons[eq] || 'check';
  }

  editBox(box: any) {
    this.openForm(box);
  }

  assignShop(box: any) {
    this.openAssignDialog(box);
  }

  unassignShop(box: any) {
    this.unassignBox(box);
  }

  openAssignDialog(box: any) {
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

  unassignBox(box: any) {
    if (!confirm('Voulez-vous retirer la boutique de ce box ?')) return;

    this.boxService.unassignFromShop(box._id).subscribe({
      next: () => {
        this.loadBoxes();
        this.loadStats();
      }
    });
  }

  setUnavailable(box: any) {
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

  setAvailable(box: any) {
    this.boxService.updateAvailability(box._id, {
      status: 'usable'
    }).subscribe({
      next: () => {
        this.loadBoxes();
        this.loadStats();
      }
    });
  }

  deleteBox(boxId: string) {
    const box = this.boxes().find(b => b._id === boxId);
    if (!box) return;
    if (!confirm(`Voulez-vous vraiment supprimer le box "${box.name}" ?`)) return;

    this.boxService.deleteBox(boxId).subscribe({
      next: () => {
        this.loadBoxes();
        this.loadStats();
      }
    });
  }
}
