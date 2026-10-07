import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from './models';

const STORAGE_KEY = 'glycosuivi.session';

interface Session {
  token: string;
  expiresAt: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly session = signal<Session | null>(readStoredSession());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);

  /** Jeton courant, ou null s'il est absent ou expiré. */
  get token(): string | null {
    const s = this.session();
    if (!s) return null;
    if (isExpired(s)) {
      this.clear();
      return null;
    }
    return s.token;
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/api/auth/register', request)
      .pipe(tap((res) => this.store(res)));
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/api/auth/login', request)
      .pipe(tap((res) => this.store(res)));
  }

  logout(): void {
    this.clear();
    this.router.navigateByUrl('/');
  }

  /** Session expirée ou rejetée par l'API : retour à la connexion. */
  expireSession(returnUrl?: string): void {
    this.clear();
    this.router.navigate(['/connexion'], {
      queryParams: returnUrl ? { returnUrl, expired: 1 } : { expired: 1 },
    });
  }

  private store(res: AuthResponse): void {
    const session: Session = { token: res.token, expiresAt: res.expiresAt, user: res.user };
    this.session.set(session);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Stockage indisponible (navigation privée) : la session reste en mémoire.
    }
  }

  private clear(): void {
    this.session.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignoré
    }
  }
}

function isExpired(session: Session): boolean {
  return new Date(session.expiresAt).getTime() <= Date.now();
}

function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    return session?.token && !isExpired(session) ? session : null;
  } catch {
    return null;
  }
}
