import { spawn, type ChildProcess } from "node:child_process";

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434";

let child: ChildProcess | null = null;
let startedByUs = false;

async function isOllamaUp(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`);
    return res.ok;
  } catch {
    return false;
  }
}

async function waitUntilUp(timeoutMs = 30_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isOllamaUp()) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Ollama did not become ready in time");
}

export async function ensureOllamaRunning(): Promise<void> {
  if (await isOllamaUp()) {
    startedByUs = false;
    return;
  }

  child = spawn("ollama", ["serve"], {
    detached: false,
    stdio: "ignore",
  });
  startedByUs = true;

  child.on("error", (err) => {
    console.error("Failed to start ollama:", err.message);
  });

  await waitUntilUp();
}

export function stopOllamaIfStartedByUs(): void {
  if (startedByUs && child && !child.killed) {
    child.kill("SIGTERM");
    child = null;
    startedByUs = false;
  }
}
