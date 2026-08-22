import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { storage } from "./storage";
import { vectorMemory } from "./vectorMemory";

export interface GitHubSyncOptions {
  repo: string; // e.g. "owner/repo" or "scoobiii/vortex"
  branch?: string; // default "main"
  token?: string; // fallback to process.env.GITHUB_TOKEN
  targetPath?: string; // default "docs" or "" for root
  commitMessage?: string;
  exportEntireProject?: boolean; // When true, syncs entire repository (src, public, config, etc.)
  syncConversations?: boolean;
  syncNotes?: boolean;
  syncSprints?: boolean;
  syncSpecs?: boolean;
  syncAttachments?: boolean;
  syncLiveFeed?: boolean;
}

export interface SyncFileResult {
  path: string;
  action: "created" | "updated" | "unchanged" | "error";
  sha?: string;
  error?: string;
}

export interface GitHubSyncResult {
  success: boolean;
  repo: string;
  branch: string;
  commitUrl?: string;
  commitSha?: string;
  syncedFiles: SyncFileResult[];
  totalFiles: number;
  syncHash: string;
  timestamp: string;
  message?: string;
}

const sha256 = (content: string): string =>
  crypto.createHash("sha256").update(content, "utf-8").digest("hex");

export class GitHubSyncService {
  private static getEffectiveToken(tokenOverride?: string): string {
    const token = tokenOverride || process.env.GITHUB_TOKEN || "";
    return token.trim();
  }

  private static parseRepo(repoString: string): { owner: string; repo: string } {
    const clean = repoString.trim().replace(/^https:\/\/github\.com\//, "").replace(/\.git$/, "");
    const parts = clean.split("/").filter(Boolean);
    if (parts.length !== 2) {
      throw new Error(`Formato de repositório inválido: "${repoString}". Use o formato "owner/repo" (ex: "scoobiii/vortex").`);
    }
    return { owner: parts[0], repo: parts[1] };
  }

  /**
   * Test repository and token access
   */
  public static async testConnection(
    repoString: string,
    tokenOverride?: string
  ): Promise<{
    success: boolean;
    repo: string;
    defaultBranch: string;
    isPrivate: boolean;
    permissions?: Record<string, boolean>;
    user?: string;
    error?: string;
  }> {
    const token = this.getEffectiveToken(tokenOverride);
    if (!token) {
      return {
        success: false,
        repo: repoString,
        defaultBranch: "main",
        isPrivate: false,
        error: "GITHUB_TOKEN não configurado. Forneça um token ou configure nas variáveis de ambiente.",
      };
    }

    try {
      const { owner, repo } = this.parseRepo(repoString);
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Accept: "application/vnd.github.v3+json",
          Authorization: `Bearer ${token}`,
          "User-Agent": "Vortex-GOS3-SyncEngine",
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        return {
          success: false,
          repo: `${owner}/${repo}`,
          defaultBranch: "main",
          isPrivate: false,
          error: `GitHub API HTTP ${res.status}: ${res.statusText}. ${errText}`,
        };
      }

      const data = await res.json();
      return {
        success: true,
        repo: data.full_name,
        defaultBranch: data.default_branch || "main",
        isPrivate: data.private || false,
        permissions: data.permissions,
        user: data.owner?.login,
      };
    } catch (err: any) {
      return {
        success: false,
        repo: repoString,
        defaultBranch: "main",
        isPrivate: false,
        error: err.message || "Falha na conexão com GitHub API",
      };
    }
  }

  /**
   * Reads and aggregates all files to sync based on options
   */
  private static async collectFilesToSync(options: GitHubSyncOptions): Promise<Map<string, string>> {
    const files = new Map<string, string>();
    const rootDir = process.cwd();
    const docsDir = path.join(rootDir, "docs");

    async function walk(dir: string, baseRel = "", ignoreList: string[] = ["node_modules", "dist", ".git", ".env", ".system_generated", "logs"]) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (ignoreList.includes(entry.name)) continue;
          const full = path.join(dir, entry.name);
          const rel = baseRel ? `${baseRel}/${entry.name}` : entry.name;
          if (entry.isDirectory()) {
            await walk(full, rel, ignoreList);
          } else if (entry.isFile()) {
            try {
              const stat = await fs.stat(full);
              // Only sync text files under 2MB
              if (stat.size < 2 * 1024 * 1024) {
                const content = await fs.readFile(full, "utf-8");
                files.set(rel, content);
              }
            } catch {
              // skip unreadable file
            }
          }
        }
      } catch {
        // directory might not exist yet
      }
    }

    if (options.exportEntireProject) {
      await walk(rootDir);
    } else {
      await walk(docsDir);
    }

    // Apply filtering if specified
    const filteredFiles = new Map<string, string>();
    for (const [filePath, content] of files.entries()) {
      if (!options.exportEntireProject) {
        if (filePath.startsWith("conversations/") && options.syncConversations === false) continue;
        if (filePath.startsWith("specs/") && options.syncSpecs === false) continue;
        if (filePath.startsWith("attachments/") && options.syncAttachments === false) continue;
        if ((filePath === "BACKLOG.md" || filePath === "SWOT-UX-GUI.md") && options.syncSprints === false) continue;
      }
      filteredFiles.set(filePath, content);
    }

    // 1. Dynamic Live Feed Discussions Export (Conversations)
    if (options.syncLiveFeed !== false && options.syncConversations !== false) {
      const posts = storage.getPosts("for-you");
      const debates = storage.getDebates();
      let liveFeedMd = `> **GOS3** · agente: \`Multi-Agent Orchestrator\` · papel: \`Live Feed Sync\`\n`;
      liveFeedMd += `> fase: \`Sprint 2 - Generalização\` · data: \`${new Date().toISOString().split("T")[0]}\` · hora: \`${new Date().toLocaleTimeString()} UTC\`\n`;
      liveFeedMd += `> assinatura: \`Vortex Live Feed Exporter · GOS3\`\n\n`;
      liveFeedMd += `# Registro de Conversas e Threads do Feed em Tempo Real\n\n`;
      liveFeedMd += `Snapshot automático gerado em **${new Date().toISOString()}** contendo **${posts.length} posts** e **${debates.length} debates**.\n\n---\n\n`;

      for (const post of posts.slice(0, 30)) {
        liveFeedMd += `### Post [${post.id}] - @${post.author.handle} (${post.author.name})\n`;
        liveFeedMd += `*Data*: ${post.createdAt} | *Likes*: ${post.likes} | *Reposts*: ${post.reposts}\n\n`;
        liveFeedMd += `${post.content}\n\n`;
        if (post.chartData) {
          liveFeedMd += `\`\`\`json\n// Chart Data Artifact: ${post.chartData.title}\n${JSON.stringify(post.chartData, null, 2)}\n\`\`\`\n\n`;
        }
        if (post.codeArtifact) {
          liveFeedMd += `\`\`\`${post.codeArtifact.language}\n// Code Artifact (${post.codeArtifact.executedByTool || "Sandbox"})\n${post.codeArtifact.code}\n\`\`\`\n\n`;
        }
        liveFeedMd += `---\n\n`;
      }
      filteredFiles.set("conversations/04-live-feed-discussions-snapshot.md", liveFeedMd);
    }

    // 2. Dynamic Vector Notes & Memory Export (Notes)
    if (options.syncNotes !== false) {
      const memories = vectorMemory.getAllMemories();
      let notesMd = `> **GOS3** · agente: \`VectorMemoryEngine\` · papel: \`Knowledge Base & Semantic Recall\`\n`;
      notesMd += `> fase: \`Sprint 2 - Generalização\` · data: \`${new Date().toISOString().split("T")[0]}\`\n`;
      notesMd += `> assinatura: \`Vector Memory Exporter · GOS3\`\n\n`;
      notesMd += `# Notas, Memória Vetorial & Base de Conhecimento Semântica\n\n`;
      notesMd += `Snapshot de **${memories.length} memórias ativas** com embeddings de 64 dimensões.\n\n`;

      for (const mem of memories) {
        notesMd += `### [MEMÓRIA] ${mem.topic}\n`;
        notesMd += `*Usuário*: @${mem.userHandle} | *Agente*: @${mem.agentHandle} | *Criado*: ${mem.createdAt}\n`;
        notesMd += `*Entidades-chave*: \`${(mem.keyEntities || []).join("`, `")}\`\n\n`;
        notesMd += `${mem.content}\n\n---\n\n`;
      }
      filteredFiles.set("notes/vector-notes-summary.md", notesMd);
    }

    // 3. Dynamic Sprints & Active Debates Export (Sprints)
    if (options.syncSprints !== false) {
      const debates = storage.getDebates();
      let sprintsMd = `> **GOS3** · agente: \`Scrum Master Agent\` · papel: \`Sprint & Debate Tracker\`\n`;
      sprintsMd += `> fase: \`Sprint 2 - Generalização\` · data: \`${new Date().toISOString().split("T")[0]}\`\n`;
      sprintsMd += `> assinatura: \`Scrum Master · GOS3\`\n\n`;
      sprintsMd += `# Resumo de Sprints, Debates e Deliberações Multi-Agente\n\n`;

      for (const d of debates) {
        sprintsMd += `### Debate: "${d.topic}"\n`;
        sprintsMd += `*ID*: \`${d.id}\` | *Status*: **${d.status.toUpperCase()}** | *Rodadas*: ${d.currentRound}/${d.rounds * d.participants.length}\n`;
        sprintsMd += `*Participantes*: ${d.participants.map(p => `@${p.handle} (${p.name})`).join(", ")}\n\n`;
        sprintsMd += `---\n\n`;
      }
      filteredFiles.set("sprints/active-sprints-summary.md", sprintsMd);
    }

    return filteredFiles;
  }

  /**
   * Syncs all collected files to the target GitHub repository
   */
  public static async syncToRepository(options: GitHubSyncOptions): Promise<GitHubSyncResult> {
    const token = this.getEffectiveToken(options.token);
    if (!token) {
      throw new Error("GITHUB_TOKEN ausente. Configure a variável de ambiente GITHUB_TOKEN ou forneça o token na requisição.");
    }

    const { owner, repo } = this.parseRepo(options.repo);
    const branch = options.branch || "main";
    const targetDir = options.targetPath !== undefined
      ? options.targetPath.replace(/^\/+|\/+$/g, "")
      : (options.exportEntireProject ? "" : "docs");
    const commitMsg = options.commitMessage || (options.exportEntireProject ? `feat: export entire project codebase and system [GOS3]` : `docs(sync): sync conversation history, notes, and project sprints [GOS3]`);

    // 1. Verify repository access and default branch
    const connCheck = await this.testConnection(options.repo, token);
    if (!connCheck.success) {
      throw new Error(connCheck.error || "Falha na verificação de acesso ao repositório GitHub");
    }

    // 2. Collect all files to sync
    const filesToSync = await this.collectFilesToSync(options);
    if (filesToSync.size === 0) {
      return {
        success: true,
        repo: `${owner}/${repo}`,
        branch,
        syncedFiles: [],
        totalFiles: 0,
        syncHash: sha256("empty"),
        timestamp: new Date().toISOString(),
        message: "Nenhum arquivo encontrado para sincronização.",
      };
    }

    const syncedResults: SyncFileResult[] = [];
    let combinedContent = "";

    // 3. Upload / Update each file via GitHub Contents API
    for (const [relPath, content] of filesToSync.entries()) {
      const repoFilePath = targetDir ? `${targetDir}/${relPath}` : relPath;
      combinedContent += `${repoFilePath}:${content}\n`;

      try {
        // A. Check if file already exists in repo to obtain its SHA
        let existingSha: string | undefined;
        const checkRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${repoFilePath}?ref=${branch}`,
          {
            headers: {
              Accept: "application/vnd.github.v3+json",
              Authorization: `Bearer ${token}`,
              "User-Agent": "Vortex-GOS3-SyncEngine",
            },
          }
        );

        if (checkRes.ok) {
          const fileInfo = await checkRes.json();
          existingSha = fileInfo.sha;
        }

        // B. Put file content (base64)
        const base64Content = Buffer.from(content, "utf-8").toString("base64");
        const putBody: Record<string, any> = {
          message: `${commitMsg} (${relPath})`,
          content: base64Content,
          branch,
        };
        if (existingSha) {
          putBody.sha = existingSha;
        }

        const putRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${repoFilePath}`,
          {
            method: "PUT",
            headers: {
              Accept: "application/vnd.github.v3+json",
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "User-Agent": "Vortex-GOS3-SyncEngine",
            },
            body: JSON.stringify(putBody),
          }
        );

        if (!putRes.ok) {
          const errText = await putRes.text();
          syncedResults.push({
            path: repoFilePath,
            action: "error",
            error: `HTTP ${putRes.status}: ${errText}`,
          });
        } else {
          const putData = await putRes.json();
          syncedResults.push({
            path: repoFilePath,
            action: existingSha ? "updated" : "created",
            sha: putData.content?.sha || putData.commit?.sha,
          });
        }
      } catch (err: any) {
        syncedResults.push({
          path: repoFilePath,
          action: "error",
          error: err.message || "Erro inesperado ao sincronizar arquivo",
        });
      }
    }

    const successCount = syncedResults.filter(r => r.action === "created" || r.action === "updated").length;
    const finalHash = sha256(combinedContent);
    const commitUrl = `https://github.com/${owner}/${repo}/tree/${branch}/${targetDir}`;

    return {
      success: successCount > 0,
      repo: `${owner}/${repo}`,
      branch,
      commitUrl,
      syncedFiles: syncedResults,
      totalFiles: filesToSync.size,
      syncHash: finalHash,
      timestamp: new Date().toISOString(),
      message: `Sincronização concluída: ${successCount} de ${filesToSync.size} arquivos sincronizados com sucesso no GitHub (${owner}/${repo}).`,
    };
  }
}
