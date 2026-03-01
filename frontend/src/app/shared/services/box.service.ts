import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class BoxService {
  apiUrl = `${environment.apiUrl}/admin/boxes`;

  constructor(private http: HttpClient) {}

  getBoxes(filters = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get(this.apiUrl, { params });
  }

  getBox(id) {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createBox(data) {
    return this.http.post(this.apiUrl, data);
  }

  updateBox(id, data) {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteBox(id) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  uploadImages(id, files) {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return this.http.post(`${this.apiUrl}/${id}/images`, formData);
  }

  removeImage(id, imageIndex) {
    return this.http.delete(`${this.apiUrl}/${id}/images/${imageIndex}`);
  }

  updateAvailability(id, data) {
    return this.http.put(`${this.apiUrl}/${id}/availability`, data);
  }

  updateRent(id, data) {
    return this.http.put(`${this.apiUrl}/${id}/rent`, data);
  }

  assignToShop(id, shopId) {
    return this.http.put(`${this.apiUrl}/${id}/assign`, { shopId });
  }

  unassignFromShop(id) {
    return this.http.put(`${this.apiUrl}/${id}/unassign`, {});
  }

  getStatistics() {
    return this.http.get(`${this.apiUrl}/statistics`);
  }

  getAvailableBoxes() {
    return this.http.get(`${this.apiUrl}/available`);
  }
}
