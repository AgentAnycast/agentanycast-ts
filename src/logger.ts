/**
 * Lightweight debug logger for AgentAnycast SDK.
 *
 * Enabled via the `AGENTANYCAST_DEBUG` environment variable. When set to any
 * truthy value (e.g. `1`, `true`, `*`), debug messages are printed to stderr.
 *
 * Usage:
 *   import { createLogger } from "./logger.js";
 *   const log = createLogger("node");
 *   log.debug("starting node...");     // [agentanycast:node] starting node...
 *   log.warn("connection slow");       // [agentanycast:node] WARN connection slow
 *   log.error("failed", err);          // [agentanycast:node] ERROR failed Error: ...
 *
 * Zero-cost when disabled: all log methods become no-ops.
 *
 * @module
 */

/** Log level for filtering output. */
export type LogLevel = "debug" | "warn" | "error";

/** A logger instance scoped to a namespace. */
export interface Logger {
  /** Log a debug-level message. Only visible when AGENTANYCAST_DEBUG is set. */
  debug(message: string, ...args: unknown[]): void;
  /** Log a warning. */
  warn(message: string, ...args: unknown[]): void;
  /** Log an error. */
  error(message: string, ...args: unknown[]): void;
}

/** Shared no-op function to avoid allocations. */
const noop = (): void => {};

/** Check if debug mode is enabled. Cached on first call. */
let _debugEnabled: boolean | undefined;

function isDebugEnabled(): boolean {
  if (_debugEnabled === undefined) {
    try {
      const val = process.env.AGENTANYCAST_DEBUG;
      _debugEnabled = val !== undefined && val !== "" && val !== "0" && val !== "false";
    } catch {
      _debugEnabled = false;
    }
  }
  return _debugEnabled;
}

/**
 * Create a logger for the given namespace.
 *
 * @param namespace - Component name (e.g. "node", "daemon", "grpc").
 *   Appears in log output as `[agentanycast:namespace]`.
 * @returns A Logger instance. All methods are no-ops when debug is disabled,
 *   except `error` which always logs.
 */
export function createLogger(namespace: string): Logger {
  const prefix = `[agentanycast:${namespace}]`;

  if (!isDebugEnabled()) {
    return {
      debug: noop,
      warn: noop,
      error(message: string, ...args: unknown[]) {
        console.error(prefix, "ERROR", message, ...args);
      },
    };
  }

  return {
    debug(message: string, ...args: unknown[]) {
      console.error(prefix, message, ...args);
    },
    warn(message: string, ...args: unknown[]) {
      console.error(prefix, "WARN", message, ...args);
    },
    error(message: string, ...args: unknown[]) {
      console.error(prefix, "ERROR", message, ...args);
    },
  };
}

/**
 * Reset the cached debug state. Useful for testing.
 * @internal
 */
export function _resetDebugCache(): void {
  _debugEnabled = undefined;
}
