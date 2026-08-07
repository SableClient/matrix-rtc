import { describe, expect, it } from 'vitest';
import type { IOpenIDToken } from 'matrix-js-sdk/lib/client.js';
import {
  advertiseCallTransport,
  buildLegacyProvisioningRequest,
  buildProvisioningRequest,
  buildStickyProvisioningRequest,
  callMemberId,
  supportsStickyMemberships,
} from './callProtocol.js';

const openidToken: IOpenIDToken = {
  access_token: 'openid-secret',
  token_type: 'Bearer',
  matrix_server_name: 'example.org',
  expires_in: 3600,
};

const inputs = {
  serviceUrl: 'https://sfu.example',
  roomId: '!room:example.org',
  userId: '@alice:example.org',
  deviceId: 'DEVICE',
  memberId: '@alice:example.org:DEVICE',
  slotId: 'm.call#call-id',
  openidToken,
};

const client = (features: Record<string, boolean>) => ({
  doesServerSupportUnstableFeature: (feature: string) =>
    Promise.resolve(features[feature] ?? false),
});

describe('supportsStickyMemberships', () => {
  it('is true only when the server advertises both MSC4354 and MSC4140', async () => {
    await expect(
      supportsStickyMemberships(
        client({ 'org.matrix.msc4354': true, 'org.matrix.msc4140': true })
      )
    ).resolves.toBe(true);
  });

  it('stays legacy without delayed events, which retract a dead client', async () => {
    await expect(
      supportsStickyMemberships(client({ 'org.matrix.msc4354': true }))
    ).resolves.toBe(false);
  });

  it('stays legacy without the sticky event format', async () => {
    await expect(
      supportsStickyMemberships(client({ 'org.matrix.msc4140': true }))
    ).resolves.toBe(false);
  });

  it('stays legacy when the server advertises neither', async () => {
    await expect(supportsStickyMemberships(client({}))).resolves.toBe(false);
  });

  it('stays legacy when the versions request fails', async () => {
    await expect(
      supportsStickyMemberships({
        doesServerSupportUnstableFeature: () => Promise.reject(new Error('offline')),
      })
    ).resolves.toBe(false);
  });
});

describe('callProtocol', () => {
  it('derives the legacy LiveKit identity', () => {
    expect(callMemberId('@alice:example.org', 'DEVICE')).toBe('@alice:example.org:DEVICE');
  });

  it('builds the /get_token provisioning request', () => {
    const request = buildStickyProvisioningRequest(inputs);

    expect(request.url).toBe('https://sfu.example/get_token');
    expect(request.body).toEqual({
      room_id: '!room:example.org',
      slot_id: 'm.call#call-id',
      openid_token: openidToken,
      member: {
        id: '@alice:example.org:DEVICE',
        claimed_user_id: '@alice:example.org',
        claimed_device_id: 'DEVICE',
      },
    });
  });

  it('builds the legacy /sfu/get provisioning request from the same inputs', () => {
    const request = buildLegacyProvisioningRequest(inputs);

    expect(request.url).toBe('https://sfu.example/sfu/get');
    expect(request.body).toEqual({
      room: '!room:example.org',
      openid_token: openidToken,
      device_id: 'DEVICE',
    });
  });

  it('pairs the endpoint with the membership format', () => {
    expect(buildProvisioningRequest(inputs, true).url).toBe('https://sfu.example/get_token');
    expect(buildProvisioningRequest(inputs, false).url).toBe('https://sfu.example/sfu/get');
  });

  it('advertises the transport with the alias legacy Element Call reads', () => {
    expect(
      advertiseCallTransport(
        { type: 'livekit', livekit_service_url: 'https://sfu.example' },
        '!room:example.org'
      )
    ).toEqual({
      type: 'livekit',
      livekit_service_url: 'https://sfu.example',
      livekit_alias: '!room:example.org',
    });
  });

  it('lets the transport keep an alias it already advertises', () => {
    expect(
      advertiseCallTransport(
        {
          type: 'livekit',
          livekit_service_url: 'https://sfu.example',
          livekit_alias: '!other:example.org',
        },
        '!room:example.org'
      ).livekit_alias
    ).toBe('!other:example.org');
  });
});
