import type { LivekitTransportConfig } from 'matrix-js-sdk/lib/matrixrtc/LivekitTransport.js';

/**
 * The `.well-known` key MSC4143 advertises SFUs under. matrix-js-sdk models the
 * membership side of MSC4143 but not autodiscovery, so there is no SDK constant
 * to use here.
 */
export const RTC_FOCI_WELL_KNOWN_KEY = 'org.matrix.msc4143.rtc_foci';

export type RtcFociDiscovery = {
  [K in typeof RTC_FOCI_WELL_KNOWN_KEY]?: LivekitTransportConfig[];
};

export const getLivekitTransports = (
  discovery: RtcFociDiscovery | undefined
): LivekitTransportConfig[] => {
  const foci = discovery?.[RTC_FOCI_WELL_KNOWN_KEY];
  if (!Array.isArray(foci)) return [];

  return foci.filter(
    (focus): focus is LivekitTransportConfig =>
      typeof focus === 'object' &&
      focus !== null &&
      focus.type === 'livekit' &&
      typeof focus.livekit_service_url === 'string'
  );
};
