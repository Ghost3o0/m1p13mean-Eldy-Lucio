import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Une erreur est survenue';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else {
          switch (error.status) {
            case 0:
              errorMessage = 'Impossible de contacter le serveur';
              break;
            case 400:
              errorMessage = 'Requête invalide';
              break;
            case 401:
              errorMessage = 'Session expirée. Veuillez vous reconnecter.';
              break;
            case 403:
              errorMessage = 'Accès non autorisé';
              break;
            case 404:
              errorMessage = 'Ressource non trouvée';
              break;
            case 500:
              errorMessage = 'Erreur serveur';
              break;
            default:
              errorMessage = `Erreur ${error.status}`;
          }
        }
      }

      console.error('HTTP Error:', {
        status: error.status,
        message: errorMessage,
        url: req.url
      });

      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        errors: error.error?.errors
      }));
    })
  );
};
