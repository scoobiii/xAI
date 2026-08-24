import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

/**
 * > **GOS3** · agente: `Gemini / ProtocolEngine` · papel: `GOS3 Invocation Contract & Runtime ID Engine`
 * > fase: `Fase 5 — ADR-003 & Contrato v0.1 Padronizado` · data: `2026-08-23`
 * > antes: Divergência entre instâncias Termux e Cloud Run, risco de simulação de execução sem prova formal
 * > depois: Contrato v0.1 com runtime_id determinístico de 64 hex, evidence_hash obrigatório e execução real
 * > base: commit `gos3-core-v1.2`, ADR-003, INC-001
 * > assinatura: `Gemini · ProtocolEngine · GOS3`
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

export interface GOS3ContractEnvelope<T = any> {
  executed: boolean;
  status: "success" | "failed";
  output: T;
  duration_ms: number;
  evidence_hash: string;
  contract_version: "v0.1";
  invocation_id: string;
  agent: string;
  truncated: boolean;
  runtime_id: string;
}

export const sha256 = (s: string): string =>
  createHash("sha256").update(s, "utf-8").digest("hex");

/**
 * Gera o runtime_id único e determinístico para a instância atual (64 hex characters).
 * Distingue formalmente instâncias Termux/Android, Cloud Run, VPS ou Isolate.
 */
export function getRuntimeId(): string {
  const envTag = process.env.GOS3_ENV_TAG || process.env.K_SERVICE ? "cloud-run" : "node-linux";
  const hostname = os.hostname() || "localhost";
  const platform = os.platform() || "linux";
  const arch = os.arch() || "x64";
  const rawId = `GOS3-RUNTIME:${envTag}:${hostname}:${platform}:${arch}:${process.pid}`;
  return sha256(rawId);
}

/**
 * Constrói o envelope canônico do contrato v0.1 com cálculo estrito de evidence_hash e runtime_id.
 */
export function buildContractEnvelope<T = any>(params: {
  agent: string;
  output: T;
  duration_ms: number;
  status?: "success" | "failed";
  truncated?: boolean;
  invocation_id?: string;
  rawStdout?: string;
  rawStderr?: string;
  exitCode?: number;
}): GOS3ContractEnvelope<T> {
  const status = params.status || "success";
  const executed = status === "success";
  const invocation_id = params.invocation_id || `inv-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const runtime_id = getRuntimeId();

  // Cálculo canônico do evidence_hash conforme ADR-002 e ADR-003:
  // sha256(stdout + stderr + exit_code + duration_ms) ou sha256(canonical JSON)
  const stdout = params.rawStdout ?? (typeof params.output === "string" ? params.output : JSON.stringify(params.output));
  const stderr = params.rawStderr ?? "";
  const exitCode = params.exitCode ?? (status === "success" ? 0 : 1);
  const evidence_hash = sha256(`${stdout}${stderr}${exitCode}${params.duration_ms}`);

  return {
    executed,
    status,
    output: params.output,
    duration_ms: params.duration_ms,
    evidence_hash,
    contract_version: "v0.1",
    invocation_id,
    agent: params.agent,
    truncated: params.truncated ?? false,
    runtime_id,
  };
}

/**
 * Validador estrito do contrato v0.1
 */
export function validateContractEnvelope(envelope: any): { valid: boolean; reason?: string } {
  if (!envelope || typeof envelope !== "object") {
    return { valid: false, reason: "Envelope nulo ou formato inválido" };
  }

  const requiredFields = [
    "executed",
    "status",
    "output",
    "duration_ms",
    "evidence_hash",
    "contract_version",
    "invocation_id",
    "agent",
    "truncated",
    "runtime_id",
  ];

  for (const field of requiredFields) {
    if (envelope[field] === undefined) {
      return { valid: false, reason: `Campo obrigatório ausente: ${field}` };
    }
  }

  if (typeof envelope.evidence_hash !== "string" || envelope.evidence_hash.length !== 64) {
    return { valid: false, reason: "evidence_hash deve ser string hex de 64 caracteres" };
  }

  if (typeof envelope.runtime_id !== "string" || envelope.runtime_id.length !== 64) {
    return { valid: false, reason: "runtime_id deve ser string hex de 64 caracteres (ADR-003)" };
  }

  if (envelope.contract_version !== "v0.1") {
    return { valid: false, reason: `Versão de contrato não suportada: ${envelope.contract_version}` };
  }

  return { valid: true };
}

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
