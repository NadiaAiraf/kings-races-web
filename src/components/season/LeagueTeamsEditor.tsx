import { useState } from 'react';
import { MAX_LEAGUE_TEAMS, newTeamNames, validateNewTeamNames } from '../../seasons/leagueTeams';

interface LeagueTeamsEditorProps {
  names: string[];
  canEdit: boolean;
  onAdd: (names: string[]) => void;
  onRemove: (name: string) => void;
}

/**
 * The league's teams for one discipline this season. It can list more than
 * a round's 31 teams; officials tick who is racing when they enter a round.
 */
export function LeagueTeamsEditor({ names, canEdit, onAdd, onRemove }: LeagueTeamsEditorProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    const added = newTeamNames(text, names);
    const validationError = validateNewTeamNames(added, names);
    if (validationError) {
      setError(validationError);
      return;
    }
    onAdd(added);
    setText('');
    setError(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-base font-semibold text-slate-900">League teams ({names.length})</h3>
      {names.length === 0 ? (
        <p className="text-sm text-slate-500">
          No teams listed yet.{canEdit && ' Add the league’s teams to pick from when entering a round.'}
        </p>
      ) : (
        <ul className="bg-white border border-slate-200 rounded-lg">
          {names.map((name) => (
            <li key={name} className="flex items-center min-h-12 px-3 border-b border-slate-100 last:border-b-0">
              <span className="flex-1 text-base text-slate-900">{name}</span>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onRemove(name)}
                  aria-label={`Remove ${name}`}
                  className="min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-red-600"
                >
                  {'×'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canEdit && names.length < MAX_LEAGUE_TEAMS && (
        <>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
            Add teams, one per line
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder={'Kings 1\nUCL 1'}
              className="text-base font-normal px-3 py-2 border border-slate-200 rounded-lg"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={handleAdd}
            className="min-h-12 rounded-lg bg-blue-600 text-white font-semibold"
          >
            Add teams
          </button>
        </>
      )}
    </div>
  );
}
