import { Component, OnInit, signal, inject, Inject } from '@angular/core';
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
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { LoadingComponent } from '@shared/components/loading/loading.component';

// ==========================================
// PROMOTE VENDOR DIALOG COMPONENT
// ==========================================
@Component({
  selector: 'app-promote-vendor-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>store</mat-icon>
      Promouvoir en vendeur
    </h2>

    <mat-dialog-content>
      <div class="user-info">
        <p><strong>Utilisateur:</strong> {{ data.user.firstName }} {{ data.user.lastName }}</p>
        <p><strong>Email:</strong> {{ data.user.email }}</p>
      </div>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Nom de la boutique</mat-label>
        <input matInput [(ngModel)]="shopName" [placeholder]="'Boutique de ' + data.user.firstName">
        <mat-hint>Laissez vide pour utiliser le nom par défaut</mat-hint>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Catégorie</mat-label>
        <mat-select [(ngModel)]="categoryId">
          <mat-option [value]="null">Aucune catégorie</mat-option>
          @for (cat of categories(); track cat._id) {
            <mat-option [value]="cat._id">{{ cat.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Assigner un box (optionnel)</mat-label>
        <mat-select [(ngModel)]="boxId">
          <mat-option [value]="null">Pas de box pour l'instant</mat-option>
          @for (box of availableBoxes(); track box._id) {
            <mat-option [value]="box._id">
              {{ box.name }}
              @if (box.location?.floor) {
                - Étage {{ box.location.floor }}
              }
              @if (box.currentRent?.amount) {
                ({{ box.currentRent.amount | number }} Ar/mois)
              }
            </mat-option>
          }
        </mat-select>
        <mat-hint>Sélectionnez un box disponible à assigner immédiatement</mat-hint>
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-raised-button color="primary" (click)="confirm()">
        <mat-icon>check</mat-icon>
        Promouvoir
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;

      mat-icon {
        color: var(--primary);
      }
    }

    mat-dialog-content {
      padding-top: 16px;
    }

    .user-info {
      background: var(--bg-secondary);
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 24px;

      p {
        margin: 4px 0;
      }
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    mat-dialog-actions {
      padding: 16px 24px;
    }
  `]
})
export class PromoteVendorDialogComponent implements OnInit {
  shopName = '';
  categoryId: string | null = null;
  boxId: string | null = null;

  categories = signal<any[]>([]);
  availableBoxes = signal<any[]>([]);

  constructor(
    public dialogRef: MatDialogRef<PromoteVendorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: any },
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadAvailableBoxes();
  }

  loadCategories(): void {
    this.http.get<any>(`${environment.apiUrl}/admin/categories`).subscribe({
      next: (res) => {
        if (res.success) {
          this.categories.set(res.data.categories);
        }
      }
    });
  }

  loadAvailableBoxes(): void {
    this.http.get<any>(`${environment.apiUrl}/admin/boxes`).subscribe({
      next: (res) => {
        if (res.success) {
          const available = res.data.boxes.filter((b: any) => !b.currentShopId);
          this.availableBoxes.set(available);
        }
      }
    });
  }

  confirm(): void {
    this.dialogRef.close({
      shopName: this.shopName || undefined,
      categoryId: this.categoryId || undefined,
      boxId: this.boxId || undefined
    });
  }
}

// ==========================================
// ADMIN USERS COMPONENT
// ==========================================
@Component({
  selector: 'app-admin-users',
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
    MatDialogModule,
    MatSnackBarModule,
    LoadingComponent
  ],
  template: `
    <div class="users-container">
      <h1>Gestion des utilisateurs</h1>

      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Rechercher</mat-label>
              <input matInput [(ngModel)]="searchQuery" (keyup.enter)="loadUsers()" placeholder="Nom, email...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Rôle</mat-label>
              <mat-select [(ngModel)]="selectedRole" (selectionChange)="loadUsers()">
                <mat-option [value]="null">Tous</mat-option>
                <mat-option value="client">Clients</mat-option>
                <mat-option value="shop">Vendeurs</mat-option>
                <mat-option value="admin">Administrateurs</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      @if (isLoading()) {
        <app-loading message="Chargement..."></app-loading>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="users()">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nom</th>
              <td mat-cell *matCellDef="let user">{{ user.firstName }} {{ user.lastName }}</td>
            </ng-container>
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let user">{{ user.email }}</td>
            </ng-container>
            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef>Rôle</th>
              <td mat-cell *matCellDef="let user">
                <mat-chip [class]="'role-' + user.role">{{ getRoleLabel(user.role) }}</mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let user">
                <mat-chip [class]="user.isActive ? 'status-active' : 'status-inactive'">
                  {{ user.isActive ? 'Actif' : 'Inactif' }}
                </mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Inscrit le</th>
              <td mat-cell *matCellDef="let user">{{ user.createdAt | date:'dd/MM/yyyy' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let user">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  @if (user.role === 'client') {
                    <button mat-menu-item (click)="promoteToVendor(user)">
                      <mat-icon>store</mat-icon>
                      <span>Promouvoir en vendeur</span>
                    </button>
                  }
                  <button mat-menu-item (click)="toggleUserStatus(user)">
                    <mat-icon>{{ user.isActive ? 'block' : 'check_circle' }}</mat-icon>
                    <span>{{ user.isActive ? 'Désactiver' : 'Activer' }}</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
          <mat-paginator [length]="pagination()?.total || 0" [pageSize]="20" (page)="onPageChange($event)"></mat-paginator>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .users-container { padding: 24px; }
    h1 { font-size: 2rem; margin-bottom: 24px; }
    .filters-card { margin-bottom: 24px; }
    .filters-row { display: flex; gap: 16px; flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 250px; }
    table { width: 100%; }
    mat-chip {
      &.role-admin { background: var(--primary-50) !important; color: var(--primary) !important; }
      &.role-shop { background: var(--warning-light) !important; color: var(--warning) !important; }
      &.role-client { background: var(--success-light) !important; color: var(--success) !important; }
      &.status-active { background: var(--success-light) !important; color: var(--success) !important; }
      &.status-inactive { background: var(--error-light) !important; color: var(--error) !important; }
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  users = signal<any[]>([]);
  pagination = signal<any>(null);
  isLoading = signal(true);
  searchQuery = '';
  selectedRole: string | null = null;
  displayedColumns = ['name', 'email', 'role', 'status', 'date', 'actions'];

  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(page = 1): void {
    this.isLoading.set(true);
    const params: any = { page, limit: 20 };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedRole) params.role = this.selectedRole;

    this.http.get<any>(`${environment.apiUrl}/admin/users`, { params }).subscribe({
      next: (res) => {
        if (res.success) {
          this.users.set(res.data.users);
          this.pagination.set(res.data.pagination);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      admin: 'Admin',
      shop: 'Vendeur',
      client: 'Client'
    };
    return labels[role] || role;
  }

  toggleUserStatus(user: any): void {
    this.http.put<any>(`${environment.apiUrl}/admin/users/${user._id}/status`, {
      isActive: !user.isActive
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(`Utilisateur ${user.isActive ? 'désactivé' : 'activé'}`, 'Fermer', { duration: 3000 });
          this.loadUsers();
        }
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.loadUsers(event.pageIndex + 1);
  }

  promoteToVendor(user: any): void {
    const dialogRef = this.dialog.open(PromoteVendorDialogComponent, {
      width: '500px',
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.http.post<any>(`${environment.apiUrl}/admin/users/${user._id}/promote-to-vendor`, result).subscribe({
          next: (res) => {
            if (res.success) {
              this.snackBar.open('Utilisateur promu vendeur avec succès!', 'Fermer', { duration: 3000 });
              this.loadUsers();
            }
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Erreur lors de la promotion', 'Fermer', { duration: 3000 });
          }
        });
      }
    });
  }
}
