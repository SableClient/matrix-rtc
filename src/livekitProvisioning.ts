import { getLivekitTransports, type RtcFociDiscovery } from './rtcFoci.js';
import type { IOpenIDToken, MatrixClient } from 'matrix-js-sdk/lib/client.js';
import type { LivekitTransportConfig } from 'matrix-js-sdk/lib/matrixrtc/LivekitTransport.js';
import type { Transport } from 'matrix-js-sdk/lib/matrixrtc/types.js';
import { buildProvisioningRequest, type CallProvisioningRequest } from './callProtocol.js';

export type LivekitProvisioningOptions = {
  mx: Pick<MatrixClient, 'getOpenIdToken'>;
  roomId: string;
  userId: string;
  deviceId: string;
  memberId: string;
  slotId: string;
  stickyMemberships: boolean;
  serviceUrl: string;
  /** Injected: a Tauri or Electron host routes through its own transport. */
  request: typeof fetch;
};

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

export type LivekitProvisioningResult = {
  url: string;
  jwt: string;
};

export const isLivekitTransportConfig = (
  transport: Transport
): transport is LivekitTransportConfig =>
  transport.type === 'livekit' && typeof transport.livekit_service_url === 'string';

const isProvisioningResult = (value: unknown): value is LivekitProvisioningResult =>
  typeof value === 'object' &&
  value !== null &&
  'url' in value &&
  typeof value.url === 'string' &&
  value.url.length > 0 &&
  'jwt' in value &&
  typeof value.jwt === 'string' &&
  value.jwt.length > 0;

export const getPreferredLivekitTransport = async (
  mx: Pick<MatrixClient, '_unstable_getRTCTransports'>,
  discovery?: RtcFociDiscovery
): Promise<LivekitTransportConfig | undefined> => {
  const transports = await mx['_unstable_getRTCTransports']().catch(() => undefined);
  const livekitTransport = transports?.find(isLivekitTransportConfig);
  if (livekitTransport) return livekitTransport;

  return getLivekitTransports(discovery)[0];
};

const requestLivekitToken = async (
  { url, body }: CallProvisioningRequest,
  request: typeof fetch
): Promise<LivekitProvisioningResult> => {
  const response = await request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (response.status < 200 || response.status >= 300) {
    const error: Error & { status?: number } = new Error(
      `LiveKit provisioning request failed with status ${response.status}`
    );
    error.status = response.status;
    throw error;
  }

  const data = (await response.json()) as unknown;

  if (!isProvisioningResult(data)) {
    throw new Error('LiveKit provisioning response was invalid');
  }

  return { url: data.url, jwt: data.jwt };
};

export const provisionLivekitToken = async ({
  mx,
  roomId,
  userId,
  deviceId,
  memberId,
  slotId,
  stickyMemberships,
  serviceUrl,
  request,
}: LivekitProvisioningOptions): Promise<LivekitProvisioningResult> => {
  let openidToken: IOpenIDToken;
  try {
    openidToken = await mx.getOpenIdToken();
  } catch {
    throw new Error('Unable to obtain an OpenID token for LiveKit provisioning');
  }

  const endpoint = trimTrailingSlash(serviceUrl);
  const inputs = {
    serviceUrl: endpoint,
    roomId,
    userId,
    deviceId,
    memberId,
    slotId,
    openidToken,
  };

  try {
    return await requestLivekitToken(buildProvisioningRequest(inputs, stickyMemberships), request);
  } catch (error) {
    // Report which SFU refused us and with what status, since that separates a
    // dead transport advertised by another participant from a rejected token.
    // Never forward the underlying message or cause: the request body carries
    // the OpenID token and the response carries the issued JWT.
    const status = (error as { status?: number } | null)?.status;
    // oxlint-disable-next-line preserve-caught-error -- attaching the cause leaks the tokens
    throw new Error(
      status === undefined
        ? `LiveKit token provisioning failed against ${endpoint}`
        : `LiveKit token provisioning failed against ${endpoint} with status ${status}`
    );
  }
};
