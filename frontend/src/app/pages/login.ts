import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../core/api-error';
import { AuthService } from '../core/auth.service';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  styleUrl: './auth-layout.scss',
  template: `
    <div class="auth">
      <div class="page-intro">
        <h1>Se connecter</h1>
        <p>Heureux de vous revoir. Entrez votre courriel et votre mot de passe.</p>
      </div>

      <form class="card form-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (expired && !error()) {
          <div class="alert alert-info" role="status">
            <app-icon name="info" />
            <span>Votre session a expiré. Reconnectez-vous.</span>
          </div>
        }
        @if (error(); as e) {
          <div class="alert alert-error" role="alert">
            <app-icon name="errCircle" />
            <div class="alert-body">
              <strong>{{ e.title }}</strong>
              @if (e.detail) {
                <span class="alert-detail">{{ e.detail }}</span>
              }
            </div>
          </div>
        }

        <div class="field">
          <label for="email">Courriel</label>
          <input id="email" class="input" [class.is-invalid]="invalid('email')" type="email" formControlName="email"
            autocomplete="email" placeholder="nom@exemple.ca" [attr.aria-invalid]="invalid('email')" />
        </div>

        <div class="field">
          <label for="password">Mot de passe</label>
          <div class="password">
            <input id="password" class="input" [class.is-invalid]="invalid('password')"
              [type]="showPassword() ? 'text' : 'password'" formControlName="password"
              autocomplete="current-password" [attr.aria-invalid]="invalid('password')" />
            <button type="button" class="toggle" (click)="showPassword.set(!showPassword())"
              [attr.aria-pressed]="showPassword()" aria-controls="password">
              <app-icon [name]="showPassword() ? 'eyeOff' : 'eye'" [size]="20" />
              {{ showPassword() ? 'Masquer' : 'Afficher' }}
            </button>
          </div>
        </div>

        <button class="btn btn-primary" type="submit" [disabled]="loading()">
          {{ loading() ? 'Connexion…' : 'Se connecter' }}
        </button>
        <p class="form-switch">Pas encore de compte ? <a routerLink="/inscription">En créer un</a></p>
      </form>
    </div>
  `,
  styles: `
    .password { position: relative; display: flex; align-items: center; }
    .password .input { padding-right: 132px; }
    .toggle {
      position: absolute;
      right: 6px;
      display: flex;
      gap: 6px;
      align-items: center;
      min-height: 44px;
      padding: 0 14px;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: var(--color-accent-800);
      font: inherit;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
    }
    .toggle:hover { background: var(--color-accent-100); }
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
  protected readonly error = signal<{ title: string; detail?: string; rejected?: boolean } | null>(null);
  protected readonly showPassword = signal(false);

  /** Champ vide après envoi, ou identifiants refusés : bordure rouge sur les deux champs. */
  protected invalid(name: 'email' | 'password'): boolean {
    const c = this.form.controls[name];
    return (c.invalid && c.touched) || !!this.error()?.rejected;
  }

  protected submit(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set({ title: 'Veuillez entrer votre courriel et votre mot de passe.' });
      return;
    }
    this.loading.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl(safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'))),
      error: (err) => {
        this.error.set(
          err instanceof HttpErrorResponse && err.status === 401
            ? { title: 'Courriel ou mot de passe incorrect', detail: 'Vérifiez vos informations et réessayez.', rejected: true }
            : { title: apiErrorMessage(err) },
        );
        this.loading.set(false);
      },
    });
  }
}

/** N'accepte qu'un chemin interne, pour éviter une redirection vers un autre site. */
export function safeReturnUrl(url: string | null): string {
  return url && url.startsWith('/') && !url.startsWith('//') ? url : '/mesures/nouvelle';
}
