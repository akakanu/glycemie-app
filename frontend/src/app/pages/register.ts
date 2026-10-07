import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../core/api-error';
import { AuthService } from '../core/auth.service';
import { matchFields } from '../shared/validators';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-card card">
      <h1>Créer un compte</h1>

      @if (error()) {
        <p class="alert alert-error" role="alert">{{ error() }}</p>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="field">
          <label for="firstName">Prénom</label>
          <input id="firstName" formControlName="firstName" autocomplete="given-name" />
          @if (showError('firstName')) {
            <p class="field-error">Le prénom est obligatoire (50 caractères maximum).</p>
          }
        </div>

        <div class="field">
          <label for="email">Courriel</label>
          <input id="email" type="email" formControlName="email" autocomplete="email" />
          @if (showError('email')) {
            <p class="field-error">Saisissez un courriel valide.</p>
          }
        </div>

        <div class="field">
          <label for="password">Mot de passe</label>
          <input id="password" type="password" formControlName="password" autocomplete="new-password" />
          <div class="strength" [attr.data-score]="strength().score" aria-live="polite">
            <span class="strength-bar"></span>
            <span class="strength-label">{{ strength().label }}</span>
          </div>
          @if (showError('password')) {
            <p class="field-error">8 caractères minimum.</p>
          }
        </div>

        <div class="field">
          <label for="confirmPassword">Confirmation du mot de passe</label>
          <input id="confirmPassword" type="password" formControlName="confirmPassword" autocomplete="new-password" />
          @if (form.hasError('fieldsMismatch') && form.controls.confirmPassword.touched) {
            <p class="field-error">Les mots de passe ne correspondent pas.</p>
          }
        </div>

        <label class="checkbox">
          <input type="checkbox" formControlName="acknowledge" />
          J'ai compris que cette application ne remplace pas un avis médical
        </label>
        @if (showError('acknowledge')) {
          <p class="field-error">Cette confirmation est obligatoire.</p>
        }

        <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
          {{ loading() ? 'Création…' : 'Créer mon compte' }}
        </button>
      </form>

      <p class="switch">Déjà un compte ? <a routerLink="/connexion">Se connecter</a></p>
    </section>
  `,
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group(
    {
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
      confirmPassword: ['', Validators.required],
      acknowledge: [false, Validators.requiredTrue],
    },
    { validators: matchFields('password', 'confirmPassword') },
  );

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly password = toSignal(this.form.controls.password.valueChanges, { initialValue: '' });
  protected readonly strength = computed(() => passwordStrength(this.password()));

  protected showError(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && c.touched;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { firstName, email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);
    this.auth.register({ firstName, email, password }).subscribe({
      next: () => this.router.navigateByUrl('/mesures/nouvelle'),
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }
}

/** Indicateur simple de robustesse : longueur et variété des caractères. */
export function passwordStrength(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Trop court', 'Faible', 'Moyen', 'Bon', 'Excellent'];
  return { score, label: labels[score] };
}
