import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { LoadingComponent } from '@shared/components/loading/loading.component';

@Component({
  selector: 'app-shop-box-info',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatListModule,
    LoadingComponent
  ],
  templateUrl: './box-info.component.html',
  styleUrls: ['./box-info.component.scss'],})
export class ShopBoxInfoComponent implements OnInit {
  isLoading = signal(true);
  boxInfo = signal<any>(null);

  private equipmentLabels: Record<string, string> = {
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

  private equipmentIcons: Record<string, string> = {
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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadBoxInfo();
  }

  loadBoxInfo(): void {
    this.http.get<any>(`${environment.apiUrl}/shop/profile`).subscribe({
      next: (response) => {
        if (response.success && response.data?.shop?.boxId) {
          this.boxInfo.set(response.data.shop.boxId);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  getEquipmentLabel(eq: string): string {
    return this.equipmentLabels[eq] || eq;
  }

  getEquipmentIcon(eq: string): string {
    return this.equipmentIcons[eq] || 'check';
  }

  openImage(url: string): void {
    window.open(url, '_blank');
  }
}


