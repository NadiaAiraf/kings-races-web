import type { Team } from '../../domain/types';

interface TeamRowProps {
  team: Team;
  index: number;
  onDelete?: (slot: number) => void;
  /** Omitted when the team cannot move that way (first/last, or locked). */
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const MOVE_BUTTON =
  'min-h-11 min-w-11 flex items-center justify-center text-lg text-slate-500 disabled:opacity-20';

export function TeamRow({ team, index, onDelete, onMoveUp, onMoveDown }: TeamRowProps) {
  const canMove = Boolean(onMoveUp || onMoveDown);
  return (
    <div className="flex items-center min-h-12 border-b border-slate-200">
      <span className="flex-1 text-base text-slate-900">
        {index + 1}. {team.name}
      </span>
      {canMove && (
        <>
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!onMoveUp}
            aria-label={`Move ${team.name} up`}
            className={MOVE_BUTTON}
          >
            {'↑'}
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!onMoveDown}
            aria-label={`Move ${team.name} down`}
            className={MOVE_BUTTON}
          >
            {'↓'}
          </button>
        </>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(team.slot)}
          aria-label={`Remove ${team.name}`}
          className="min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-red-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      )}
    </div>
  );
}
