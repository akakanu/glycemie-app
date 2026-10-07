import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from './icon';

/**
 * Avertissement médical.
 * - `footer` : discret, en bas de l'accueil
 * - `note` : encadré bien visible, sur la page résultat
 */
@Component({
  selector: 'app-disclaimer',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (variant() === 'note') {
      <div class="alert alert-info note" role="note">
        <app-icon name="info" [size]="26" />
        <div class="alert-body">
          <strong>Information générale seulement</strong>
          <p>
            Ce résultat n'est pas un diagnostic. Pour toute question sur votre santé ou votre traitement,
            consultez un professionnel de la santé ou appelez Info-Santé au 811. En cas d'urgence, composez le 911.
          </p>
        </div>
      </div>
    } @else {
      <footer class="footer">
        <app-icon name="info" [size]="22" />
        <p>
          GlycoSuivi fournit de l'information générale et ne pose aucun diagnostic. L'application ne remplace pas
          l'avis d'un professionnel de la santé. Pour toute question, consultez votre médecin ou appelez Info-Santé au 811.
        </p>
      </footer>
    }
  `,
  styles: `
    :host { display: block; }
    .note { padding: 20px 22px; border-radius: 24px; gap: 14px; }
    .note p { font-size: 16px; }
    .footer {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding-top: 20px;
      border-top: 1px solid var(--color-divider);
      color: var(--color-neutral-700);
      font-size: 16px;
    }
    .footer app-icon { margin-top: 2px; }
    .footer p { max-width: 72ch; }
  `,
})
export class Disclaimer {
  readonly variant = input<'footer' | 'note'>('footer');
}
