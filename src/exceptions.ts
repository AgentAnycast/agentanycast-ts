/** Exception hierarchy for AgentAnycast SDK. */

/** Base error for all AgentAnycast errors. */
export class AgentAnycastError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentAnycastError";
  }
}

// ── Daemon Errors ─────────────────────────────────────────

export class DaemonError extends AgentAnycastError {
  constructor(message: string) {
    super(message);
    this.name = "DaemonError";
  }
}

export class DaemonNotFoundError extends DaemonError {
  constructor(message: string) {
    super(message);
    this.name = "DaemonNotFoundError";
  }
}

export class DaemonStartError extends DaemonError {
  constructor(message: string) {
    super(message);
    this.name = "DaemonStartError";
  }
}

export class DaemonConnectionError extends DaemonError {
  constructor(message: string) {
    super(message);
    this.name = "DaemonConnectionError";
  }
}

// ── Peer Errors ───────────────────────────────────────────

export class PeerError extends AgentAnycastError {
  constructor(message: string) {
    super(message);
    this.name = "PeerError";
  }
}

export class PeerNotFoundError extends PeerError {
  constructor(message: string) {
    super(message);
    this.name = "PeerNotFoundError";
  }
}

export class PeerDisconnectedError extends PeerError {
  constructor(message: string) {
    super(message);
    this.name = "PeerDisconnectedError";
  }
}

export class PeerAuthenticationError extends PeerError {
  constructor(message: string) {
    super(message);
    this.name = "PeerAuthenticationError";
  }
}

// ── Task Errors ───────────────────────────────────────────

export class TaskError extends AgentAnycastError {
  constructor(message: string) {
    super(message);
    this.name = "TaskError";
  }
}

export class TaskNotFoundError extends TaskError {
  constructor(message: string) {
    super(message);
    this.name = "TaskNotFoundError";
  }
}

export class TaskTimeoutError extends TaskError {
  constructor(message: string) {
    super(message);
    this.name = "TaskTimeoutError";
  }
}

export class TaskCanceledError extends TaskError {
  constructor(message: string) {
    super(message);
    this.name = "TaskCanceledError";
  }
}

export class TaskFailedError extends TaskError {
  readonly errorDetail: string;
  constructor(message: string, errorDetail = "") {
    super(message || errorDetail);
    this.name = "TaskFailedError";
    this.errorDetail = errorDetail;
  }
}

export class TaskRejectedError extends TaskError {
  constructor(message: string) {
    super(message);
    this.name = "TaskRejectedError";
  }
}

// ── Card Errors ───────────────────────────────────────────

export class CardNotAvailableError extends AgentAnycastError {
  constructor(message: string) {
    super(message);
    this.name = "CardNotAvailableError";
  }
}

// ── Routing Errors ────────────────────────────────────────

export class RoutingError extends AgentAnycastError {
  constructor(message: string) {
    super(message);
    this.name = "RoutingError";
  }
}

export class SkillNotFoundError extends RoutingError {
  constructor(message: string) {
    super(message);
    this.name = "SkillNotFoundError";
  }
}

// ── Bridge Errors ─────────────────────────────────────────

export class BridgeError extends AgentAnycastError {
  constructor(message: string) {
    super(message);
    this.name = "BridgeError";
  }
}

export class BridgeConnectionError extends BridgeError {
  constructor(message: string) {
    super(message);
    this.name = "BridgeConnectionError";
  }
}

export class BridgeTranslationError extends BridgeError {
  constructor(message: string) {
    super(message);
    this.name = "BridgeTranslationError";
  }
}
