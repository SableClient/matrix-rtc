import type { MatrixClient } from 'matrix-js-sdk/lib/client.js';
import type { Room } from 'matrix-js-sdk/lib/models/room.js';
import {
  joinAndProvisionMatrixRTC,
  leaveMatrixRTCOnPageHide,
  type MatrixRTCJoinProvisionOptions,
  type MatrixRTCJoinProvisionResult,
} from './matrixRtcCallLifecycle.js';

/**
 * Everything a join installs that a teardown has to undo. Engines release these
 * themselves: the web lane only after LiveKit disconnects, the native lane up
 * front.
 */
export type CallSessionHandles = {
  /** True once `joinRTCSession` was called, so a membership may need leaving. */
  joinStarted: boolean;
  cancelMembershipWait?: () => void;
  removePageHideListener?: () => void;
  unsubscribeCallRoom?: () => void;
};

export const createCallSessionHandles = (): CallSessionHandles => ({ joinStarted: false });

/**
 * MSC4143 requires MatrixRTC encryption in an encrypted room and forbids it
 * otherwise, so nothing but the room's encryption state may decide this.
 */
export const callEncryptsMedia = (room: Room): boolean => room.hasEncryptionStateEvent();

/** Joining a running call must not ring again: whoever started it already did. */
export const isCallOngoing = (mx: MatrixClient, room: Room): boolean =>
  mx.matrixRTC.getRoomSession(room).memberships.length > 0;

/** The join, minus everything this module derives or wires up itself. */
export type CallSessionJoinOptions = Omit<
  MatrixRTCJoinProvisionOptions,
  | 'notificationType'
  | 'manageMediaKeys'
  | 'onMembershipWait'
  | 'onCallRoomSubscribed'
  | 'onJoinStarted'
> & {
  /** A DM rings; a room only notifies. */
  dm: boolean;
  /** A call that is already running was announced by whoever started it. */
  ongoing: boolean;
  encryptMedia: boolean;
};

/**
 * Join MatrixRTC and provision an SFU token, recording what the join installed
 * in `handles`. Both engines run this identically.
 */
export const joinCallSession = (
  { dm, ongoing, encryptMedia, ...join }: CallSessionJoinOptions,
  handles: CallSessionHandles
): Promise<MatrixRTCJoinProvisionResult> =>
  joinAndProvisionMatrixRTC({
    ...join,
    ...(ongoing ? {} : { notificationType: dm ? 'ring' : 'notification' }),
    manageMediaKeys: encryptMedia,
    onMembershipWait: (cancel) => {
      handles.cancelMembershipWait = cancel;
    },
    onCallRoomSubscribed: (unsubscribe) => {
      handles.unsubscribeCallRoom = unsubscribe;
    },
    onJoinStarted: () => {
      handles.joinStarted = true;
      handles.removePageHideListener = leaveMatrixRTCOnPageHide(join.session);
    },
  });
