import type { Team } from '../../domain/types';
import { TeamRow } from './TeamRow';

interface TeamListProps {
  teams: Team[];
  onDelete: (slot: number) => void;
}

export function TeamList({ teams, onDelete }: TeamListProps) {
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
        />
      ))}
    </div>
  );
}
