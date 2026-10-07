import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { GlycemiaThresholds } from '../core/models';

/** Échelle affichée par la jauge, en mmol/L. */
const SCALE_MIN = 2;
const SCALE_MAX = 15;

/** Jauge horizontale situant la valeur entre les seuils bas, normal, élevé et très élevé. */
@Component({
  selector: 'app-threshold-gauge',
  imports: [DecimalPipe],
  template: `
    <div class="gauge" role="img" [attr.aria-label]="ariaLabel()">
      <div class="gauge-track">
        <span class="gauge-zone level-Low" [style.width.%]="zones().low"></span>
        <span class="gauge-zone level-Normal" [style.width.%]="zones().normal"></span>
        <span class="gauge-zone level-High" [style.width.%]="zones().high"></span>
        <span class="gauge-zone level-VeryHigh" [style.width.%]="zones().veryHigh"></span>
      </div>
      <span class="gauge-marker" [style.left.%]="markerPosition()"></span>
      <div class="gauge-ticks">
        <span [style.left.%]="pos(thresholds().lowBelow)">{{ thresholds().lowBelow | number: '1.1-1' }}</span>
        <span [style.left.%]="pos(thresholds().normalBelow)">{{ thresholds().normalBelow | number: '1.1-1' }}</span>
        <span [style.left.%]="pos(thresholds().highBelow)">{{ thresholds().highBelow | number: '1.1-1' }}</span>
      </div>
    </div>
  `,
})
export class ThresholdGauge {
  readonly value = input.required<number>();
  readonly thresholds = input.required<GlycemiaThresholds>();

  protected readonly zones = computed(() => {
    const t = this.thresholds();
    const low = this.pos(t.lowBelow);
    const normal = this.pos(t.normalBelow) - low;
    const high = this.pos(t.highBelow) - low - normal;
    return { low, normal, high, veryHigh: 100 - low - normal - high };
  });

  protected readonly markerPosition = computed(() => this.pos(this.value()));

  protected readonly ariaLabel = computed(() => {
    const t = this.thresholds();
    return `Valeur ${this.value()} mmol/L. Plage normale de ${t.lowBelow} à moins de ${t.normalBelow}.`;
  });

  protected pos(v: number): number {
    const clamped = Math.min(Math.max(v, SCALE_MIN), SCALE_MAX);
    return ((clamped - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;
  }
}
