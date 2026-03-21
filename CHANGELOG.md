# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.7.0] - 2026-03-20

### Changed

- Regenerated proto stubs with OpenTelemetry trace context fields
- Bumped version for CI/CD improvements (OIDC trusted publishing)

## [0.6.0] - 2026-03-20

### Added

- MCP Tool ↔ A2A Skill mapping (`mcpToolToSkill`, `skillToMcpTool`, `mcpToolsToAgentCard`)
- W3C DID extensions: `did:dns` support and verifiable credentials fields on `AgentCard`
- `did:web` ↔ URL conversion (`didWebToUrl`, `urlToDidWeb`) with validation
- Postinstall script for automatic daemon binary download

## [0.5.0] - 2026-03-19

### Added

- ANP interoperability fields on `AgentCard` (`supportedTransports`, `relayAddresses`)
- DHT-based discovery via `Node.discover()` with tag filtering
- Streaming task update subscription (`subscribeTaskUpdates`)

## [0.4.0] - 2026-03-19

### Added

- Discovery API with tag-based filtering (`GrpcClient.discover()`)
- DID support: `did:key` conversion (`peerIdToDIDKey`, `didKeyToPeerId`)
- `did:web` field on `AgentCard` P2P extension
- Card serialization helpers (`agentCardToDict`, `agentCardFromDict`)

## [0.3.0] - 2026-03-18

### Added

- `Node` class — manages daemon lifecycle and gRPC communication
- `GrpcClient` — full gRPC client with proto/SDK type converters and error mapping
- `AgentCard` and `Skill` interfaces with JSON serialization
- `TaskHandle` for tracking outgoing tasks with `wait()` and `cancel()`
- `IncomingTask` for receiving and responding to tasks
- `DaemonManager` for auto-downloading and managing the daemon binary
- `peerIdToDIDKey` / `didKeyToPeerId` — W3C DID interoperability
- `mcpToolToSkill` / `skillToMcpTool` — MCP Tool mapping
- Full exception hierarchy (18 classes)
- CI pipeline with proto freshness check and multi-version test matrix (Node 18/20/22)

[0.7.0]: https://github.com/AgentAnycast/agentanycast-ts/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/AgentAnycast/agentanycast-ts/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/AgentAnycast/agentanycast-ts/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/AgentAnycast/agentanycast-ts/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/AgentAnycast/agentanycast-ts/releases/tag/v0.3.0
