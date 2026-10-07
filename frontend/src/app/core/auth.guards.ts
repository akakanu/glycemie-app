import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Pages réservées aux utilisateurs connectés. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.token) return true;
  return inject(Router).createUrlTree(['/connexion'], { queryParams: { returnUrl: state.url } });
};

/** Pages de connexion et d'inscription : inutiles si déjà connecté. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.token) return true;
  return inject(Router).createUrlTree(['/mesures/nouvelle']);
};
