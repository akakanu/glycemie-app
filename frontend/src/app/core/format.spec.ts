import { gaugePosition } from '../shared/threshold-gauge';
import { dateLabels, formatValue, parseDecimal } from './format';

describe('parseDecimal', () => {
  it('accepte le point et la virgule', () => {
    expect(parseDecimal('6.2')).toBe(6.2);
    expect(parseDecimal(' 6,2 ')).toBe(6.2);
    expect(parseDecimal('12')).toBe(12);
  });

  it('refuse ce qui n’est pas un nombre', () => {
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('abc')).toBeNull();
    expect(parseDecimal('6.2.1')).toBeNull();
    expect(parseDecimal('-3')).toBeNull();
  });
});

describe('formatValue', () => {
  it('affiche une décimale', () => {
    expect(formatValue(8)).toBe('8.0');
    expect(formatValue(5.64)).toBe('5.6');
  });
});

describe('dateLabels', () => {
  it('suit le format de la maquette', () => {
    const d = dateLabels(new Date(2026, 9, 6, 7, 5).toISOString());
    expect(d.long).toBe('Mardi 6 octobre');
    expect(d.full).toBe('Mardi 6 octobre 2026');
    expect(d.short).toBe('6 oct. 2026');
    expect(d.time).toBe('7 h 05');
  });
});

describe('gaugePosition', () => {
  const fasting = { lowBelow: 4, normalBelow: 6.1, highBelow: 7 };

  it('place le repère dans la zone du niveau', () => {
    expect(gaugePosition(3.6, 'Low', fasting)).toBeGreaterThan(0);
    expect(gaugePosition(3.6, 'Low', fasting)).toBeLessThan(25);
    expect(gaugePosition(5.6, 'Normal', fasting)).toBeGreaterThan(25);
    expect(gaugePosition(5.6, 'Normal', fasting)).toBeLessThan(50);
    expect(gaugePosition(6.5, 'High', fasting)).toBeGreaterThan(50);
    expect(gaugePosition(6.5, 'High', fasting)).toBeLessThan(75);
  });

  it('reste dans la jauge pour les valeurs extrêmes', () => {
    expect(gaugePosition(33.3, 'VeryHigh', fasting)).toBeLessThan(100);
    expect(gaugePosition(1, 'Low', fasting)).toBeGreaterThan(0);
  });
});
