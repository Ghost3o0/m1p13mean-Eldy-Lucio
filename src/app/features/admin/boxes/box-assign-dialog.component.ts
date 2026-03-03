import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { BoxService } from '@shared/services/box.service';

@Component({
  selector: 'app-box-assign-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './box-assign-dialog.component.html',
  styleUrls: ['./box-assign-dialog.component.scss']
})
export class BoxAssignDialogComponent implements OnInit {
  isLoading = signal(true);
  isSaving = signal(false);
  shops = signal<any[]>([]);
  selectedShopId: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<BoxAssignDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private boxService: BoxService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadShops();
  }

  loadShops() {
    this.http.get(`${environment.apiUrl}/admin/shops`, {
      params: { status: 'approved', limit: '100' }
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.shops.set(response.data.shops || []);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  getSelectedShopName(): string {
    const shop = this.shops().find(s => s._id === this.selectedShopId);
    return shop?.name || '';
  }

  assign() {
    if (!this.selectedShopId) return;

    this.isSaving.set(true);

    this.boxService.assignToShop(this.data.box._id, this.selectedShopId).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }
}
