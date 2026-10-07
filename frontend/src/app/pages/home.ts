import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { Disclaimer } from '../shared/disclaimer';

@Component({
  selector: 'app-home',
  imports: [RouterLink, Disclaimer],
  template: `
    <section class="hero">
      <h1>Votre glycémie, enfin claire</h1>
      <p class="lead">Saisissez votre glycémie, comprenez votre résultat, suivez votre évolution.</p>
      <div class="actions">
        @if (auth.isAuthenticated()) {
          <a class="btn btn-primary" routerLink="/mesures/nouvelle">Nouvelle mesure</a>
          <a class="btn btn-secondary" routerLink="/historique">Mon historique</a>
        } @else {
          <a class="btn btn-primary" routerLink="/inscription">Créer un compte</a>
          <a class="btn btn-secondary" routerLink="/connexion">Se connecter</a>
        }
      </div>
    </section>

    <section class="benefits">
      <article class="card">
        <span class="benefit-icon" aria-hidden="true">✍️</span>
        <h2>Simple</h2>
        <p>Une valeur, un moment, et c'est tout. Le résultat s'affiche immédiatement.</p>
      </article>
      <article class="card">
        <span class="benefit-icon" aria-hidden="true">🍽️</span>
        <h2>Adapté au repas</h2>
        <p>À jeun, 1 h, 2 h ou 4 h après le repas : l'interprétation tient compte du moment.</p>
      </article>
      <article class="card">
        <span class="benefit-icon" aria-hidden="true">📈</span>
        <h2>Historique</h2>
        <p>Retrouvez toutes vos mesures pour suivre votre évolution dans le temps.</p>
      </article>
    </section>

    <app-disclaimer />
  `,
})
export class Home {
  protected readonly auth = inject(AuthService);
}
