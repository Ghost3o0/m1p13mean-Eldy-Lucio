import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  clientApiUrl = `${environment.apiUrl}/client/reservations`;
  shopApiUrl = `${environment.apiUrl}/shop/reservations`;

  constructor(private http: HttpClient) {}

  // ========== CLIENT METHODS ==========

  getUserReservations(filters = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    });
    return this.http.get(this.clientApiUrl, { params });
  }

  getUserReservation(id) {
    return this.http.get(`${this.clientApiUrl}/${id}`);
  }

  createReservation(data) {
    return this.http.post(this.clientApiUrl, data);
  }

  cancelUserReservation(id, reason = null) {
    return this.http.put(`${this.clientApiUrl}/${id}/cancel`, { reason });
  }

  // ========== SHOP METHODS ==========

  getShopReservations(filters = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    });
    return this.http.get(this.shopApiUrl, { params });
  }

  getTodayReservations() {
    return this.http.get(`${this.shopApiUrl}/today`);
  }

  getShopReservation(id) {
    return this.http.get(`${this.shopApiUrl}/${id}`);
  }

  findByPickupCode(code) {
    return this.http.get(`${this.shopApiUrl}/pickup-code/${code}`);
  }

  confirmReservation(id) {
    return this.http.put(`${this.shopApiUrl}/${id}/confirm`, {});
  }

  markReady(id) {
    return this.http.put(`${this.shopApiUrl}/${id}/ready`, {});
  }

  markCollected(id) {
    return this.http.put(`${this.shopApiUrl}/${id}/collected`, {});
  }

  cancelShopReservation(id, reason = null) {
    return this.http.put(`${this.shopApiUrl}/${id}/cancel`, { reason });
  }

  addShopNote(id, note) {
    return this.http.put(`${this.shopApiUrl}/${id}/note`, { note });
  }

  getStatistics(period = null) {
    let params = new HttpParams();
    if (period) params = params.set('period', period);
    return this.http.get(`${this.shopApiUrl}/statistics`, { params });
  }
}
