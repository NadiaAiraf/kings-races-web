import { createPortal } from 'react-dom';
import { useEventInfo } from '../../events/eventInfo';
import { DISCIPLINE_LABELS } from '../../domain/csvExport';
import type { PrintRow } from '../../domain/printRaceList';

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
 * document.body so the print CSS can hide #root around it.
 */
export function PrintRaceSheet({ roundLabel, rows }: PrintRaceSheetProps) {
  const event = useEventInfo();
  const title = event?.name ? `${event.name} - ${roundLabel}` : roundLabel;

  return createPortal(
    <div className="print-race-sheet" data-testid="print-race-sheet">
      <h1>{title}</h1>
      <table>
        <colgroup>
          <col className="print-col-narrow" />
          <col className="print-col-narrow" />
          <col className="print-col-narrow" />
          <col className="print-col-team" />
          <col className="print-col-v" />
          <col className="print-col-team" />
        </colgroup>
        <tbody>
          {rows.map(({ key, row }) =>
            row.kind === 'gap' ? (
              <tr key={key} data-print-gap aria-hidden="true">
                <td colSpan={6}>&nbsp;</td>
              </tr>
            ) : (
              <tr key={key} data-print-key={key}>
                <td>{DISCIPLINE_LABELS[row.discipline]}</td>
                <td>{row.raceNum}</td>
                <td>{row.group}</td>
                <td>{row.homeTeamName}</td>
                <td className="print-v">V</td>
                <td>{row.awayTeamName}</td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>,
    document.body,
  );
}
