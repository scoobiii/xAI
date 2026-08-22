import React, { useState, useEffect } from "react";
import {
  Folder,
  FileText,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Search,
  Copy,
  Check,
  Download,
  GitBranch,
  Github,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
  History,
  CheckCircle2,
  XCircle,
  Layers,
  Sparkles,
  ArrowRight,
  Sliders,
} from "lucide-react";
import {
  GitHubDocsSyncService,
  GitHubSyncResult,
  ConnectionTestResult,
  SyncHistoryEntry,
} from "../../services/githubDocsSyncService";

interface DocItem {
  name: string;
  path: string;
  type: "file" | "directory";
  content?: string;
  children?: DocItem[];
}

export const DocsHubModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"viewer" | "sync">("viewer");
  const [tree, setTree] = useState<DocItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    conversations: true,
    specs: true,
    attachments: true,
    notes: true,
    sprints: true,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [hasServerGithubToken, setHasServerGithubToken] = useState(false);

  // GitHub Sync State
  const [targetRepo, setTargetRepo] = useState(GitHubDocsSyncService.getLastUsedRepo());
  const [targetBranch, setTargetBranch] = useState(GitHubDocsSyncService.getLastUsedBranch());
  const [targetPath, setTargetPath] = useState("docs");
  const [customToken, setCustomToken] = useState("");
  const [exportEntireProject, setExportEntireProject] = useState(false);
  const [commitMessage, setCommitMessage] = useState(
    "docs(sync): sync conversation history, notes, and project sprints [GOS3]"
  );

  // Star & Fork status
  const [isStarring, setIsStarring] = useState(false);
  const [starResult, setStarResult] = useState<string | null>(null);
  const [isForking, setIsForking] = useState(false);
  const [forkResult, setForkResult] = useState<string | null>(null);

  // Scopes
  const [syncConversations, setSyncConversations] = useState(true);
  const [syncNotes, setSyncNotes] = useState(true);
  const [syncSprints, setSyncSprints] = useState(true);
  const [syncSpecs, setSyncSpecs] = useState(true);
  const [syncAttachments, setSyncAttachments] = useState(true);
  const [syncLiveFeed, setSyncLiveFeed] = useState(true);

  // Status & Telemetry
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [connTestResult, setConnTestResult] = useState<ConnectionTestResult | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<GitHubSyncResult | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadDocs();
      setSyncHistory(GitHubDocsSyncService.getSyncHistory());
    }
  }, [isOpen]);

  const loadDocs = () => {
    setLoadingDocs(true);
    fetch("/api/docs")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.tree)) {
          setTree(data.tree);
          setHasServerGithubToken(Boolean(data.hasGithubToken));
          // Default select README or first file
          const readme = data.tree.find((item: DocItem) => item.name === "README.md");
          if (readme) {
            setSelectedDoc(readme);
          } else if (data.tree[0]) {
            setSelectedDoc(
              data.tree[0].type === "file" ? data.tree[0] : data.tree[0].children?.[0] || null
            );
          }
        }
        setLoadingDocs(false);
      })
      .catch(() => setLoadingDocs(false));
  };

  if (!isOpen) return null;

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folderPath]: !prev[folderPath] }));
  };

  const handleCopyContent = () => {
    if (selectedDoc?.content) {
      navigator.clipboard.writeText(selectedDoc.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (selectedDoc?.content) {
      const blob = new Blob([selectedDoc.content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = selectedDoc.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleTestConnection = async () => {
    if (!targetRepo.trim()) return;
    setIsTestingConn(true);
    setConnTestResult(null);
    try {
      const res = await GitHubDocsSyncService.testConnection(
        targetRepo.trim(),
        customToken.trim() || undefined
      );
      setConnTestResult(res);
      if (res.success && res.defaultBranch) {
        setTargetBranch(res.defaultBranch);
      }
    } catch (err: any) {
      setConnTestResult({
        success: false,
        repo: targetRepo,
        defaultBranch: "main",
        isPrivate: false,
        error: err.message,
      });
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleExecuteSync = async () => {
    if (!targetRepo.trim()) return;
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const result = await GitHubDocsSyncService.syncDocs({
        repo: targetRepo.trim(),
        branch: targetBranch.trim() || "main",
        targetPath: exportEntireProject ? "" : (targetPath.trim() || "docs"),
        token: customToken.trim() || undefined,
        commitMessage: commitMessage.trim(),
        exportEntireProject,
        syncConversations,
        syncNotes,
        syncSprints,
        syncSpecs,
        syncAttachments,
        syncLiveFeed,
      });
      setSyncResult(result);
      setSyncHistory(GitHubDocsSyncService.getSyncHistory());
      // Refresh docs tree to reflect generated notes or live snapshots
      loadDocs();
    } catch (err: any) {
      setSyncResult({
        success: false,
        repo: targetRepo,
        branch: targetBranch,
        syncedFiles: [],
        totalFiles: 0,
        syncHash: "",
        timestamp: new Date().toISOString(),
        error: err.message || "Erro inesperado ao sincronizar.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleStarRepo = async () => {
    if (!targetRepo.trim()) return;
    setIsStarring(true);
    setStarResult(null);
    try {
      const res = await fetch("/api/sandbox/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: "githubStarRepo",
          params: { repoFullName: targetRepo.trim() },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStarResult(`⭐ Repositório ${targetRepo} estrelado com sucesso! (Hash: ${data.evidenceHash})`);
      } else {
        setStarResult(`❌ Falha ao votar estrela: ${data.logs?.join(" ") || "Erro"}`);
      }
    } catch (err: any) {
      setStarResult(`❌ Erro: ${err.message}`);
    } finally {
      setIsStarring(false);
    }
  };

  const handleForkRepo = async () => {
    if (!targetRepo.trim()) return;
    setIsForking(true);
    setForkResult(null);
    try {
      const res = await fetch("/api/sandbox/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: "githubForkRepo",
          params: { repoFullName: targetRepo.trim() },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setForkResult(`🍴 Fork criado com sucesso para ${data.data?.targetFork || targetRepo}! (Hash: ${data.evidenceHash})`);
      } else {
        setForkResult(`❌ Falha ao criar Fork: ${data.logs?.join(" ") || "Erro"}`);
      }
    } catch (err: any) {
      setForkResult(`❌ Erro: ${err.message}`);
    } finally {
      setIsForking(false);
    }
  };

  const renderTree = (items: DocItem[], depth = 0) => {
    return items.map((item) => {
      const isExpanded = expandedFolders[item.path] ?? true;
      const isSelected = selectedDoc?.path === item.path;

      if (item.type === "directory") {
        return (
          <div key={item.path} className="select-none">
            <button
              onClick={() => toggleFolder(item.path)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-300 hover:bg-neutral-800/60 hover:text-white transition-colors"
              style={{ paddingLeft: `${depth * 12 + 10}px` }}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              )}
              <Folder className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="truncate">{item.name}</span>
            </button>
            {isExpanded && item.children && <div>{renderTree(item.children, depth + 1)}</div>}
          </div>
        );
      }

      // File item
      if (
        searchTerm &&
        !item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !item.content?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return null;
      }

      return (
        <button
          key={item.path}
          onClick={() => {
            setSelectedDoc(item);
            setActiveTab("viewer");
          }}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
            isSelected && activeTab === "viewer"
              ? "bg-purple-900/40 text-purple-200 border border-purple-700/50 font-medium"
              : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
          }`}
          style={{ paddingLeft: `${depth * 12 + 16}px` }}
        >
          <FileText
            className={`w-3.5 h-3.5 shrink-0 ${
              isSelected && activeTab === "viewer" ? "text-purple-400" : "text-neutral-500"
            }`}
          />
          <span className="truncate">{item.name}</span>
        </button>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        id="docs-hub-modal"
        className="w-full max-w-5xl h-[90vh] bg-neutral-950 border border-neutral-800 rounded-3xl flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-700/60 flex items-center justify-center text-purple-400 shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                Repositório de Documentação & Conversas
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800/80 text-emerald-400 font-mono">
                  GOS3 v2.4 (NxN)
                </span>
              </div>
              <div className="text-xs text-neutral-400">
                Histórico consolidado, memórias vetoriais, sprints e sincronizador direto com GitHub.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View vs Sync Tabs */}
            <div className="flex bg-neutral-900 p-0.5 rounded-xl border border-neutral-800">
              <button
                onClick={() => setActiveTab("viewer")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "viewer"
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Explorador</span>
              </button>
              <button
                id="tab-sync-github"
                onClick={() => setActiveTab("sync")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "sync"
                    ? "bg-purple-900/60 text-purple-200 border border-purple-700/50 shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Github className="w-3.5 h-3.5 text-purple-400" />
                <span>Sincronizar GitHub</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-semibold transition-colors ml-2"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* Body (Split View) */}
        <div className="flex-1 flex min-h-0">
          {/* Left Sidebar: File Tree & Quick Info */}
          <div className="w-72 sm:w-80 border-r border-neutral-800/80 flex flex-col bg-neutral-950/60 shrink-0">
            {/* Search Box */}
            <div className="p-3 border-b border-neutral-800/60">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Buscar doc, conversa ou sprint..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-purple-600 font-sans"
                />
              </div>
            </div>

            {/* Tree Navigation */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
              {loadingDocs ? (
                <div className="p-4 text-xs text-neutral-500 text-center">Carregando árvore de docs...</div>
              ) : (
                renderTree(tree)
              )}
            </div>

            {/* Bottom GitHub Status & Shortcut */}
            <div className="p-3 border-t border-neutral-800/60 bg-neutral-900/30 text-[11px] text-neutral-400 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-purple-400">/docs</span>
                <span className="flex items-center gap-1 text-emerald-400 font-mono">
                  <ShieldCheck className="w-3 h-3" /> Imutável
                </span>
              </div>
              <button
                onClick={() => setActiveTab("sync")}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/70 rounded-xl text-neutral-200 text-xs font-semibold transition-colors"
              >
                <Github className="w-3.5 h-3.5 text-purple-400" />
                <span>Sync direto para GitHub</span>
              </button>
            </div>
          </div>

          {/* Right Area: Explorer or GitHub Sync Console */}
          <div className="flex-1 flex flex-col min-w-0 bg-neutral-900/20 overflow-y-auto custom-scrollbar">
            {activeTab === "viewer" ? (
              selectedDoc ? (
                <>
                  {/* Doc Header Action Bar */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800/60 bg-neutral-950/40 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="text-xs font-bold text-neutral-200 truncate font-mono">
                        {selectedDoc.path}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyContent}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs transition-colors border border-neutral-700/60"
                        title="Copiar Markdown"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copied ? "Copiado!" : "Copiar"}</span>
                      </button>

                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs transition-colors border border-neutral-700/60"
                        title="Download Markdown"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Baixar</span>
                      </button>
                    </div>
                  </div>

                  {/* Content View */}
                  <div className="flex-1 p-6 space-y-4 text-neutral-300 text-xs font-mono leading-relaxed select-text">
                    <pre className="whitespace-pre-wrap font-mono text-neutral-200 bg-neutral-950/80 p-5 rounded-2xl border border-neutral-800/80 overflow-x-auto selection:bg-purple-900 selection:text-white">
                      {selectedDoc.content}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-500">
                  <BookOpen className="w-10 h-10 text-neutral-700 mb-3" />
                  <div className="text-sm font-semibold text-neutral-400">Nenhum documento selecionado</div>
                  <div className="text-xs text-neutral-600 mt-1">
                    Selecione um arquivo na árvore à esquerda para visualizar
                  </div>
                </div>
              )
            ) : (
              /* --- GITHUB SYNC CONSOLE TAB --- */
              <div className="p-6 space-y-6 max-w-3xl mx-auto w-full animate-fadeIn">
                {/* Banner */}
                <div className="bg-gradient-to-r from-purple-950/60 to-neutral-950 border border-purple-800/40 p-5 rounded-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <Github className="w-4 h-4 text-purple-400" />
                        Sincronização Direta de Documentação & Sprints via GITHUB_TOKEN
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        Sincroniza o histórico de conversações, notas semânticas, memórias vetoriais e status de sprints
                        do protocolo GOS3 diretamente para o repositório GitHub especificado pelo usuário.
                      </p>
                    </div>
                    <div className="shrink-0">
                      {hasServerGithubToken ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-[11px] font-mono">
                          <CheckCircle2 className="w-3 h-3" /> Token Ativo (.env)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950 border border-amber-800 text-amber-400 text-[11px] font-mono">
                          <AlertCircle className="w-3 h-3" /> Token Manual Necessário
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Controls */}
                <div className="bg-neutral-950 border border-neutral-800/80 p-5 rounded-2xl space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Repository Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                        <span>Repositório Alvo</span>
                        <span className="text-[10px] text-neutral-500 font-mono">owner/repo</span>
                      </label>
                      <input
                        type="text"
                        placeholder="ex: scoobiii/vortex"
                        value={targetRepo}
                        onChange={(e) => setTargetRepo(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    {/* Branch Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                        <span>Branch de Destino</span>
                        <span className="text-[10px] text-neutral-500 font-mono">default: main</span>
                      </label>
                      <div className="relative">
                        <GitBranch className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
                        <input
                          type="text"
                          placeholder="main"
                          value={targetBranch}
                          onChange={(e) => setTargetBranch(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-purple-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Target Directory & Optional Token */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                        <span>Diretório de Destino</span>
                        {exportEntireProject && (
                          <span className="text-[10px] text-emerald-400 font-mono">/ (Raiz do Repo)</span>
                        )}
                      </label>
                      <input
                        type="text"
                        placeholder={exportEntireProject ? "Raiz do repositório (/)" : "docs"}
                        disabled={exportEntireProject}
                        value={exportEntireProject ? "" : targetPath}
                        onChange={(e) => setTargetPath(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-purple-600 disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                        <span>GITHUB_TOKEN (Opcional / Sobrescrever)</span>
                        {hasServerGithubToken && (
                          <span className="text-[10px] text-emerald-400">Usando token do servidor</span>
                        )}
                      </label>
                      <input
                        type="password"
                        placeholder={hasServerGithubToken ? "•••••••••••• (usando GITHUB_TOKEN)" : "ghp_..."}
                        value={customToken}
                        onChange={(e) => setCustomToken(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>

                  {/* Full Project Export Mode Toggle */}
                  <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-800/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exportEntireProject}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setExportEntireProject(checked);
                            if (checked) {
                              setCommitMessage("feat: export entire site codebase and architecture [GOS3]");
                            } else {
                              setCommitMessage("docs(sync): sync conversation history, notes, and project sprints [GOS3]");
                            }
                          }}
                          className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4 bg-neutral-950 border-neutral-700"
                        />
                        <span>🚀 Exportar Todo o Site / Código Completo do Repositório</span>
                      </label>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700 font-mono">
                        {exportEntireProject ? "Full Project Mode" : "Docs Only Mode"}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-300 pl-6 leading-relaxed">
                      {exportEntireProject
                        ? "Transfere a estrutura completa do app (código-fonte, componentes, rotas, sandbox e documentação) para a raiz do repositório GitHub escolhido."
                        : "Sincroniza exclusivamente o diretório /docs, relatórios e conversas estruturadas sem sobrescrever o código do projeto."}
                    </p>
                  </div>

                  {/* Commit Message */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">Mensagem do Commit</label>
                    <input
                      type="text"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-purple-600"
                    />
                  </div>

                  {/* Sync Scopes Selector */}
                  <div className="pt-2 border-t border-neutral-800/80 space-y-2.5">
                    <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-purple-400" />
                      Módulos & Escopos de Sincronização
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-neutral-900/60 border border-neutral-800/60 text-neutral-300 cursor-pointer hover:bg-neutral-900">
                        <input
                          type="checkbox"
                          checked={syncConversations}
                          onChange={(e) => setSyncConversations(e.target.checked)}
                          className="rounded text-purple-600 focus:ring-purple-500 h-3.5 w-3.5 bg-neutral-950 border-neutral-700"
                        />
                        <span>Histórico de Conversas (threads & auditorias)</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-xl bg-neutral-900/60 border border-neutral-800/60 text-neutral-300 cursor-pointer hover:bg-neutral-900">
                        <input
                          type="checkbox"
                          checked={syncLiveFeed}
                          onChange={(e) => setSyncLiveFeed(e.target.checked)}
                          className="rounded text-purple-600 focus:ring-purple-500 h-3.5 w-3.5 bg-neutral-950 border-neutral-700"
                        />
                        <span>Snapshot do Feed em Tempo Real (posts ativos)</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-xl bg-neutral-900/60 border border-neutral-800/60 text-neutral-300 cursor-pointer hover:bg-neutral-900">
                        <input
                          type="checkbox"
                          checked={syncNotes}
                          onChange={(e) => setSyncNotes(e.target.checked)}
                          className="rounded text-purple-600 focus:ring-purple-500 h-3.5 w-3.5 bg-neutral-950 border-neutral-700"
                        />
                        <span>Notas & Memória Vetorial (embeddings)</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-xl bg-neutral-900/60 border border-neutral-800/60 text-neutral-300 cursor-pointer hover:bg-neutral-900">
                        <input
                          type="checkbox"
                          checked={syncSprints}
                          onChange={(e) => setSyncSprints(e.target.checked)}
                          className="rounded text-purple-600 focus:ring-purple-500 h-3.5 w-3.5 bg-neutral-950 border-neutral-700"
                        />
                        <span>Sprints, Backlog & Debates Ativos</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-xl bg-neutral-900/60 border border-neutral-800/60 text-neutral-300 cursor-pointer hover:bg-neutral-900">
                        <input
                          type="checkbox"
                          checked={syncSpecs}
                          onChange={(e) => setSyncSpecs(e.target.checked)}
                          className="rounded text-purple-600 focus:ring-purple-500 h-3.5 w-3.5 bg-neutral-950 border-neutral-700"
                        />
                        <span>Especificações e Contratos de Invocação</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-xl bg-neutral-900/60 border border-neutral-800/60 text-neutral-300 cursor-pointer hover:bg-neutral-900">
                        <input
                          type="checkbox"
                          checked={syncAttachments}
                          onChange={(e) => setSyncAttachments(e.target.checked)}
                          className="rounded text-purple-600 focus:ring-purple-500 h-3.5 w-3.5 bg-neutral-950 border-neutral-700"
                        />
                        <span>Anexos, Manifestos e Análise SWOT</span>
                      </label>
                    </div>
                  </div>

                  {/* Actions & Connection Feedback */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                    <div className="flex items-center gap-2">
                      <button
                        id="btn-test-github-connection"
                        onClick={handleTestConnection}
                        disabled={isTestingConn || !targetRepo.trim()}
                        className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {isTestingConn ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                        )}
                        <span>Testar Conexão</span>
                      </button>

                      <button
                        id="btn-star-repo"
                        onClick={handleStarRepo}
                        disabled={isStarring || !targetRepo.trim()}
                        className="px-3 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/80 text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        title="Votar Estrela no Repositório com assinatura de agente/usuário"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isStarring ? "Estrelando..." : "Votar Star ⭐"}</span>
                      </button>

                      <button
                        id="btn-fork-repo"
                        onClick={handleForkRepo}
                        disabled={isForking || !targetRepo.trim()}
                        className="px-3 py-2 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/80 text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        title="Criar Fork do Repositório para o Workspace do Usuário"
                      >
                        <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{isForking ? "Forking..." : "Fazer Fork 🍴"}</span>
                      </button>
                    </div>

                    <button
                      id="btn-execute-github-sync"
                      onClick={handleExecuteSync}
                      disabled={isSyncing || !targetRepo.trim()}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-950 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSyncing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Github className="w-4 h-4" />
                      )}
                      <span>{isSyncing ? "Sincronizando..." : exportEntireProject ? "Exportar Projeto Completo" : "Sincronizar Docs com GitHub"}</span>
                    </button>
                  </div>

                  {/* Star / Fork Feedback Message */}
                  {(starResult || forkResult) && (
                    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-700 text-xs font-mono text-purple-200">
                      {starResult && <div>{starResult}</div>}
                      {forkResult && <div className="mt-1">{forkResult}</div>}
                    </div>
                  )}

                  {/* Google Cloud & Colab Ecosystem Connectivity Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-neutral-900/80 to-purple-950/40 border border-blue-800/30 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Google Ecosystem & Cloud Sandbox Runtime Conectados
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-300 border border-blue-700 text-[10px] font-mono">
                        OAuth Full Duplex
                      </span>
                    </div>
                    <p className="text-neutral-300 text-[11px] leading-relaxed">
                      Bots e agentes autenticados via conta Google possuem acesso nativo aos runtimes <strong>Google Cloud Sandbox</strong>, <strong>Google Colab Notebooks (CPython)</strong> e persistência em <strong>Google Drive</strong>.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300 font-mono">✓ Google Cloud Compute</span>
                      <span className="px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300 font-mono">✓ Colab Jupyter Kernel</span>
                      <span className="px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300 font-mono">✓ Drive Cloud Storage</span>
                      <span className="px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300 font-mono">✓ GitHub Multi-Repo Sync</span>
                    </div>
                  </div>

                  {/* Connection Test Feedback Box */}
                  {connTestResult && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                        connTestResult.success
                          ? "bg-emerald-950/40 border-emerald-800 text-emerald-200"
                          : "bg-red-950/40 border-red-800 text-red-200"
                      }`}
                    >
                      {connTestResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-0.5">
                        <div className="font-bold">
                          {connTestResult.success
                            ? `Repositório verificado: ${connTestResult.repo}`
                            : "Falha na verificação"}
                        </div>
                        <div className="text-[11px] text-neutral-300">
                          {connTestResult.success ? (
                            <span>
                              Branch padrão: <code className="text-purple-300">{connTestResult.defaultBranch}</code> |
                              Visibilidade: {connTestResult.isPrivate ? "Privado" : "Público"} | Proprietário: @
                              {connTestResult.user || "unknown"}
                            </span>
                          ) : (
                            <span>{connTestResult.error}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sync Results Card */}
                {syncResult && (
                  <div
                    className={`p-5 rounded-2xl border space-y-3 ${
                      syncResult.success
                        ? "bg-emerald-950/20 border-emerald-800/80"
                        : "bg-red-950/20 border-red-800/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {syncResult.success ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        <span className="text-xs font-bold text-white">
                          {syncResult.success ? "Sincronização Concluída com Sucesso" : "Falha na Sincronização"}
                        </span>
                      </div>

                      {syncResult.commitUrl && (
                        <a
                          href={syncResult.commitUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold underline"
                        >
                          <span>Ver no GitHub</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <p className="text-xs text-neutral-300">{syncResult.message || syncResult.error}</p>

                    {syncResult.syncHash && (
                      <div className="text-[10px] font-mono text-neutral-400 bg-neutral-950/80 p-2 rounded-lg border border-neutral-800">
                        <span className="text-purple-400 font-bold">SHA-256 Hash: </span>
                        {syncResult.syncHash}
                      </div>
                    )}

                    {/* Files Synced Breakdown */}
                    {syncResult.syncedFiles && syncResult.syncedFiles.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <div className="text-[11px] font-bold text-neutral-400">Arquivos Processados:</div>
                        <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar text-[11px] font-mono">
                          {syncResult.syncedFiles.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between px-2 py-1 rounded bg-neutral-900/60 border border-neutral-800/40"
                            >
                              <span className="text-neutral-300 truncate max-w-md">{file.path}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                                  file.action === "created"
                                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                                    : file.action === "updated"
                                    ? "bg-blue-950 text-blue-400 border border-blue-800/60"
                                    : "bg-red-950 text-red-400 border border-red-800/60"
                                }`}
                              >
                                {file.action}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sync History Log */}
                {syncHistory.length > 0 && (
                  <div className="bg-neutral-950 border border-neutral-800/80 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
                      <div className="flex items-center gap-1.5">
                        <History className="w-4 h-4 text-purple-400" />
                        <span>Histórico Recente de Sincronizações</span>
                      </div>
                      <button
                        onClick={() => {
                          GitHubDocsSyncService.clearHistory();
                          setSyncHistory([]);
                        }}
                        className="text-[10px] text-neutral-500 hover:text-neutral-300"
                      >
                        Limpar histórico
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {syncHistory.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/50 border border-neutral-800/50 text-xs font-mono"
                        >
                          <div className="space-y-0.5">
                            <div className="text-neutral-200 font-bold flex items-center gap-2">
                              <span>{item.repo}</span>
                              <span className="text-[10px] text-purple-400 font-normal">({item.branch})</span>
                            </div>
                            <div className="text-[10px] text-neutral-500">
                              {new Date(item.timestamp).toLocaleString()} • {item.successCount}/{item.totalFiles} arquivos
                            </div>
                          </div>

                          {item.commitUrl && (
                            <a
                              href={item.commitUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] flex items-center gap-1 font-sans font-semibold transition-colors"
                            >
                              <span>Ver</span>
                              <ExternalLink className="w-3 h-3 text-purple-400" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
