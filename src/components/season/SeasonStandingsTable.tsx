import type { SeasonStandingRow } from '../../seasons/seasonStandings';
import { MAX_ROUNDS } from '../../seasons/seasons';

const ROUND_NUMBERS = Array.from({ length: MAX_ROUNDS }, (_, i) => i + 1);

interface SeasonStandingsTableProps {
  rows: SeasonStandingRow[];
}

/** League table for one discipline: points per round (place below) and total. */
export function SeasonStandingsTable({ rows }: SeasonStandingsTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-4 text-center">
        No finished rounds yet. Points appear once a round's finals are all scored.
      </p>
    );
  }

  return (
    <table className="w-full table-fixed text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-slate-500">
          <th scope="col" className="w-8 px-1 py-2 text-left font-semibold">
            #
          </th>
          <th scope="col" className="px-1 py-2 text-left font-semibold">
            Team
          </th>
          {ROUND_NUMBERS.map((n) => (
            <th key={n} scope="col" className="w-9 px-1 py-2 text-right font-semibold">
              R{n}
            </th>
          ))}
          <th scope="col" className="w-11 px-1 py-2 text-right font-semibold">
            Total
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={row.key} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
            <td className="px-1 py-2 font-mono text-slate-700">{index + 1}</td>
            <td className="px-1 py-2 text-slate-900 truncate">{row.name}</td>
            {ROUND_NUMBERS.map((n) => {
              const result = row.results[n];
              return (
                <td key={n} className="px-1 py-2 text-right font-mono text-slate-700">
                  {result ? (
                    <>
                      <span className="block">{result.points}</span>
                      <span className="block text-xs text-slate-400">
                        {result.place === null ? '?' : `${result.place}`}
                      </span>
                    </>
                  ) : (
                    '-'
                  )}
                </td>
              );
            })}
            <td className="px-1 py-2 text-right font-mono font-semibold text-slate-900">
              {row.total}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
