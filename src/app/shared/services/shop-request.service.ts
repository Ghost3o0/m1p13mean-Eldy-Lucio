import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class ShopRequestService {
  shopApiUrl = `${environment.apiUrl}/shop/requests`;
  adminApiUrl = `${environment.apiUrl}/admin/shop-requests`;

  constructor(private http: HttpClient) {}

  // ========== SHOP METHODS ==========

  getShopRequests(filters = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    });
    return this.http.get(this.shopApiUrl, { params });
  }

  getShopRequestById(id) {
    return this.http.get(`${this.shopApiUrl}/${id}`);
  }

  createBoxChangeRequest(data) {
    return this.http.post(`${this.shopApiUrl}/box-change`, data);
  }

  createProblemReport(data, photos = null) {
    const formData = new FormData();
    formData.append('problemType', data.problemType);
    formData.append('description', data.description);
    if (data.urgency) formData.append('urgency', data.urgency);
    if (photos) {
      photos.forEach(photo => formData.append('photos', photo));
    }
    return this.http.post(`${this.shopApiUrl}/problem`, formData);
  }

  createTerminationRequest(data) {
    return this.http.post(`${this.shopApiUrl}/termination`, data);
  }

  cancelRequest(id) {
    return this.http.put(`${this.shopApiUrl}/${id}/cancel`, {});
  }

  // ========== ADMIN METHODS ==========

  getAllRequests(filters = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    });
    return this.http.get(this.adminApiUrl, { params });
  }

  getPendingRequests(type = null, page = 1, limit = 20) {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (type) params = params.set('type', type);
    return this.http.get(`${this.adminApiUrl}/pending`, { params });
  }

  getUrgentProblems() {
    return this.http.get(`${this.adminApiUrl}/urgent`);
  }

  getRequestById(id) {
    return this.http.get(`${this.adminApiUrl}/${id}`);
  }

  approveRequest(id, notes = null) {
    return this.http.put(`${this.adminApiUrl}/${id}/approve`, { notes });
  }

  rejectRequest(id, reason) {
    return this.http.put(`${this.adminApiUrl}/${id}/reject`, { reason });
  }

  completeRequest(id, notes = null) {
    return this.http.put(`${this.adminApiUrl}/${id}/complete`, { notes });
  }

  updateStatus(id, status, note = null) {
    return this.http.put(`${this.adminApiUrl}/${id}/status`, { status, note });
  }

  getStatistics() {
    return this.http.get(`${this.adminApiUrl}/statistics`);
  }
}
