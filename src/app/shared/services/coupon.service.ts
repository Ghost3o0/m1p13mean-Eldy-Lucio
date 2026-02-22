import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  publicApiUrl = `${environment.apiUrl}/coupons`;
  shopApiUrl = `${environment.apiUrl}/shop/coupons`;
  adminApiUrl = `${environment.apiUrl}/admin/coupons`;

  constructor(private http: HttpClient) {}

  // ========== PUBLIC METHODS ==========

  getPublicCoupons(shopId = null) {
    let params = new HttpParams();
    if (shopId) params = params.set('shopId', shopId);
    return this.http.get(`${this.publicApiUrl}/public`, { params });
  }

  getFlashPromotions(shopId = null) {
    let params = new HttpParams();
    if (shopId) params = params.set('shopId', shopId);
    return this.http.get(`${this.publicApiUrl}/flash`, { params });
  }

  validateCoupon(data) {
    return this.http.post(`${this.publicApiUrl}/validate`, data);
  }

  // ========== SHOP METHODS ==========

  getShopCoupons(filters = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    });
    return this.http.get(this.shopApiUrl, { params });
  }

  getShopCoupon(id) {
    return this.http.get(`${this.shopApiUrl}/${id}`);
  }

  createCoupon(data) {
    return this.http.post(this.shopApiUrl, data);
  }

  updateCoupon(id, data) {
    return this.http.put(`${this.shopApiUrl}/${id}`, data);
  }

  toggleCouponStatus(id) {
    return this.http.put(`${this.shopApiUrl}/${id}/toggle`, {});
  }

  deleteCoupon(id) {
    return this.http.delete(`${this.shopApiUrl}/${id}`);
  }

  getShopCouponStats() {
    return this.http.get(`${this.shopApiUrl}/statistics`);
  }

  // ========== ADMIN METHODS ==========

  getAllCoupons(filters = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    });
    return this.http.get(this.adminApiUrl, { params });
  }

  createPlatformCoupon(data) {
    return this.http.post(this.adminApiUrl, data);
  }

  getGlobalCouponStats() {
    return this.http.get(`${this.adminApiUrl}/statistics`);
  }
}
