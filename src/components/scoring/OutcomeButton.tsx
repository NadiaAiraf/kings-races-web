import { clsx } from 'clsx';
import type { RaceOutcome } from '../../domain/types';

const OUTCOME_STYLES: Record<RaceOutcome, { active: string; inactive: string }> = {
  win:  { active: 'bg-green-600 text-white ring-2 ring-green-300', inactive: 'bg-slate-100 text-slate-600' },
  loss: { active: 'bg-amber-600 text-white ring-2 ring-amber-300', inactive: 'bg-slate-100 text-slate-600' },
  dsq:  { active: 'bg-red-600 text-white ring-2 ring-red-300',     inactive: 'bg-slate-100 text-slate-600' },
};

const LABELS: Record<RaceOutcome, string> = { win: 'Win', loss: 'Loss', dsq: 'DSQ' };

interface OutcomeButtonProps {
  outcome: RaceOutcome;
  selected: boolean;
  disabled?: boolean;
  onSelect: (outcome: RaceOutcome) => void;
}

export function OutcomeButton({ outcome, selected, disabled, onSelect }: OutcomeButtonProps) {
  const styles = OUTCOME_STYLES[outcome];
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onSelect(outcome)}
      className={clsx(
        'h-16 flex-1 font-semibold text-base rounded-lg',
        'focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
        selected ? styles.active : styles.inactive,
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      {LABELS[outcome]}
    </button>
  );
}
