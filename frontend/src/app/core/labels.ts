import { IconName } from '../shared/icon';
import { GlycemiaLevel, MeasurementMoment } from './models';

export interface MomentOption {
  value: MeasurementMoment;
  label: string;
  /** Libellé court des filtres de l'historique. */
  short: string;
  /** Complément de phrase, ex. « à jeun » ou « 2 h après un repas ». */
  context: string;
  icon: IconName;
}

/** Les 4 moments de mesure, dans l'ordre d'affichage. */
export const MOMENTS: readonly MomentOption[] = [
  { value: 'Fasting', label: 'À jeun', short: 'À jeun', context: 'à jeun', icon: 'sunrise' },
  { value: 'OneHourAfterMeal', label: '1 h après le repas', short: '1 h après', context: '1 h après un repas', icon: 'utensils' },
  { value: 'TwoHoursAfterMeal', label: '2 h après le repas', short: '2 h après', context: '2 h après un repas', icon: 'clock' },
  {
    value: 'FourHoursOrMoreAfterMeal',
    label: '4 h et plus après le repas',
    short: '4 h et plus',
    context: '4 h ou plus après un repas',
    icon: 'hourglass',
  },
];

export function momentOption(moment: MeasurementMoment): MomentOption {
  return MOMENTS.find((m) => m.value === moment) ?? MOMENTS[0];
}

export const LEVEL_ORDER: readonly GlycemiaLevel[] = ['Low', 'Normal', 'High', 'VeryHigh'];

export const LEVELS: Record<GlycemiaLevel, { label: string; icon: IconName }> = {
  Low: { label: 'Bas', icon: 'down' },
  Normal: { label: 'Normal', icon: 'check' },
  High: { label: 'Élevé', icon: 'up' },
  VeryHigh: { label: 'Très élevé', icon: 'alert' },
};
