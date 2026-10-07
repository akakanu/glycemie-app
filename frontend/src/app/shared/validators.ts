import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { parseDecimal } from '../core/format';

/** Vérifie que deux champs d'un groupe sont identiques (ex. mot de passe et confirmation). */
export function matchFields(field: string, confirmField: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const a = group.get(field)?.value;
    const b = group.get(confirmField)?.value;
    return a && b && a !== b ? { fieldsMismatch: true } : null;
  };
}

/** Vrai si la date (format datetime-local) est dans le futur, avec 5 minutes de tolérance comme l'API. */
export function isFuture(value: string): boolean {
  return new Date(value).getTime() > Date.now() + 5 * 60_000;
}

/** Interdit une date dans le futur. */
export function notInFuture(control: AbstractControl): ValidationErrors | null {
  return control.value && isFuture(control.value) ? { future: true } : null;
}

/** Même règle sur un couple de champs date (AAAA-MM-JJ) et heure (HH:MM). */
export function dateTimeNotInFuture(dateField: string, timeField: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const date = group.get(dateField)?.value;
    const time = group.get(timeField)?.value || '00:00';
    return date && isFuture(`${date}T${time}`) ? { future: true } : null;
  };
}

/** Valeur de glycémie saisie en texte (point ou virgule), comprise entre min et max. */
export function decimalInRange(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!String(control.value ?? '').trim()) return null; // géré par Validators.required
    const value = parseDecimal(control.value);
    return value !== null && value >= min && value <= max ? null : { range: true };
  };
}

/** Valeur pour un champ datetime-local à partir d'une date (heure locale). */
export function toDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
