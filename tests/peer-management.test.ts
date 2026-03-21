import { describe, it, expect, vi, beforeEach } from "vitest";
import { GrpcClient, type PeerInfo } from "../src/grpc-client.js";
import { PeerNotFoundError } from "../src/exceptions.js";
import { status } from "@grpc/grpc-js";

// ── Helper: create a GrpcClient with a mocked proto client ───────────

function createMockedClient(): { grpc: GrpcClient; mockProto: Record<string, any> } {
  const grpc = new GrpcClient("localhost:50051");
  const mockProto: Record<string, any> = {};
  // Inject the mock client directly via the private field.
  (grpc as any)._client = mockProto;
  return { grpc, mockProto };
}

// ── connectPeer ──────────────────────────────────────────────────────

describe("GrpcClient.connectPeer", () => {
  let grpc: GrpcClient;
  let mockProto: Record<string, any>;

  beforeEach(() => {
    ({ grpc, mockProto } = createMockedClient());
  });

  it("returns PeerInfo on success", async () => {
    mockProto.connectPeer = vi.fn((_req: any, cb: any) => {
      cb(null, {
        peerInfo: {
          peerId: "12D3KooWTest",
          addresses: ["/ip4/127.0.0.1/tcp/4001"],
          connectionType: 1,
        },
      });
    });

    const result: PeerInfo = await grpc.connectPeer("12D3KooWTest");
    expect(result.peerId).toBe("12D3KooWTest");
    expect(result.addresses).toEqual(["/ip4/127.0.0.1/tcp/4001"]);
    expect(result.connectionType).toBe(1);
  });

  it("passes addresses when provided", async () => {
    mockProto.connectPeer = vi.fn((req: any, cb: any) => {
      // Verify addresses are forwarded.
      expect(req.addresses).toEqual(["/ip4/10.0.0.1/tcp/4001"]);
      cb(null, {
        peerInfo: {
          peerId: "12D3KooWTest",
          addresses: ["/ip4/10.0.0.1/tcp/4001"],
          connectionType: 2,
        },
      });
    });

    const result = await grpc.connectPeer("12D3KooWTest", ["/ip4/10.0.0.1/tcp/4001"]);
    expect(result.peerId).toBe("12D3KooWTest");
  });

  it("throws PeerNotFoundError on NOT_FOUND", async () => {
    mockProto.connectPeer = vi.fn((_req: any, cb: any) => {
      const err = Object.assign(new Error("not found"), { code: status.NOT_FOUND });
      cb(err, null);
    });

    await expect(grpc.connectPeer("12D3KooWMissing")).rejects.toThrow(PeerNotFoundError);
  });

  it("rethrows unexpected errors", async () => {
    mockProto.connectPeer = vi.fn((_req: any, cb: any) => {
      const err = Object.assign(new Error("internal"), { code: status.INTERNAL });
      cb(err, null);
    });

    await expect(grpc.connectPeer("12D3KooWTest")).rejects.toThrow("internal");
  });
});

// ── listPeers ────────────────────────────────────────────────────────

describe("GrpcClient.listPeers", () => {
  let grpc: GrpcClient;
  let mockProto: Record<string, any>;

  beforeEach(() => {
    ({ grpc, mockProto } = createMockedClient());
  });

  it("returns an array of PeerInfo", async () => {
    mockProto.listPeers = vi.fn((_req: any, cb: any) => {
      cb(null, {
        peers: [
          { peerId: "peer-1", addresses: ["/ip4/1.2.3.4/tcp/4001"], connectionType: 1 },
          { peerId: "peer-2", addresses: ["/ip4/5.6.7.8/tcp/4001"], connectionType: 2 },
        ],
      });
    });

    const result = await grpc.listPeers();
    expect(result).toHaveLength(2);
    expect(result[0].peerId).toBe("peer-1");
    expect(result[1].peerId).toBe("peer-2");
    expect(result[0].connectionType).toBe(1);
  });

  it("returns empty array when no peers", async () => {
    mockProto.listPeers = vi.fn((_req: any, cb: any) => {
      cb(null, { peers: [] });
    });

    const result = await grpc.listPeers();
    expect(result).toEqual([]);
  });
});
