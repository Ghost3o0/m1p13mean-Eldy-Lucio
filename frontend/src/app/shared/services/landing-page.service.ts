import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class LandingPageService {
  publicApiUrl = `${environment.apiUrl}/landing`;
  adminApiUrl = `${environment.apiUrl}/admin/landing`;
  shopApiUrl = `${environment.apiUrl}/shop/landing`;

  constructor(private http: HttpClient) {}

  // ========== PUBLIC METHODS ==========

  getPlatformLanding() {
    return this.http.get(`${this.publicApiUrl}/platform`);
  }

  getShopLandingPublic(shopId) {
    return this.http.get(`${this.publicApiUrl}/shop/${shopId}`);
  }

  // ========== ADMIN METHODS ==========

  getPlatformLandingAdmin() {
    return this.http.get(`${this.adminApiUrl}/platform`);
  }

  updatePlatformLanding(data) {
    return this.http.put(`${this.adminApiUrl}/platform`, data);
  }

  uploadPlatformHeroImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post(`${this.adminApiUrl}/platform/hero-image`, formData);
  }

  addPlatformBanner(data, image) {
    const formData = new FormData();
    formData.append('image', image);
    if (data.title) formData.append('title', data.title);
    if (data.subtitle) formData.append('subtitle', data.subtitle);
    if (data.link) formData.append('link', data.link);
    if (data.linkText) formData.append('linkText', data.linkText);
    return this.http.post(`${this.adminApiUrl}/platform/banners`, formData);
  }

  updatePlatformBanner(bannerId, data, image = null) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, String(value));
    });
    if (image) formData.append('image', image);
    return this.http.put(`${this.adminApiUrl}/platform/banners/${bannerId}`, formData);
  }

  deletePlatformBanner(bannerId) {
    return this.http.delete(`${this.adminApiUrl}/platform/banners/${bannerId}`);
  }

  reorderPlatformBanners(bannerIds) {
    return this.http.put(`${this.adminApiUrl}/platform/banners/reorder`, { bannerIds });
  }

  togglePlatformPublish(publish) {
    return this.http.put(`${this.adminApiUrl}/platform/publish`, { publish });
  }

  // ========== SHOP METHODS ==========

  getShopLanding() {
    return this.http.get(this.shopApiUrl);
  }

  updateShopLanding(data) {
    return this.http.put(this.shopApiUrl, data);
  }

  uploadShopHeroImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post(`${this.shopApiUrl}/hero-image`, formData);
  }

  addShopBanner(data, image) {
    const formData = new FormData();
    formData.append('image', image);
    if (data.title) formData.append('title', data.title);
    if (data.subtitle) formData.append('subtitle', data.subtitle);
    if (data.link) formData.append('link', data.link);
    if (data.linkText) formData.append('linkText', data.linkText);
    return this.http.post(`${this.shopApiUrl}/banners`, formData);
  }

  updateShopBanner(bannerId, data, image = null) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, String(value));
    });
    if (image) formData.append('image', image);
    return this.http.put(`${this.shopApiUrl}/banners/${bannerId}`, formData);
  }

  reorderShopBanners(bannerIds) {
    return this.http.put(`${this.shopApiUrl}/banners/reorder`, { bannerIds });
  }

  deleteShopBanner(bannerId) {
    return this.http.delete(`${this.shopApiUrl}/banners/${bannerId}`);
  }

  toggleShopPublish(publish) {
    return this.http.put(`${this.shopApiUrl}/publish`, { publish });
  }
}
