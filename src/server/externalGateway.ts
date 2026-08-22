import crypto from "crypto";
import { execFile } from "child_process";
import { ExternalSideEffectReceipt } from "../types";

export interface GitHubRepoDetails {
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  htmlUrl: string;
  defaultBranch: string;
  updatedAt: string;
}

// In-memory token store override (allows setting token via UI or fallback to process.env)
let configuredGitHubToken: string | null = null;

export class ExternalGateway {
  public static setGitHubToken(token: string | null) {
    configuredGitHubToken = token?.trim() || null;
  }

  public static getGitHubToken(): string | null {
    return configuredGitHubToken || process.env.GITHUB_TOKEN || null;
  }

  /**
   * Execute real Python 3 code using the native Linux container runtime (/usr/bin/python3).
   */
  public static async executeRealPython(code: string, timeoutMs: number = 4000): Promise<{
    success: boolean;
    stdout: string;
    stderr: string;
    executionTimeMs: number;
    exitCode: number | null;
    evidenceHash: string;
    engine: string;
  }> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      execFile(
        "/usr/bin/python3",
        ["-c", code],
        { timeout: timeoutMs, maxBuffer: 1024 * 1024 },
        (error, stdout, stderr) => {
          const duration = Date.now() - startTime;
          const exitCode = error ? (error as any).code ?? 1 : 0;
          const isTimeout = error && (error as any).killed;

          let errStr = stderr ? stderr.toString() : "";
          if (isTimeout) {
            errStr = `Timeout (${timeoutMs}ms) excedido na execução do processo Python nativo.`;
          } else if (error && !errStr) {
            errStr = error.message;
          }

          const outStr = stdout ? stdout.toString() : "";
          const hash = crypto
            .createHash("sha256")
            .update(`PYTHON3:${code}:${outStr}:${errStr}`)
            .digest("hex")
            .slice(0, 16);

          resolve({
            success: !error,
            stdout: outStr,
            stderr: errStr,
            executionTimeMs: Math.max(1, duration),
            exitCode: typeof exitCode === "number" ? exitCode : null,
            evidenceHash: `0x${hash}`,
            engine: "CPython 3.10 Linux Runtime (Subprocess)",
          });
        }
      );
    });
  }

  /**
   * Real GitHub Star Action (or audited token authentication check) on a repository.
   * e.g., 'scoobiii/vortex' or 'https://github.com/scoobiii/vortex'
   */
  public static async starGitHubRepo(
    repoInput: string,
    providedToken?: string
  ): Promise<ExternalSideEffectReceipt> {
    const startTime = Date.now();
    const cleanRepo = repoInput.replace(/https?:\/\/github\.com\//, "").replace(/\.git$/, "").trim();
    const token = providedToken || this.getGitHubToken();
    const timestamp = new Date().toISOString();

    const logs: string[] = [
      `[GitHub Agency Gateway] Iniciando ação de Star para: ${cleanRepo}`,
    ];

    if (!token) {
      logs.push(`[GitHub Auth] Nenhuma credencial GITHUB_TOKEN encontrada no ambiente (.env) ou Gateway.`);
      logs.push(`[GitHub Protocol] Para efetivar a escrita (PUT /user/starred/${cleanRepo}), é necessário GITHUB_TOKEN com scope 'public_repo'.`);

      // Attempt live public repo check to verify repository exists
      let repoMeta: any = null;
      let checkHttpStatus = 401;

      try {
        const checkRes = await fetch(`https://api.github.com/repos/${cleanRepo}`, {
          headers: {
            "User-Agent": "MoltBot-Agent-Vortex/1.0",
            Accept: "application/vnd.github.v3+json",
          },
          signal: AbortSignal.timeout(3000),
        });
        checkHttpStatus = checkRes.status;
        if (checkRes.ok) {
          repoMeta = await checkRes.json();
          logs.push(`[GitHub Public Probe] Repositório confirmado: ${cleanRepo} (${repoMeta.stargazers_count} ⭐ atuais).`);
        }
      } catch (err: any) {
        logs.push(`[GitHub Probe] Verificação de repo público: ${err.message}`);
      }

      const duration = Date.now() - startTime;
      const proofHash = crypto
        .createHash("sha256")
        .update(`GITHUB_STAR_ACTION_UNAUTH:${cleanRepo}:${timestamp}`)
        .digest("hex")
        .slice(0, 16);

      return {
        service: "github",
        action: "github.starRepo",
        target: cleanRepo,
        status: "auth_required",
        httpStatus: 401,
        statusText: "401 Unauthorized (Write scope required)",
        authScope: "public_repo",
        verified: false,
        evidenceHash: `0x${proofHash}`,
        proofSignature: `SIG:UNAUTH_GITHUB_GUARD:${cleanRepo}`,
        latencyMs: duration,
        data: {
          repository: cleanRepo,
          actionAttempted: `PUT https://api.github.com/user/starred/${cleanRepo}`,
          requiresToken: true,
          envVarName: "GITHUB_TOKEN",
          currentLiveStars: repoMeta?.stargazers_count ?? "Disponível via Token",
          htmlUrl: `https://github.com/${cleanRepo}`,
        },
        logs,
        timestamp,
      };
    }

    // Authenticated Request
    try {
      logs.push(`[GitHub Auth] Token autenticado detectado. Enviando requisição PUT /user/starred/${cleanRepo}...`);

      const res = await fetch(`https://api.github.com/user/starred/${cleanRepo}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "MoltBot-Agent-Vortex/1.0",
          Accept: "application/vnd.github.v3+json",
          "Content-Length": "0",
        },
        signal: AbortSignal.timeout(6000),
      });

      const duration = Date.now() - startTime;
      const isSuccess = res.status === 204 || res.status === 200;
      const rateLimitRemaining = res.headers.get("x-ratelimit-remaining");

      logs.push(`[GitHub API] Resposta HTTP ${res.status} ${res.statusText} (${duration}ms).`);
      if (rateLimitRemaining) {
        logs.push(`[GitHub Quota] Rate limit restante: ${rateLimitRemaining}`);
      }

      const proofHash = crypto
        .createHash("sha256")
        .update(`GITHUB_STAR_SUCCESS:${cleanRepo}:${res.status}:${timestamp}`)
        .digest("hex")
        .slice(0, 16);

      return {
        service: "github",
        action: "github.starRepo",
        target: cleanRepo,
        status: isSuccess ? "success" : res.status === 403 ? "rate_limited" : "error",
        httpStatus: res.status,
        statusText: res.statusText || (isSuccess ? "204 No Content (Starred)" : `HTTP ${res.status}`),
        authScope: "public_repo",
        verified: isSuccess,
        evidenceHash: `0x${proofHash}`,
        proofSignature: `SIG:GITHUB_VERIFIED_${cleanRepo.toUpperCase()}_${res.status}`,
        latencyMs: duration,
        data: {
          repository: cleanRepo,
          actionAttempted: `PUT https://api.github.com/user/starred/${cleanRepo}`,
          starred: isSuccess,
          httpStatus: res.status,
          rateLimitRemaining,
          htmlUrl: `https://github.com/${cleanRepo}`,
        },
        logs,
        timestamp,
      };
    } catch (err: any) {
      const duration = Date.now() - startTime;
      logs.push(`[GitHub API Error] Falha de conexão: ${err.message}`);

      const proofHash = crypto
        .createHash("sha256")
        .update(`GITHUB_STAR_ERR:${cleanRepo}:${err.message}`)
        .digest("hex")
        .slice(0, 16);

      return {
        service: "github",
        action: "github.starRepo",
        target: cleanRepo,
        status: "error",
        httpStatus: 500,
        statusText: err.message,
        verified: false,
        evidenceHash: `0x${proofHash}`,
        latencyMs: duration,
        data: { error: err.message, repository: cleanRepo },
        logs,
        timestamp,
      };
    }
  }

  /**
   * Fetch Live GitHub Repository Metadata (stars, forks, description, license).
   */
  public static async getGitHubRepoDetails(
    repoInput: string,
    providedToken?: string
  ): Promise<{
    success: boolean;
    data: GitHubRepoDetails | null;
    httpStatus: number;
    receipt: ExternalSideEffectReceipt;
  }> {
    const startTime = Date.now();
    const cleanRepo = repoInput.replace(/https?:\/\/github\.com\//, "").replace(/\.git$/, "").trim();
    const token = providedToken || this.getGitHubToken();
    const timestamp = new Date().toISOString();
    const logs: string[] = [`[GitHub Gateway] Consultando dados de repositório: ${cleanRepo}`];

    try {
      const headers: Record<string, string> = {
        "User-Agent": "MoltBot-Agent-Vortex/1.0",
        Accept: "application/vnd.github.v3+json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`https://api.github.com/repos/${cleanRepo}`, {
        headers,
        signal: AbortSignal.timeout(5000),
      });

      const duration = Date.now() - startTime;

      if (!res.ok) {
        logs.push(`[GitHub API] Erro HTTP ${res.status}: ${res.statusText}`);
        const hash = crypto.createHash("sha256").update(`GH_ERR:${cleanRepo}:${res.status}`).digest("hex").slice(0, 16);
        return {
          success: false,
          data: null,
          httpStatus: res.status,
          receipt: {
            service: "github",
            action: "github.getRepo",
            target: cleanRepo,
            status: res.status === 404 ? "error" : "auth_required",
            httpStatus: res.status,
            statusText: res.statusText,
            verified: false,
            evidenceHash: `0x${hash}`,
            latencyMs: duration,
            logs,
            timestamp,
          },
        };
      }

      const json = await res.json();
      logs.push(`[GitHub API] Metadados obtidos com sucesso. ⭐ ${json.stargazers_count} stars, 🍴 ${json.forks_count} forks.`);

      const details: GitHubRepoDetails = {
        fullName: json.full_name,
        description: json.description || "Sem descrição pública.",
        stars: json.stargazers_count,
        forks: json.forks_count,
        openIssues: json.open_issues_count,
        htmlUrl: json.html_url,
        defaultBranch: json.default_branch || "main",
        updatedAt: json.updated_at,
      };

      const hash = crypto.createHash("sha256").update(`GH_REPO:${cleanRepo}:${details.stars}:${timestamp}`).digest("hex").slice(0, 16);

      return {
        success: true,
        data: details,
        httpStatus: 200,
        receipt: {
          service: "github",
          action: "github.getRepo",
          target: cleanRepo,
          status: "success",
          httpStatus: 200,
          statusText: "200 OK",
          verified: true,
          evidenceHash: `0x${hash}`,
          proofSignature: `SIG:GITHUB_REPO_${cleanRepo.replace(/[\/\-]/g, "_")}`,
          latencyMs: duration,
          data: details,
          logs,
          timestamp,
        },
      };
    } catch (err: any) {
      const duration = Date.now() - startTime;
      logs.push(`[GitHub Gateway] Exceção de rede: ${err.message}`);
      const hash = crypto.createHash("sha256").update(`GH_EX:${cleanRepo}:${err.message}`).digest("hex").slice(0, 16);

      return {
        success: false,
        data: null,
        httpStatus: 500,
        receipt: {
          service: "github",
          action: "github.getRepo",
          target: cleanRepo,
          status: "error",
          httpStatus: 500,
          statusText: err.message,
          verified: false,
          evidenceHash: `0x${hash}`,
          latencyMs: duration,
          logs,
          timestamp,
        },
      };
    }
  }

  /**
   * Real Audited HTTP Request to any external REST / Oracle endpoint with cryptographic receipt.
   */
  public static async fetchExternalEndpoint(
    url: string,
    options?: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
      timeoutMs?: number;
    }
  ): Promise<ExternalSideEffectReceipt> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const method = options?.method || "GET";
    const logs: string[] = [`[External Oracle] Executando requisição ${method} -> ${url}`];

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "User-Agent": "MoltBot-External-Agency/1.0",
          ...(options?.headers || {}),
        },
        body: options?.body,
        signal: AbortSignal.timeout(options?.timeoutMs || 5000),
      });

      const duration = Date.now() - startTime;
      let responseBody: any = null;
      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        responseBody = await res.json();
      } else {
        responseBody = (await res.text()).slice(0, 2000);
      }

      logs.push(`[External Oracle] Resposta HTTP ${res.status} ${res.statusText} (${duration}ms).`);

      const hash = crypto
        .createHash("sha256")
        .update(`HTTP:${method}:${url}:${res.status}:${JSON.stringify(responseBody).slice(0, 500)}`)
        .digest("hex")
        .slice(0, 16);

      return {
        service: "http_api",
        action: "http.fetch",
        target: url,
        status: res.ok ? "success" : "error",
        httpStatus: res.status,
        statusText: res.statusText || `HTTP ${res.status}`,
        verified: res.ok,
        evidenceHash: `0x${hash}`,
        latencyMs: duration,
        data: responseBody,
        logs,
        timestamp,
      };
    } catch (err: any) {
      const duration = Date.now() - startTime;
      logs.push(`[External Oracle] Falha na requisição: ${err.message}`);

      const hash = crypto.createHash("sha256").update(`HTTP_ERR:${url}:${err.message}`).digest("hex").slice(0, 16);

      return {
        service: "http_api",
        action: "http.fetch",
        target: url,
        status: "error",
        httpStatus: 500,
        statusText: err.message,
        verified: false,
        evidenceHash: `0x${hash}`,
        latencyMs: duration,
        data: { error: err.message },
        logs,
        timestamp,
      };
    }
  }
}
