import type { IOpenIDToken } from 'matrix-js-sdk/lib/client.js';
import type { LivekitTransportConfig } from 'matrix-js-sdk/lib/matrixrtc/LivekitTransport.js';

export const callMemberId = (userId: string, deviceId: string): string => `${userId}:${deviceId}`;

/**
 * Element Call builds that predate Matrix 2.0 read `livekit_alias` off the
 * advertised transport, so `legacy-livekit` keeps carrying it.
 */
export const advertiseCallTransport = (
  transport: LivekitTransportConfig,
  roomId: string
): LivekitTransportConfig => ({ livekit_alias: roomId, ...transport });

export type CallProvisioningRequest = {
  url: string;
  body: { room: string; openid_token: IOpenIDToken; device_id: string };
};

export type CallProvisioningInputs = {
  serviceUrl: string;
  roomId: string;
  deviceId: string;
  openidToken: IOpenIDToken;
};

export const buildProvisioningRequest = ({
  serviceUrl,
  roomId,
  deviceId,
  openidToken,
}: CallProvisioningInputs): CallProvisioningRequest => ({
  url: `${serviceUrl}/sfu/get`,
  body: { room: roomId, openid_token: openidToken, device_id: deviceId },
});
