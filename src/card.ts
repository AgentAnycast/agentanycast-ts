/** Agent Card and Skill data models — A2A compatible. */

/** Describes a single capability an agent exposes. */
export interface Skill {
  /** Unique identifier for the skill (e.g. "analyze_csv", "summarize"). */
  id: string;
  /** Human-readable description of what this skill does. */
  description: string;
  /** Optional JSON Schema describing the expected input format. */
  inputSchema?: string;
  /** Optional JSON Schema describing the output format. */
  outputSchema?: string;
}

/**
 * A2A-compatible capability descriptor for an agent node.
 *
 * Standard A2A fields are preserved. The P2P extension fields (peerId,
 * supportedTransports, relayAddresses, DID fields) are populated
 * automatically by the daemon after node startup.
 */
export interface AgentCard {
  /** Display name of the agent. */
  name: string;
  /** Human-readable description of the agent's purpose. */
  description?: string;
  /** Semantic version of the agent implementation (default "1.0.0"). */
  version?: string;
  /** A2A protocol version this agent conforms to (default "a2a/0.3"). */
  protocolVersion?: string;
  /** Skills (capabilities) this agent exposes for discovery and routing. */
  skills: Skill[];

  // ── P2P extension (populated by daemon) ──────────────────────────

  /** libp2p PeerID (base58btc-encoded). Set by the daemon after startup. */
  peerId?: string;
  /** Transport protocols supported by this node (e.g. ["tcp", "quic"]). */
  supportedTransports?: string[];
  /** Relay server multiaddrs this node is reachable through. */
  relayAddresses?: string[];
  /** W3C DID (did:key) derived from the node's Ed25519 public key. */
  didKey?: string;
  /** Optional did:web identifier for HTTPS-based DID resolution. */
  didWeb?: string;
  /** Optional did:dns domain for DNS-based DID resolution. */
  didDns?: string;
  /** JSON-encoded Verifiable Credentials associated with this agent. */
  verifiableCredentials?: string[];
}

/** Serialize an AgentCard to a plain object (A2A JSON format). */
export function agentCardToDict(card: AgentCard): Record<string, unknown> {
  const d: Record<string, unknown> = {
    name: card.name,
    description: card.description ?? "",
    version: card.version ?? "1.0.0",
    protocol_version: card.protocolVersion ?? "a2a/0.3",
    skills: card.skills.map((s) => {
      const sd: Record<string, unknown> = { id: s.id, description: s.description };
      if (s.inputSchema) sd.input_schema = s.inputSchema;
      if (s.outputSchema) sd.output_schema = s.outputSchema;
      return sd;
    }),
  };
  const hasP2p = card.peerId || card.didKey || card.didWeb || card.didDns;
  if (hasP2p) {
    const p2p: Record<string, unknown> = {};
    if (card.peerId) p2p.peer_id = card.peerId;
    if (card.supportedTransports?.length) p2p.supported_transports = card.supportedTransports;
    if (card.relayAddresses?.length) p2p.relay_addresses = card.relayAddresses;
    if (card.didKey) p2p.did_key = card.didKey;
    if (card.didWeb) p2p.did_web = card.didWeb;
    if (card.didDns) p2p.did_dns = card.didDns;
    if (card.verifiableCredentials?.length) {
      p2p.verifiable_credentials = [...card.verifiableCredentials];
    }
    d.agentanycast = p2p;
  }
  return d;
}

/** Deserialize an AgentCard from a plain object (A2A JSON format). */
export function agentCardFromDict(data: Record<string, unknown>): AgentCard {
  const skills = ((data.skills as Record<string, unknown>[]) ?? []).map((s) => ({
    id: s.id as string,
    description: (s.description as string) ?? "",
    inputSchema: s.input_schema as string | undefined,
    outputSchema: s.output_schema as string | undefined,
  }));
  const p2p = (data.agentanycast as Record<string, unknown>) ?? {};
  return {
    name: data.name as string,
    description: (data.description as string) ?? "",
    version: (data.version as string) ?? "1.0.0",
    protocolVersion: (data.protocol_version as string) ?? "a2a/0.3",
    skills,
    peerId: p2p.peer_id as string | undefined,
    supportedTransports: (p2p.supported_transports as string[]) ?? [],
    relayAddresses: (p2p.relay_addresses as string[]) ?? [],
    didKey: p2p.did_key as string | undefined,
    didWeb: p2p.did_web as string | undefined,
    didDns: p2p.did_dns as string | undefined,
    verifiableCredentials: (p2p.verifiable_credentials as string[]) ?? [],
  };
}
