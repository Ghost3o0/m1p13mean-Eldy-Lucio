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
  template: `
    <div class="box-info-container">
      <div class="box-header">
        <h1>Mon Box</h1>
        <p class="subtitle">Informations sur votre emplacement</p>
      </div>

      @if (isLoading()) {
        <app-loading message="Chargement des informations..."></app-loading>
      } @else if (!boxInfo()) {
        <mat-card class="no-box-card">
          <mat-card-content>
            <div class="no-box">
              <mat-icon>business</mat-icon>
              <h3>Aucun box assigné</h3>
              <p>Votre boutique n'a pas encore de box assigné.</p>
              <p>Contactez l'administration pour plus d'informations.</p>
            </div>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="box-content">
          <!-- Main Info Card -->
          <mat-card class="main-info-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>business</mat-icon>
              <mat-card-title>{{ boxInfo()?.name }}</mat-card-title>
              <mat-card-subtitle>
                @if (boxInfo()?.location?.floor) {
                  Étage {{ boxInfo()?.location?.floor }}
                }
                @if (boxInfo()?.location?.zone) {
                  - Zone {{ boxInfo()?.location?.zone }}
                }
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              @if (boxInfo()?.description) {
                <p class="description">{{ boxInfo()?.description }}</p>
              }

              <mat-divider></mat-divider>

              <div class="info-grid">
                <!-- Dimensions -->
                <div class="info-item">
                  <mat-icon>straighten</mat-icon>
                  <div class="info-content">
                    <span class="label">Surface</span>
                    <span class="value">
                      @if (boxInfo()?.dimensions?.area) {
                        {{ boxInfo()?.dimensions?.area }} m²
                      } @else if (boxInfo()?.dimensions?.length && boxInfo()?.dimensions?.width) {
                        {{ boxInfo()?.dimensions?.length }}m x {{ boxInfo()?.dimensions?.width }}m
                      } @else {
                        Non spécifiée
                      }
                    </span>
                  </div>
                </div>

                <!-- Location -->
                <div class="info-item">
                  <mat-icon>place</mat-icon>
                  <div class="info-content">
                    <span class="label">Position</span>
                    <span class="value">{{ boxInfo()?.location?.position || 'Non spécifiée' }}</span>
                  </div>
                </div>

                <!-- Rent -->
                <div class="info-item">
                  <mat-icon>payments</mat-icon>
                  <div class="info-content">
                    <span class="label">Loyer mensuel</span>
                    <span class="value rent">
                      {{ boxInfo()?.currentRent?.amount | number:'1.2-2' }}
                      {{ boxInfo()?.currentRent?.currency || 'Ar' }}
                    </span>
                  </div>
                </div>

                <!-- Status -->
                <div class="info-item">
                  <mat-icon>info</mat-icon>
                  <div class="info-content">
                    <span class="label">Statut</span>
                    <mat-chip [class]="boxInfo()?.availability?.status === 'usable' ? 'status-ok' : 'status-warning'">
                      {{ boxInfo()?.availability?.status === 'usable' ? 'Opérationnel' : 'Indisponible' }}
                    </mat-chip>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Equipment Card -->
          @if (boxInfo()?.equipment?.length) {
            <mat-card class="equipment-card">
              <mat-card-header>
                <mat-card-title>Équipements</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="equipment-grid">
                  @for (eq of boxInfo()?.equipment; track eq) {
                    <div class="equipment-item">
                      <mat-icon>{{ getEquipmentIcon(eq) }}</mat-icon>
                      <span>{{ getEquipmentLabel(eq) }}</span>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          }

          <!-- Gallery Card -->
          @if (boxInfo()?.gallery?.length) {
            <mat-card class="gallery-card">
              <mat-card-header>
                <mat-card-title>Galerie photos</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="gallery-grid">
                  @for (image of boxInfo()?.gallery; track image) {
                    <div class="gallery-item" (click)="openImage(image)">
                      <img [src]="image" alt="Photo du box">
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          }

          <!-- Actions Card -->
          <mat-card class="actions-card">
            <mat-card-header>
              <mat-card-title>Actions</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-list>
                <a mat-list-item routerLink="/shop/requests">
                  <mat-icon matListItemIcon>swap_horiz</mat-icon>
                  <span matListItemTitle>Demander un changement de box</span>
                  <span matListItemLine>Faire une demande pour changer d'emplacement</span>
                </a>
                <a mat-list-item routerLink="/shop/requests">
                  <mat-icon matListItemIcon>report_problem</mat-icon>
                  <span matListItemTitle>Signaler un problème</span>
                  <span matListItemLine>Électricité, plomberie, sécurité...</span>
                </a>
                <a mat-list-item routerLink="/shop/rent-payments">
                  <mat-icon matListItemIcon>receipt</mat-icon>
                  <span matListItemTitle>Mes paiements de loyer</span>
                  <span matListItemLine>Historique et soumettre un nouveau paiement</span>
                </a>
              </mat-list>
            </mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .box-info-container {
      padding: 24px;
    }

    .box-header {
      margin-bottom: 24px;

      h1 {
        font-size: 2rem;
        margin: 0;
      }

      .subtitle {
        color: var(--text-secondary);
        margin: 4px 0 0 0;
      }
    }

    .no-box-card {
      max-width: 500px;
      margin: 0 auto;

      .no-box {
        text-align: center;
        padding: 32px;

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
          margin: 4px 0;
        }
      }
    }

    .box-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 24px;
    }

    .main-info-card {
      grid-column: 1 / -1;

      mat-card-header {
        mat-icon[mat-card-avatar] {
          font-size: 40px;
          width: 40px;
          height: 40px;
          color: var(--primary);
        }
      }

      .description {
        margin: 16px 0;
        color: var(--text-secondary);
      }

      mat-divider {
        margin: 16px 0;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 24px;
        padding: 16px 0;
      }

      .info-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;

        mat-icon {
          color: var(--primary);
        }

        .info-content {
          display: flex;
          flex-direction: column;

          .label {
            font-size: 0.85rem;
            color: var(--text-secondary);
          }

          .value {
            font-size: 1.1rem;
            font-weight: 500;

            &.rent {
              color: var(--success);
            }
          }
        }
      }
    }

    mat-chip {
      &.status-ok {
        background: var(--success-light) !important;
        color: var(--success) !important;
      }
      &.status-warning {
        background: var(--warning-light) !important;
        color: var(--warning) !important;
      }
    }

    .equipment-card {
      .equipment-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 16px;
        padding: 16px 0;
      }

      .equipment-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background: var(--bg-secondary);
        border-radius: 8px;

        mat-icon {
          color: var(--primary);
        }
      }
    }

    .gallery-card {
      .gallery-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 12px;
        padding: 16px 0;
      }

      .gallery-item {
        aspect-ratio: 4/3;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.2s;

        &:hover {
          transform: scale(1.05);
        }

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
    }

    .actions-card {
      mat-list-item {
        cursor: pointer;

        mat-icon {
          color: var(--primary);
        }
      }
    }

    @media (max-width: 768px) {
      .box-content {
        grid-template-columns: 1fr;
      }
    }
  `]
})
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
