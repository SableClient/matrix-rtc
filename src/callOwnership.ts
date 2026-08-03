export type CallOwnerLease = {
  kind: string;
  roomId: string;
  release: () => void;
};

/** Injected: a module singleton in a library is per-bundle-copy, not per-app. */
export type AcquireCallOwner = (kind: string, roomId: string) => CallOwnerLease | undefined;

export type CallOwnership = {
  acquire: AcquireCallOwner;
  getActive: () => Pick<CallOwnerLease, 'kind' | 'roomId'> | undefined;
  release: (kind: string, roomId: string) => void;
  reset: () => void;
};

/** A single-slot implementation, for hosts that have no policy of their own. */
export const createCallOwnership = (): CallOwnership => {
  let active: CallOwnerLease | undefined;

  const acquire: AcquireCallOwner = (kind, roomId) => {
    if (active) return undefined;

    let released = false;
    const lease: CallOwnerLease = {
      kind,
      roomId,
      release: () => {
        if (released || active !== lease) return;
        released = true;
        active = undefined;
      },
    };
    active = lease;
    return lease;
  };

  return {
    acquire,
    getActive: () => active,
    release: (kind, roomId) => {
      if (active?.kind === kind && active.roomId === roomId) active.release();
    },
    reset: () => {
      active = undefined;
    },
  };
};
