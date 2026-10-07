import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Vérifie que deux champs d'un groupe sont identiques (ex. mot de passe et confirmation). */
export function matchFields(field: string, confirmField: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const a = group.get(field)?.value;
    const b = group.get(confirmField)?.value;
    return a && b && a !== b ? { fieldsMismatch: true } : null;
  };
}

/** Interdit une date dans le futur (tolérance de 5 minutes, comme l'API). */
export function notInFuture(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const date = new Date(control.value).getTime();
  return date > Date.now() + 5 * 60_000 ? { future: true } : null;
}

/** Valeur pour un champ datetime-local à partir d'une date (heure locale). */
export function toDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
