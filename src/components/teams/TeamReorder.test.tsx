import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { EditAccessContext } from '../../auth/editAccess';
import { useEventStore } from '../../store/eventStore';
import { assignSlots } from '../../domain/assignSlots';
import { TeamEntryView } from './TeamEntryView';

const store = () => useEventStore.getState();
const names = () => store().disciplines.mixed.teams.map((t) => t.name);

function renderEntry(canEdit: boolean) {
  return render(
    <EditAccessContext.Provider value={canEdit}>
      <TeamEntryView discipline="mixed" />
    </EditAccessContext.Provider>
  );
}

describe('reordering entered teams', () => {
  beforeEach(() => {
    store().resetEvent();
    store().setTeams('mixed', assignSlots(['Kings', 'UCL', 'LSE', 'Bath']));
  });

  afterEach(() => cleanup());

  it('moves a team up the seeding', () => {
    renderEntry(true);
    fireEvent.click(screen.getByLabelText('Move LSE up'));
    expect(names()).toEqual(['Kings', 'LSE', 'UCL', 'Bath']);
  });

  it('moves a team down the seeding', () => {
    renderEntry(true);
    fireEvent.click(screen.getByLabelText('Move Kings down'));
    expect(names()).toEqual(['UCL', 'Kings', 'LSE', 'Bath']);
  });

  it('re-slots teams so the new order is the seeding', () => {
    renderEntry(true);
    fireEvent.click(screen.getByLabelText('Move Bath up'));
    expect(store().disciplines.mixed.teams).toEqual(assignSlots(['Kings', 'UCL', 'Bath', 'LSE']));
  });

  it('cannot move the top team up or the bottom team down', () => {
    renderEntry(true);
    expect((screen.getByLabelText('Move Kings up') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText('Move Bath down') as HTMLButtonElement).disabled).toBe(true);
  });

  it('locks the order once a result is recorded', () => {
    const [home, away] = store().disciplines.mixed.teams;
    store().recordResult('mixed', {
      raceId: 'r1-1',
      homeSlot: home.slot,
      awaySlot: away.slot,
      homeOutcome: 'win',
      awayOutcome: 'loss',
    });
    renderEntry(true);
    expect(screen.queryByLabelText('Move LSE up')).toBeNull();
  });

  it('does not offer reordering to viewers', () => {
    renderEntry(false);
    expect(screen.queryByLabelText('Move LSE up')).toBeNull();
  });
});
