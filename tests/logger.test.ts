import { describe, it, expect, vi, afterEach } from "vitest";
import { createLogger, _resetDebugCache } from "../src/logger.js";

describe("logger", () => {
  afterEach(() => {
    _resetDebugCache();
    vi.restoreAllMocks();
  });

  it("should create a logger with the correct namespace", () => {
    const log = createLogger("test");
    expect(log).toBeDefined();
    expect(typeof log.debug).toBe("function");
    expect(typeof log.warn).toBe("function");
    expect(typeof log.error).toBe("function");
  });

  it("should be silent by default (no AGENTANYCAST_DEBUG)", () => {
    delete process.env.AGENTANYCAST_DEBUG;
    _resetDebugCache();

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = createLogger("test");
    log.debug("should not appear");
    log.warn("should not appear");

    // debug and warn should be no-ops when debug is off
    const debugWarnCalls = spy.mock.calls.filter(
      (call) => !call.some((arg) => typeof arg === "string" && arg.includes("ERROR"))
    );
    expect(debugWarnCalls).toHaveLength(0);
  });

  it("should log error even when debug is disabled", () => {
    delete process.env.AGENTANYCAST_DEBUG;
    _resetDebugCache();

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = createLogger("test");
    log.error("critical failure");

    expect(spy).toHaveBeenCalledWith("[agentanycast:test]", "ERROR", "critical failure");
  });

  it("should log all levels when AGENTANYCAST_DEBUG=1", () => {
    process.env.AGENTANYCAST_DEBUG = "1";
    _resetDebugCache();

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = createLogger("node");

    log.debug("starting");
    log.warn("slow connection");
    log.error("failed");

    expect(spy).toHaveBeenCalledWith("[agentanycast:node]", "starting");
    expect(spy).toHaveBeenCalledWith("[agentanycast:node]", "WARN", "slow connection");
    expect(spy).toHaveBeenCalledWith("[agentanycast:node]", "ERROR", "failed");
  });

  it("should treat AGENTANYCAST_DEBUG=0 as disabled", () => {
    process.env.AGENTANYCAST_DEBUG = "0";
    _resetDebugCache();

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = createLogger("test");
    log.debug("should not appear");

    const debugCalls = spy.mock.calls.filter(
      (call) => !call.some((arg) => typeof arg === "string" && arg.includes("ERROR"))
    );
    expect(debugCalls).toHaveLength(0);
  });

  it("should treat AGENTANYCAST_DEBUG=false as disabled", () => {
    process.env.AGENTANYCAST_DEBUG = "false";
    _resetDebugCache();

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = createLogger("test");
    log.debug("should not appear");

    const debugCalls = spy.mock.calls.filter(
      (call) => !call.some((arg) => typeof arg === "string" && arg.includes("ERROR"))
    );
    expect(debugCalls).toHaveLength(0);
  });
});
