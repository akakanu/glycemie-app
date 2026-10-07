import { FormControl, FormGroup } from '@angular/forms';
import { safeReturnUrl } from '../pages/login';
import { passwordStrength } from '../pages/register';
import { matchFields, notInFuture, toDateTimeLocal } from './validators';

describe('matchFields', () => {
  const group = (a: string, b: string) =>
    new FormGroup(
      { password: new FormControl(a), confirm: new FormControl(b) },
      { validators: matchFields('password', 'confirm') },
    );

  it('signale deux mots de passe différents', () => {
    expect(group('MotDePasse1', 'Autre').hasError('fieldsMismatch')).toBe(true);
  });

  it('accepte deux mots de passe identiques', () => {
    expect(group('MotDePasse1', 'MotDePasse1').valid).toBe(true);
  });
});

describe('notInFuture', () => {
  it('refuse une date dans plus de 5 minutes', () => {
    const inOneHour = toDateTimeLocal(new Date(Date.now() + 3_600_000));
    expect(notInFuture(new FormControl(inOneHour))).toEqual({ future: true });
  });

  it('accepte maintenant', () => {
    expect(notInFuture(new FormControl(toDateTimeLocal(new Date())))).toBeNull();
  });
});

describe('toDateTimeLocal', () => {
  it('formate au format attendu par datetime-local', () => {
    expect(toDateTimeLocal(new Date(2026, 9, 7, 8, 5))).toBe('2026-10-07T08:05');
  });
});

describe('safeReturnUrl', () => {
  it('garde un chemin interne', () => {
    expect(safeReturnUrl('/historique')).toBe('/historique');
  });

  it('refuse une URL externe ou absente', () => {
    expect(safeReturnUrl('https://exemple.com')).toBe('/mesures/nouvelle');
    expect(safeReturnUrl('//exemple.com')).toBe('/mesures/nouvelle');
    expect(safeReturnUrl(null)).toBe('/mesures/nouvelle');
  });
});

describe('passwordStrength', () => {
  it('progresse avec la longueur et la variété', () => {
    expect(passwordStrength('').score).toBe(0);
    expect(passwordStrength('abcdefgh').score).toBe(1);
    expect(passwordStrength('Abcdefgh1234!').score).toBe(4);
  });
});
