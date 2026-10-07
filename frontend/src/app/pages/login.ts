import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../core/api-error';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-card card">
      <h1>Se connecter</h1>

      @if (expired) {
        <p class="alert alert-info" role="status">Votre session a expiré. Reconnectez-vous.</p>
      }
      @if (error()) {
        <p class="alert alert-error" role="alert">{{ error() }}</p>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="field">
          <label for="email">Courriel</label>
          <input id="email" type="email" formControlName="email" autocomplete="email" />
          @if (form.controls.email.invalid && form.controls.email.touched) {
            <p class="field-error">Le courriel est obligatoire.</p>
          }
        </div>

        <div class="field">
          <label for="password">Mot de passe</label>
          <div class="input-with-action">
            <input
              id="password"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              autocomplete="current-password"
            />
            <button
              type="button"
              class="btn-link"
              (click)="showPassword.set(!showPassword())"
              [attr.aria-pressed]="showPassword()"
            >
              {{ showPassword() ? 'Masquer' : 'Afficher' }}
            </button>
          </div>
          @if (form.controls.password.invalid && form.controls.password.touched) {
            <p class="field-error">Le mot de passe est obligatoire.</p>
          }
        </div>

        <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
          {{ loading() ? 'Connexion…' : 'Se connecter' }}
        </button>
      </form>

      <p class="switch">Pas encore de compte ? <a routerLink="/inscription">En créer un</a></p>
    </section>
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected readonly expired = this.route.snapshot.queryParamMap.has('expired');
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl(safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'))),
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }
}

/** N'accepte qu'un chemin interne, pour éviter une redirection vers un autre site. */
export function safeReturnUrl(url: string | null): string {
  return url && url.startsWith('/') && !url.startsWith('//') ? url : '/mesures/nouvelle';
}
