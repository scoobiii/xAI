/**
 * Client Service Layer for Docs & Knowledge GitHub Sync (GOS3 Protocol)
 * Synchronizes conversation history, notes, and project sprints directly to user-specified GitHub repos.
 */

export interface GitHubSyncOptions {
  repo: string;
  branch?: string;
  token?: string;
  targetPath?: string;
  commitMessage?: string;
  exportEntireProject?: boolean;
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
  error?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  repo: string;
  defaultBranch: string;
  isPrivate: boolean;
  permissions?: Record<string, boolean>;
  user?: string;
  error?: string;
}

export interface SyncHistoryEntry {
  id: string;
  repo: string;
  branch: string;
  timestamp: string;
  totalFiles: number;
  successCount: number;
  commitUrl?: string;
  syncHash: string;
}

const STORAGE_KEY_HISTORY = "vortex_github_sync_history";
const STORAGE_KEY_LAST_REPO = "vortex_github_last_repo";
const STORAGE_KEY_LAST_BRANCH = "vortex_github_last_branch";

export class GitHubDocsSyncService {
  /**
   * Tests connection and permissions for the specified GitHub repository
   */
  public static async testConnection(repo: string, token?: string): Promise<ConnectionTestResult> {
    try {
      const res = await fetch("/api/docs/github-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo, token }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        repo,
        defaultBranch: "main",
        isPrivate: false,
        error: err.message || "Falha na comunicação com o servidor de sync",
      };
    }
  }

  /**
   * Syncs documentation, conversation history, notes, and sprints to GitHub
   */
  public static async syncDocs(options: GitHubSyncOptions): Promise<GitHubSyncResult> {
    try {
      // Save last used parameters
      if (options.repo) {
        localStorage.setItem(STORAGE_KEY_LAST_REPO, options.repo);
      }
      if (options.branch) {
        localStorage.setItem(STORAGE_KEY_LAST_BRANCH, options.branch);
      }

      const res = await fetch("/api/docs/github-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });

      const data: GitHubSyncResult = await res.json();

      if (data.success) {
        // Record in history
        const successCount = (data.syncedFiles || []).filter(
          (f) => f.action === "created" || f.action === "updated"
        ).length;

        const historyEntry: SyncHistoryEntry = {
          id: `sync-${Date.now()}`,
          repo: data.repo,
          branch: data.branch,
          timestamp: data.timestamp || new Date().toISOString(),
          totalFiles: data.totalFiles || data.syncedFiles?.length || 0,
          successCount,
          commitUrl: data.commitUrl,
          syncHash: data.syncHash || "",
        };

        this.addHistoryEntry(historyEntry);
      }

      return data;
    } catch (err: any) {
      return {
        success: false,
        repo: options.repo,
        branch: options.branch || "main",
        syncedFiles: [],
        totalFiles: 0,
        syncHash: "",
        timestamp: new Date().toISOString(),
        error: err.message || "Erro inesperado ao realizar sincronização",
      };
    }
  }

  /**
   * Retrieve history of previous syncs
   */
  public static getSyncHistory(): SyncHistoryEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private static addHistoryEntry(entry: SyncHistoryEntry): void {
    try {
      const history = this.getSyncHistory();
      const updated = [entry, ...history].slice(0, 20); // Keep last 20
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
    } catch {}
  }

  public static clearHistory(): void {
    localStorage.removeItem(STORAGE_KEY_HISTORY);
  }

  public static getLastUsedRepo(): string {
    return localStorage.getItem(STORAGE_KEY_LAST_REPO) || "scoobiii/vortex";
  }

  public static getLastUsedBranch(): string {
    return localStorage.getItem(STORAGE_KEY_LAST_BRANCH) || "main";
  }
}
