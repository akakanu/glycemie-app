import { GlycemiaLevel, MeasurementMoment } from './models';

export interface MomentOption {
  value: MeasurementMoment;
  label: string;
  icon: string;
}

/** Les 4 moments de mesure, dans l'ordre d'affichage. */
export const MOMENTS: readonly MomentOption[] = [
  { value: 'Fasting', label: 'À jeun', icon: '🌅' },
  { value: 'OneHourAfterMeal', label: '1 h après le repas', icon: '🍽️' },
  { value: 'TwoHoursAfterMeal', label: '2 h après le repas', icon: '⏱️' },
  { value: 'FourHoursOrMoreAfterMeal', label: '4 h et plus après le repas', icon: '🕓' },
];

export function momentLabel(moment: MeasurementMoment): string {
  return MOMENTS.find((m) => m.value === moment)?.label ?? moment;
}

export const LEVELS: Record<GlycemiaLevel, { label: string; icon: string }> = {
  Low: { label: 'Bas', icon: '▼' },
  Normal: { label: 'Normal', icon: '✓' },
  High: { label: 'Élevé', icon: '▲' },
  VeryHigh: { label: 'Très élevé', icon: '⚠' },
};
