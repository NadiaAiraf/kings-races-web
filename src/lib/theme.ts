export type ThemeChoice = 'system' | 'light' | 'dark' | 'pink' | 'oldfashioned';

export const THEME_CHOICES: readonly ThemeChoice[] = ['system', 'light', 'dark', 'pink', 'oldfashioned'];

export const THEME_STORAGE_KEY = 'kings-races:theme';

// Mirrors the theme-color metas in index.html and the palettes in index.css.
const THEME_COLOURS = { light: '#d72d28', dark: '#1b1d22', pink: '#d6006f', oldfashioned: '#7b2323' } as const;

function isThemeChoice(value: unknown): value is ThemeChoice {
  return typeof value === 'string' && (THEME_CHOICES as readonly string[]).includes(value);
}

/** The theme chosen on this device; System when unset, unknown or unreadable. */
export function readThemeChoice(): ThemeChoice {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeChoice(value) ? value : 'system';
  } catch {
    return 'system';
  }
}

export function writeThemeChoice(choice: ThemeChoice): void {
  try {
    if (choice === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // Storage unavailable: the choice still holds for this session.
  }
}

/** Sets data-theme on <html> (removed for System) and the theme-color metas. */
export function applyThemeChoice(choice: ThemeChoice, doc: Document = document): void {
  const root = doc.documentElement;
  if (choice === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', choice);

  doc.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    if (choice !== 'system') {
      meta.content = THEME_COLOURS[choice];
    } else {
      meta.content = meta.media.includes('dark') ? THEME_COLOURS.dark : THEME_COLOURS.light;
    }
  });
}
