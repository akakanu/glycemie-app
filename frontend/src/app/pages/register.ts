import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../core/api-error';
import { AuthService } from '../core/auth.service';
import { Icon } from '../shared/icon';
import { matchFields } from '../shared/validators';

type Field = 'firstName' | 'email' | 'password' | 'confirmPassword' | 'acknowledge';
const FIELDS: Field[] = ['firstName', 'email', 'password', 'confirmPassword', 'acknowledge'];

export const EMAIL_TAKEN = 'Ce courriel est déjà associé à un compte. Connectez-vous ou utilisez une autre adresse.';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  styleUrl: './auth-layout.scss',
  template: `
    <div class="auth">
      <div class="page-intro">
        <h1>Créer votre compte</h1>
        <p>Quelques informations suffisent pour commencer à suivre votre glycémie.</p>
      </div>

      <form class="card form-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (submitted() && errorCount() > 0) {
          <div class="alert alert-error" role="alert">
            <app-icon name="errCircle" />
            <strong>
              {{ errorCount() === 1 ? 'Veuillez corriger le champ indiqué.' : 'Veuillez corriger les ' + errorCount() + ' champs indiqués.' }}
            </strong>
          </div>
        }
        @if (error()) {
          <div class="alert alert-error" role="alert">
            <app-icon name="errCircle" />
            <strong>{{ error() }}</strong>
          </div>
        }

        <div class="field">
          <label for="firstName">Prénom</label>
          <input id="firstName" class="input" [class.is-invalid]="!!errorFor('firstName')" formControlName="firstName"
            autocomplete="given-name" [attr.aria-invalid]="!!errorFor('firstName')" aria-describedby="firstName-error" />
          @if (errorFor('firstName'); as msg) {
            <p class="field-error" id="firstName-error"><app-icon name="errCircle" [size]="20" /><span>{{ msg }}</span></p>
          }
        </div>

        <div class="field">
          <label for="email">Courriel</label>
          <input id="email" class="input" [class.is-invalid]="!!errorFor('email')" type="email" formControlName="email"
            autocomplete="email" placeholder="nom@exemple.ca" [attr.aria-invalid]="!!errorFor('email')" aria-describedby="email-error" />
          @if (errorFor('email'); as msg) {
            <p class="field-error" id="email-error"><app-icon name="errCircle" [size]="20" /><span>{{ msg }}</span></p>
          }
        </div>

        <div class="field">
          <label for="password">Mot de passe</label>
          <input id="password" class="input" [class.is-invalid]="!!errorFor('password')" type="password" formControlName="password"
            autocomplete="new-password" [attr.aria-invalid]="!!errorFor('password')" aria-describedby="password-strength password-error" />
          <div class="strength" aria-hidden="true">
            @for (i of [0, 1, 2, 3]; track i) {
              <div [style.background]="i < strength().score ? strength().color : null"></div>
            }
          </div>
          <p class="hint" id="password-strength" aria-live="polite">{{ strength().label }}</p>
          @if (errorFor('password'); as msg) {
            <p class="field-error" id="password-error"><app-icon name="errCircle" [size]="20" /><span>{{ msg }}</span></p>
          }
        </div>

        <div class="field">
          <label for="confirmPassword">Confirmation du mot de passe</label>
          <input id="confirmPassword" class="input" [class.is-invalid]="!!errorFor('confirmPassword')" type="password"
            formControlName="confirmPassword" autocomplete="new-password" [attr.aria-invalid]="!!errorFor('confirmPassword')"
            aria-describedby="confirmPassword-error" />
          @if (errorFor('confirmPassword'); as msg) {
            <p class="field-error" id="confirmPassword-error"><app-icon name="errCircle" [size]="20" /><span>{{ msg }}</span></p>
          }
        </div>

        <div class="field">
          <label class="checkbox" [class.is-invalid]="!!errorFor('acknowledge')">
            <input type="checkbox" formControlName="acknowledge" />
            <span>J'ai compris que cette application ne remplace pas un avis médical</span>
          </label>
          @if (errorFor('acknowledge'); as msg) {
            <p class="field-error"><app-icon name="errCircle" [size]="20" /><span>{{ msg }}</span></p>
          }
        </div>

        <button class="btn btn-primary" type="submit" [disabled]="loading()">
          {{ loading() ? 'Création…' : 'Créer mon compte' }}
        </button>
        <p class="form-switch">Déjà un compte ? <a routerLink="/connexion">Se connecter</a></p>
      </form>
    </div>
  `,
  styles: `
    .strength { display: flex; gap: 6px; margin-top: 4px; }
    .strength div { flex: 1; height: 8px; border-radius: 999px; background: var(--color-neutral-300); }
    .checkbox {
      display: flex;
      gap: 14px;
      align-items: flex-start;
      padding: 14px 16px;
      border: 2px solid var(--color-neutral-600);
      border-radius: 20px;
      background: var(--color-neutral-100);
      font-size: 17px;
      cursor: pointer;
    }
    .checkbox.is-invalid { border-color: var(--lvl-tres-eleve); }
    .checkbox input { flex: none; width: 26px; height: 26px; margin: 0; accent-color: var(--color-accent); }
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
  protected readonly submitted = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly password = toSignal(this.form.controls.password.valueChanges, { initialValue: '' });
  protected readonly strength = computed(() => passwordStrength(this.password()));

  /** Message d'erreur du champ, affiché une fois le champ quitté ou le formulaire envoyé. */
  protected errorFor(name: Field): string | null {
    const c = this.form.controls[name];
    if (!c.touched) return null;
    switch (name) {
      case 'firstName':
        if (c.hasError('required')) return 'Veuillez entrer votre prénom.';
        return c.hasError('maxlength') ? 'Le prénom ne doit pas dépasser 50 caractères.' : null;
      case 'email':
        if (c.hasError('taken')) return EMAIL_TAKEN;
        return c.invalid ? 'Veuillez entrer un courriel valide, par exemple nom@exemple.ca.' : null;
      case 'password':
        if (c.hasError('maxlength')) return 'Le mot de passe ne doit pas dépasser 100 caractères.';
        return c.invalid ? 'Le mot de passe doit contenir au moins 8 caractères.' : null;
      case 'confirmPassword':
        if (c.hasError('required')) return 'Veuillez confirmer votre mot de passe.';
        return this.form.hasError('fieldsMismatch') ? 'Les mots de passe ne correspondent pas.' : null;
      case 'acknowledge':
        return c.invalid ? 'Veuillez cocher cette case pour continuer.' : null;
    }
  }

  protected errorCount(): number {
    return FIELDS.filter((f) => this.errorFor(f)).length;
  }

  protected submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { firstName, email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.auth.register({ firstName, email, password }).subscribe({
      next: () => this.router.navigateByUrl('/mesures/nouvelle'),
      error: (err) => {
        if (err instanceof HttpErrorResponse && err.status === 409) {
          this.form.controls.email.setErrors({ taken: true });
        } else {
          this.error.set(apiErrorMessage(err));
        }
        this.loading.set(false);
      },
    });
  }
}

/** Indicateur de robustesse de la maquette : longueur, casse, chiffres et symboles (score de 0 à 4). */
export function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score++;
  if (pw.length && pw.length < 8) score = 1;

  const color = ['', 'var(--lvl-tres-eleve)', 'var(--lvl-eleve)', 'var(--color-accent)', 'var(--lvl-normal)'][score];
  const label = !pw
    ? '8 caractères minimum. Ajoutez des chiffres et des symboles pour plus de sécurité.'
    : pw.length < 8
      ? `Robustesse : trop court (${pw.length} sur 8 caractères)`
      : `Robustesse : ${['', 'faible', 'moyenne', 'bonne', 'excellente'][score]}`;
  return { score, label, color };
}
