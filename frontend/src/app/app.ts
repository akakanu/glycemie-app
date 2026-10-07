import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from './core/auth.service';
import { Icon, IconName } from './shared/icon';

interface NavItem {
  label: string;
  icon: IconName;
  /** Absent pour la déconnexion, qui est une action et non une page. */
  link?: string;
  /** Autres chemins qui activent l'onglet (regex sur l'URL). */
  alsoActive?: RegExp;
  /** Mis en avant tant qu'il n'est pas la page courante. */
  cta?: boolean;
}

const GUEST_NAV: NavItem[] = [
  { label: 'Accueil', icon: 'home', link: '/' },
  { label: 'Connexion', icon: 'login', link: '/connexion' },
  { label: 'Créer un compte', icon: 'userPlus', link: '/inscription', cta: true },
];

const USER_NAV: NavItem[] = [
  { label: 'Nouvelle mesure', icon: 'plus', link: '/mesures/nouvelle' },
  // La page résultat (/mesures/:id) est rattachée à l'historique.
  { label: 'Historique', icon: 'history', link: '/historique', alsoActive: /^\/mesures\/(?!nouvelle)/ },
  { label: 'Déconnexion', icon: 'logout' },
];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, Icon],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly path = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.currentPath()),
    ),
    { initialValue: this.currentPath() },
  );

  protected readonly homeLink = computed(() => (this.auth.isAuthenticated() ? '/mesures/nouvelle' : '/'));

  protected readonly nav = computed(() => {
    const path = this.path();
    return (this.auth.isAuthenticated() ? USER_NAV : GUEST_NAV).map((item) => {
      const active = item.link === path || !!item.alsoActive?.test(path);
      return { ...item, active, cta: item.cta && !active };
    });
  });

  private currentPath(): string {
    return this.router.url.split(/[?#]/)[0];
  }
}
