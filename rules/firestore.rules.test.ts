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

const APPROVED_UID = 'official-1';
const UNAPPROVED_UID = 'stranger-1';
const EVENT_ID = 'event-1';

let testEnv: RulesTestEnvironment;

const serverTimestamp = () => firebase.firestore.FieldValue.serverTimestamp();

const emptyDiscipline = () => ({
  teams: [],
  teamCount: 0,
  phase: 'setup',
  scores: [],
  manualTiebreaks: {},
});

const newEvent = (createdBy: string) => ({
  name: 'Round 1',
  date: '2026-11-14',
  createdBy,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  disciplines: { mixed: emptyDiscipline(), board: emptyDiscipline(), ladies: emptyDiscipline() },
});

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
    await assertSucceeds(anonDb().collection('events').orderBy('date', 'desc').get());
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
