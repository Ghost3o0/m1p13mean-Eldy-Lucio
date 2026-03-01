import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from '@env/environment';

export interface DeliverySettings {
  offersDelivery: boolean;
  offersPickup: boolean;
  freeDeliveryThreshold: number | null;
  defaultDeliveryFee: number;
  maxDeliveryDistance: number | null;
}

export interface DeliveryZone {
  _id?: string;
  name: string;
  type: 'postal_codes' | 'cities' | 'radius';
  postalCodes: string[];
  cities: string[];
  centerCoordinates?: {
    lat: number;
    lng: number;
  };
  radiusKm?: number;
  deliveryFee: number;
  minOrderAmount: number;
  estimatedTime: string;
  isActive: boolean;
}

export interface DeliveryInfo {
  shopId: string;
  shopName: string;
  available: boolean;
  reason?: string;
  zone?: {
    name: string;
    deliveryFee: number;
    minOrderAmount: number;
    estimatedTime: string;
  };
  deliveryFee?: number;
  freeDeliveryThreshold?: number | null;
  offersPickup?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private readonly shopApiUrl = `${environment.apiUrl}/shop/delivery`;
  private readonly publicApiUrl = `${environment.apiUrl}/delivery`;

  isLoading = signal<boolean>(false);
  deliverySettings = signal<DeliverySettings | null>(null);
  deliveryZones = signal<DeliveryZone[]>([]);

  constructor(private http: HttpClient) {}

  // ==========================================
  // SHOP OWNER ENDPOINTS
  // ==========================================

  // Get delivery settings
  getDeliverySettings(): Observable<any> {
    this.isLoading.set(true);

    return this.http.get<any>(`${this.shopApiUrl}/settings`).pipe(
      tap({
        next: (response) => {
          if (response.success) {
            this.deliverySettings.set(response.data.settings);
            this.deliveryZones.set(response.data.zones);
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      })
    );
  }

  // Update delivery settings
  updateDeliverySettings(settings: Partial<DeliverySettings>): Observable<any> {
    return this.http.put<any>(`${this.shopApiUrl}/settings`, settings).pipe(
      tap(response => {
        if (response.success) {
          this.deliverySettings.set(response.data.settings);
        }
      })
    );
  }

  // Get delivery zones
  getDeliveryZones(): Observable<any> {
    return this.http.get<any>(`${this.shopApiUrl}/zones`).pipe(
      tap(response => {
        if (response.success) {
          this.deliveryZones.set(response.data.zones);
        }
      })
    );
  }

  // Create delivery zone
  createDeliveryZone(zone: Omit<DeliveryZone, '_id'>): Observable<any> {
    return this.http.post<any>(`${this.shopApiUrl}/zones`, zone).pipe(
      tap(response => {
        if (response.success) {
          this.deliveryZones.update(zones => [...zones, response.data.zone]);
        }
      })
    );
  }

  // Update delivery zone
  updateDeliveryZone(zoneId: string, zone: Partial<DeliveryZone>): Observable<any> {
    return this.http.put<any>(`${this.shopApiUrl}/zones/${zoneId}`, zone).pipe(
      tap(response => {
        if (response.success) {
          this.deliveryZones.update(zones =>
            zones.map(z => z._id === zoneId ? response.data.zone : z)
          );
        }
      })
    );
  }

  // Delete delivery zone
  deleteDeliveryZone(zoneId: string): Observable<any> {
    return this.http.delete<any>(`${this.shopApiUrl}/zones/${zoneId}`).pipe(
      tap(response => {
        if (response.success) {
          this.deliveryZones.update(zones => zones.filter(z => z._id !== zoneId));
        }
      })
    );
  }

  // Public alias for deleteDeliveryZone
  deleteZone(zoneId: string): Observable<any> {
    return this.deleteDeliveryZone(zoneId);
  }

  // Public alias for getDeliveryZones
  getZones(): Observable<DeliveryZone[]> {
    return this.getDeliveryZones().pipe(
      map((response: any) => {
        if (response.success) {
          return response.data.zones;
        }
        return [];
      })
    );
  }

  // ==========================================
  // PUBLIC ENDPOINTS (for clients)
  // ==========================================

  // Calculate delivery fee
  calculateDeliveryFee(
    shopIds: string[],
    address: {
      postalCode?: string;
      city?: string;
      coordinates?: { lat: number; lng: number };
    }
  ): Observable<{ success: boolean; data: { deliveryInfo: DeliveryInfo[] } }> {
    return this.http.post<any>(`${this.publicApiUrl}/calculate`, {
      shopIds,
      ...address
    });
  }

  // Get shop delivery zones (public)
  getShopDeliveryZones(shopId: string): Observable<any> {
    return this.http.get<any>(`${this.publicApiUrl}/shops/${shopId}/zones`);
  }

  // ==========================================
  // HELPERS
  // ==========================================

  getZoneTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'postal_codes': 'Codes postaux',
      'cities': 'Villes',
      'radius': 'Rayon'
    };
    return labels[type] || type;
  }

  getZoneCoverageText(zone: DeliveryZone): string {
    switch (zone.type) {
      case 'postal_codes':
        return `${zone.postalCodes.length} code(s) postal(aux)`;
      case 'cities':
        return `${zone.cities.length} ville(s)`;
      case 'radius':
        return `Rayon de ${zone.radiusKm} km`;
      default:
        return '';
    }
  }
}
