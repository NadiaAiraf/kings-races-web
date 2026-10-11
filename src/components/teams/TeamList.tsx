import type { Team } from '../../domain/types';
import { TeamRow } from './TeamRow';

interface TeamListProps {
  teams: Team[];
  onDelete?: (slot: number) => void;
  /** Move the team at `index` one place up (-1) or down (+1) the seeding. */
  onMove?: (index: number, direction: -1 | 1) => void;
}

export function TeamList({ teams, onDelete, onMove }: TeamListProps) {
  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <h3 className="text-lg font-semibold text-slate-900">No teams yet</h3>
        <p className="text-sm text-slate-500">
          Enter team names to generate the race schedule.
        </p>
      </div>
    );
  }

  return (
    <div>
      {teams.map((team, index) => (
        <TeamRow
          key={team.slot}
          team={team}
          index={index}
          onDelete={onDelete}
          onMoveUp={onMove && index > 0 ? () => onMove(index, -1) : undefined}
          onMoveDown={onMove && index < teams.length - 1 ? () => onMove(index, 1) : undefined}
        />
      ))}
    </div>
  );
}
