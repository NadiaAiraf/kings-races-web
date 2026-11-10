import type { DisciplineKey } from '../../domain/types';

/**
 * Discipline colours for the All races view: card stripe, label chip and
 * sub-heading. Full literal class names so Tailwind finds them in source.
 */
export const DISCIPLINE_ACCENT: Record<DisciplineKey, { stripe: string; chip: string; heading: string }> = {
  mixed: { stripe: 'border-l-blue-600', chip: 'bg-blue-600 text-white', heading: 'text-blue-700 dark:text-blue-400 border-l-blue-600' },
  ladies: { stripe: 'border-l-red-600', chip: 'bg-red-600 text-white', heading: 'text-red-700 dark:text-red-400 border-l-red-600' },
  board: { stripe: 'border-l-green-700', chip: 'bg-green-700 text-white', heading: 'text-green-800 border-l-green-700' },
};
