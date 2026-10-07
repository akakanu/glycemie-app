import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LEVELS } from '../core/labels';
import { GlycemiaLevel } from '../core/models';
import { Icon } from './icon';

/** Badge de niveau : toujours couleur + icône + libellé, jamais la couleur seule. */
@Component({
  selector: 'app-level-badge',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': "'lvl-' + level() + ' badge-' + size()" },
  template: `<app-icon [name]="info().icon" [size]="size() === 'sm' ? 18 : 20" />{{ info().label }}`,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 36px;
      padding: 4px 16px 4px 10px;
      border: 2px solid var(--lvl);
      border-radius: 999px;
      background: var(--color-neutral-100);
      color: var(--lvl-fg);
      font-size: 17px;
      font-weight: 700;
      white-space: nowrap;
    }
    :host(.badge-lg) {
      min-height: 40px;
      padding-right: 18px;
      font-size: 18px;
    }
    :host(.badge-sm) {
      gap: 6px;
      min-height: 32px;
      padding: 2px 12px 2px 8px;
      background: var(--lvl-bg);
      font-size: 15px;
    }
  `,
})
export class LevelBadge {
  readonly level = input.required<GlycemiaLevel>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  protected readonly info = computed(() => LEVELS[this.level()]);
}
