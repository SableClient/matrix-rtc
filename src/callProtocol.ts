import type { IOpenIDToken, MatrixClient } from 'matrix-js-sdk/lib/client.js';
import {
  UNSTABLE_MSC4140_DELAYED_EVENTS,
  UNSTABLE_MSC4354_STICKY_EVENTS,
} from 'matrix-js-sdk/lib/client.js';
import type { LivekitTransportConfig } from 'matrix-js-sdk/lib/matrixrtc/LivekitTransport.js';

export const callMemberId = (userId: string, deviceId: string): string => `${userId}:${deviceId}`;

/**
 * Membership format for MatrixRTC. It also picks the JWT endpoint, because the
 * two cannot be chosen independently: `/get_token` grants a LiveKit identity
 * hashed from the sticky membership, `/sfu/get` grants `${userId}:${deviceId}`,
 * and LiveKit binds E2EE keys strictly to the identity the JWT carries. Pairing
 * them wrongly connects the call and fills the roster while decrypting nothing.
 *
 * Sticky memberships need MSC4354 for the `m.rtc.member` format itself and
 * MSC4140 to retract it when the client dies, so both are required. A server
 * that advertises neither, or a `/versions` request that fails, stays legacy.
 */
export const supportsStickyMemberships = async (
  mx: Pick<MatrixClient, 'doesServerSupportUnstableFeature'>
): Promise<boolean> => {
  try {
    const [sticky, delayed] = await Promise.all([
      mx.doesServerSupportUnstableFeature(UNSTABLE_MSC4354_STICKY_EVENTS),
      mx.doesServerSupportUnstableFeature(UNSTABLE_MSC4140_DELAYED_EVENTS),
    ]);
    return sticky && delayed;
  } catch {
    return false;
  }
};

/**
 * Element Call builds that predate Matrix 2.0 read `livekit_alias` off the
 * advertised transport, so `legacy-livekit` keeps carrying it.
 */
export const advertiseCallTransport = (
  transport: LivekitTransportConfig,
  roomId: string
): LivekitTransportConfig => ({ livekit_alias: roomId, ...transport });

export type CallProvisioningBody =
  | { room_id: string; slot_id: string; openid_token: IOpenIDToken; member: CallProvisioningMember }
  | { room: string; openid_token: IOpenIDToken; device_id: string };

export type CallProvisioningMember = {
  id: string;
  claimed_user_id: string;
  claimed_device_id: string;
};

export type CallProvisioningRequest = {
  url: string;
  body: CallProvisioningBody;
};

export type CallProvisioningInputs = {
  serviceUrl: string;
  roomId: string;
  userId: string;
  deviceId: string;
  memberId: string;
  slotId: string;
  openidToken: IOpenIDToken;
};

export const buildStickyProvisioningRequest = ({
  serviceUrl,
  roomId,
  userId,
  deviceId,
  memberId,
  slotId,
  openidToken,
}: CallProvisioningInputs): CallProvisioningRequest => ({
  url: `${serviceUrl}/get_token`,
  body: {
    room_id: roomId,
    slot_id: slotId,
    openid_token: openidToken,
    member: { id: memberId, claimed_user_id: userId, claimed_device_id: deviceId },
  },
});

export const buildLegacyProvisioningRequest = ({
  serviceUrl,
  roomId,
  deviceId,
  openidToken,
}: CallProvisioningInputs): CallProvisioningRequest => ({
  url: `${serviceUrl}/sfu/get`,
  body: { room: roomId, openid_token: openidToken, device_id: deviceId },
});

export const buildProvisioningRequest = (
  inputs: CallProvisioningInputs,
  stickyMemberships: boolean
): CallProvisioningRequest =>
  stickyMemberships
    ? buildStickyProvisioningRequest(inputs)
    : buildLegacyProvisioningRequest(inputs);
