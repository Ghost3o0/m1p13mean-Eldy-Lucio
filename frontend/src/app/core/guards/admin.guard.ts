import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  }

  // Redirect to appropriate page based on role
  if (authService.isShopOwner()) {
    router.navigate(['/shop-manager/dashboard']);
  } else {
    router.navigate(['/']);
  }

  return false;
};
