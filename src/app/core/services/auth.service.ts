import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { environment } from '@env/environment';
import { StorageService } from './storage.service';
import { User, AuthResponse, Shop } from '@shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // Signals for reactive state
  private currentUserSignal = signal<User | null>(null);
  private currentShopSignal = signal<Shop | null>(null);
  private isAuthenticatedSignal = signal<boolean>(false);
  private isLoadingSignal = signal<boolean>(true);

  // Public computed values
  currentUser = computed(() => this.currentUserSignal());
  currentShop = computed(() => this.currentShopSignal());
  isAuthenticated = computed(() => this.isAuthenticatedSignal());
  isLoading = computed(() => this.isLoadingSignal());

  isAdmin = computed(() => this.currentUserSignal()?.role === 'admin');
  isShopOwner = computed(() => this.currentUserSignal()?.role === 'shop');
  isClient = computed(() => this.currentUserSignal()?.role === 'client');

  constructor(
    private http: HttpClient,
    private router: Router,
    private storageService: StorageService
  ) {}

  // Initialize auth state from storage
  initializeAuth(): void {
    const token = this.storageService.getToken();
    const user = this.storageService.getUser<User>();

    if (token && user) {
      this.currentUserSignal.set(user);
      this.isAuthenticatedSignal.set(true);

      // Fetch fresh user data
      this.fetchCurrentUser().subscribe({
        error: () => {
          // Token expired or invalid
          this.logout();
        }
      });
    }

    this.isLoadingSignal.set(false);
  }

  // Register
  register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: 'client' | 'shop';
    shopName?: string;
    shopDescription?: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.handleAuthSuccess(response.data);
        }
      })
    );
  }

  // Login
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.handleAuthSuccess(response.data);
        }
      })
    );
  }

  // Logout
  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      complete: () => this.clearAuth()
    });
  }

  // Refresh token
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.storageService.getRefreshToken();

    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.storageService.setToken(response.data.accessToken);
          this.storageService.setRefreshToken(response.data.refreshToken);
        }
      }),
      catchError(error => {
        this.clearAuth();
        return throwError(() => error);
      })
    );
  }

  // Fetch current user
  fetchCurrentUser(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.currentUserSignal.set(response.data.user);
          if (response.data.shop) {
            this.currentShopSignal.set(response.data.shop);
          }
          this.storageService.setUser(response.data.user);
        }
      })
    );
  }

  // Update profile
  updateProfile(data: Partial<User>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/me`, data).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.currentUserSignal.set(response.data.user);
          this.storageService.setUser(response.data.user);
        }
      })
    );
  }

  // Update password
  updatePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/password`, {
      currentPassword,
      newPassword
    });
  }

  // Forgot password
  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/forgot-password`, { email });
  }

  // Reset password
  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reset-password`, { token, password });
  }

  // Handle successful authentication
  private handleAuthSuccess(data: {
    user: User;
    shop?: Shop;
    accessToken: string;
    refreshToken: string;
  }): void {
    this.storageService.setToken(data.accessToken);
    this.storageService.setRefreshToken(data.refreshToken);
    this.storageService.setUser(data.user);

    this.currentUserSignal.set(data.user);
    this.isAuthenticatedSignal.set(true);

    if (data.shop) {
      this.currentShopSignal.set(data.shop);
    }
  }

  // Clear authentication state
  private clearAuth(): void {
    this.storageService.clearAuth();
    this.currentUserSignal.set(null);
    this.currentShopSignal.set(null);
    this.isAuthenticatedSignal.set(false);
    this.router.navigate(['/auth/login']);
  }

  // Get redirect URL based on role
  getRedirectUrl(): string {
    const user = this.currentUserSignal();
    if (!user) return '/';

    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'shop':
        return '/shop-manager/dashboard';
      default:
        return '/';
    }
  }

  // Favorites
  getFavorites(page = 1, limit = 12): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/client/favorites`, {
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

  addFavorite(productId: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/client/favorites/${productId}`, {});
  }

  removeFavorite(productId: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/client/favorites/${productId}`);
  }

  // Addresses
  addAddress(address: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/client/addresses`, address).pipe(
      tap(response => {
        if (response.success && response.data?.user) {
          this.currentUserSignal.set(response.data.user);
          this.storageService.setUser(response.data.user);
        }
      })
    );
  }

  updateAddress(index: number, address: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/client/addresses/${index}`, address).pipe(
      tap(response => {
        if (response.success && response.data?.user) {
          this.currentUserSignal.set(response.data.user);
          this.storageService.setUser(response.data.user);
        }
      })
    );
  }

  deleteAddress(index: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/client/addresses/${index}`).pipe(
      tap(response => {
        if (response.success && response.data?.user) {
          this.currentUserSignal.set(response.data.user);
          this.storageService.setUser(response.data.user);
        }
      })
    );
  }

  setDefaultAddress(index: number): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/client/addresses/${index}/default`, {}).pipe(
      tap(response => {
        if (response.success && response.data?.user) {
          this.currentUserSignal.set(response.data.user);
          this.storageService.setUser(response.data.user);
        }
      })
    );
  }

  // Delete account
  deleteAccount(): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/client/account`).pipe(
      tap(() => this.clearAuth())
    );
  }
}
