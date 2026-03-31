import { useState, useCallback } from 'react';
import type { DisciplineKey } from '../../domain/types';
import { useDisciplineState } from '../../hooks/useDisciplineState';
import { useEventStore } from '../../store/eventStore';
import { assignSlots } from '../../domain/assignSlots';
import { getValidTeamCountRange } from '../../domain/validation';
import { TeamInput } from './TeamInput';
import { TeamList } from './TeamList';
import { Toast } from '../shared/Toast';
import { ConfirmButton } from '../shared/ConfirmButton';

interface TeamEntryViewProps {
  discipline: DisciplineKey;
}

export function TeamEntryView({ discipline }: TeamEntryViewProps) {
  const { teams, teamCount, scores } = useDisciplineState(discipline);
  const setTeams = useEventStore((s) => s.setTeams);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { max } = getValidTeamCountRange(discipline);
  const atLimit = teamCount >= max;
  const hasScores = scores.length > 0;

  const validationError = atLimit
    ? `Maximum ${max} teams for ${discipline}`
    : undefined;

  const label = discipline.charAt(0).toUpperCase() + discipline.slice(1);

  const handleAdd = useCallback(
    (name: string) => {
      if (atLimit) return;
      const allNames = [...teams.map((t) => t.name), name];
      const newTeams = assignSlots(allNames);
      setTeams(discipline, newTeams);
    },
    [teams, atLimit, discipline, setTeams]
  );

  const handleDelete = useCallback(
    (slot: number) => {
      if (hasScores) return;
      const removed = teams.find((t) => t.slot === slot);
      const remainingNames = teams
        .filter((t) => t.slot !== slot)
        .map((t) => t.name);
      const newTeams = assignSlots(remainingNames);
      setTeams(discipline, newTeams);
      if (removed) {
        setToastMessage(`Removed: ${removed.name}`);
      }
    },
    [teams, hasScores, discipline, setTeams]
  );

  const resetDiscipline = useEventStore((s) => s.resetDiscipline);

  const handleReset = useCallback(() => {
    resetDiscipline(discipline);
  }, [discipline, resetDiscipline]);

  return (
    <div className="flex flex-col gap-4">
      <TeamInput
        onAdd={handleAdd}
        disabled={atLimit || hasScores}
        error={validationError}
        existingNames={teams.map((t) => t.name)}
      />
      <p className="text-sm text-slate-500">{teamCount} teams entered</p>
      {teamCount < 4 && teamCount > 0 && (
        <p className="text-sm text-amber-600">Minimum 4 teams required</p>
      )}
      <TeamList
        teams={teams}
        onDelete={hasScores ? () => {} : handleDelete}
      />
      {teamCount > 0 && (
        <ConfirmButton
          label={`Reset ${label}`}
          confirmLabel="Confirm Reset?"
          onConfirm={handleReset}
        />
      )}
      {toastMessage && (
        <Toast
          message={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
