import { createPortal } from 'react-dom';
import { useEventInfo } from '../../events/eventInfo';
import { printDisciplineLetter, type PrintRow } from '../../domain/printRaceList';

export interface PrintSheetRow {
  /** Combined race key ("discipline:raceId"), or a unique key for a gap row. */
  key: string;
  row: PrintRow;
}

interface PrintRaceSheetProps {
  /** Round label, e.g. "Round 1". */
  roundLabel: string;
  rows: readonly PrintSheetRow[];
}

/**
 * A plain black-on-white race list, hidden on screen and shown in place of the
 * app when printed (see `.print-race-sheet` in index.css). Rendered into
 * document.body so the print CSS can hide #root around it. Columns follow the
 * cheat sheet: running number, discipline letter, home team, V, away team.
 */
export function PrintRaceSheet({ roundLabel, rows }: PrintRaceSheetProps) {
  const event = useEventInfo();
  const title = event?.name ? `${event.name} - ${roundLabel}` : roundLabel;

  return createPortal(
    <div className="print-race-sheet" data-testid="print-race-sheet">
      <table>
        <colgroup>
          <col className="print-col-box" />
          <col className="print-col-box" />
          <col className="print-col-team" />
          <col className="print-col-box" />
          <col className="print-col-team" />
        </colgroup>
        {/* The page has no margin, so the browser prints no URL or date; the
            header and footer repeat on every page and stand in for the margin. */}
        <thead>
          <tr>
            <th colSpan={5} className="print-title">
              <h1>{title}</h1>
            </th>
          </tr>
        </thead>
        <tfoot aria-hidden="true">
          <tr>
            <td colSpan={5} className="print-page-foot" />
          </tr>
        </tfoot>
        <tbody>
          {rows.map(({ key, row }) =>
            row.kind === 'gap' ? (
              <tr key={key} data-print-gap aria-hidden="true">
                <td colSpan={5}>&nbsp;</td>
              </tr>
            ) : (
              <tr key={key} data-print-key={key}>
                <td className="print-box print-order">{row.order}</td>
                <td className="print-box">{printDisciplineLetter(row.discipline)}</td>
                <td className="print-team">{row.homeTeamName}</td>
                <td className="print-box">V</td>
                <td className="print-team print-team-away">{row.awayTeamName}</td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>,
    document.body,
  );
}
