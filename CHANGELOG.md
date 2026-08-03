# Changelog

All notable changes to this package are documented here. This project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.0 (unreleased)

Initial extraction from Sable.

### Added

- `CallTransport`: the seam between call logic and the media stack.
- MSC4143 session protocol helpers and LiveKit token provisioning request
  building (`callProtocol`).
- Media-key distribution (`callKeyPipeline`) and the LiveKit key-ring provider it
  feeds (`livekitMatrixKeyProvider`).
- Call-start capability and incoming-call blocker evaluation.
- RTC notification and decline parsing, call intents, and signalling decryption.
- An injectable log sink so the host owns diagnostics.
