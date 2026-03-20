/**
 * Bidirectional conversion between libp2p PeerIDs and W3C did:key identifiers.
 *
 * The did:key method encodes an Ed25519 public key as:
 *   did:key:z<base58btc(0xed01 + raw_public_key)>
 *
 * where the multicodec prefix for Ed25519 is 0xed01 (varint-encoded 0xed).
 *
 * This module produces identical output to the Go daemon's
 * crypto.PeerIDToDIDKey / DIDKeyToPeerID and the Python SDK's equivalents.
 */

import basex from "base-x";

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const bs58 = basex(BASE58_ALPHABET);

/** Ed25519 multicodec varint prefix. */
const ED25519_MULTICODEC_PREFIX = Uint8Array.from([0xed, 0x01]);

/** libp2p identity multihash code. */
const IDENTITY_MULTIHASH_CODE = 0x00;

/**
 * Convert a libp2p PeerID (base58btc-encoded) to a did:key string.
 * Only Ed25519-based PeerIDs (identity multihash) are supported.
 */
export function peerIdToDIDKey(peerId: string): string {
  const raw = bs58.decode(peerId);

  if (raw.length < 2 || raw[0] !== IDENTITY_MULTIHASH_CODE) {
    throw new Error(`Unsupported PeerID format (expected identity multihash): ${peerId}`);
  }

  const length = raw[1];
  const protoBytes = raw.slice(2, 2 + length);
  const pubkey = parseLibp2pPubkeyProto(protoBytes);

  const mcBytes = new Uint8Array(ED25519_MULTICODEC_PREFIX.length + pubkey.length);
  mcBytes.set(ED25519_MULTICODEC_PREFIX);
  mcBytes.set(pubkey, ED25519_MULTICODEC_PREFIX.length);

  return "did:key:z" + bs58.encode(mcBytes);
}

/**
 * Convert a did:key string back to a libp2p PeerID.
 * Only Ed25519 did:key values are supported.
 */
export function didKeyToPeerId(didKey: string): string {
  if (!didKey.startsWith("did:key:z")) {
    throw new Error(`Invalid did:key format: ${didKey}`);
  }

  const encoded = didKey.slice("did:key:z".length);
  const decoded = bs58.decode(encoded);

  if (decoded.length < ED25519_MULTICODEC_PREFIX.length + 32) {
    throw new Error("did:key payload too short");
  }

  if (decoded[0] !== ED25519_MULTICODEC_PREFIX[0] || decoded[1] !== ED25519_MULTICODEC_PREFIX[1]) {
    throw new Error("Unsupported multicodec prefix (only Ed25519 supported)");
  }

  const pubkey = decoded.slice(ED25519_MULTICODEC_PREFIX.length);
  const protoBytes = encodeLibp2pPubkeyProto(pubkey);

  // Identity multihash: <0x00> <length> <data>
  const mh = new Uint8Array(2 + protoBytes.length);
  mh[0] = IDENTITY_MULTIHASH_CODE;
  mh[1] = protoBytes.length;
  mh.set(protoBytes, 2);

  return bs58.encode(mh);
}

/** Parse a minimal libp2p crypto.pb.PublicKey protobuf to extract the raw key. */
function parseLibp2pPubkeyProto(data: Uint8Array): Uint8Array {
  let idx = 0;
  let keyType: number | undefined;
  let keyData: Uint8Array | undefined;

  while (idx < data.length) {
    const tag = data[idx++];
    const fieldNumber = tag >> 3;
    const wireType = tag & 0x07;

    if (wireType === 0) {
      // varint
      let val = 0;
      let shift = 0;
      while (idx < data.length) {
        const b = data[idx++];
        val |= (b & 0x7f) << shift;
        if (b < 0x80) break;
        shift += 7;
      }
      if (fieldNumber === 1) keyType = val;
    } else if (wireType === 2) {
      // length-delimited
      const len = data[idx++];
      if (fieldNumber === 2) {
        keyData = data.slice(idx, idx + len);
      }
      idx += len;
    }
  }

  if (keyType !== 1) {
    throw new Error(`Unsupported key type ${keyType} (expected Ed25519=1)`);
  }
  if (!keyData || keyData.length !== 32) {
    throw new Error("Invalid Ed25519 public key data");
  }

  return keyData;
}

/** Encode a raw Ed25519 public key as libp2p crypto.pb.PublicKey protobuf. */
function encodeLibp2pPubkeyProto(pubkey: Uint8Array): Uint8Array {
  // Field 1 (KeyType=Ed25519=1): tag=0x08, value=0x01
  // Field 2 (Data): tag=0x12, length, data
  const result = new Uint8Array(4 + pubkey.length);
  result[0] = 0x08;
  result[1] = 0x01;
  result[2] = 0x12;
  result[3] = pubkey.length;
  result.set(pubkey, 4);
  return result;
}

// ── did:web helpers ──────────────────────────────────────────────────

/**
 * Convert a `did:web` identifier to its HTTPS resolution URL.
 *
 * Follows the did:web Method Specification:
 * - `did:web:example.com` → `https://example.com/.well-known/did.json`
 * - `did:web:example.com:agents:myagent` → `https://example.com/agents/myagent/did.json`
 *
 * Percent-encoded characters in the DID are decoded for the URL path.
 */
export function didWebToUrl(didWeb: string): string {
  if (!didWeb.startsWith("did:web:")) {
    throw new Error(`Invalid did:web format: ${didWeb}`);
  }

  const specificId = didWeb.slice("did:web:".length);
  if (!specificId) {
    throw new Error("did:web identifier has empty domain");
  }
  const parts = specificId.split(":");

  // First segment is the domain (percent-decoded).
  const domain = decodeURIComponent(parts[0]);
  if (!domain) {
    throw new Error("did:web identifier has empty domain");
  }

  if (parts.length === 1) {
    return `https://${domain}/.well-known/did.json`;
  }

  const path = parts.slice(1).map((p) => decodeURIComponent(p)).join("/");
  return `https://${domain}/${path}/did.json`;
}

/**
 * Convert an HTTPS URL to a `did:web` identifier (reverse of `didWebToUrl`).
 *
 * The URL must use `https://` and end with `did.json`.
 */
export function urlToDidWeb(url: string): string {
  if (!url.startsWith("https://")) {
    throw new Error(`did:web URLs must use HTTPS: ${url}`);
  }

  const rest = url.slice("https://".length);
  const slashIdx = rest.indexOf("/");
  if (slashIdx === -1) {
    throw new Error(`URL missing path component: ${url}`);
  }

  const domain = rest.slice(0, slashIdx);
  const path = rest.slice(slashIdx + 1);

  const encodedDomain = encodeURIComponent(domain);

  if (path === ".well-known/did.json") {
    return `did:web:${encodedDomain}`;
  }

  if (!path.endsWith("/did.json")) {
    throw new Error(`URL path must end with /did.json: ${url}`);
  }

  const pathPart = path.slice(0, -"/did.json".length);
  const segments = pathPart.split("/").map((s) => encodeURIComponent(s));
  return `did:web:${encodedDomain}:${segments.join(":")}`;
}
