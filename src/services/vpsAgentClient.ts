/**
 * > **GOS3** · agente: `Gemini / ProtocolEngine` · papel: `Lead Architect & Lightweight Client Engine`
 * > fase: `Fase 5 — Governança e Cliente Fino Local (Termux / A23)` · data: `2026-08-23`
 * > antes: Clientes locais necessitando de SDKs pesados no dispositivo, estourando limite de 5GB e criando risco de descompasso de chaves
 * > depois: vpsAgentClient leve com fetch nativo que delega inferências pesadas ao backend central Cloud Run / VPS
 * > base: commit `gos3-core-v1.2`, ADR-003
 * > assinatura: `Gemini · Lead Architect · GOS3`
 */

export interface VPSProxyOptions {
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  payload?: any;
  token?: string;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export interface VPSProxyResponse<T = any> {
  success: boolean;
  status: number;
  data: T;
  latencyMs: number;
  runtimeId?: string;
  evidenceHash?: string;
  error?: string;
}

/**
 * Retorna a URL base do backend central (VPS / Cloud Run).
 * Prioridade:
 * 1. process.env.VPS_API_URL (se disponível em Node/Termux)
 * 2. import.meta.env.VITE_VPS_API_URL (se em bundling Vite client-side)
 * 3. Fallback para URL pública canônica Cloud Run do projeto zAI / Molt Hybrid Hub
 */
export function getVPSBaseUrl(): string {
  // Verificação segura de ambiente sem crash em browser ou Node
  if (typeof process !== "undefined" && process.env && process.env.VPS_API_URL) {
    return process.env.VPS_API_URL.replace(/\/$/, "");
  }

  try {
    // @ts-ignore
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_VPS_API_URL) {
      // @ts-ignore
      return import.meta.env.VITE_VPS_API_URL.replace(/\/$/, "");
    }
  } catch {}

  if (typeof window !== "undefined" && window.location && window.location.origin) {
    return window.location.origin;
  }

  return "https://ais-dev-4tmvuvv55hemt6f75zz2ga-30357252941.us-west1.run.app";
}

/**
 * Cliente HTTP leve sem dependências externas (Zero SDK).
 * Utiliza o fetch nativo da runtime (Node 18+, Bun ou Browser) para
 * delegar a execução de agentes, inferência e ferramentas pesadas ao Cloud Run.
 */
export async function vpsProxyRequest<T = any>(
  endpointOrOptions: string | VPSProxyOptions,
  payload?: any
): Promise<VPSProxyResponse<T>> {
  const startTime = Date.now();
  const options: VPSProxyOptions =
    typeof endpointOrOptions === "string"
      ? { endpoint: endpointOrOptions, payload, method: payload ? "POST" : "GET" }
      : endpointOrOptions;

  const baseUrl = getVPSBaseUrl();
  const cleanEndpoint = options.endpoint.startsWith("/") ? options.endpoint : `/${options.endpoint}`;
  const fullUrl = `${baseUrl}${cleanEndpoint}`;

  const method = options.method || (options.payload ? "POST" : "GET");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-GOS3-Client": "vpsAgentClient-v1.0",
    ...(options.headers || {}),
  };

  const authToken =
    options.token ||
    (typeof process !== "undefined" && process.env && process.env.VPS_API_TOKEN) ||
    "";

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  try {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller
      ? setTimeout(() => controller.abort(), options.timeoutMs || 30000)
      : null;

    const response = await fetch(fullUrl, {
      method,
      headers,
      body: options.payload ? JSON.stringify(options.payload) : undefined,
      signal: controller ? controller.signal : undefined,
    });

    if (timeoutId) clearTimeout(timeoutId);

    const latencyMs = Date.now() - startTime;
    const json = await response.json().catch(() => ({}));

    return {
      success: response.ok,
      status: response.status,
      data: json,
      latencyMs,
      runtimeId: json.runtime_id || json.runtimeId,
      evidenceHash: json.evidence_hash || json.evidenceHash,
      error: response.ok ? undefined : json.error || `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      status: 0,
      data: null as any,
      latencyMs,
      error: err.name === "AbortError" ? "Timeout de requisição VPS excedido" : err.message || String(err),
    };
  }
}
