import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { StockService, StockItem, StockMovement, StockSettings } from '@shared/services/stock.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { environment } from '@env/environment';

@Component({
  selector: 'app-stock-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatDividerModule,
    MatTooltipModule,
    MatRadioModule,
    MatSlideToggleModule,
    LoadingComponent
  ],
  templateUrl: './stock-management.component.html',
  styleUrls: ['./stock-management.component.scss'],})
export class StockManagementComponent implements OnInit {
  displayedColumns = ['product', 'stock', 'status', 'actions'];

  searchTerm = '';
  stockFilter = '';
  movementTypeFilter = '';

  showAdjustmentModal = signal(false);
  showHistoryModal = signal(false);
  showSettingsModal = signal(false);
  selectedItem = signal<StockItem | null>(null);
  isSaving = signal(false);
  allMovements = signal<StockMovement[]>([]);

  adjustmentForm: FormGroup;
  settingsForm: FormGroup;

  inStockCount = computed(() =>
    this.stockService.stockItems().filter(i => i.status === 'in_stock').length
  );
  lowStockCount = computed(() =>
    this.stockService.stockItems().filter(i => i.status === 'low_stock').length
  );
  outOfStockCount = computed(() =>
    this.stockService.stockItems().filter(i => i.status === 'out_of_stock').length
  );

  constructor(
    public stockService: StockService,
    private fb: FormBuilder
  ) {
    this.adjustmentForm = this.fb.group({
      newStock: [0, [Validators.required, Validators.min(0)]],
      reason: ['', Validators.required],
      customReason: [''],
      note: ['']
    });

    this.settingsForm = this.fb.group({
      lowStockThreshold: [5],
      enableLowStockAlerts: [true],
      trackMovements: [true]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadLowStock();
    this.loadMovements();
    this.loadSettings();
  }

  loadProducts(): void {
    this.stockService.getProductsWithStock({
      filter: this.stockFilter as any || undefined,
      search: this.searchTerm || undefined
    }).subscribe();
  }

  loadLowStock(): void {
    this.stockService.getLowStockProducts().subscribe();
  }

  loadMovements(): void {
    this.stockService.getAllMovements({
      type: this.movementTypeFilter || undefined,
      limit: 50
    }).subscribe(response => {
      if (response.success) {
        this.allMovements.set(response.data.movements);
      }
    });
  }

  loadSettings(): void {
    this.stockService.getStockSettings().subscribe(response => {
      if (response.success) {
        this.settingsForm.patchValue(response.data.stockSettings);
      }
    });
  }

  getImageUrl(path: string | null): string {
    if (!path) return '/assets/placeholder.png';
    if (path.startsWith('http')) return path;
    return `${environment.apiUrl.replace('/api', '')}${path}`;
  }

  openAdjustmentModal(item: StockItem): void {
    this.selectedItem.set(item);
    this.adjustmentForm.patchValue({
      newStock: item.stock,
      reason: '',
      customReason: '',
      note: ''
    });
    this.showAdjustmentModal.set(true);
  }

  openAdjustmentModalForLowStock(item: any): void {
    const stockItem: StockItem = {
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      sku: '',
      variationId: item.variationId,
      variationName: item.variationName,
      optionId: item.optionId,
      optionValue: item.optionValue,
      stock: item.stock,
      status: item.isOutOfStock ? 'out_of_stock' : 'low_stock',
      isActive: true
    };
    this.openAdjustmentModal(stockItem);
  }

  closeAdjustmentModal(): void {
    this.showAdjustmentModal.set(false);
    this.selectedItem.set(null);
  }

  submitAdjustment(): void {
    if (this.adjustmentForm.invalid || !this.selectedItem()) return;

    this.isSaving.set(true);
    const item = this.selectedItem()!;
    const formValue = this.adjustmentForm.value;

    const reason = formValue.reason === 'Autre' ? formValue.customReason : formValue.reason;

    this.stockService.makeAdjustment(item.productId, {
      newStock: formValue.newStock,
      reason,
      note: formValue.note,
      variationId: item.variationId || undefined,
      optionId: item.optionId || undefined
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeAdjustmentModal();
        this.loadProducts();
        this.loadLowStock();
        this.loadMovements();
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }

  openHistoryModal(item: StockItem): void {
    this.selectedItem.set(item);
    this.stockService.getProductMovements(item.productId, {
      variationId: item.variationId || undefined,
      optionId: item.optionId || undefined,
      limit: 50
    }).subscribe(() => {
      this.showHistoryModal.set(true);
    });
  }

  closeHistoryModal(): void {
    this.showHistoryModal.set(false);
    this.selectedItem.set(null);
  }

  openSettings(): void {
    this.showSettingsModal.set(true);
  }

  closeSettings(): void {
    this.showSettingsModal.set(false);
  }

  saveSettings(): void {
    this.isSaving.set(true);
    this.stockService.updateStockSettings(this.settingsForm.value).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeSettings();
        this.loadProducts();
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }

  exportMovements(): void {
    this.stockService.getAllMovements({ limit: 1000 }).subscribe(response => {
      if (response.success) {
        this.stockService.exportMovementsCSV(response.data.movements);
      }
    });
  }
}


