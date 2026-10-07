import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, input, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { apiErrorMessage } from '../core/api-error';
import { momentLabel } from '../core/labels';
import { Reading } from '../core/models';
import { ReadingService } from '../core/reading.service';
import { Disclaimer } from '../shared/disclaimer';
import { LevelBadge } from '../shared/level-badge';
import { ThresholdGauge } from '../shared/threshold-gauge';

@Component({
  selector: 'app-reading-result',
  imports: [RouterLink, DatePipe, DecimalPipe, Disclaimer, LevelBadge, ThresholdGauge],
  template: `
    @if (reading(); as r) {
      <section class="card result" [class]="'card result result-' + r.interpretation.level">
        <p class="result-moment">{{ label(r) }} · {{ r.measuredAt | date: 'd MMMM y, HH:mm' }}</p>
        <p class="result-value">
          {{ r.value | number: '1.1-1' }} <span>mmol/L</span>
        </p>
        <app-level-badge [level]="r.interpretation.level" />

        <app-threshold-gauge [value]="r.value" [thresholds]="r.interpretation.thresholds" />

        <h1 class="result-title">{{ r.interpretation.title }}</h1>
        <p>{{ r.interpretation.message }}</p>

        <h2>Conseils</h2>
        <ul class="advice" [class.advice-urgent]="r.interpretation.level === 'Low'">
          @for (a of r.interpretation.advice; track $index) {
            <li>{{ a }}</li>
          }
        </ul>

        @if (r.note) {
          <p class="note">Note : {{ r.note }}</p>
        }

        <app-disclaimer [text]="r.interpretation.disclaimer" />

        <div class="actions">
          <a class="btn btn-primary" routerLink="/mesures/nouvelle">Nouvelle mesure</a>
          <a class="btn btn-secondary" routerLink="/historique">Voir mon historique</a>
        </div>
      </section>
    } @else if (error()) {
      <section class="card">
        <p class="alert alert-error" role="alert">{{ error() }}</p>
        <a class="btn btn-secondary" routerLink="/historique">Retour à l'historique</a>
      </section>
    } @else {
      <p class="loading">Chargement…</p>
    }
  `,
})
export class ReadingResult {
  private readonly readings = inject(ReadingService);

  /** Paramètre de route :id (withComponentInputBinding). */
  readonly id = input.required<string>();

  protected readonly reading = signal<Reading | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect((onCleanup) => {
      const id = this.id();
      this.reading.set(null);
      this.error.set(null);
      const sub = this.readings.get(id).subscribe({
        next: (r) => this.reading.set(r),
        error: (err) =>
          this.error.set(apiErrorMessage(err, 'Cette mesure est introuvable.')),
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected label(r: Reading): string {
    return momentLabel(r.moment);
  }
}
