import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatValue } from '../core/format';
import { LEVEL_ORDER, LEVELS } from '../core/labels';
import { GlycemiaLevel, GlycemiaThresholds } from '../core/models';
import { Icon } from './icon';

/** Borne basse de la zone « Bas » et largeur de la zone « Très élevé », en mmol/L. */
const SCALE_MIN = 1;
const VERY_HIGH_SPAN = 8;

/**
 * Jauge à 4 zones de largeur égale (bas, normal, élevé, très élevé).
 * Le repère est placé dans la zone du niveau calculé par l'API, proportionnellement
 * à la valeur entre les seuils de cette zone.
 */
export function gaugePosition(value: number, level: GlycemiaLevel, t: GlycemiaThresholds): number {
  const bounds: Record<GlycemiaLevel, [number, number]> = {
    Low: [SCALE_MIN, t.lowBelow],
    Normal: [t.lowBelow, t.normalBelow],
    High: [t.normalBelow, t.highBelow],
    VeryHigh: [t.highBelow, t.highBelow + VERY_HIGH_SPAN],
  };
  const [a, b] = bounds[level];
  const within = Math.min(Math.max((value - a) / (b - a), 0.04), 0.96);
  return (LEVEL_ORDER.indexOf(level) + within) * 25;
}

@Component({
  selector: 'app-threshold-gauge',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="gauge" role="img" [attr.aria-label]="ariaLabel()">
      <div class="bubble" [style.left.%]="bubbleLeft()">{{ text() }}</div>
      <div class="track">
        @for (z of zones; track z.level) {
          <div class="zone" [class]="'zone lvl-' + z.level"></div>
        }
        <div class="marker" [style.left.%]="position()"></div>
      </div>
      <div class="ticks">
        @for (tk of ticks(); track tk.left) {
          <span [style.left.%]="tk.left">{{ tk.text }}</span>
        }
      </div>
      <div class="legend">
        @for (z of zones; track z.level) {
          <span [class]="'lvl-' + z.level"><app-icon [name]="z.icon" [size]="18" />{{ z.label }}</span>
        }
      </div>
    </div>
  `,
  styles: `
    .gauge { position: relative; padding-top: 46px; margin-top: 6px; }
    .bubble {
      position: absolute;
      top: 0;
      transform: translateX(-50%);
      padding: 4px 12px;
      border-radius: 999px;
      background: var(--color-text);
      color: var(--color-bg);
      font-size: 16px;
      font-weight: 700;
      white-space: nowrap;
    }
    .track { position: relative; display: flex; gap: 3px; height: 16px; }
    .zone { flex: 1; background: var(--lvl); }
    .zone:first-child { border-radius: 999px 0 0 999px; }
    .zone:nth-child(4) { border-radius: 0 999px 999px 0; }
    .marker {
      position: absolute;
      top: 50%;
      width: 30px;
      height: 30px;
      transform: translate(-50%, -50%);
      border: 5px solid var(--color-text);
      border-radius: 50%;
      background: var(--color-neutral-100);
    }
    .ticks {
      position: relative;
      height: 26px;
      margin-top: 6px;
      font-size: 15px;
      font-weight: 700;
      color: var(--color-neutral-800);
    }
    .ticks span { position: absolute; transform: translateX(-50%); }
    .legend { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; margin-top: 4px; }
    .legend span {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      color: var(--lvl-fg);
      font-size: 14px;
      font-weight: 700;
      line-height: 1.2;
      text-align: center;
    }
  `,
})
export class ThresholdGauge {
  readonly value = input.required<number>();
  readonly level = input.required<GlycemiaLevel>();
  readonly thresholds = input.required<GlycemiaThresholds>();
  /** Complément de phrase pour les lecteurs d'écran, ex. « à jeun ». */
  readonly context = input('');

  protected readonly zones = LEVEL_ORDER.map((level) => ({ level, ...LEVELS[level] }));

  protected readonly text = computed(() => formatValue(this.value()));
  protected readonly position = computed(() => gaugePosition(this.value(), this.level(), this.thresholds()));
  protected readonly bubbleLeft = computed(() => Math.min(Math.max(this.position(), 7), 93));

  protected readonly ticks = computed(() => {
    const t = this.thresholds();
    return [t.lowBelow, t.normalBelow, t.highBelow].map((v, i) => ({ left: (i + 1) * 25, text: formatValue(v) }));
  });

  protected readonly ariaLabel = computed(() => {
    const t = this.thresholds();
    const [low, normal, high] = [t.lowBelow, t.normalBelow, t.highBelow].map(formatValue);
    const ctx = this.context() ? ` ${this.context()}` : '';
    return (
      `${this.text()} mmol/L, niveau ${LEVELS[this.level()].label}. Seuils${ctx} : bas sous ${low}, ` +
      `normal de ${low} à moins de ${normal}, élevé de ${normal} à moins de ${high}, très élevé à partir de ${high}.`
    );
  });
}
