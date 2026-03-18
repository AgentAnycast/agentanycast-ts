#!/usr/bin/env node

/**
 * Postinstall script: downloads the agentanycastd binary for the current
 * platform. Runs automatically after `npm install agentanycast`.
 *
 * Set AGENTANYCAST_SKIP_DOWNLOAD=1 to skip (e.g., when the binary is
 * already on PATH or you plan to build from source).
 */

import { existsSync, mkdirSync, createWriteStream, chmodSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));
const VERSION = pkg.version;

const RELEASE_URL =
  "https://github.com/agentanycast/agentanycast-node/releases/download/" +
  `v${VERSION}/agentanycastd-{os}-{arch}`;

const PLATFORM_MAP = {
  "darwin-arm64": ["darwin", "arm64"],
  "darwin-x64": ["darwin", "amd64"],
  "linux-x64": ["linux", "amd64"],
  "linux-arm64": ["linux", "arm64"],
  "win32-x64": ["windows", "amd64"],
};

async function main() {
  if (process.env.AGENTANYCAST_SKIP_DOWNLOAD === "1") {
    console.log("[agentanycast] Skipping daemon download (AGENTANYCAST_SKIP_DOWNLOAD=1)");
    return;
  }

  const key = `${process.platform}-${process.arch}`;
  const mapping = PLATFORM_MAP[key];
  if (!mapping) {
    console.warn(`[agentanycast] Unsupported platform: ${key}. Skipping daemon download.`);
    console.warn("[agentanycast] You can build the daemon from source:");
    console.warn("[agentanycast]   https://github.com/agentanycast/agentanycast-node");
    return;
  }

  const [osName, arch] = mapping;
  const suffix = osName === "windows" ? ".exe" : "";
  const binDir = join(homedir(), ".agentanycast", "bin");
  const dest = join(binDir, `agentanycastd${suffix}`);

  if (existsSync(dest)) {
    console.log(`[agentanycast] Daemon binary already exists at ${dest}`);
    return;
  }

  const url = RELEASE_URL.replace("{os}", osName).replace("{arch}", arch);
  console.log(`[agentanycast] Downloading daemon v${VERSION} for ${osName}/${arch}...`);

  try {
    mkdirSync(binDir, { recursive: true });
    const resp = await fetch(url, { redirect: "follow" });
    if (!resp.ok) {
      if (resp.status === 404) {
        console.warn(`[agentanycast] Binary not available yet at ${url} (HTTP 404).`);
        console.warn("[agentanycast] You can build the daemon from source:");
        console.warn("[agentanycast]   https://github.com/agentanycast/agentanycast-node");
        return;
      }
      throw new Error(`HTTP ${resp.status}`);
    }

    const body = resp.body;
    if (!body) throw new Error("Empty response body");

    const nodeStream = Readable.fromWeb(body);
    await pipeline(nodeStream, createWriteStream(dest));
    chmodSync(dest, 0o755);
    console.log(`[agentanycast] Daemon binary installed at ${dest}`);
  } catch (err) {
    console.warn(`[agentanycast] Failed to download daemon: ${err.message}`);
    console.warn("[agentanycast] You can build the daemon from source or download it manually.");
  }
}

main();
