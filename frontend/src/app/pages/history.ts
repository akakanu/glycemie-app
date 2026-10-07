import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { apiErrorMessage } from '../core/api-error';
import { MOMENTS, momentLabel } from '../core/labels';
import { MeasurementMoment, Reading } from '../core/models';
import { ReadingService } from '../core/reading.service';
import { LevelBadge } from '../shared/level-badge';

@Component({
  selector: 'app-history',
  imports: [RouterLink, DatePipe, DecimalPipe, LevelBadge],
  template: `
    <section class="card">
      <div class="history-header">
        <h1>Mon historique</h1>
        <label class="filter">
          <span>Moment</span>
          <select [value]="moment() ?? ''" (change)="onFilter($event)">
            <option value="">Tous</option>
            @for (m of moments; track m.value) {
              <option [value]="m.value">{{ m.label }}</option>
            }
          </select>
        </label>
      </div>

      @if (error()) {
        <p class="alert alert-error" role="alert">{{ error() }}</p>
      } @else if (readings() === null) {
        <p class="loading">Chargement…</p>
      } @else if (readings()!.length === 0) {
        <div class="empty">
          <p>{{ moment() ? 'Aucune mesure pour ce moment.' : 'Aucune mesure pour l’instant.' }}</p>
          <a class="btn btn-primary" routerLink="/mesures/nouvelle">Ajouter ma première mesure</a>
        </div>
      } @else {
        <ul class="history-list">
          @for (r of readings(); track r.id) {
            <li>
              <a class="history-item" [routerLink]="['/mesures', r.id]">
                <span class="history-date">{{ r.measuredAt | date: 'd MMM y, HH:mm' }}</span>
                <span class="history-moment">{{ label(r.moment) }}</span>
                <span class="history-value">{{ r.value | number: '1.1-1' }} <small>mmol/L</small></span>
                <app-level-badge [level]="r.interpretation.level" />
              </a>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class History {
  private readonly service = inject(ReadingService);

  protected readonly moments = MOMENTS;
  protected readonly moment = signal<MeasurementMoment | null>(null);
  protected readonly readings = signal<Reading[] | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect((onCleanup) => {
      const moment = this.moment();
      this.readings.set(null);
      this.error.set(null);
      const sub = this.service.list(moment).subscribe({
        next: (list) => this.readings.set(list),
        error: (err) => this.error.set(apiErrorMessage(err)),
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected onFilter(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.moment.set((value || null) as MeasurementMoment | null);
  }

  protected label(m: MeasurementMoment): string {
    return momentLabel(m);
  }
}
