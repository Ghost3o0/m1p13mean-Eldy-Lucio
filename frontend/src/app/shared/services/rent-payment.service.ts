import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class RentPaymentService {
  shopApiUrl = `${environment.apiUrl}/shop/rent-payments`;
  adminApiUrl = `${environment.apiUrl}/admin/rent-payments`;

  constructor(private http: HttpClient) {}

  // ========== SHOP METHODS ==========

  getCurrentMonthStatus() {
    return this.http.get(`${this.shopApiUrl}/current-status`);
  }

  getShopPayments(filters = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    });
    return this.http.get(this.shopApiUrl, { params });
  }

  submitPayment(data, files = null) {
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append('month', String(data.month));
      formData.append('year', String(data.year));
      if (data.amount) formData.append('amount', String(data.amount));
      formData.append('paymentMethod', data.paymentMethod);
      formData.append('paymentDate', data.paymentDate);
      if (data.notes) formData.append('notes', data.notes);
      files.forEach(file => formData.append('files', file));
      return this.http.post(this.shopApiUrl, formData);
    }
    return this.http.post(this.shopApiUrl, data);
  }

  addPaymentProof(paymentId, files) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.http.put(`${this.shopApiUrl}/${paymentId}/proof`, formData);
  }

  getShopStats() {
    return this.http.get(`${this.shopApiUrl}/statistics`);
  }

  // ========== ADMIN METHODS ==========

  getAllPayments(filters = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    });
    return this.http.get(this.adminApiUrl, { params });
  }

  getPendingPayments(page = 1, limit = 20) {
    const params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    return this.http.get(`${this.adminApiUrl}/pending`, { params });
  }

  getLatePayments() {
    return this.http.get(`${this.adminApiUrl}/late`);
  }

  getPaymentById(id) {
    return this.http.get(`${this.adminApiUrl}/${id}`);
  }

  validatePayment(id) {
    return this.http.put(`${this.adminApiUrl}/${id}/validate`, {});
  }

  rejectPayment(id, reason) {
    return this.http.put(`${this.adminApiUrl}/${id}/reject`, { reason });
  }

  generateInvoice(id) {
    return this.http.post(`${this.adminApiUrl}/${id}/invoice`, {});
  }

  getStatistics(year = null) {
    let params = new HttpParams();
    if (year) params = params.set('year', String(year));
    return this.http.get(`${this.adminApiUrl}/statistics`, { params });
  }
}
