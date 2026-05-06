// Undo Send manager. Buffers outgoing mails for a configurable window
// before actually handing them off to the SMTP/JMAP layer.
const inflight = new Map();
/**
 * Schedule a send with an undo window. Returns the SendRequest immediately;
 * the actual transmission only happens after the window unless cancel() is
 * called first.
 */
export function scheduleSend(draftId, payload, windowSeconds, doSend) {
    let resolveOuter = () => { };
    let rejectOuter = () => { };
    const promise = new Promise((res, rej) => {
        resolveOuter = res;
        rejectOuter = rej;
    });
    const scheduledAt = new Date(Date.now() + windowSeconds * 1000);
    const entry = {
        request: {
            draftId,
            scheduledAt,
            payload,
            promise,
            cancel: () => cancel(draftId),
        },
        timer: setTimeout(() => {
            doSend(payload).then(() => {
                entry.resolve();
                inflight.delete(draftId);
            }, (err) => {
                entry.reject(err);
                inflight.delete(draftId);
            });
        }, windowSeconds * 1000),
        resolve: resolveOuter,
        reject: rejectOuter,
        cancelled: false,
    };
    inflight.set(draftId, entry);
    return entry.request;
}
export function cancel(draftId) {
    const e = inflight.get(draftId);
    if (!e)
        return false;
    clearTimeout(e.timer);
    e.cancelled = true;
    e.reject(new Error('cancelled'));
    inflight.delete(draftId);
    return true;
}
export function listPending() {
    return Array.from(inflight.values()).map(({ request }) => ({
        draftId: request.draftId,
        scheduledAt: request.scheduledAt.toISOString(),
        cancellable: true,
    }));
}
