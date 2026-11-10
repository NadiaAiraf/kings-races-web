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

const darkBlock = blockAfter(css, DARK_MEDIA);
const darkRoot = blockAfter(darkBlock, ':root {');
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
  it('has exactly one prefers-color-scheme dark block', () => {
    expect(css.split('prefers-color-scheme: dark').length - 1).toBe(1);
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
    const mixedDark = blockAfter(darkBlock, "[data-discipline='mixed'] {");
    const boardDark = blockAfter(darkBlock, "[data-discipline='board'] {");
    expect(mixedDark).toContain('--color-table-stripe');
    expect(boardDark).toContain('--color-table-stripe');
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
