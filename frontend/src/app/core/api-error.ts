import { HttpErrorResponse } from '@angular/common/http';

/**
 * Transforme une erreur HTTP en message lisible.
 * L'API renvoie des ProblemDetails : `title` pour les erreurs métier,
 * `errors` pour les erreurs de validation.
 */
export function apiErrorMessage(error: unknown, fallback = 'Une erreur est survenue. Réessayez.'): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  if (error.status === 0) return "Impossible de joindre le serveur. Vérifiez qu'il est démarré.";

  const body = error.error as { title?: string; errors?: Record<string, string[]> } | null;
  const validation = body?.errors ? Object.values(body.errors).flat() : [];
  if (validation.length) return validation.join(' ');
  if (body?.title && error.status < 500) return body.title;
  return fallback;
}
