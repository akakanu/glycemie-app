import { Component, input } from '@angular/core';

export const DEFAULT_DISCLAIMER =
  'Information générale à titre indicatif. Ne remplace pas un avis médical. ' +
  'En cas de doute ou de malaise, consultez un professionnel de santé ou composez le 911.';

@Component({
  selector: 'app-disclaimer',
  template: `<p class="disclaimer" role="note"><span aria-hidden="true">ⓘ</span> {{ text() }}</p>`,
})
export class Disclaimer {
  readonly text = input(DEFAULT_DISCLAIMER);
}
