import { useState } from 'react';
import { useLocation } from 'react-router';
import {
  THEME_CHOICES,
  applyThemeChoice,
  readThemeChoice,
  writeThemeChoice,
  type ThemeChoice,
} from '../lib/theme';
import { PageHeader, PageLayout } from './PageLayout';

const THEME_TEXT: Record<ThemeChoice, { name: string; description: string }> = {
  system: { name: 'System', description: "Match this phone's light or dark setting." },
  light: { name: 'Light', description: 'Always light, best in bright sun.' },
  dark: { name: 'Dark', description: 'Always the soft dark theme.' },
  pink: { name: 'Hot pink', description: 'Just for fun.' },
};

function backPath(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from;
  return typeof from === 'string' && from.startsWith('/') ? from : '/';
}

export function OptionsPage() {
  const location = useLocation();
  const backTo = backPath(location.state);
  const [current, setCurrent] = useState<ThemeChoice>(readThemeChoice);

  function select(choice: ThemeChoice) {
    writeThemeChoice(choice);
    applyThemeChoice(choice);
    setCurrent(choice);
  }

  return (
    <PageLayout>
      <PageHeader title="Options" backTo={backTo} backLabel="Back" />
      <main className="flex-1 px-4 py-4">
        <fieldset>
          <legend className="text-sm font-semibold text-slate-700 mb-2">Appearance</legend>
          <div className="flex flex-col gap-2">
            {THEME_CHOICES.map((choice) => (
              <label
                key={choice}
                className="flex items-start gap-3 rounded-sm border border-slate-200 bg-surface p-4 min-h-14 cursor-pointer has-checked:border-brand-600 has-checked:ring-2 has-checked:ring-brand-600 has-focus-visible:ring-2 has-focus-visible:ring-brand-600"
              >
                <input
                  type="radio"
                  name="theme"
                  value={choice}
                  checked={choice === current}
                  onChange={() => select(choice)}
                  className="mt-1 h-5 w-5 accent-brand-600"
                />
                <span>
                  <span className="block text-base font-semibold text-slate-900">{THEME_TEXT[choice].name}</span>
                  <span className="block text-sm text-slate-600">{THEME_TEXT[choice].description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </main>
    </PageLayout>
  );
}
