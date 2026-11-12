import { describe, it, expect } from 'vitest';
import css from './index.css?raw';
import html from '../index.html?raw';

// Static guard for the soft dark mode: the dark palette in index.css must
// cover every colour step the source uses, and the source must keep to the
// rules that let one palette serve both schemes.

const sources = import.meta.glob(['./**/*.{ts,tsx}', '!./**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const DARK_MEDIA = '@media (prefers-color-scheme: dark) {';
const SYSTEM_DARK = ":root:not([data-theme='light']):not([data-theme='pink']):not([data-theme='oldfashioned'])";
const EXPLICIT_DARK = ":root[data-theme='dark']";

/** Body of the block opened by the `{` that ends `opener`, found by brace depth. */
function blockAfter(text: string, opener: string, from = 0): string {
  const start = text.indexOf(opener, from);
  if (start < 0) return '';
  let depth = 0;
  for (let i = start + opener.length - 1; i < text.length; i++) {
    if (text[i] === '{') depth++;
    if (text[i] === '}') {
      depth--;
      if (depth === 0) return text.slice(start + opener.length, i);
    }
  }
  return '';
}

const baseLayer = blockAfter(css, '@layer base {');
const darkBlock = blockAfter(baseLayer, DARK_MEDIA);
const darkRoot = blockAfter(darkBlock, `${SYSTEM_DARK} {`);
const explicitDark = blockAfter(baseLayer, `${EXPLICIT_DARK} {`);
const pinkBlock = blockAfter(baseLayer, ":root[data-theme='pink'] {");
const oldBlock = blockAfter(baseLayer, ":root[data-theme='oldfashioned'] {");
const themeBlock = blockAfter(css, '@theme {');

/** `--color-x: #hex` declarations in a rule body, keyed by x. */
function colourDecls(body: string): Record<string, string> {
  const decls: Record<string, string> = {};
  for (const m of body.matchAll(/--color-([\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/g)) {
    decls[m[1]] = m[2].toLowerCase();
  }
  return decls;
}

const darkColours = colourDecls(darkRoot);
const themeColours = colourDecls(themeBlock);
const pinkColours = colourDecls(pinkBlock);
const oldColours = colourDecls(oldBlock);

/** Declarations of a rule body, comments dropped, sorted for comparison. */
function declarations(body: string): string[] {
  return body
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(';')
    .map((d) => d.trim())
    .filter((d) => d !== '')
    .sort();
}

function usedSteps(pattern: RegExp): string[] {
  const found = new Set<string>();
  for (const text of Object.values(sources)) {
    for (const m of text.matchAll(pattern)) found.add(`${m[1]}-${m[2]}`);
  }
  return [...found].sort();
}

function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function filesMatching(pattern: RegExp): string[] {
  return Object.entries(sources)
    .filter(([, text]) => pattern.test(text))
    .map(([file]) => file);
}

describe('dark palette in index.css', () => {
  it('has one prefers-color-scheme dark block in the base layer plus the custom variant', () => {
    expect(baseLayer.split('prefers-color-scheme: dark').length - 1).toBe(1);
    expect(css.split('prefers-color-scheme: dark').length - 1).toBe(2);
    expect(darkRoot).not.toBe('');
  });

  it('remaps every slate step used in src', () => {
    const missing = usedSteps(/-(slate)-(\d+)(?!\d)/g).filter((step) => !(step in darkColours));
    expect(missing).toEqual([]);
  });

  it('remaps every hue tint and dark text step used in src', () => {
    const missing = usedSteps(/-(amber|green|red|blue)-(50|100|200|300|800|900)(?!\d)/g).filter(
      (step) => !(step in darkColours),
    );
    expect(missing).toEqual([]);
  });

  it('remaps the brand tint and the semantic tokens', () => {
    const tokens = ['brand-50', 'surface', 'canvas', 'inverse', 'solid-neutral', 'scrim', 'ink', 'table-stripe'];
    expect(tokens.filter((t) => !(t in darkColours))).toEqual([]);
  });

  it('leaves white and the solid fill steps alone so button text stays white on colour', () => {
    const fills = Object.keys(darkColours).filter((t) =>
      /^(white|brand-(600|700)|(amber|green|red|blue)-(400|600|700))$/.test(t),
    );
    expect(fills).toEqual([]);
  });

  it('sets color-scheme so native controls and scrollbars follow the scheme', () => {
    expect(css).toContain('color-scheme: light dark');
  });

  it('moves discipline table colours into data-discipline rules with dark stripes', () => {
    expect(css).toContain("[data-discipline='mixed']");
    expect(css).toContain("[data-discipline='board']");
    const mixedDark = blockAfter(darkBlock, `${SYSTEM_DARK} [data-discipline='mixed'] {`);
    const boardDark = blockAfter(darkBlock, `${SYSTEM_DARK} [data-discipline='board'] {`);
    expect(mixedDark).toContain('--color-table-stripe');
    expect(boardDark).toContain('--color-table-stripe');
  });
});

describe('theme choice in index.css', () => {
  it('defines a dark custom variant that follows the chosen theme', () => {
    const variant = blockAfter(css, '@custom-variant dark {');
    for (const part of [
      "[data-theme='dark']",
      'prefers-color-scheme: dark',
      ":not([data-theme='light'])",
      ":not([data-theme='pink'])",
      ":not([data-theme='oldfashioned'])",
      '@slot',
    ]) {
      expect(variant).toContain(part);
    }
  });

  it('has an explicit dark block identical to the system dark block', () => {
    expect(explicitDark).not.toBe('');
    expect(declarations(explicitDark)).toEqual(declarations(darkRoot));
  });

  it('sets color-scheme dark in both dark blocks', () => {
    expect(explicitDark).toContain('color-scheme: dark');
    expect(darkRoot).toContain('color-scheme: dark');
  });

  it.each(['mixed', 'board'])('gives the %s discipline the same dark stripe on both paths', (discipline) => {
    const explicit = colourDecls(blockAfter(baseLayer, `${EXPLICIT_DARK} [data-discipline='${discipline}'] {`));
    const system = colourDecls(blockAfter(darkBlock, `${SYSTEM_DARK} [data-discipline='${discipline}'] {`));
    expect(explicit['table-stripe']).toBeDefined();
    expect(explicit['table-stripe']).toBe(system['table-stripe']);
  });

  it('sets dark body text on both paths', () => {
    expect(blockAfter(baseLayer, `${EXPLICIT_DARK} body {`)).toContain('color: var(--color-ink)');
    expect(blockAfter(darkBlock, `${SYSTEM_DARK} body {`)).toContain('color: var(--color-ink)');
  });

  it('excludes old fashioned wherever pink is excluded from system dark', () => {
    const pinkExclusions = css.split(":not([data-theme='pink'])").length - 1;
    const combined = css.split(":not([data-theme='pink']):not([data-theme='oldfashioned'])").length - 1;
    expect(pinkExclusions).toBeGreaterThan(0);
    expect(combined).toBe(pinkExclusions);
  });

  it('forces color-scheme light for the light choice', () => {
    expect(blockAfter(baseLayer, ":root[data-theme='light'] {")).toContain('color-scheme: light');
  });
});

describe('hot pink palette', () => {
  const ink = () => pinkColours.ink ?? themeColours.ink;

  it('is a light theme', () => {
    expect(pinkBlock).toContain('color-scheme: light');
  });

  it('defines the brand, table and background tokens', () => {
    const tokens = [
      'brand-50',
      'brand-400',
      'brand-600',
      'brand-700',
      'table-head',
      'table-stripe',
      'canvas',
      'surface',
      'slate-50',
    ];
    expect(tokens.filter((t) => !(t in pinkColours))).toEqual([]);
  });

  it.each(['brand-600', 'brand-700', 'table-head'])('keeps white text at WCAG AA on %s', (token) => {
    expect(pinkColours[token]).toBeDefined();
    expect(contrast('#ffffff', pinkColours[token])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(['canvas', 'surface', 'slate-50'])('keeps brand-600 text at WCAG AA on %s', (bg) => {
    expect(pinkColours[bg]).toBeDefined();
    expect(contrast(pinkColours['brand-600'], pinkColours[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(['canvas', 'surface'])('keeps ink at WCAG AA on %s', (bg) => {
    expect(contrast(ink(), pinkColours[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it('leaves the hue fill steps alone', () => {
    const fills = Object.keys(pinkColours).filter((t) => /^(white|(amber|green|red|blue)-(400|600|700))$/.test(t));
    expect(fills).toEqual([]);
  });
});

describe('old fashioned palette', () => {
  const backgrounds = ['canvas', 'surface', 'slate-50', 'slate-100', 'slate-200'];
  const textSteps = ['ink', 'slate-500', 'slate-600', 'slate-700', 'slate-800', 'slate-900'];

  it('is a light theme', () => {
    expect(oldBlock).toContain('color-scheme: light');
  });

  it('defines the brand, table, background and text tokens', () => {
    const tokens = [
      'brand-50',
      'brand-400',
      'brand-600',
      'brand-700',
      'table-head',
      'table-stripe',
      'canvas',
      'surface',
      'slate-50',
      'slate-100',
      'slate-200',
      ...textSteps,
    ];
    expect(tokens.filter((t) => !(t in oldColours))).toEqual([]);
  });

  it.each(['brand-600', 'brand-700', 'table-head'])('keeps white text at WCAG AA on %s', (token) => {
    expect(oldColours[token]).toBeDefined();
    expect(contrast('#ffffff', oldColours[token])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(['canvas', 'surface', 'slate-50', 'slate-100'])('keeps brand-600 text at WCAG AA on %s', (bg) => {
    expect(oldColours[bg]).toBeDefined();
    expect(contrast(oldColours['brand-600'], oldColours[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(textSteps)('keeps %s text at WCAG AA on every background', (token) => {
    expect(oldColours[token]).toBeDefined();
    const failing = backgrounds.filter((bg) => !oldColours[bg] || contrast(oldColours[token], oldColours[bg]) < 4.5);
    expect(failing).toEqual([]);
  });

  it('leaves white alone', () => {
    expect(oldColours.white).toBeUndefined();
  });

  it('keeps white text at WCAG AA on any hue fill step it mutes', () => {
    const fills = Object.keys(oldColours).filter((t) => /^(amber|green|red|blue)-(600|700)$/.test(t));
    const failing = fills.filter((t) => contrast('#ffffff', oldColours[t]) < 4.5);
    expect(failing).toEqual([]);
  });

  it.each([
    ['blue-600', '#2f5d62'],
    ['green-600', '#3d5230'],
  ])('mutes the %s discipline accent to a vintage shade', (token, shade) => {
    expect(oldColours[token]).toBe(shade);
  });

  it('keeps green-800 win text at WCAG AA on its green-100 badge', () => {
    expect(contrast(oldColours['green-800'], oldColours['green-100'])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(['solid-neutral', 'inverse'])('prints the %s fill in ink with white text at AA', (token) => {
    expect(oldColours[token]).toBeDefined();
    expect(contrast('#ffffff', oldColours[token])).toBeGreaterThanOrEqual(4.5);
  });

  it('uses an old-style serif stack at a larger base size', () => {
    expect(oldBlock).toContain("'Iowan Old Style'");
    expect(oldBlock).toContain('Palatino');
    expect(oldBlock).toContain('Georgia');
    expect(oldBlock).toContain('serif');
    expect(oldBlock).toContain('font-size: 112.5%');
  });

  it('prints in ink rather than club red', () => {
    expect(oldColours['brand-600']).toBe('#2b241c');
    expect(oldColours['table-head']).toBe('#2b241c');
  });

  it('squares off every rounded corner token', () => {
    for (const size of ['xs', 'sm', 'md', 'lg', 'xl', '2xl']) {
      expect(oldBlock).toContain(`--radius-${size}: 0;`);
    }
  });

  it.each(['blue-50', 'green-50', 'red-50'])('turns the %s discipline background into parchment', (token) => {
    expect(oldColours[token]).toBeDefined();
    expect(contrast(oldColours.ink, oldColours[token])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(oldColours['slate-500'], oldColours[token])).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ['mixed', '#2f5d62'],
    ['board', '#3d5230'],
  ])('gives %s results tables a muted vintage head', (discipline, head) => {
    const block = blockAfter(baseLayer, `:root[data-theme='oldfashioned'] [data-discipline='${discipline}'] {`);
    const colours = colourDecls(block);
    expect(colours['table-head']).toBe(head);
    expect(contrast('#ffffff', colours['table-head'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(oldColours.ink, colours['table-stripe'])).toBeGreaterThanOrEqual(4.5);
  });

  it('loads only the latin subset of the Rye display face', () => {
    expect(css).toContain('@import "@fontsource/rye/latin-400.css";');
  });

  it('sets page titles in Rye, scoped to the theme', () => {
    const titles = blockAfter(css, ":root[data-theme='oldfashioned'] h1 {");
    expect(titles).toContain("'Rye'");
  });
});

describe('dark palette contrast', () => {
  const textTokens = [
    'slate-500',
    'slate-600',
    'slate-700',
    'slate-800',
    'slate-900',
    'ink',
    'amber-800',
    'amber-900',
    'green-800',
    'red-800',
  ];

  it('keeps dark text tokens at WCAG AA on the dark surface and canvas', () => {
    const backgrounds = [darkColours.surface, darkColours.canvas];
    const failing = textTokens.flatMap((token) =>
      backgrounds
        .filter((bg) => !darkColours[token] || !bg || contrast(darkColours[token], bg) < 4.5)
        .map((bg) => `${token} on ${bg}`),
    );
    expect(failing).toEqual([]);
  });

  it('keeps brand-400 link text at WCAG AA on the dark surface and canvas', () => {
    const brand400 = themeColours['brand-400'];
    expect(brand400).toBeDefined();
    expect(contrast(brand400, darkColours.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(brand400, darkColours.canvas)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps white text at WCAG AA on the dark inverse and solid neutral fills', () => {
    expect(darkColours.inverse).toBeDefined();
    expect(darkColours['solid-neutral']).toBeDefined();
    expect(contrast('#ffffff', darkColours.inverse)).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#ffffff', darkColours['solid-neutral'])).toBeGreaterThanOrEqual(4.5);
  });
});

describe('source classes for dark mode', () => {
  it('uses bg-surface instead of bg-white', () => {
    expect(filesMatching(/(^|[\s'"`:])bg-white(?![\w-])/)).toEqual([]);
  });

  it('uses tokens instead of raw dark slate fills', () => {
    expect(filesMatching(/bg-slate-(700|800|900)(?!\d)|border-slate-700(?!\d)/)).toEqual([]);
  });

  it('gives every 600 and 700 hue text class a dark partner', () => {
    const missing: string[] = [];
    for (const [file, text] of Object.entries(sources)) {
      text.split('\n').forEach((line, i) => {
        for (const m of line.matchAll(/(?<![\w:-])((?:[\w-]+:)?)text-(brand|red|amber|green|blue)-(600|700)(?![\w-])/g)) {
          const [, variant, hue] = m;
          if (variant !== '' && variant !== 'hover:') continue;
          const partner = variant === 'hover:' ? `dark:hover:text-${hue}-400` : `dark:text-${hue}-400`;
          if (!line.includes(partner)) missing.push(`${file}:${i + 1} ${m[0]} needs ${partner}`);
        }
      });
    }
    expect(missing).toEqual([]);
  });
});

describe('theme-color in index.html', () => {
  it('uses club red in light mode', () => {
    expect(html).toMatch(
      /<meta name="theme-color" media="\(prefers-color-scheme: light\)" content="#d72d28" \/>/,
    );
  });

  it('uses the dark canvas in dark mode', () => {
    expect(html).toMatch(
      /<meta name="theme-color" media="\(prefers-color-scheme: dark\)" content="#1b1d22" \/>/,
    );
  });
});
