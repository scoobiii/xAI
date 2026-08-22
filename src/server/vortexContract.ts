import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

/**
 * Vortex Invocation Contract Implementation (spec/invocation-contract.md)
 * 
 * Regras estritas de conformidade:
 * 1. Sem shadowing de `process` (evita ReferenceError / Temporal Dead Zone).
 * 2. `killSignal: "SIGKILL"` explícito para garantir terminação irrecusável em timeout.
 * 3. Sem fallbacks de template disfarçados: ausência de chave ou erro de rede resulta
 *    em `claim: "not_executed"` ou `claim: "failed"`.
 * 4. Saída 100% tipada com hash SHA-256 e prova de execução do kernel/processo real.
 */

export interface ExecutionProof {
  node_id: string;
  claim: "executed" | "failed" | "not_executed";
  runtime: {
    engine: string;
    arch: string;
    verifiable_via: string;
  };
  proof: {
    stdout_raw: string;
    exit_code: number | null;
    duration_ms: number;
  };
  input_hash: string;
  output_hash: string;
  timestamp: string;
}

export const sha256 = (s: string): string =>
  createHash("sha256").update(s, "utf-8").digest("hex");

/**
 * Executa código Python real em subprocesso isolado no host Linux/POSIX.
 */
export async function executeRealPython(
  nodeId: string,
  code: string,
  timeoutMs = 5000
): Promise<ExecutionProof> {
  const startedAt = Date.now();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "vortex-sandbox-"));
  const scriptPath = path.join(tempDir, "script.py");
  await fs.writeFile(scriptPath, code, "utf-8");

  // Captura PATH antes do spawn, sem shadowing da variável global `process`
  const inheritedPath = process.env.PATH ?? "/usr/bin:/bin";

  const result = await new Promise<{ stdout: string; stderr: string; exitCode: number | null }>(
    (resolve) => {
      const child = spawn("python3", [scriptPath], {
        timeout: timeoutMs,
        killSignal: "SIGKILL", // Força encerramento real se timeout expirar
        env: { PATH: inheritedPath }, // Nenhuma secret ou token repassado ao subprocesso
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (d) => {
        stdout += d.toString();
      });
      child.stderr.on("data", (d) => {
        stderr += d.toString();
      });

      child.on("close", (code) => resolve({ stdout, stderr, exitCode: code }));
      child.on("error", (err) => resolve({ stdout: "", stderr: err.message, exitCode: null }));
    }
  );

  await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

  const durationMs = Date.now() - startedAt;
  const stdoutRaw = result.stderr ? `${result.stdout}\n${result.stderr}` : result.stdout;

  return {
    node_id: nodeId,
    claim: result.exitCode === 0 ? "executed" : "failed",
    runtime: {
      engine: "CPython 3.10 (subprocess real, node:child_process.spawn)",
      arch: os.arch(),
      verifiable_via: "python3 --version",
    },
    proof: {
      stdout_raw: stdoutRaw,
      exit_code: result.exitCode,
      duration_ms: durationMs,
    },
    input_hash: sha256(code),
    output_hash: sha256(stdoutRaw),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Chamada real a provider externo. Sem fallback de template.
 * Se a chave for inexistente, emite estritamente `claim: "not_executed"`.
 */
export async function callRealProvider(
  nodeId: string,
  endpoint: string,
  apiKey: string | undefined,
  body: Record<string, unknown>
): Promise<ExecutionProof> {
  const startedAt = Date.now();
  const bodyStr = JSON.stringify(body);

  if (!apiKey) {
    return {
      node_id: nodeId,
      claim: "not_executed",
      runtime: { engine: "HTTP fetch (External LLM Gateway)", arch: os.arch(), verifiable_via: "n/a" },
      proof: {
        stdout_raw: `⚠️ [CLAIM: NOT_EXECUTED] Nenhuma API Key configurada para o nó '${nodeId}'. Execução abortada sem simulação.`,
        exit_code: null,
        duration_ms: 0,
      },
      input_hash: sha256(bodyStr),
      output_hash: sha256(""),
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: bodyStr,
      signal: AbortSignal.timeout(15000),
    });

    const text = await response.text();
    const durationMs = Date.now() - startedAt;

    return {
      node_id: nodeId,
      claim: response.ok ? "executed" : "failed",
      runtime: {
        engine: "HTTP fetch",
        arch: os.arch(),
        verifiable_via: `curl -I ${endpoint}`,
      },
      proof: {
        stdout_raw: text,
        exit_code: response.ok ? 0 : response.status,
        duration_ms: durationMs,
      },
      input_hash: sha256(bodyStr),
      output_hash: sha256(text),
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      node_id: nodeId,
      claim: "failed",
      runtime: { engine: "HTTP fetch", arch: os.arch(), verifiable_via: `curl -I ${endpoint}` },
      proof: {
        stdout_raw: `[Network Exception] ${msg}`,
        exit_code: null,
        duration_ms: Date.now() - startedAt,
      },
      input_hash: sha256(bodyStr),
      output_hash: sha256(msg),
      timestamp: new Date().toISOString(),
    };
  }
}
