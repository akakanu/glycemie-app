import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { apiErrorMessage } from '../core/api-error';
import { dateLabels, formatValue } from '../core/format';
import { momentOption } from '../core/labels';
import { Reading } from '../core/models';
import { ReadingService } from '../core/reading.service';
import { Disclaimer } from '../shared/disclaimer';
import { Icon } from '../shared/icon';
import { LevelBadge } from '../shared/level-badge';
import { ThresholdGauge } from '../shared/threshold-gauge';

/**
 * Pour une glycémie basse, l'API place les deux étapes de la règle du 15/15 en tête des conseils :
 * elles sont mises en avant dans un encadré, la suite est affichée sous « Ensuite ».
 */
const LOW_URGENT_STEPS = 2;

@Component({
  selector: 'app-reading-result',
  imports: [RouterLink, Disclaimer, Icon, LevelBadge, ThresholdGauge],
  template: `
    @if (view(); as v) {
      <div class="page">
        <div class="heading">
          <p class="hint">{{ v.date.full }} · {{ v.date.time }}</p>
          <h1>Votre résultat</h1>
        </div>

        <div class="columns">
          <section class="value-card" [class]="'value-card lvl-' + v.level" aria-label="Valeur mesurée">
            <span class="moment"><app-icon [name]="v.moment.icon" />{{ v.moment.label }}</span>
            <div class="value"><span>{{ v.value }}</span> mmol/L</div>
            <app-level-badge [level]="v.level" size="lg" />
            <app-threshold-gauge
              [value]="v.reading.value"
              [level]="v.level"
              [thresholds]="v.reading.interpretation.thresholds"
              [context]="v.moment.context"
            />
          </section>

          <section class="advice">
            @if (v.urgent.length) {
              <div class="urgent" role="alert">
                <div class="urgent-head">
                  <span class="urgent-icon"><app-icon name="zap" /></span>
                  <div>
                    <span class="kicker">À faire maintenant</span>
                    <h2>La règle du 15/15</h2>
                  </div>
                </div>
                <ol>
                  @for (step of v.urgent; track $index) {
                    <li><span class="step">{{ $index + 1 }}</span><span>{{ step }}</span></li>
                  }
                </ol>
                <p>Si vous ne vous sentez pas mieux, demandez de l'aide autour de vous ou composez le 911.</p>
              </div>
            }

            <p class="interp">{{ v.reading.interpretation.message }}</p>

            @if (v.tips.length) {
              <div class="tips">
                <h2>{{ v.urgent.length ? 'Ensuite' : 'Nos conseils' }}</h2>
                <ul>
                  @for (tip of v.tips; track $index) {
                    <li>{{ tip }}</li>
                  }
                </ul>
              </div>
            }

            @if (v.reading.note) {
              <p class="hint">Votre note : « {{ v.reading.note }} »</p>
            }
          </section>
        </div>

        <app-disclaimer variant="note" />

        <div class="btn-row">
          <a class="btn btn-primary" routerLink="/mesures/nouvelle"><app-icon name="plus" [size]="22" />Nouvelle mesure</a>
          <a class="btn btn-secondary" routerLink="/historique">Voir mon historique</a>
        </div>
      </div>
    } @else if (error()) {
      <div class="page">
        <div class="alert alert-error" role="alert">
          <app-icon name="errCircle" />
          <strong>{{ error() }}</strong>
        </div>
        <div class="btn-row">
          <a class="btn btn-secondary" routerLink="/historique">Retour à l'historique</a>
        </div>
      </div>
    } @else {
      <p class="loading page">Chargement…</p>
    }
  `,
  styles: `
    .heading { display: flex; flex-direction: column; gap: 6px; }
    .columns {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
      gap: clamp(20px, 3vw, 40px);
      align-items: start;
    }

    .value-card {
      display: flex;
      flex-direction: column;
      gap: 18px;
      padding: clamp(22px, 3vw, 36px);
      border-radius: 32px;
      background: var(--lvl-bg);
    }
    .moment { display: flex; gap: 10px; align-items: center; font-size: 18px; font-weight: 700; }
    .value { display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px; font-size: 22px; font-weight: 700; }
    .value span { font-family: var(--font-heading); font-size: clamp(76px, 8vw, 104px); font-weight: 400; line-height: 0.95; }
    app-level-badge { align-self: flex-start; }

    .advice { display: flex; flex-direction: column; gap: 20px; }
    .interp { font-size: 19px; line-height: 1.5; text-wrap: pretty; }

    .urgent {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 22px;
      border: 3px solid var(--lvl-bas);
      border-radius: 28px;
      background: var(--color-neutral-100);
    }
    .urgent-head { display: flex; gap: 12px; align-items: center; }
    .urgent-icon {
      display: grid;
      place-items: center;
      flex: none;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--lvl-bas);
      color: #fff;
    }
    .kicker {
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--lvl-bas-fg);
    }
    .urgent ol { display: flex; flex-direction: column; gap: 12px; margin: 0; padding: 0; list-style: none; }
    .urgent li { display: flex; gap: 12px; align-items: flex-start; font-size: 17px; }
    .urgent li > span:last-child { padding-top: 3px; }
    .step {
      display: grid;
      place-items: center;
      flex: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--lvl-bas-bg);
      color: var(--lvl-bas-fg);
      font-weight: 700;
    }
    .urgent p { font-size: 16px; color: var(--color-neutral-800); }

    .tips { display: flex; flex-direction: column; gap: 12px; }
    .tips ul { display: flex; flex-direction: column; gap: 12px; margin: 0; padding: 0; list-style: none; }
    .tips li { position: relative; padding-left: 22px; font-size: 17px; }
    .tips li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 9px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--color-accent);
    }
  `,
})
export class ReadingResult {
  private readonly readings = inject(ReadingService);

  /** Paramètre de route :id (withComponentInputBinding). */
  readonly id = input.required<string>();

  protected readonly reading = signal<Reading | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly view = computed(() => {
    const reading = this.reading();
    if (!reading) return null;
    const { level, advice } = reading.interpretation;
    const urgent = level === 'Low' ? advice.slice(0, LOW_URGENT_STEPS) : [];
    return {
      reading,
      level,
      value: formatValue(reading.value),
      moment: momentOption(reading.moment),
      date: dateLabels(reading.measuredAt),
      urgent,
      tips: advice.slice(urgent.length),
    };
  });

  constructor() {
    effect((onCleanup) => {
      const id = this.id();
      this.reading.set(null);
      this.error.set(null);
      const sub = this.readings.get(id).subscribe({
        next: (r) => this.reading.set(r),
        error: (err) => this.error.set(apiErrorMessage(err, 'Cette mesure est introuvable.')),
      });
      onCleanup(() => sub.unsubscribe());
    });
  }
}
