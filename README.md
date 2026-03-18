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

- **Local network (LAN):** Agents discover each other automatically via mDNS. No relay needed.
- **Cross-network (WAN):** Deploy your own relay server, then point agents to it.

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
import { Node, type AgentCard } from "agentanycast";

const card: AgentCard = { name: "Client", description: "Sends tasks", skills: [] };

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
// 1. Direct — by Peer ID
await node.sendTask(message, { peerId: "12D3KooW..." });

// 2. Anycast — by skill (relay resolves the target)
await node.sendTask(message, { skill: "translate" });

// 3. HTTP Bridge — to standard HTTP A2A agents
await node.sendTask(message, { url: "https://agent.example.com" });
```

### Skill Discovery

```typescript
// Find all agents offering a skill
const agents = await node.discover("translate");
for (const agent of agents) {
  console.log(`${agent.name} (${agent.peerId})`);
}

// With tag filtering
const frenchAgents = await node.discover("translate", { tags: { lang: "fr" } });
```

### Cross-Network

```bash
# On a VPS with a public IP:
git clone https://github.com/AgentAnycast/agentanycast-relay && cd agentanycast-relay
docker-compose up -d
# Note the RELAY_ADDR from the logs
```

```typescript
const node = new Node({
  card,
  relay: "/ip4/<YOUR_IP>/tcp/4001/p2p/12D3KooW...",
});
```

## Features

- **End-to-end encrypted** — All communication uses the Noise_XX protocol
- **NAT traversal** — Automatic hole-punching with relay fallback
- **Anycast routing** — Send tasks by skill, not by address
- **HTTP Bridge** — Reach standard HTTP A2A agents from P2P
- **DHT discovery** — Decentralized agent discovery via Kademlia DHT
- **DID support** — W3C `did:key` identity for cross-ecosystem interop
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

| Property | Type | Description |
|---|---|---|
| `peerId` | `string` | This node's Peer ID (after `start()`) |
| `isRunning` | `boolean` | Whether the node is running |

### Node Options

| Option | Description | Default |
|---|---|---|
| `card` | Agent's `AgentCard` | Required |
| `relay` | Relay server multiaddr | `undefined` (LAN only) |
| `keyPath` | Path to Ed25519 identity key | `<home>/key` |
| `daemonAddr` | Address of an externally managed daemon | Auto-managed |
| `daemonPath` | Path to daemon binary | Auto-download |
| `home` | Data directory for daemon state | `~/.agentanycast` |

### AgentCard & Skill

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
  didKey?: string;  // W3C did:key
}

interface Skill {
  id: string;
  description: string;
  inputSchema?: string;   // JSON Schema
  outputSchema?: string;  // JSON Schema
}
```

### TaskHandle

Returned by `sendTask()`. Tracks a remote task's progress.

| Method / Property | Description |
|---|---|
| `taskId` | Unique task identifier |
| `status` | Current `TaskStatus` |
| `artifacts` | Result artifacts |
| `wait(timeoutMs?)` | Wait for completion. Throws on failure/timeout. |
| `cancel()` | Request task cancellation |

### IncomingTask

Passed to `onTask` handlers.

| Method / Property | Description |
|---|---|
| `taskId` | Unique task identifier |
| `peerId` | Sender's Peer ID |
| `messages` | Messages from the sender |
| `targetSkillId` | Which skill the sender is targeting |
| `senderCard` | Sender's Agent Card (if available) |
| `updateStatus(status)` | Update task status (e.g., `"working"`) |
| `complete(artifacts?)` | Complete with optional artifacts |
| `fail(error)` | Fail with error message |
| `requestInput(message?)` | Request additional input from sender |

### TaskStatus

```typescript
enum TaskStatus {
  SUBMITTED = "submitted",
  WORKING = "working",
  INPUT_REQUIRED = "input_required",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELED = "canceled",
  REJECTED = "rejected",
}
```

### Message, Part, Artifact

```typescript
interface Message {
  role: "user" | "agent";
  parts: Part[];
  messageId?: string;
}

interface Part {
  text?: string;
  data?: Record<string, unknown>;
  url?: string;
  raw?: Uint8Array;
  mediaType?: string;
  metadata?: Record<string, string>;
}

interface Artifact {
  artifactId?: string;
  name?: string;
  parts: Part[];
}
```

## Interoperability

### W3C DID

```typescript
import { peerIdToDIDKey, didKeyToPeerId } from "agentanycast";

const did = peerIdToDIDKey("12D3KooW...");       // "did:key:z6Mk..."
const peerId = didKeyToPeerId("did:key:z6Mk..."); // "12D3KooW..."
```

### MCP (Model Context Protocol)

```typescript
import { mcpToolsToAgentCard, mcpToolToSkill, skillToMcpTool } from "agentanycast";

// Wrap MCP tools as an AgentCard
const card = mcpToolsToAgentCard("MCPServer", mcpTools);

// Individual conversions
const skill = mcpToolToSkill(tool);
const tool = skillToMcpTool(skill);
```

## Exceptions

All errors inherit from `AgentAnycastError`:

```
AgentAnycastError
├── DaemonError
│   ├── DaemonNotFoundError
│   ├── DaemonStartError
│   └── DaemonConnectionError
├── PeerError
│   ├── PeerNotFoundError
│   ├── PeerDisconnectedError
│   └── PeerAuthenticationError
├── CardNotAvailableError
├── TaskError
│   ├── TaskNotFoundError
│   ├── TaskTimeoutError
│   ├── TaskCanceledError
│   ├── TaskFailedError
│   └── TaskRejectedError
├── RoutingError
│   └── SkillNotFoundError
└── BridgeError
    ├── BridgeConnectionError
    └── BridgeTranslationError
```

## Advanced

### DaemonManager

For manual daemon lifecycle management:

```typescript
import { DaemonManager } from "agentanycast";

const daemon = new DaemonManager({ home: "/tmp/my-agent" });
await daemon.start();
console.log(`gRPC: ${daemon.grpcAddress}`);
// ... use GrpcClient directly ...
await daemon.stop();
```

### GrpcClient

Low-level gRPC client for direct daemon communication:

```typescript
import { GrpcClient } from "agentanycast";

const client = new GrpcClient(daemon.sockPath);
await client.connect();
const info = await client.getNodeInfo();
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
