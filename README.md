# AgentAnycast TypeScript SDK

**Build P2P agents in TypeScript.** Discover, communicate, and collaborate with AI agents across any network -- encrypted, decentralized, NAT-traversing.

[![npm](https://img.shields.io/npm/v/agentanycast?color=3178C6)](https://www.npmjs.com/package/agentanycast)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue)](LICENSE)

```bash
npm install agentanycast
```

## Quick Start

**Create an agent:**

```typescript
import { Node, type AgentCard } from "agentanycast";

const card: AgentCard = {
  name: "EchoAgent",
  description: "Echoes back any message",
  skills: [{ id: "echo", description: "Echo the input" }],
};

const node = new Node({ card });
await node.start();
console.log(`Agent running — Peer ID: ${node.peerId}`);

node.onTask(async (task) => {
  const text = task.messages.at(-1)?.parts[0]?.text ?? "";
  await task.complete([{ parts: [{ text: `Echo: ${text}` }] }]);
});

await node.serveForever();
```

**Send a task to another agent:**

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

## Three Ways to Send a Task

```typescript
// Direct — by Peer ID
await node.sendTask(message, { peerId: "12D3KooW..." });

// Anycast — by skill (relay resolves the target)
await node.sendTask(message, { skill: "translate" });

// HTTP Bridge — to standard HTTP A2A agents
await node.sendTask(message, { url: "https://agent.example.com" });
```

## How It Works

```
┌─────────────┐         mDNS / Relay         ┌─────────────┐
│  Agent A    │<------------------------------>│  Agent B    │
│  (Node.js)  │     E2E encrypted (Noise)     │  (Python)   │
└──────┬──────┘                               └──────┬──────┘
       | gRPC                                        | gRPC
┌──────┴──────┐                               ┌──────┴──────┐
│  Daemon A   │<---------- libp2p ------------>│  Daemon B   │
│  (Go)       │   Noise_XX + Yamux + QUIC     │  (Go)       │
└─────────────┘                               └─────────────┘
```

TypeScript and Python agents interoperate seamlessly -- same daemon, same protocol, same network.

- **LAN** -- agents discover each other via mDNS. Zero configuration.
- **WAN** -- deploy a [self-hosted relay](https://github.com/AgentAnycast/agentanycast-relay) and point agents to it.
- The Go daemon is **auto-downloaded on `npm install`**. No manual setup required.

## Skill Discovery

```typescript
const agents = await node.discover("translate");
const frenchAgents = await node.discover("translate", { tags: { lang: "fr" } });
```

## Interoperability

```typescript
// W3C DID
import { peerIdToDIDKey, didKeyToPeerId } from "agentanycast";
import { didWebToUrl, urlToDidWeb } from "agentanycast";

// MCP Tool <-> A2A Skill mapping
import { mcpToolsToAgentCard, mcpToolToSkill, skillToMcpTool } from "agentanycast";
```

## API Reference

### Node

| Method | Description |
|---|---|
| `new Node(options)` | Create a node with an `AgentCard` and optional config |
| `start()` | Launch daemon, connect gRPC, register card |
| `stop()` | Stop daemon and clean up |
| `sendTask(message, target)` | Send a task by `peerId`, `skill`, or `url` |
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
  skills: Skill[];
  // Read-only (populated by daemon):
  peerId?: string;
  didKey?: string;       // W3C did:key
  didWeb?: string;       // did:web identifier
  didDns?: string;       // did:dns identifier
}
```

### Key Features

| | |
|---|---|
| **End-to-end encrypted** | Noise_XX protocol, no plaintext path |
| **NAT traversal** | Automatic hole-punching with relay fallback |
| **Anycast routing** | Send tasks by skill, not by address |
| **HTTP Bridge** | Reach standard HTTP A2A agents from P2P |
| **DID support** | W3C `did:key`, `did:web`, `did:dns` identity |
| **MCP interop** | Bidirectional MCP Tool <-> A2A Skill mapping |
| **Cross-language** | Interoperates with Python agents on the same network |

## Development

```bash
npm install                  # Install deps (auto-downloads daemon)
npm run build                # Compile TypeScript -> dist/
npm test                     # Run tests (vitest)
npm run lint                 # Lint (eslint)
npm run clean                # Remove dist/
```

Set `AGENTANYCAST_SKIP_DOWNLOAD=1` to skip daemon download during install (e.g., when building from source).

## Requirements

- Node.js 18+
- The [agentanycastd](https://github.com/AgentAnycast/agentanycast-node) daemon (auto-downloaded on `npm install`)

## License

[Apache License, Version 2.0](LICENSE)
