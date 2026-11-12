import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  THEME_CHOICES,
  THEME_STORAGE_KEY,
  applyThemeChoice,
  readThemeChoice,
  writeThemeChoice,
} from './theme';

function addThemeColorMetas(): { light: HTMLMetaElement; dark: HTMLMetaElement } {
  const light = document.createElement('meta');
  light.name = 'theme-color';
  light.media = '(prefers-color-scheme: light)';
  light.content = '#d72d28';
  const dark = document.createElement('meta');
  dark.name = 'theme-color';
  dark.media = '(prefers-color-scheme: dark)';
  dark.content = '#1b1d22';
  document.head.append(light, dark);
  return { light, dark };
}

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  document.documentElement.removeAttribute('data-theme');
  document.head.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
});

describe('THEME_CHOICES', () => {
  it('lists system first, then light, dark, pink and oldfashioned', () => {
    expect(THEME_CHOICES).toEqual(['system', 'light', 'dark', 'pink', 'oldfashioned']);
  });
});

describe('readThemeChoice', () => {
  it('returns system when nothing is stored', () => {
    expect(readThemeChoice()).toBe('system');
  });

  it('returns the stored choice', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    expect(readThemeChoice()).toBe('dark');
  });

  it('returns oldfashioned when it is stored', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'oldfashioned');

    expect(readThemeChoice()).toBe('oldfashioned');
  });

  it('returns system for an unknown stored value', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'purple');

    expect(readThemeChoice()).toBe('system');
  });

  it('returns system when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });

    expect(readThemeChoice()).toBe('system');
  });
});

describe('writeThemeChoice', () => {
  it('stores an explicit choice under kings-races:theme', () => {
    writeThemeChoice('pink');

    expect(THEME_STORAGE_KEY).toBe('kings-races:theme');
    expect(localStorage.getItem('kings-races:theme')).toBe('pink');
  });

  it('removes the key for system', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    writeThemeChoice('system');

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('does not throw when setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });

    expect(() => writeThemeChoice('dark')).not.toThrow();
  });

  it('does not throw when removeItem throws', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('denied');
    });

    expect(() => writeThemeChoice('system')).not.toThrow();
  });
});

describe('applyThemeChoice', () => {
  it.each(['light', 'dark', 'pink', 'oldfashioned'] as const)('sets data-theme to %s on the html element', (choice) => {
    applyThemeChoice(choice);

    expect(document.documentElement.getAttribute('data-theme')).toBe(choice);
  });

  it('removes data-theme for system', () => {
    document.documentElement.setAttribute('data-theme', 'dark');

    applyThemeChoice('system');

    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('sets both theme-color metas to hot pink for pink', () => {
    const { light, dark } = addThemeColorMetas();

    applyThemeChoice('pink');

    expect([light.content, dark.content]).toEqual(['#d6006f', '#d6006f']);
  });

  it('sets both theme-color metas to ink for oldfashioned', () => {
    const { light, dark } = addThemeColorMetas();

    applyThemeChoice('oldfashioned');

    expect([light.content, dark.content]).toEqual(['#2b241c', '#2b241c']);
  });

  it('sets both theme-color metas to the dark canvas for dark', () => {
    const { light, dark } = addThemeColorMetas();

    applyThemeChoice('dark');

    expect([light.content, dark.content]).toEqual(['#1b1d22', '#1b1d22']);
  });

  it('sets both theme-color metas to club red for light', () => {
    const { light, dark } = addThemeColorMetas();

    applyThemeChoice('light');

    expect([light.content, dark.content]).toEqual(['#d72d28', '#d72d28']);
  });

  it('restores the per-scheme theme-color metas for system', () => {
    const { light, dark } = addThemeColorMetas();
    applyThemeChoice('pink');

    applyThemeChoice('system');

    expect([light.content, dark.content]).toEqual(['#d72d28', '#1b1d22']);
  });
});
