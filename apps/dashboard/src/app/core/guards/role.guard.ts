import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Role } from '@org/data';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as Role[];
  
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  const user = authService.getCurrentUser();
  if (!user) {
    return router.createUrlTree(['/login']);
  }

  // Check if user has any of the required roles
  const hasAccess = requiredRoles.some(role => authService.hasRole(role));
  
  if (hasAccess) {
    return true;
  }

  // User is authenticated but doesn't have required role
  return router.createUrlTree(['/dashboard']);
};
