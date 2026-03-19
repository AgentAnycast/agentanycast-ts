# AgentAnycast TypeScript SDK

TypeScript/JavaScript SDK for AgentAnycast -- decentralized A2A agent-to-agent communication over P2P.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue)](LICENSE)

> **AgentAnycast is fully decentralized.** On a local network, it works with zero configuration. For cross-network communication, just deploy your own relay with a single command.

## Installation

```bash
npm install agentanycast
```

The daemon binary is automatically downloaded on install. Skip with `AGENTANYCAST_SKIP_DOWNLOAD=1` if building from source.

## How It Works

```
┌─────────────┐         mDNS / Relay         ┌─────────────┐
│  Agent A    │◄──────────────────────────────►│  Agent B    │
│  (Node.js)  │     E2E encrypted (Noise)     │  (Python)   │
└──────┬──────┘                               └──────┬──────┘
       │ gRPC                                        │ gRPC
┌──────┴──────┐                               ┌──────┴──────┐
│  Daemon A   │◄──────── libp2p ──────────────►│  Daemon B   │
│  (Go)       │   Noise_XX + Yamux + QUIC     │  (Go)       │
└─────────────┘                               └─────────────┘
```

TypeScript and Python agents interoperate seamlessly -- they share the same daemon and protocol.

## Quick Start

### Server Agent

```typescript
import { Node, type AgentCard } from "agentanycast";

const card: AgentCard = {
  name: "EchoAgent",
  description: "Echoes back any message",
  skills: [{ id: "echo", description: "Echo the input" }],
};

const node = new Node({ card });
await node.start();
console.log(`Peer ID: ${node.peerId}`);

node.onTask(async (task) => {
  const text = task.messages.at(-1)?.parts[0]?.text ?? "";
  await task.complete([{ parts: [{ text: `Echo: ${text}` }] }]);
});

await node.serveForever();
```

### Client Agent

```typescript
const node = new Node({ card, home: "/tmp/agentanycast-client" });
await node.start();

const handle = await node.sendTask(
  { role: "user", parts: [{ text: "Hello!" }] },
  { peerId: "12D3KooW..." },
);

const result = await handle.wait(30_000);
console.log(result.artifacts[0].parts[0].text); // "Echo: Hello!"

await node.stop();
```

### Three Ways to Send a Task

```typescript
await node.sendTask(message, { peerId: "12D3KooW..." });             // direct
await node.sendTask(message, { skill: "translate" });                 // by skill
await node.sendTask(message, { url: "https://agent.example.com" });   // HTTP bridge
```

### Skill Discovery

```typescript
const agents = await node.discover("translate");
const frenchAgents = await node.discover("translate", { tags: { lang: "fr" } });
```

## Features

- **End-to-end encrypted** — All communication uses the Noise_XX protocol
- **NAT traversal** — Automatic hole-punching with relay fallback
- **Anycast routing** — Send tasks by skill, not by address
- **HTTP Bridge** — Reach standard HTTP A2A agents from P2P
- **DHT discovery** — Decentralized agent discovery via Kademlia DHT
- **DID support** — W3C `did:key`, `did:web`, and `did:dns` identity
- **MCP interop** — Bidirectional MCP Tool ↔ A2A Skill mapping
- **Sidecar architecture** — Go daemon handles networking; SDK communicates via gRPC

## API Reference

### Node

| Method | Description |
|---|---|
| `new Node(options)` | Create a node with an `AgentCard` and optional config |
| `start()` | Launch daemon, connect gRPC, register card |
| `stop()` | Stop daemon and clean up |
| `sendTask(message, target)` | Send a task (by `peerId`, `skill`, or `url`) |
| `getCard(peerId)` | Fetch a remote agent's card |
| `discover(skill, options?)` | Find agents by skill with optional tag filtering |
| `onTask(handler)` | Register handler for incoming tasks |
| `serveForever()` | Block until stopped, processing incoming tasks |

### AgentCard

```typescript
interface AgentCard {
  name: string;
  description?: string;
  version?: string;
  protocolVersion?: string;
  skills: Skill[];
  // Read-only (populated by daemon):
  peerId?: string;
  supportedTransports?: string[];
  relayAddresses?: string[];
  didKey?: string;                    // W3C did:key
  didWeb?: string;                    // did:web identifier
  didDns?: string;                    // did:dns identifier
  verifiableCredentials?: string[];   // JSON-encoded VCs
}
```

### Interoperability

```typescript
import { peerIdToDIDKey, didKeyToPeerId } from "agentanycast";
import { didWebToUrl, urlToDidWeb } from "agentanycast";
import { mcpToolsToAgentCard, mcpToolToSkill, skillToMcpTool } from "agentanycast";
```

## Development

```bash
npm install                          # Install deps (AGENTANYCAST_SKIP_DOWNLOAD=1 to skip daemon)
npm run build                        # Compile TypeScript
npm test                             # Run tests (vitest)
npm run lint                         # Lint (eslint)
```

## Requirements

- Node.js 18+
- The [agentanycastd](https://github.com/AgentAnycast/agentanycast-node) daemon (auto-downloaded on install, or build from source)

## License

[Apache License, Version 2.0](LICENSE)
