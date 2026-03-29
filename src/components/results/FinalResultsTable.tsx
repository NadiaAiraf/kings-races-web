import type { DisciplineKey } from '../../domain/types';
import type { FinalResult } from '../../domain/csvExport';

interface FinalResultsTableProps {
  discipline: DisciplineKey;
  results: FinalResult[];
}

const DISCIPLINE_DISPLAY: Record<DisciplineKey, string> = {
  mixed: 'Mixed',
  board: 'Board',
  ladies: 'Ladies',
};

export function FinalResultsTable({ discipline, results }: FinalResultsTableProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-3">
        Final Results: {DISCIPLINE_DISPLAY[discipline]}
      </h2>
      <table className="w-full table-auto">
        <thead>
          <tr className="border-b border-slate-200">
            <th
              scope="col"
              className="px-2 py-2 text-left text-sm font-semibold text-slate-500 w-8"
            >
              #
            </th>
            <th
              scope="col"
              className="px-2 py-2 text-left text-sm font-semibold text-slate-500"
            >
              Team
            </th>
            <th
              scope="col"
              className="px-2 py-2 text-left text-sm font-semibold text-slate-500"
            >
              Placement
            </th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr
              key={result.position}
              className={`min-h-12 ${result.position % 2 === 1 ? 'bg-white' : 'bg-slate-50'}`}
            >
              <td className="px-2 py-3 font-mono text-sm text-slate-700 w-8">
                {result.position}
              </td>
              <td className="px-2 py-3 text-base text-slate-900">
                {result.teamName}
              </td>
              <td className="px-2 py-3 text-base text-slate-700">
                {result.placementLabel}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
