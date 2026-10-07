import { Component, computed, input } from '@angular/core';
import { LEVELS } from '../core/labels';
import { GlycemiaLevel } from '../core/models';

/** Badge de niveau : toujours couleur + icône + libellé, jamais la couleur seule. */
@Component({
  selector: 'app-level-badge',
  template: `
    <span class="badge" [class]="'badge level-' + level()">
      <span aria-hidden="true">{{ info().icon }}</span>
      {{ info().label }}
    </span>
  `,
})
export class LevelBadge {
  readonly level = input.required<GlycemiaLevel>();
  protected readonly info = computed(() => LEVELS[this.level()]);
}
