// Undo Send manager. Buffers outgoing mails for a configurable window
// before actually handing them off to the SMTP/JMAP layer.

import type { PendingSend } from '@/types';

export interface SendRequest {
  draftId: string;
  scheduledAt: Date;
  payload: unknown;
  // Resolved when the actual send happens (or rejected if cancelled).
  promise: Promise<void>;
  cancel: () => void;
}

interface InternalEntry {
  request: SendRequest;
  timer: ReturnType<typeof setTimeout>;
  resolve: () => void;
  reject: (reason: unknown) => void;
  cancelled: boolean;
}

const inflight = new Map<string, InternalEntry>();

/**
 * Schedule a send with an undo window. Returns the SendRequest immediately;
 * the actual transmission only happens after the window unless cancel() is
 * called first.
 */
export function scheduleSend(
  draftId: string,
  payload: unknown,
  windowSeconds: number,
  doSend: (payload: unknown) => Promise<void>,
): SendRequest {
  let resolveOuter: () => void = () => {};
  let rejectOuter: (reason: unknown) => void = () => {};
  const promise = new Promise<void>((res, rej) => {
    resolveOuter = res;
    rejectOuter = rej;
  });

  const scheduledAt = new Date(Date.now() + windowSeconds * 1000);

  const entry: InternalEntry = {
    request: {
      draftId,
      scheduledAt,
      payload,
      promise,
      cancel: () => cancel(draftId),
    },
    timer: setTimeout(() => {
      doSend(payload).then(
        () => {
          entry.resolve();
          inflight.delete(draftId);
        },
        (err) => {
          entry.reject(err);
          inflight.delete(draftId);
        },
      );
    }, windowSeconds * 1000),
    resolve: resolveOuter,
    reject: rejectOuter,
    cancelled: false,
  };
  inflight.set(draftId, entry);
  return entry.request;
}

export function cancel(draftId: string): boolean {
  const e = inflight.get(draftId);
  if (!e) return false;
  clearTimeout(e.timer);
  e.cancelled = true;
  e.reject(new Error('cancelled'));
  inflight.delete(draftId);
  return true;
}

export function listPending(): PendingSend[] {
  return Array.from(inflight.values()).map(({ request }) => ({
    draftId: request.draftId,
    scheduledAt: request.scheduledAt.toISOString(),
    cancellable: true,
  }));
}
