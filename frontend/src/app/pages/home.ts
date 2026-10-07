import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { Disclaimer } from '../shared/disclaimer';
import { Icon } from '../shared/icon';
import { LevelBadge } from '../shared/level-badge';

@Component({
  selector: 'app-home',
  imports: [RouterLink, Disclaimer, Icon, LevelBadge],
  template: `
    <div class="home">
      <section class="hero">
        <div class="hero-text">
          <span class="tag tag-accent-2">Suivi de la glycémie</span>
          <h1>Comprendre votre glycémie, simplement.</h1>
          <p class="lead">Saisissez votre glycémie, comprenez votre résultat, suivez votre évolution.</p>
          <div class="btn-row">
            @if (auth.isAuthenticated()) {
              <a class="btn btn-primary" routerLink="/mesures/nouvelle">Nouvelle mesure</a>
              <a class="btn btn-secondary" routerLink="/historique">Voir mon historique</a>
            } @else {
              <a class="btn btn-primary" routerLink="/inscription">Créer un compte</a>
              <a class="btn btn-secondary" routerLink="/connexion">Se connecter</a>
            }
          </div>
        </div>

        <!-- Illustration : exemple de résultat -->
        <div class="hero-art desktop-only" aria-hidden="true">
          <div class="blob blob-lg"></div>
          <div class="blob blob-sm"></div>
          <div class="card demo">
            <span class="demo-moment"><app-icon name="sunrise" [size]="20" />À jeun · 7 h 15</span>
            <div class="demo-value"><span>5.6</span> mmol/L</div>
            <app-level-badge [level]="'Normal'" />
            <div class="demo-gauge">
              <div class="lvl-Low"></div>
              <div class="lvl-Normal"></div>
              <div class="lvl-High"></div>
              <div class="lvl-VeryHigh"></div>
              <span class="demo-marker"></span>
            </div>
          </div>
        </div>
      </section>

      <section class="benefits">
        <h2>Ce que GlycoSuivi vous offre</h2>
        <div class="benefit-grid">
          <article class="card">
            <span class="benefit-icon icon-accent"><app-icon name="pencil" [size]="28" /></span>
            <h3>Simple à utiliser</h3>
            <p>Une seule valeur à entrer, en mmol/L. Votre résultat s'affiche aussitôt, en mots clairs.</p>
          </article>
          <article class="card">
            <span class="benefit-icon icon-sage"><app-icon name="utensils" [size]="28" /></span>
            <h3>Adapté au moment du repas</h3>
            <p>L'interprétation tient compte du moment de la mesure : à jeun ou après le repas.</p>
          </article>
          <article class="card">
            <span class="benefit-icon icon-neutral"><app-icon name="chart" [size]="28" /></span>
            <h3>Votre historique</h3>
            <p>Retrouvez toutes vos mesures au même endroit et suivez votre évolution.</p>
          </article>
        </div>
      </section>

      <app-disclaimer />
    </div>
  `,
  styles: `
    .home { display: flex; flex-direction: column; gap: clamp(48px, 6vw, 88px); }

    .hero {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 440px), 1fr));
      gap: 48px;
      align-items: center;
      padding-top: clamp(12px, 4vw, 48px);
    }
    .hero-text { display: flex; flex-direction: column; gap: 20px; align-items: flex-start; }
    .hero h1 { font-size: clamp(36px, 4.8vw, 58px); text-wrap: balance; }
    .lead { font-size: clamp(18px, 1.7vw, 21px); color: var(--color-neutral-800); max-width: 32ch; text-wrap: pretty; }
    .hero .btn-row { width: 100%; margin-top: 8px; }
    .hero .btn-row .btn { flex-basis: 210px; max-width: none; }

    .hero-art { position: relative; display: grid; place-items: center; min-height: 440px; }
    .blob { position: absolute; border-radius: 50%; }
    .blob-lg { width: 400px; height: 400px; background: var(--color-accent-2-200); }
    .blob-sm { width: 130px; height: 130px; top: 6px; right: 36px; background: var(--color-accent-200); }
    .demo {
      position: relative;
      width: 330px;
      gap: 16px;
      background: var(--color-neutral-100);
      box-shadow: var(--shadow-lg);
    }
    .demo-moment { display: flex; gap: 8px; align-items: center; font-size: 16px; color: var(--color-neutral-700); }
    .demo-value { display: flex; align-items: baseline; gap: 8px; font-size: 18px; font-weight: 700; }
    .demo-value span { font-family: var(--font-heading); font-size: 66px; font-weight: 400; line-height: 1; }
    .demo app-level-badge { align-self: flex-start; background: var(--lvl-bg); }
    .demo-gauge { position: relative; display: flex; gap: 3px; height: 12px; margin-top: 8px; }
    .demo-gauge div { flex: 1; background: var(--lvl); }
    .demo-gauge div:first-child { border-radius: 999px 0 0 999px; }
    .demo-gauge div:nth-child(4) { border-radius: 0 999px 999px 0; }
    .demo-marker {
      position: absolute;
      left: 33%;
      top: 50%;
      width: 24px;
      height: 24px;
      transform: translate(-50%, -50%);
      border: 4px solid var(--lvl-normal);
      border-radius: 50%;
      background: var(--color-neutral-100);
    }

    .benefits { display: flex; flex-direction: column; gap: 24px; }
    .benefits h2 { font-size: clamp(28px, 3vw, 36px); }
    .benefit-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 20px; }
    .benefit-grid p { color: var(--color-neutral-800); }
    .benefit-icon { display: grid; place-items: center; width: 60px; height: 60px; border-radius: 50%; }
    .icon-accent { background: var(--color-accent-100); color: var(--color-accent-700); }
    .icon-sage { background: var(--color-accent-2-200); color: var(--color-accent-2-800); }
    .icon-neutral { background: var(--color-neutral-200); color: var(--color-neutral-800); }
  `,
})
export class Home {
  protected readonly auth = inject(AuthService);
}
