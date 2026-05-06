// Test the draft lifecycle through the store: create via composer, close
// without sending → saved, resume → reopens with state, delete → removed.

import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store';
import { mockMails } from '../mockData';

function fresh() {
  // Reset everything that could carry over between tests.
  useStore.setState({
    drafts: [],
    composeOpen: false,
    composeDraft: null,
  });
  localStorage.clear();
}

describe('drafts lifecycle', () => {
  beforeEach(fresh);

  it('saves a draft when closing composer with content', () => {
    const s = useStore.getState();
    s.openCompose();
    useStore.getState().updateDraft({ subject: 'WIP', body: 'hello' });
    useStore.getState().closeCompose();
    const drafts = useStore.getState().drafts;
    expect(drafts).toHaveLength(1);
    expect(drafts[0]?.subject).toBe('WIP');
    expect(drafts[0]?.body).toBe('hello');
  });

  it('does not save a fully empty draft', () => {
    const s = useStore.getState();
    s.openCompose();
    s.closeCompose();
    expect(useStore.getState().drafts).toHaveLength(0);
  });

  it('persists drafts to localStorage', () => {
    const s = useStore.getState();
    s.openCompose();
    useStore.getState().updateDraft({ subject: 'Persisted' });
    useStore.getState().closeCompose();
    const raw = localStorage.getItem('teddy-mail-drafts-v1');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw ?? '[]');
    expect(parsed[0].subject).toBe('Persisted');
  });

  it('resumeDraft pulls draft out of list and into composer', () => {
    const s = useStore.getState();
    s.openCompose();
    useStore.getState().updateDraft({ subject: 'Resume me' });
    useStore.getState().closeCompose();
    const draftId = useStore.getState().drafts[0]?.id;
    expect(draftId).toBeTruthy();

    useStore.getState().resumeDraft(draftId!);
    const after = useStore.getState();
    expect(after.composeOpen).toBe(true);
    expect(after.composeDraft?.subject).toBe('Resume me');
    expect(after.drafts).toHaveLength(0);
  });

  it('deleteDraft removes from list and persists', () => {
    const s = useStore.getState();
    s.openCompose();
    useStore.getState().updateDraft({ body: 'Doomed' });
    useStore.getState().closeCompose();
    const id = useStore.getState().drafts[0]?.id;
    useStore.getState().deleteDraft(id!);
    expect(useStore.getState().drafts).toHaveLength(0);
    const raw = localStorage.getItem('teddy-mail-drafts-v1');
    expect(JSON.parse(raw ?? '[]')).toHaveLength(0);
  });

  it('reply opens composer pre-filled, saves on close', () => {
    const someMail = mockMails[0]!;
    useStore.getState().openCompose(someMail);
    expect(useStore.getState().composeOpen).toBe(true);
    expect(useStore.getState().composeDraft?.to[0]?.email).toBe(someMail.from.email);
    expect(useStore.getState().composeDraft?.subject.startsWith('Re:')).toBe(true);
    useStore.getState().closeCompose();
    expect(useStore.getState().drafts).toHaveLength(1);
  });
});
