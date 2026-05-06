import { describe, it, expect } from 'vitest';
import { scheduleSend, cancel, listPending } from '../undoSend';

describe('undoSend', () => {
  it('actually sends after the window', async () => {
    let sent = false;
    const req = scheduleSend('d1', { foo: 1 }, 0.05, async () => {
      sent = true;
    });
    await req.promise;
    expect(sent).toBe(true);
    expect(listPending()).toHaveLength(0);
  });

  it('cancels before the window', async () => {
    let sent = false;
    const req = scheduleSend('d2', null, 0.5, async () => {
      sent = true;
    });
    expect(listPending().length).toBeGreaterThanOrEqual(1);
    cancel('d2');
    await req.promise.catch(() => {
      // expected
    });
    expect(sent).toBe(false);
  });
});
