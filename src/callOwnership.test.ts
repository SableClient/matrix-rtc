import { describe, expect, it } from 'vitest';
import { createCallOwnership } from './callOwnership.js';

describe('createCallOwnership', () => {
  it('grants the first caller and refuses the next', () => {
    const ownership = createCallOwnership();

    expect(ownership.acquire('livekit-js', '!a:example.org')).toBeDefined();
    expect(ownership.acquire('livekit-mobile', '!b:example.org')).toBeUndefined();
  });

  it('grants again once the lease is released', () => {
    const ownership = createCallOwnership();
    const lease = ownership.acquire('livekit-js', '!a:example.org');

    lease?.release();

    expect(ownership.acquire('livekit-mobile', '!b:example.org')).toBeDefined();
  });

  it('ignores a second release so it cannot free someone else’s lease', () => {
    const ownership = createCallOwnership();
    const first = ownership.acquire('livekit-js', '!a:example.org');
    first?.release();
    const second = ownership.acquire('livekit-mobile', '!b:example.org');

    first?.release();

    expect(ownership.getActive()).toMatchObject({
      kind: 'livekit-mobile',
      roomId: '!b:example.org',
    });
    expect(second).toBeDefined();
  });

  it('releases by kind and room only when both match', () => {
    const ownership = createCallOwnership();
    ownership.acquire('livekit-js', '!a:example.org');

    ownership.release('livekit-js', '!other:example.org');
    expect(ownership.getActive()).toBeDefined();

    ownership.release('livekit-js', '!a:example.org');
    expect(ownership.getActive()).toBeUndefined();
  });

  it('reports no owner after a reset', () => {
    const ownership = createCallOwnership();
    ownership.acquire('livekit-js', '!a:example.org');

    ownership.reset();

    expect(ownership.getActive()).toBeUndefined();
    expect(ownership.acquire('livekit-js', '!a:example.org')).toBeDefined();
  });

  it('keeps separate instances independent', () => {
    const first = createCallOwnership();
    const second = createCallOwnership();

    first.acquire('livekit-js', '!a:example.org');

    expect(second.acquire('livekit-js', '!a:example.org')).toBeDefined();
  });
});
