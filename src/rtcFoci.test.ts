import { describe, expect, it } from 'vitest';
import { getLivekitTransports, RTC_FOCI_WELL_KNOWN_KEY, type RtcFociDiscovery } from './rtcFoci.js';

const discovery = (foci: unknown): RtcFociDiscovery =>
  ({ [RTC_FOCI_WELL_KNOWN_KEY]: foci }) as RtcFociDiscovery;

const livekit = { type: 'livekit', livekit_service_url: 'https://sfu.example' };

describe('getLivekitTransports', () => {
  it('returns nothing when autodiscovery advertised no foci', () => {
    expect(getLivekitTransports(undefined)).toEqual([]);
    expect(getLivekitTransports(discovery(undefined))).toEqual([]);
  });

  it('returns nothing when the field is not a list', () => {
    expect(getLivekitTransports(discovery({ type: 'livekit' }))).toEqual([]);
    expect(getLivekitTransports(discovery('livekit'))).toEqual([]);
  });

  it('keeps the advertised order so the first entry stays preferred', () => {
    const second = { type: 'livekit', livekit_service_url: 'https://second.example' };

    expect(getLivekitTransports(discovery([livekit, second]))).toEqual([livekit, second]);
  });

  // Well-known is untrusted input, so a malformed entry must not reach a caller
  // that will read livekit_service_url off it.
  it('drops entries that are not usable LiveKit transports', () => {
    expect(
      getLivekitTransports(
        discovery([
          null,
          'livekit',
          { type: 'jitsi', livekit_service_url: 'https://sfu.example' },
          { type: 'livekit' },
          { type: 'livekit', livekit_service_url: 42 },
          livekit,
        ])
      )
    ).toEqual([livekit]);
  });
});
