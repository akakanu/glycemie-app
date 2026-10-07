import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../core/api-error';
import { dateLabels, formatValue } from '../core/format';
import { MOMENTS, momentOption, LEVELS } from '../core/labels';
import { MeasurementMoment, Reading } from '../core/models';
import { ReadingService } from '../core/reading.service';
import { Icon } from '../shared/icon';
import { LevelBadge } from '../shared/level-badge';

@Component({
  selector: 'app-history',
  imports: [RouterLink, Icon, LevelBadge],
  template: `
    <div class="page history">
      <div class="header">
        <div class="heading">
          <h1>Historique</h1>
          @if (items()?.length; as n) {
            <p class="count">{{ n }} mesure{{ n > 1 ? 's' : '' }} · de la plus récente à la plus ancienne</p>
          }
        </div>
        @if (items()?.length) {
          <a class="btn btn-primary cta desktop-only" routerLink="/mesures/nouvelle"><app-icon name="plus" [size]="22" />Nouvelle mesure</a>
        }
      </div>

      @if (items()?.length || moment()) {
        <div class="filters" role="group" aria-label="Filtrer par moment de mesure">
          <span class="filters-label">Filtrer par moment</span>
          <div class="pills">
            @for (f of filters; track f.label) {
              <button type="button" class="pill" [class.on]="moment() === f.value"
                [attr.aria-pressed]="moment() === f.value" (click)="moment.set(f.value)">{{ f.label }}</button>
            }
          </div>
        </div>
      }

      @if (error()) {
        <div class="alert alert-error" role="alert">
          <app-icon name="errCircle" />
          <strong>{{ error() }}</strong>
        </div>
      } @else if (items() === null) {
        <p class="loading">Chargement…</p>
      } @else if (items()!.length === 0 && moment()) {
        <div class="panel">
          <p>Aucune mesure « {{ filterLabel() }} » pour l'instant.</p>
          <button type="button" class="btn btn-secondary" (click)="moment.set(null)">Voir toutes les mesures</button>
        </div>
      } @else if (items()!.length === 0) {
        <div class="panel empty">
          <span class="empty-icon"><app-icon name="chart" [size]="44" /></span>
          <h2>Aucune mesure pour l'instant</h2>
          <p>Vos mesures apparaîtront ici, de la plus récente à la plus ancienne.</p>
          <a class="btn btn-primary" routerLink="/mesures/nouvelle"><app-icon name="plus" [size]="22" />Ajouter ma première mesure</a>
        </div>
      } @else {
        <!-- Mobile : cartes -->
        <ul class="cards mobile-only">
          @for (it of items(); track it.id) {
            <li>
              <a class="item-card" [routerLink]="['/mesures', it.id]" [attr.aria-label]="it.aria">
                <span class="hint">{{ it.date.long }} · {{ it.date.time }}</span>
                <app-level-badge class="end" [level]="it.level" size="sm" />
                <span class="value"><span>{{ it.value }}</span> mmol/L</span>
                <app-icon class="end chevron" name="chevron" />
                <span class="moment"><app-icon [name]="it.moment.icon" [size]="20" />{{ it.moment.label }}</span>
              </a>
            </li>
          }
        </ul>

        <!-- Bureau : tableau -->
        <div class="table desktop-only" role="table" aria-label="Mesures de glycémie">
          <div class="row head" role="row">
            <span role="columnheader">Date et heure</span>
            <span role="columnheader">Moment</span>
            <span role="columnheader">Valeur</span>
            <span role="columnheader">Niveau</span>
            <span role="columnheader" class="visually-hidden">Ouvrir</span>
          </div>
          @for (it of items(); track it.id) {
            <div class="row" role="row" (click)="open(it.id)">
              <span role="cell" class="date"><strong>{{ it.date.short }}</strong><span class="hint">{{ it.date.time }}</span></span>
              <span role="cell" class="moment"><app-icon [name]="it.moment.icon" [size]="20" />{{ it.moment.label }}</span>
              <span role="cell" class="value small"><span>{{ it.value }}</span> mmol/L</span>
              <span role="cell"><app-level-badge [level]="it.level" size="sm" /></span>
              <span role="cell">
                <a class="btn btn-secondary btn-icon" [routerLink]="['/mesures', it.id]" [attr.aria-label]="it.aria"
                  (click)="$event.stopPropagation()"><app-icon name="chevron" [size]="22" /></a>
              </span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .history { gap: 24px; }
    .header { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px; }
    .heading { display: flex; flex-direction: column; gap: 6px; }
    .count { color: var(--color-neutral-700); }
    .cta { min-height: 54px; padding: 0 26px; }

    .filters { display: flex; flex-direction: column; gap: 10px; }
    .filters-label { font-weight: 700; }
    .pills { display: flex; flex-wrap: wrap; gap: 8px; }
    .pill {
      min-height: 48px;
      padding: 0 18px;
      border: 2px solid var(--color-neutral-400);
      border-radius: 999px;
      background: var(--color-neutral-100);
      color: var(--color-text);
      font: inherit;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
    }
    .pill:hover { border-color: var(--color-accent-400); }
    .pill.on { border-color: var(--color-accent); background: var(--color-accent); color: var(--color-bg); }

    .panel {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      padding: 28px;
      border-radius: 28px;
      background: var(--color-surface);
      font-size: 18px;
    }
    .panel .btn-secondary { min-height: 52px; padding: 0 24px; font-size: 17px; }
    .empty { gap: 18px; max-width: 640px; padding: clamp(28px, 4vw, 48px); border-radius: 36px; }
    .empty h2 { font-size: 28px; }
    .empty p { color: var(--color-neutral-800); max-width: 40ch; }
    .empty-icon {
      display: grid;
      place-items: center;
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: var(--color-accent-2-200);
      color: var(--color-accent-2-800);
    }

    .value { display: flex; align-items: baseline; gap: 6px; font-size: 16px; font-weight: 700; }
    .value span { font-family: var(--font-heading); font-size: 34px; font-weight: 400; line-height: 1; }
    .value.small { font-weight: 600; }
    .value.small span { font-size: 26px; }
    .moment { display: flex; gap: 8px; align-items: center; }

    .cards { display: flex; flex-direction: column; gap: 12px; margin: 0; padding: 0; list-style: none; }
    .item-card {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px 12px;
      align-items: center;
      padding: 18px 20px;
      border-radius: 28px;
      background: var(--color-surface);
      color: var(--color-text);
      text-decoration: none;
    }
    .item-card:hover { background: var(--color-neutral-300); color: var(--color-text); }
    .item-card .end { justify-self: end; }
    .item-card .chevron { color: var(--color-neutral-700); }
    .item-card .moment { grid-column: 1 / -1; font-size: 16px; font-weight: 600; color: var(--color-neutral-800); }

    .table { padding: 8px 20px; border-radius: 32px; background: var(--color-neutral-100); box-shadow: var(--shadow-sm); }
    .row {
      display: grid;
      grid-template-columns: 1.3fr 1.5fr 1fr 1fr 56px;
      gap: 12px;
      align-items: center;
      min-height: 72px;
      padding: 12px;
      border-bottom: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent);
      border-radius: 18px;
      cursor: pointer;
    }
    .row:not(.head):hover { background: var(--color-neutral-200); }
    .row:last-child { border-bottom: 0; }
    .row.head {
      min-height: 0;
      padding: 14px 12px;
      border-bottom: 1px solid var(--color-divider);
      border-radius: 0;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--color-neutral-700);
      cursor: default;
    }
    .date { display: flex; flex-direction: column; }
    .row .moment app-icon { color: var(--color-neutral-700); }
  `,
})
export class History {
  private readonly service = inject(ReadingService);
  private readonly router = inject(Router);

  protected readonly filters: { label: string; value: MeasurementMoment | null }[] = [
    { label: 'Toutes', value: null },
    ...MOMENTS.map((m) => ({ label: m.short, value: m.value })),
  ];

  protected readonly moment = signal<MeasurementMoment | null>(null);
  private readonly readings = signal<Reading[] | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly filterLabel = computed(() => this.filters.find((f) => f.value === this.moment())?.label ?? '');

  protected readonly items = computed(() =>
    this.readings()?.map((r) => {
      const moment = momentOption(r.moment);
      const date = dateLabels(r.measuredAt);
      const value = formatValue(r.value);
      const level = r.interpretation.level;
      return {
        id: r.id,
        moment,
        date,
        value,
        level,
        aria: `Ouvrir le résultat du ${date.long} à ${date.time} : ${value} mmol/L, ${moment.label}, ${LEVELS[level].label}`,
      };
    }) ?? null,
  );

  constructor() {
    effect((onCleanup) => {
      // La liste précédente reste affichée pendant le chargement du nouveau filtre.
      const moment = this.moment();
      this.error.set(null);
      const sub = this.service.list(moment).subscribe({
        next: (list) => this.readings.set(list),
        error: (err) => this.error.set(apiErrorMessage(err)),
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected open(id: string): void {
    this.router.navigate(['/mesures', id]);
  }
}
