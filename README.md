# @sableclient/matrixrtc

Engine-agnostic MatrixRTC call logic: the MSC4143 session protocol, media-key
distribution, LiveKit key-ring management and the notification/decline handling
that sits around a call. No UI, no app state, no framework.

Extracted from [Sable](https://github.com/SableClient/Sable) so the same call
core can back a web client, a Tauri desktop build and a native mobile transport.

## Install

```sh
pnpm add @sableclient/matrixrtc
```

Both SDKs are peer dependencies: the host owns their versions and their
singletons:

```sh
pnpm add matrix-js-sdk livekit-client
```

## The seam

`CallTransport` is the boundary between call logic and the media stack. On the web
that is an in-page `livekit-client` `Room`; on mobile it is the native LiveKit SDK
behind IPC. Everything above the seam is written once.

```ts
import type { CallTransport } from '@sableclient/matrixrtc';
```

## Media keys

`callKeyPipeline` is the only subscriber to the session's `EncryptionKeyChanged`,
so there is exactly one place a key can be lost. It feeds
`LivekitMatrixKeyProvider`, which turns those keys into LiveKit key-ring entries.

```ts
import { createCallKeyPipeline, LivekitMatrixKeyProvider } from '@sableclient/matrixrtc';

const provider = new LivekitMatrixKeyProvider();
const pipeline = createCallKeyPipeline();
pipeline.setOnKey(provider.setKey);
pipeline.attach(session, { userId, deviceId });
```

Key indices are slots in a per-participant ring, not sequence numbers: they are
reused modulo 256 and a peer that rejoins restarts at 0. Carry them through
untouched, because filtering on them strands every frame encrypted with a dropped key.

Subpath imports are exported too, for contexts that must keep their import
graph narrow (a service worker cannot pull in the runtime Matrix SDK):

```ts
import { normalizeCallIntent } from '@sableclient/matrixrtc/callIntent';
```

## Diagnostics

Nothing is logged until a host installs a sink, so the package never owns a
transport, a buffer or a crash reporter:

```ts
import { setLogSink } from '@sableclient/matrixrtc';

setLogSink((namespace, level, category, message, data) => {
  myLogger[level](`${namespace}: ${message}`, data);
});
```

## Consumers must bundle

`matrix-js-sdk` ships ESM directory imports that Node's own resolver rejects, so
this package is consumed through a bundler (Vite, webpack, rollup) rather than
loaded directly by Node. That is an upstream constraint, not a choice here: the
same workaround appears in the SDK's own test setup and in Sable's Vitest config:

```ts
resolve: {
  alias: {
    'matrix-js-sdk/lib': path.resolve('node_modules/matrix-js-sdk/lib'),
    'matrix-js-sdk': path.resolve('node_modules/matrix-js-sdk/lib/matrix.js'),
  },
},
test: { server: { deps: { inline: [/matrix-js-sdk\/lib\//] } } },
```

## What is deliberately not here

- Anything that renders. Layout, controls and device pickers stay in the host.
- App state. No jotai, no React, no store — the lint config forbids them.
- Session join/leave orchestration, LiveKit token provisioning and the engine
  controllers. Those still reach for host singletons (a call-ownership lease, a
  sliding-sync manager, the host's `fetch`) and move here once those are
  inverted into injected dependencies.

## Scripts

```sh
pnpm typecheck    # tsc, no emit
pnpm test         # vitest
pnpm lint         # oxlint
pnpm fmt:check    # oxfmt
pnpm build        # tsc -> dist (ESM + declarations)
```

## License

AGPL-3.0-only, matching Sable.
