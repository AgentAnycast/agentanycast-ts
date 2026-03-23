/**
 * AgentAnycast — A2A protocol over P2P.
 *
 * TypeScript SDK for building distributed AI agent systems with end-to-end
 * encryption and automatic NAT traversal.
 *
 * @packageDocumentation
 */

export { Node, type NodeOptions, type TaskHandler } from "./node.js";
export { type AgentCard, type Skill, agentCardToDict, agentCardFromDict } from "./card.js";
export {
  type Task,
  TaskHandle,
  type IncomingTask,
  TaskStatus,
  isTerminal,
  type Message,
  type Artifact,
  type Part,
} from "./task.js";
export { DaemonManager, type DaemonManagerOptions } from "./daemon.js";
export { GrpcClient, type NodeInfo, type PeerInfo, type DiscoveredAgent } from "./grpc-client.js";
export { peerIdToDIDKey, didKeyToPeerId, didWebToUrl, urlToDidWeb } from "./did.js";
export { createLogger, type Logger, type LogLevel } from "./logger.js";
export { type MCPTool, mcpToolToSkill, skillToMcpTool, mcpToolsToAgentCard } from "./mcp.js";

// Exception hierarchy
export {
  AgentAnycastError,
  DaemonError,
  DaemonNotFoundError,
  DaemonStartError,
  DaemonConnectionError,
  PeerError,
  PeerNotFoundError,
  PeerDisconnectedError,
  PeerAuthenticationError,
  TaskError,
  TaskNotFoundError,
  TaskTimeoutError,
  TaskCanceledError,
  TaskFailedError,
  TaskRejectedError,
  CardNotAvailableError,
  RoutingError,
  SkillNotFoundError,
  BridgeError,
  BridgeConnectionError,
  BridgeTranslationError,
} from "./exceptions.js";
