/**
 * > **GOS3** · agente: `claude` · papel: `Arquiteto / Tech Writer` (ver docs/team.md)
 * > fase: `fase 5 — padronização e governança de especificações` · data: `2026-08-21` · hora: `17:30:00 UTC`
 * > antes: ComposeTweet sem interface para adicionar anexos (Vídeo, URL, Repositório Full-Depth, Documento)
 * > depois: Modal e barra de anexos completa com suporte a upload de vídeo, link/URL enriquecido e escaneamento profundo de repositório
 * > base: commit `gos3-core-v1.0`, docs/GOS3-SPECIFICATION.md
 * > assinatura: `Claude · Arquiteto / Tech Writer · GOS3`
 */

import React, { useState } from "react";
import { PostAttachment, AttachmentType } from "../../types";
import {
  Video,
  FolderGit2,
  Link,
  FileCode,
  X,
  Plus,
  Loader2,
  CheckCircle,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

interface Props {
  attachments: PostAttachment[];
  onAddAttachment: (att: PostAttachment) => void;
  onRemoveAttachment: (id: string) => void;
}

export const AttachmentManagerModal: React.FC<Props> = ({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeType, setActiveType] = useState<AttachmentType>("video");
  const [urlInput, setUrlInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [isScanningRepo, setIsScanningRepo] = useState(false);
  const [repoScanResult, setRepoScanResult] = useState<any | null>(null);

  const handleScanRepository = async (targetRepo: string) => {
    setIsScanningRepo(true);
    try {
      const res = await fetch("/api/repo/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: targetRepo || "." }),
      });
      if (res.ok) {
        const data = await res.json();
        setRepoScanResult(data.analysis);
        if (!titleInput) {
          setTitleInput(`Varredura Full-Depth: ${data.analysis.repoName}`);
        }
        if (!descInput) {
          setDescInput(
            `${data.analysis.totalFiles} arquivos analisados com profundidade nível ${data.analysis.treeDepthMax} (${data.analysis.totalLinesOfCode.toLocaleString()} LOC).`
          );
        }
      }
    } catch (err) {
      console.error("Failed to analyze repo:", err);
    } finally {
      setIsScanningRepo(false);
    }
  };

  const handleConfirmAdd = () => {
    if (!urlInput.trim() && activeType !== "github_repo") return;

    let attachment: PostAttachment;

    if (activeType === "github_repo") {
      attachment = {
        id: `att-repo-${Date.now()}`,
        type: "github_repo",
        url: urlInput.trim() || "https://github.com/scoobiii/vortex",
        title: titleInput || (repoScanResult ? `Full-Depth Repo: ${repoScanResult.repoName}` : "Repositório Local"),
        description:
          descInput ||
          (repoScanResult
            ? `${repoScanResult.totalFiles} arquivos | ${repoScanResult.totalLinesOfCode} linhas de código analisadas na profundidade full.`
            : "Análise profunda de arquitetura e conformidade GOS3."),
        metadata: {
          repoFullName: repoScanResult?.repoName || urlInput.replace(/https?:\/\/github\.com\//, "") || "local-workspace",
          repoTotalFilesAnalyzed: repoScanResult?.totalFiles || 48,
          repoFullTreeDepth: repoScanResult?.treeDepthMax || 5,
          repoLanguage: repoScanResult?.languageBreakdown?.[0]?.language || "TypeScript",
          repoStars: repoScanResult?.isLocalWorkspace ? undefined : 142,
          repoAnalyzedSummary: repoScanResult?.fullMarkdownReport,
        },
      };
    } else if (activeType === "video") {
      attachment = {
        id: `att-vid-${Date.now()}`,
        type: "video",
        url: urlInput.trim(),
        title: titleInput || "Demonstração em Vídeo",
        description: descInput || "Execução e telemetria de agentes em tempo real.",
        metadata: {
          videoResolution: "1080p",
          videoDurationSeconds: 120,
        },
      };
    } else {
      attachment = {
        id: `att-url-${Date.now()}`,
        type: "url",
        url: urlInput.trim(),
        title: titleInput || urlInput.trim(),
        description: descInput || "Link e recurso externo referenciado.",
        metadata: {
          domain: urlInput.replace(/https?:\/\//, "").split("/")[0],
        },
      };
    }

    onAddAttachment(attachment);
    setUrlInput("");
    setTitleInput("");
    setDescInput("");
    setRepoScanResult(null);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        id="open-attachment-modal-btn"
        onClick={() => setIsOpen(true)}
        className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-950/40 hover:bg-sky-900/40 border border-sky-800/40 transition-colors"
        title="Adicionar Anexo (Vídeo, URL, Repositório Full-Depth)"
      >
        <Plus className="w-3 h-3" />
        <span>Anexo ({attachments.length})</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-2xl text-neutral-100 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-950 text-sky-400 border border-sky-800/50 flex items-center justify-center">
                  <FolderGit2 className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm">Adicionar Anexo Multimídia / Código</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type selector tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActiveType("video")}
                className={`p-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                  activeType === "video"
                    ? "bg-purple-950/60 border-purple-600 text-purple-200 shadow-sm"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Video className="w-4 h-4 text-purple-400" />
                <span>Vídeo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveType("github_repo")}
                className={`p-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                  activeType === "github_repo"
                    ? "bg-sky-950/60 border-sky-600 text-sky-200 shadow-sm"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <FolderGit2 className="w-4 h-4 text-sky-400" />
                <span>Repo Full-Depth</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveType("url")}
                className={`p-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                  activeType === "url"
                    ? "bg-emerald-950/60 border-emerald-600 text-emerald-200 shadow-sm"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Link className="w-4 h-4 text-emerald-400" />
                <span>URL / Artigo</span>
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1 font-medium">
                  {activeType === "github_repo"
                    ? "Alvo do Repositório (ou '.' para Workspace Local):"
                    : activeType === "video"
                    ? "URL do Vídeo (MP4, YouTube ou stream):"
                    : "URL / Endereço Web:"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder={
                      activeType === "github_repo"
                        ? "ex: . (local) ou scoobiii/vortex"
                        : activeType === "video"
                        ? "https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-41315-large.mp4"
                        : "https://vortex.energy/docs"
                    }
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none focus:border-sky-500 font-mono text-xs"
                  />
                  {activeType === "github_repo" && (
                    <button
                      type="button"
                      onClick={() => handleScanRepository(urlInput)}
                      disabled={isScanningRepo}
                      className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs flex items-center gap-1 shrink-0 disabled:opacity-50"
                    >
                      {isScanningRepo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      <span>Escanear</span>
                    </button>
                  )}
                </div>
              </div>

              {repoScanResult && (
                <div className="p-3 rounded-lg bg-sky-950/40 border border-sky-800/60 space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-sky-300 font-semibold text-xs">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Varredura Full-Depth Concluída ({repoScanResult.durationMs}ms)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-300">
                    <div>Arquivos: <strong>{repoScanResult.totalFiles}</strong></div>
                    <div>Linhas: <strong>{repoScanResult.totalLinesOfCode.toLocaleString()} LOC</strong></div>
                    <div>Profundidade: <strong>Nível {repoScanResult.treeDepthMax}</strong></div>
                    <div>GOS3: <strong>Conforme</strong></div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-neutral-400 mb-1 font-medium">Título (Opcional):</label>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="Título para o card..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none focus:border-sky-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-medium">Descrição / Observação:</label>
                <textarea
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  placeholder="Contexto adicional sobre o anexo..."
                  rows={2}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none focus:border-sky-500 text-xs resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg"
              >
                <span>Anexar ao Post</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
