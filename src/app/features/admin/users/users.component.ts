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
  templateUrl: './promote-vendor-dialog.component.html',
  styleUrls: ['./promote-vendor-dialog.component.scss']
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
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class AdminUsersComponent implements OnInit {
  users = signal<any[]>([]);
  pagination = signal<any>(null);
  isLoading = signal(true);
  searchQuery = '';
  selectedRole: string | null = null;
  displayedColumns = ['name', 'email', 'date', 'actions'];

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
