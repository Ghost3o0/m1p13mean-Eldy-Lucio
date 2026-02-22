import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class SellerService {
  apiUrl = `${environment.apiUrl}/shop/sellers`;

  constructor(private http: HttpClient) {}

  getSellers(filters = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get(this.apiUrl, { params });
  }

  getSeller(id) {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createSeller(data) {
    return this.http.post(this.apiUrl, data);
  }

  updateSeller(id, data) {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  updatePermissions(id, permissions) {
    return this.http.put(`${this.apiUrl}/${id}/permissions`, { permissions });
  }

  updateStatus(id, status) {
    return this.http.put(`${this.apiUrl}/${id}/status`, { status });
  }

  uploadAvatar(id, file) {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.http.post(`${this.apiUrl}/${id}/avatar`, formData);
  }

  recordSale(id, orderTotal) {
    return this.http.post(`${this.apiUrl}/${id}/sale`, { orderTotal });
  }

  deleteSeller(id) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getTopPerformers(limit = 5) {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get(`${this.apiUrl}/top-performers`, { params });
  }

  getStatistics() {
    return this.http.get(`${this.apiUrl}/statistics`);
  }

  getByPermission(permission) {
    return this.http.get(`${this.apiUrl}/by-permission/${permission}`);
  }
}
