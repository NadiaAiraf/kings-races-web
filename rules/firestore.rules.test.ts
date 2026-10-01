import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { buildNewEventDoc } from '../src/events/eventDoc';

const APPROVED_UID = 'official-1';
const UNAPPROVED_UID = 'stranger-1';
const EVENT_ID = 'event-1';

let testEnv: RulesTestEnvironment;

const serverTimestamp = () => firebase.firestore.FieldValue.serverTimestamp();

// Firestore shape of a discipline (see FirestoreDiscipline in eventDoc.ts).
const emptyDiscipline = () => ({ teams: [], phase: 'setup', scores: {}, manualTiebreaks: {} });

// The exact payload the app sends when creating an event.
const newEvent = (createdBy: string) =>
  buildNewEventDoc({ name: 'Round 1', date: '2026-11-14' }, createdBy, serverTimestamp);

const anonDb = () => testEnv.unauthenticatedContext().firestore();
const approvedDb = () => testEnv.authenticatedContext(APPROVED_UID).firestore();
const unapprovedDb = () => testEnv.authenticatedContext(UNAPPROVED_UID).firestore();

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-kings-races',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc(`approvedUsers/${APPROVED_UID}`).set({ note: 'race official' });
    await db.doc(`events/${EVENT_ID}`).set({
      ...newEvent(APPROVED_UID),
      createdAt: new Date('2026-11-01'),
      updatedAt: new Date('2026-11-01'),
    });
  });
});

describe('events: anonymous user', () => {
  it('can read an event', async () => {
    await assertSucceeds(anonDb().doc(`events/${EVENT_ID}`).get());
  });

  it('can list events', async () => {
    await assertSucceeds(anonDb().collection('events').orderBy('date', 'desc').limit(40).get());
  });

  it('cannot list events without a limit', async () => {
    await assertFails(anonDb().collection('events').orderBy('date', 'desc').get());
  });

  it('cannot list more than 40 events at once', async () => {
    await assertFails(anonDb().collection('events').orderBy('date', 'desc').limit(41).get());
  });

  it('cannot create an event', async () => {
    await assertFails(anonDb().collection('events').add(newEvent('anyone')));
  });

  it('cannot update an event', async () => {
    await assertFails(
      anonDb().doc(`events/${EVENT_ID}`).update({ name: 'Hacked', updatedAt: serverTimestamp() })
    );
  });

  it('cannot delete an event', async () => {
    await assertFails(anonDb().doc(`events/${EVENT_ID}`).delete());
  });
});

describe('events: signed-in user who is not approved', () => {
  it('can read an event', async () => {
    await assertSucceeds(unapprovedDb().doc(`events/${EVENT_ID}`).get());
  });

  it('cannot create an event', async () => {
    await assertFails(unapprovedDb().collection('events').add(newEvent(UNAPPROVED_UID)));
  });

  it('cannot update a discipline', async () => {
    await assertFails(
      unapprovedDb()
        .doc(`events/${EVENT_ID}`)
        .update({ 'disciplines.mixed': emptyDiscipline(), updatedAt: serverTimestamp() })
    );
  });
});

describe('events: approved user', () => {
  it('can create an event as themselves', async () => {
    await assertSucceeds(approvedDb().collection('events').add(newEvent(APPROVED_UID)));
  });

  it('cannot create an event attributed to someone else', async () => {
    await assertFails(approvedDb().collection('events').add(newEvent(UNAPPROVED_UID)));
  });

  it('cannot create an event with a client-chosen createdAt', async () => {
    await assertFails(
      approvedDb()
        .collection('events')
        .add({ ...newEvent(APPROVED_UID), createdAt: new Date('2020-01-01') })
    );
  });

  it('cannot create an event with an empty name', async () => {
    await assertFails(
      approvedDb().collection('events').add({ ...newEvent(APPROVED_UID), name: '' })
    );
  });

  it('cannot create an event with unexpected fields', async () => {
    await assertFails(
      approvedDb().collection('events').add({ ...newEvent(APPROVED_UID), admin: true })
    );
  });

  it('can update a single discipline', async () => {
    await assertSucceeds(
      approvedDb()
        .doc(`events/${EVENT_ID}`)
        .update({
          'disciplines.board': { ...emptyDiscipline(), phase: 'group-stage' },
          updatedAt: serverTimestamp(),
        })
    );
  });

  it('cannot change createdBy', async () => {
    await assertFails(
      approvedDb()
        .doc(`events/${EVENT_ID}`)
        .update({ createdBy: 'someone-else', updatedAt: serverTimestamp() })
    );
  });

  it('cannot add an unknown discipline', async () => {
    await assertFails(
      approvedDb()
        .doc(`events/${EVENT_ID}`)
        .update({ 'disciplines.snowboard': emptyDiscipline(), updatedAt: serverTimestamp() })
    );
  });

  it('cannot delete an event', async () => {
    await assertFails(approvedDb().doc(`events/${EVENT_ID}`).delete());
  });
});

describe('events: approved user field-level scoring', () => {
  const eventDoc = () => approvedDb().doc(`events/${EVENT_ID}`);
  const score = {
    raceId: 'r1-1',
    homeSlot: 1,
    awaySlot: 2,
    homeOutcome: 'win',
    awayOutcome: 'loss',
  };

  it('can write a single score field', async () => {
    await assertSucceeds(
      eventDoc().update(
        new firebase.firestore.FieldPath('disciplines', 'mixed', 'scores', 'r1-1'),
        score,
        'updatedAt',
        serverTimestamp()
      )
    );
  });

  it('can write only the phase field', async () => {
    await assertSucceeds(
      eventDoc().update({ 'disciplines.mixed.phase': 'round-two', updatedAt: serverTimestamp() })
    );
  });

  it('cannot set an unknown phase', async () => {
    await assertFails(
      eventDoc().update({ 'disciplines.mixed.phase': 'semi-finals', updatedAt: serverTimestamp() })
    );
  });

  it('cannot store more than 32 teams in a discipline', async () => {
    const teams = Array.from({ length: 33 }, (_, i) => ({ slot: i + 1, name: `Team ${i + 1}` }));
    await assertFails(
      eventDoc().update({ 'disciplines.mixed.teams': teams, updatedAt: serverTimestamp() })
    );
  });

  it('cannot add unknown fields to a discipline', async () => {
    await assertFails(
      eventDoc().update({ 'disciplines.mixed.teamCount': 4, updatedAt: serverTimestamp() })
    );
  });
});

describe('events: field-level write shapes the app sends', () => {
  const FieldPath = firebase.firestore.FieldPath;
  const FieldValue = firebase.firestore.FieldValue;
  const eventDoc = () => approvedDb().doc(`events/${EVENT_ID}`);
  const score = { raceId: 'r1-1', homeSlot: 1, awaySlot: 2, homeOutcome: 'win', awayOutcome: 'loss' };
  const teams = [
    { slot: 1, name: 'Kings' },
    { slot: 2, name: 'Imperial' },
  ];

  const seedScoredMixed = () =>
    testEnv.withSecurityRulesDisabled((ctx) =>
      ctx
        .firestore()
        .doc(`events/${EVENT_ID}`)
        .update({ 'disciplines.mixed.teams': teams, 'disciplines.mixed.scores': { 'r1-1': score } })
    );

  it('can clear a score with deleteField', async () => {
    await seedScoredMixed();
    await assertSucceeds(
      eventDoc().update(
        new FieldPath('disciplines', 'mixed', 'scores', 'r1-1'),
        FieldValue.delete(),
        'updatedAt',
        serverTimestamp()
      )
    );
  });

  it('can write a single tiebreak field', async () => {
    await assertSucceeds(
      eventDoc().update(
        new FieldPath('disciplines', 'mixed', 'manualTiebreaks', 'A'),
        [2, 1],
        'updatedAt',
        serverTimestamp()
      )
    );
  });

  it('can reset a scored discipline by replacing it whole', async () => {
    await seedScoredMixed();
    await assertSucceeds(
      eventDoc().update({ 'disciplines.mixed': emptyDiscipline(), updatedAt: serverTimestamp() })
    );
  });

  it('can store exactly 32 teams', async () => {
    const many = Array.from({ length: 32 }, (_, i) => ({ slot: i + 1, name: `Team ${i + 1}` }));
    await assertSucceeds(
      eventDoc().update({ 'disciplines.mixed.teams': many, updatedAt: serverTimestamp() })
    );
  });

  it('cannot change teams while the discipline has scores', async () => {
    await seedScoredMixed();
    await assertFails(
      eventDoc().update({ 'disciplines.mixed.teams': [teams[0]], updatedAt: serverTimestamp() })
    );
  });

  it('cannot delete a whole discipline', async () => {
    await assertFails(
      eventDoc().update({ 'disciplines.mixed': FieldValue.delete(), updatedAt: serverTimestamp() })
    );
  });

  it('cannot store scores as a list', async () => {
    await assertFails(
      eventDoc().update({ 'disciplines.mixed.scores': [score], updatedAt: serverTimestamp() })
    );
  });

  it('cannot write without stamping updatedAt', async () => {
    await assertFails(eventDoc().update({ 'disciplines.mixed.phase': 'round-two' }));
  });

  it('rejects a field-level score write from an unapproved user', async () => {
    await assertFails(
      unapprovedDb()
        .doc(`events/${EVENT_ID}`)
        .update(new FieldPath('disciplines', 'mixed', 'scores', 'r1-1'), score, 'updatedAt', serverTimestamp())
    );
  });
});

describe('events: create validation', () => {
  it('rejects a create with a malformed discipline', async () => {
    const event = newEvent(APPROVED_UID);
    await assertFails(
      approvedDb()
        .collection('events')
        .add({ ...event, disciplines: { ...event.disciplines, mixed: { teams: [], phase: 'setup', scores: [] } } })
    );
  });

  it('rejects a create without disciplines', async () => {
    const { disciplines: _omit, ...withoutDisciplines } = newEvent(APPROVED_UID);
    void _omit;
    await assertFails(approvedDb().collection('events').add(withoutDisciplines));
  });

  it('rejects a create with a client-chosen updatedAt', async () => {
    await assertFails(
      approvedDb().collection('events').add({ ...newEvent(APPROVED_UID), updatedAt: new Date() })
    );
  });

  it('rejects a create with an impossible date', async () => {
    await assertFails(
      approvedDb().collection('events').add({ ...newEvent(APPROVED_UID), date: '2026-13-01' })
    );
  });
});

describe('events: approved user update validation', () => {
  const eventDoc = () => approvedDb().doc(`events/${EVENT_ID}`);

  it('cannot set a client-chosen updatedAt', async () => {
    await assertFails(eventDoc().update({ name: 'Round 1b', updatedAt: new Date('2020-01-01') }));
  });

  it('cannot change createdAt', async () => {
    await assertFails(
      eventDoc().update({ createdAt: new Date('2020-01-01'), updatedAt: serverTimestamp() })
    );
  });

  it('cannot set an invalid date', async () => {
    await assertFails(eventDoc().update({ date: '2026-13-45', updatedAt: serverTimestamp() }));
  });

  it('cannot set a name over 100 characters', async () => {
    await assertFails(eventDoc().update({ name: 'x'.repeat(101), updatedAt: serverTimestamp() }));
  });

  it('can rename an event', async () => {
    await assertSucceeds(eventDoc().update({ name: 'Round 1 - Hemel', updatedAt: serverTimestamp() }));
  });
});

describe('approvedUsers', () => {
  it('lets a user read their own approval doc', async () => {
    await assertSucceeds(approvedDb().doc(`approvedUsers/${APPROVED_UID}`).get());
  });

  it('lets an unapproved user check their own (missing) approval doc', async () => {
    await assertSucceeds(unapprovedDb().doc(`approvedUsers/${UNAPPROVED_UID}`).get());
  });

  it("does not let a user read someone else's approval doc", async () => {
    await assertFails(unapprovedDb().doc(`approvedUsers/${APPROVED_UID}`).get());
  });

  it('does not let a signed-in user list who is approved', async () => {
    await assertFails(unapprovedDb().collection('approvedUsers').get());
  });

  it('does not let an approved user list who is approved', async () => {
    await assertFails(approvedDb().collection('approvedUsers').get());
  });

  it('does not let an anonymous user read approval docs', async () => {
    await assertFails(anonDb().doc(`approvedUsers/${APPROVED_UID}`).get());
  });

  it('does not let a user approve themselves', async () => {
    await assertFails(unapprovedDb().doc(`approvedUsers/${UNAPPROVED_UID}`).set({}));
  });

  it('does not let an approved user write approval docs', async () => {
    await assertFails(approvedDb().doc(`approvedUsers/${UNAPPROVED_UID}`).set({}));
  });

  it('does not let an approved user remove their approval doc', async () => {
    await assertFails(approvedDb().doc(`approvedUsers/${APPROVED_UID}`).delete());
  });
});
