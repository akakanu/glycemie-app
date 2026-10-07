// Formats d'affichage de la maquette : « Lundi 6 octobre », « 12 h 40 », « 8.4 ».
// Le point décimal est celui des messages de l'API (ex. « sous 4.0 mmol/L »).

const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Valeur de glycémie à une décimale. */
export function formatValue(value: number): string {
  return value.toFixed(1);
}

/** Lit une valeur saisie avec un point ou une virgule ; null si ce n'est pas un nombre. */
export function parseDecimal(raw: string | null | undefined): number | null {
  const text = (raw ?? '').trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  return Number(text);
}

export interface DateLabels {
  /** « Lundi 6 octobre » */
  long: string;
  /** « Lundi 6 octobre 2026 » */
  full: string;
  /** « 6 oct. 2026 » */
  short: string;
  /** « 12 h 40 », avec des espaces insécables pour ne jamais couper l'heure */
  time: string;
}

/** Libellés d'une date ISO, en heure locale. */
export function dateLabels(iso: string): DateLabels {
  const d = new Date(iso);
  const day = d.getDate();
  const long = `${capitalize(DAYS[d.getDay()])} ${day} ${MONTHS[d.getMonth()]}`;
  return {
    long,
    full: `${long} ${d.getFullYear()}`,
    short: `${day} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`,
    time: `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`,
  };
}
