import { clsx } from 'clsx';
import { useCanEdit } from '../../auth/editAccess';
import { useRaceOrder } from '../../events/raceOrder';
import { RACE_ORDER_LABELS, RACE_ORDER_OPTIONS } from '../../domain/combinedRaceOrder';

/**
 * The order the All races list runs Round 1 and Round 2 in. Approved users
 * pick it; everyone else sees it as text. It changes the display and
 * auto-advance order only, never scores.
 */
export function RaceOrderPicker() {
  const { order, setOrder } = useRaceOrder();
  const canEdit = useCanEdit();

  if (!canEdit || !setOrder) {
    return <p className="text-sm text-slate-600 px-4 py-2">Race order: {RACE_ORDER_LABELS[order]}</p>;
  }

  return (
    <div role="radiogroup" aria-label="Race order" className="flex rounded-sm overflow-hidden">
      {RACE_ORDER_OPTIONS.map((option) => {
        const checked = option === order;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => {
              if (!checked) setOrder(option);
            }}
            className={clsx(
              'min-h-[44px] flex-1 px-3 text-sm font-semibold',
              'focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
              checked ? 'bg-brand-600 text-white' : 'bg-surface text-slate-700 border border-slate-300',
            )}
          >
            {RACE_ORDER_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}
