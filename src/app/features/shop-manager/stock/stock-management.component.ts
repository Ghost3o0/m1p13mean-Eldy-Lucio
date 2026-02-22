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
  template: `
    <div class="stock-container">
      <div class="header">
        <div class="title-section">
          <h1>Gestion du Stock</h1>
          <p class="subtitle">Gérez les niveaux de stock et consultez l'historique des mouvements</p>
        </div>
        <div class="actions">
          <button mat-button (click)="exportMovements()">
            <mat-icon>download</mat-icon>
            Exporter
          </button>
          <button mat-raised-button color="primary" (click)="openSettings()">
            <mat-icon>settings</mat-icon>
            Paramètres
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <mat-card class="summary-card">
          <mat-card-content>
            <mat-icon class="card-icon success">check_circle</mat-icon>
            <div class="card-info">
              <span class="value">{{ inStockCount() }}</span>
              <span class="label">En stock</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card">
          <mat-card-content>
            <mat-icon class="card-icon warning">warning</mat-icon>
            <div class="card-info">
              <span class="value">{{ lowStockCount() }}</span>
              <span class="label">Stock faible</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card">
          <mat-card-content>
            <mat-icon class="card-icon error">error</mat-icon>
            <div class="card-info">
              <span class="value">{{ outOfStockCount() }}</span>
              <span class="label">Rupture</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-tab-group>
        <!-- Products Tab -->
        <mat-tab label="Produits">
          <div class="tab-content">
            <!-- Filters -->
            <div class="filters">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Rechercher</mat-label>
                <input matInput [(ngModel)]="searchTerm" (keyup.enter)="loadProducts()" placeholder="Nom ou SKU">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-chip-listbox [(ngModel)]="stockFilter" (change)="loadProducts()">
                <mat-chip-option value="">Tous</mat-chip-option>
                <mat-chip-option value="in_stock">En stock</mat-chip-option>
                <mat-chip-option value="low_stock">Stock faible</mat-chip-option>
                <mat-chip-option value="out_of_stock">Rupture</mat-chip-option>
              </mat-chip-listbox>
            </div>

            @if (stockService.isLoading()) {
              <app-loading message="Chargement..."></app-loading>
            }

            @if (!stockService.isLoading()) {
              <!-- Stock Table -->
              <mat-card class="stock-table-card">
                <table mat-table [dataSource]="stockService.stockItems()" class="stock-table">
                  <!-- Product Column -->
                  <ng-container matColumnDef="product">
                    <th mat-header-cell *matHeaderCellDef>Produit</th>
                    <td mat-cell *matCellDef="let item">
                      <div class="product-cell">
                        <img [src]="getImageUrl(item.productImage)" [alt]="item.productName" class="product-image">
                        <div class="product-info">
                          <span class="product-name">{{ item.productName }}</span>
                          @if (item.variationName) {
                            <span class="variation">{{ item.variationName }}: {{ item.optionValue }}</span>
                          }
                          @if (item.sku) {
                            <span class="sku">SKU: {{ item.sku }}</span>
                          }
                        </div>
                      </div>
                    </td>
                  </ng-container>

                  <!-- Stock Column -->
                  <ng-container matColumnDef="stock">
                    <th mat-header-cell *matHeaderCellDef>Stock</th>
                    <td mat-cell *matCellDef="let item">
                      <div class="stock-cell" [class]="item.status">
                        <span class="stock-value">{{ item.stock }}</span>
                        @switch (item.status) {
                          @case ('in_stock') {
                            <mat-icon class="status-icon">check_circle</mat-icon>
                          }
                          @case ('low_stock') {
                            <mat-icon class="status-icon">warning</mat-icon>
                          }
                          @case ('out_of_stock') {
                            <mat-icon class="status-icon">error</mat-icon>
                          }
                        }
                      </div>
                    </td>
                  </ng-container>

                  <!-- Status Column -->
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Statut</th>
                    <td mat-cell *matCellDef="let item">
                      <span class="status-badge" [class]="item.status">
                        {{ stockService.getStatusLabel(item.status) }}
                      </span>
                    </td>
                  </ng-container>

                  <!-- Actions Column -->
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let item">
                      <button mat-icon-button color="primary" matTooltip="Ajuster le stock" (click)="openAdjustmentModal(item)">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button matTooltip="Voir l'historique" (click)="openHistoryModal(item)">
                        <mat-icon>history</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                </table>

                @if (stockService.stockItems().length === 0) {
                  <div class="empty-state">
                    <mat-icon>inventory_2</mat-icon>
                    <p>Aucun produit trouvé</p>
                  </div>
                }
              </mat-card>
            }
          </div>
        </mat-tab>

        <!-- Low Stock Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <span>Alertes stock</span>
            @if (lowStockCount() + outOfStockCount() > 0) {
              <span class="tab-badge">{{ lowStockCount() + outOfStockCount() }}</span>
            }
          </ng-template>

          <div class="tab-content">
            @if (stockService.lowStockItems().length === 0) {
              <div class="empty-state success">
                <mat-icon>check_circle</mat-icon>
                <h3>Tout est en ordre !</h3>
                <p>Aucun produit en rupture ou stock faible</p>
              </div>
            } @else {
              <div class="low-stock-list">
                @for (item of stockService.lowStockItems(); track item.productId + item.optionId) {
                  <mat-card class="low-stock-item" [class.out-of-stock]="item.isOutOfStock">
                    <img [src]="getImageUrl(item.productImage)" [alt]="item.productName" class="product-image">
                    <div class="item-info">
                      <span class="product-name">{{ item.productName }}</span>
                      @if (item.variationName) {
                        <span class="variation">{{ item.variationName }}: {{ item.optionValue }}</span>
                      }
                    </div>
                    <div class="stock-info">
                      <span class="stock-value" [class.zero]="item.stock === 0">{{ item.stock }}</span>
                      <span class="stock-label">en stock</span>
                    </div>
                    <button mat-raised-button color="primary" (click)="openAdjustmentModalForLowStock(item)">
                      Réapprovisionner
                    </button>
                  </mat-card>
                }
              </div>
            }
          </div>
        </mat-tab>

        <!-- Movements Tab -->
        <mat-tab label="Historique">
          <div class="tab-content">
            <div class="filters">
              <mat-form-field appearance="outline">
                <mat-label>Type</mat-label>
                <mat-select [(ngModel)]="movementTypeFilter" (selectionChange)="loadMovements()">
                  <mat-option value="">Tous</mat-option>
                  <mat-option value="order">Commandes</mat-option>
                  <mat-option value="adjustment">Ajustements</mat-option>
                  <mat-option value="return">Retours</mat-option>
                  <mat-option value="in">Entrées</mat-option>
                  <mat-option value="out">Sorties</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <mat-card class="movements-card">
              @for (movement of allMovements(); track movement._id) {
                <div class="movement-item">
                  <div class="movement-icon" [class]="movement.quantity > 0 ? 'positive' : 'negative'">
                    @if (movement.quantity > 0) {
                      <mat-icon>arrow_upward</mat-icon>
                    } @else {
                      <mat-icon>arrow_downward</mat-icon>
                    }
                  </div>
                  <div class="movement-info">
                    <span class="product-name">{{ movement.productId?.name || 'Produit' }}</span>
                    <span class="movement-type">{{ stockService.getMovementTypeLabel(movement.type) }}</span>
                    @if (movement.reason) {
                      <span class="reason">{{ movement.reason }}</span>
                    }
                  </div>
                  <div class="movement-details">
                    <span class="quantity" [class]="movement.quantity > 0 ? 'positive' : 'negative'">
                      {{ movement.quantity > 0 ? '+' : '' }}{{ movement.quantity }}
                    </span>
                    <span class="stock-change">{{ movement.previousStock }} → {{ movement.newStock }}</span>
                  </div>
                  <span class="movement-date">{{ movement.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              } @empty {
                <div class="empty-state">
                  <mat-icon>history</mat-icon>
                  <p>Aucun mouvement enregistré</p>
                </div>
              }
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>

      <!-- Adjustment Modal -->
      @if (showAdjustmentModal()) {
        <div class="modal-overlay" (click)="closeAdjustmentModal()">
          <mat-card class="modal" (click)="$event.stopPropagation()">
            <mat-card-header>
              <mat-card-title>Ajustement de stock</mat-card-title>
              <button mat-icon-button (click)="closeAdjustmentModal()">
                <mat-icon>close</mat-icon>
              </button>
            </mat-card-header>
            <mat-card-content>
              <div class="modal-product">
                <img [src]="getImageUrl(selectedItem()?.productImage)" [alt]="selectedItem()?.productName">
                <div>
                  <strong>{{ selectedItem()?.productName }}</strong>
                  @if (selectedItem()?.variationName) {
                    <span>{{ selectedItem()?.variationName }}: {{ selectedItem()?.optionValue }}</span>
                  }
                </div>
              </div>

              <div class="current-stock">
                Stock actuel: <strong>{{ selectedItem()?.stock }}</strong>
              </div>

              <form [formGroup]="adjustmentForm">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Nouveau stock</mat-label>
                  <input matInput type="number" formControlName="newStock" min="0">
                </mat-form-field>

                <div class="reason-options">
                  <label>Raison:</label>
                  <mat-radio-group formControlName="reason">
                    <mat-radio-button value="Réception marchandise">Réception marchandise</mat-radio-button>
                    <mat-radio-button value="Inventaire">Inventaire</mat-radio-button>
                    <mat-radio-button value="Retour client">Retour client</mat-radio-button>
                    <mat-radio-button value="Perte/Casse">Perte/Casse</mat-radio-button>
                    <mat-radio-button value="Autre">Autre</mat-radio-button>
                  </mat-radio-group>
                </div>

                @if (adjustmentForm.get('reason')?.value === 'Autre') {
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Précisez</mat-label>
                    <input matInput formControlName="customReason">
                  </mat-form-field>
                }

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Note (optionnel)</mat-label>
                  <textarea matInput formControlName="note" rows="2"></textarea>
                </mat-form-field>
              </form>
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-button (click)="closeAdjustmentModal()">Annuler</button>
              <button mat-raised-button color="primary" (click)="submitAdjustment()" [disabled]="adjustmentForm.invalid || isSaving()">
                @if (isSaving()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Confirmer
                }
              </button>
            </mat-card-actions>
          </mat-card>
        </div>
      }

      <!-- History Modal -->
      @if (showHistoryModal()) {
        <div class="modal-overlay" (click)="closeHistoryModal()">
          <mat-card class="modal history-modal" (click)="$event.stopPropagation()">
            <mat-card-header>
              <mat-card-title>
                Historique - {{ selectedItem()?.productName }}
                @if (selectedItem()?.variationName) {
                  ({{ selectedItem()?.optionValue }})
                }
              </mat-card-title>
              <button mat-icon-button (click)="closeHistoryModal()">
                <mat-icon>close</mat-icon>
              </button>
            </mat-card-header>
            <mat-card-content>
              @for (movement of stockService.movements(); track movement._id) {
                <div class="history-item">
                  <span class="date">{{ movement.createdAt | date:'dd/MM HH:mm' }}</span>
                  <span class="type">{{ stockService.getMovementTypeLabel(movement.type) }}</span>
                  <span class="quantity" [class]="movement.quantity > 0 ? 'positive' : 'negative'">
                    {{ movement.quantity > 0 ? '+' : '' }}{{ movement.quantity }}
                  </span>
                  <span class="stock">{{ movement.newStock }}</span>
                  <span class="reason">{{ movement.reason || '-' }}</span>
                </div>
              } @empty {
                <div class="empty-state">
                  <p>Aucun historique disponible</p>
                </div>
              }
            </mat-card-content>
          </mat-card>
        </div>
      }

      <!-- Settings Modal -->
      @if (showSettingsModal()) {
        <div class="modal-overlay" (click)="closeSettings()">
          <mat-card class="modal" (click)="$event.stopPropagation()">
            <mat-card-header>
              <mat-card-title>Paramètres de stock</mat-card-title>
              <button mat-icon-button (click)="closeSettings()">
                <mat-icon>close</mat-icon>
              </button>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="settingsForm">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Seuil de stock faible</mat-label>
                  <input matInput type="number" formControlName="lowStockThreshold" min="0">
                  <mat-hint>Alerte quand le stock descend sous ce seuil</mat-hint>
                </mat-form-field>

                <mat-slide-toggle formControlName="enableLowStockAlerts">
                  Activer les alertes de stock faible
                </mat-slide-toggle>

                <mat-slide-toggle formControlName="trackMovements">
                  Enregistrer l'historique des mouvements
                </mat-slide-toggle>
              </form>
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-button (click)="closeSettings()">Annuler</button>
              <button mat-raised-button color="primary" (click)="saveSettings()" [disabled]="isSaving()">
                Enregistrer
              </button>
            </mat-card-actions>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .stock-container {
      padding: 24px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;

      h1 {
        margin: 0;
        font-size: 2rem;
      }

      .subtitle {
        color: var(--text-secondary);
        margin: 4px 0 0;
      }

      .actions {
        display: flex;
        gap: 8px;
      }
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .summary-card {
      mat-card-content {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px !important;
      }

      .card-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;

        &.success { color: var(--success); }
        &.warning { color: var(--warning); }
        &.error { color: var(--error); }
      }

      .card-info {
        display: flex;
        flex-direction: column;

        .value {
          font-size: 2rem;
          font-weight: 600;
        }

        .label {
          color: var(--text-secondary);
        }
      }
    }

    .tab-content {
      padding: 24px 0;
    }

    .filters {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;

      .search-field {
        flex: 1;
        min-width: 200px;
        max-width: 400px;
      }
    }

    .stock-table-card {
      overflow-x: auto;
    }

    .stock-table {
      width: 100%;
    }

    .product-cell {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;

      .product-image {
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 4px;
      }

      .product-info {
        display: flex;
        flex-direction: column;

        .product-name {
          font-weight: 500;
        }

        .variation, .sku {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
      }
    }

    .stock-cell {
      display: flex;
      align-items: center;
      gap: 8px;

      .stock-value {
        font-weight: 600;
        font-size: 1.1rem;
      }

      .status-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      &.in_stock .status-icon { color: var(--success); }
      &.low_stock .status-icon { color: var(--warning); }
      &.out_of_stock .status-icon { color: var(--error); }
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.85rem;
      font-weight: 500;

      &.in_stock {
        background: var(--success-light);
        color: var(--success);
      }

      &.low_stock {
        background: var(--warning-light);
        color: var(--warning);
      }

      &.out_of_stock {
        background: var(--error-light);
        color: var(--error);
      }
    }

    .tab-badge {
      background: var(--error);
      color: white;
      border-radius: 12px;
      padding: 2px 8px;
      font-size: 0.75rem;
      margin-left: 8px;
    }

    .low-stock-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .low-stock-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;

      &.out-of-stock {
        border-left: 4px solid var(--error);
      }

      .product-image {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 4px;
      }

      .item-info {
        flex: 1;
        display: flex;
        flex-direction: column;

        .product-name {
          font-weight: 500;
        }

        .variation {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
      }

      .stock-info {
        display: flex;
        flex-direction: column;
        align-items: center;

        .stock-value {
          font-size: 1.5rem;
          font-weight: 600;

          &.zero {
            color: var(--error);
          }
        }

        .stock-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
      }
    }

    .movements-card {
      padding: 0;
    }

    .movement-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border-bottom: 1px solid var(--border-color);

      &:last-child {
        border-bottom: none;
      }

      .movement-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;

        &.positive {
          background: var(--success-light);
          color: var(--success);
        }

        &.negative {
          background: var(--error-light);
          color: var(--error);
        }
      }

      .movement-info {
        flex: 1;
        display: flex;
        flex-direction: column;

        .product-name {
          font-weight: 500;
        }

        .movement-type {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .reason {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
      }

      .movement-details {
        text-align: right;

        .quantity {
          font-weight: 600;
          font-size: 1.1rem;
          display: block;

          &.positive { color: var(--success); }
          &.negative { color: var(--error); }
        }

        .stock-change {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
      }

      .movement-date {
        font-size: 0.85rem;
        color: var(--text-secondary);
        min-width: 100px;
        text-align: right;
      }
    }

    .empty-state {
      text-align: center;
      padding: 48px;
      color: var(--text-secondary);

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: var(--gray-300);
      }

      &.success {
        mat-icon {
          color: var(--success);
        }
      }

      h3 {
        margin: 16px 0 8px;
      }
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;

      mat-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      &.history-modal {
        max-width: 700px;
      }
    }

    .modal-product {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
      padding: 16px;
      background: var(--bg-secondary);
      border-radius: 8px;

      img {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 4px;
      }

      div {
        display: flex;
        flex-direction: column;

        span {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
      }
    }

    .current-stock {
      margin-bottom: 16px;
      font-size: 1.1rem;
    }

    .full-width {
      width: 100%;
    }

    .reason-options {
      margin-bottom: 16px;

      label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
      }

      mat-radio-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
    }

    .history-item {
      display: grid;
      grid-template-columns: 80px 100px 60px 50px 1fr;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-color);
      align-items: center;

      .date {
        font-size: 0.85rem;
        color: var(--text-secondary);
      }

      .type {
        font-size: 0.9rem;
      }

      .quantity {
        font-weight: 600;
        text-align: right;

        &.positive { color: var(--success); }
        &.negative { color: var(--error); }
      }

      .stock {
        font-weight: 500;
        text-align: right;
      }

      .reason {
        font-size: 0.85rem;
        color: var(--text-secondary);
      }
    }

    mat-slide-toggle {
      display: block;
      margin: 16px 0;
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        gap: 16px;
      }

      .movement-item {
        flex-wrap: wrap;
      }

      .history-item {
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
    }
  `]
})
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
