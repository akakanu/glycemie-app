import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { AuthResponse } from './models';

const response = (expiresInMs: number): AuthResponse => ({
  token: 'jeton-test',
  expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
  user: { id: '1', firstName: 'Marie', email: 'marie@example.com' },
});

describe('AuthService et authInterceptor', () => {
  let auth: AuthService;
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  function login(expiresInMs = 3_600_000) {
    auth.login({ email: 'marie@example.com', password: 'MotDePasse123' }).subscribe();
    backend.expectOne('/api/auth/login').flush(response(expiresInMs));
  }

  it('enregistre la session après connexion', () => {
    login();

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.user()?.firstName).toBe('Marie');
    expect(localStorage.getItem('glycosuivi.session')).toContain('jeton-test');
  });

  it('ajoute le jeton aux appels de l’API, mais pas aux appels d’authentification', () => {
    login();

    http.get('/api/readings').subscribe();
    expect(backend.expectOne('/api/readings').request.headers.get('Authorization')).toBe('Bearer jeton-test');

    http.post('/api/auth/login', {}).subscribe({ error: () => {} });
    expect(backend.expectOne('/api/auth/login').request.headers.has('Authorization')).toBe(false);
  });

  it('considère un jeton expiré comme absent', () => {
    login(-1000);

    expect(auth.token).toBeNull();
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('déconnecte et renvoie vers la connexion quand l’API répond 401', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    login();

    http.get('/api/readings').subscribe({ error: () => {} });
    backend.expectOne('/api/readings').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/connexion'], expect.anything());
  });
});
