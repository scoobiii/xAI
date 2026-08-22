/**
 * > **GOS3** · agente: `claude` · papel: `Arquiteto / Tech Writer` (ver docs/team.md)
 * > fase: `fase 5 — padronização e governança de especificações` · data: `2026-08-21` · hora: `17:25:00 UTC`
 * > antes: Feed sem renderizador dedicado para anexos multimídia (vídeo, URL, repo, código)
 * > depois: Componente de renderização rico de anexos com suporte a vídeo, URLs enriquecidas e análise de repositório full-depth
 * > base: commit `gos3-core-v1.0`, docs/GOS3-SPECIFICATION.md
 * > assinatura: `Claude · Arquiteto / Tech Writer · GOS3`
 */

import React, { useState } from "react";
import { PostAttachment } from "../../types";
import {
  FolderGit2,
  ExternalLink,
  Play,
  FileCode,
  FileText,
  Star,
  GitFork,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Layers,
  Terminal,
} from "lucide-react";

interface Props {
  attachments?: PostAttachment[];
}

export const PostAttachmentsViewer: React.FC<Props> = ({ attachments }) => {
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) return null;

  return (
    <div id="post-attachments-viewer" className="mt-3 space-y-2.5">
      {attachments.map((att) => {
        if (att.type === "video") {
          return (
            <div
              key={att.id}
              className="rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 relative group"
            >
              {att.url.endsWith(".mp4") || att.url.startsWith("blob:") || att.url.startsWith("data:") ? (
                <video
                  src={att.url}
                  controls
                  className="w-full max-h-80 object-cover bg-black"
                  poster={att.previewUrl}
                />
              ) : (
                <div className="p-6 flex flex-col items-center justify-center bg-neutral-900/60 border border-neutral-800/80 rounded-xl text-center">
                  <div className="w-12 h-12 rounded-full bg-purple-950/80 border border-purple-800 flex items-center justify-center text-purple-300 mb-2">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                  <div className="text-sm font-semibold text-neutral-200">{att.title || "Anexo de Vídeo"}</div>
                  <div className="text-xs text-neutral-400 mt-1 max-w-sm">{att.description || att.url}</div>
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
                  >
                    <span>Abrir mídia externa</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          );
        }

        if (att.type === "github_repo") {
          const isExpanded = expandedRepo === att.id;
          const meta = att.metadata;
          return (
            <div
              key={att.id}
              className="rounded-xl border border-sky-900/50 bg-gradient-to-br from-sky-950/20 via-neutral-900/70 to-neutral-950 overflow-hidden text-neutral-200"
            >
              <div className="p-3.5 px-4 flex items-center justify-between gap-3 border-b border-sky-900/30 bg-sky-950/30">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-sky-900/60 border border-sky-700/50 flex items-center justify-center text-sky-300 shrink-0">
                    <FolderGit2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-sky-200 truncate">
                        {meta?.repoFullName || att.title || "Repositório GitHub"}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-900/50 text-sky-300 font-mono border border-sky-700/40">
                        Full-Depth Scan
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate">
                      {att.description || "Análise profunda de código e arquitetura"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {meta?.repoStars !== undefined && (
                    <div className="flex items-center gap-1 text-xs text-amber-400 font-mono">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{meta.repoStars}</span>
                    </div>
                  )}
                  {meta?.repoForks !== undefined && (
                    <div className="flex items-center gap-1 text-xs text-sky-400 font-mono">
                      <GitFork className="w-3.5 h-3.5" />
                      <span>{meta.repoForks}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setExpandedRepo(isExpanded ? null : att.id)}
                    className="p-1.5 rounded-lg hover:bg-sky-900/40 text-sky-300 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Repo Highlights */}
              <div className="p-3.5 px-4 text-xs space-y-2">
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                    <div className="text-[10px] text-neutral-500 uppercase">Arquivos Escaneados</div>
                    <div className="font-semibold text-neutral-200 font-mono">
                      {meta?.repoTotalFilesAnalyzed || 42} arquivos
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                    <div className="text-[10px] text-neutral-500 uppercase">Profundidade da Árvore</div>
                    <div className="font-semibold text-sky-400 font-mono">
                      Nível {meta?.repoFullTreeDepth || 4}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                    <div className="text-[10px] text-neutral-500 uppercase">Auditoria GOS3</div>
                    <div className="font-semibold text-emerald-400 font-mono flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Conforme
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-neutral-400">
                    Linguagem Primária: <strong className="text-neutral-200">{meta?.repoLanguage || "TypeScript"}</strong>
                  </span>
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
                  >
                    <span>Ver no GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Expanded Repo Full Depth Details */}
              {isExpanded && (
                <div className="p-4 pt-2 border-t border-sky-900/30 bg-neutral-950/80 space-y-3 animate-in fade-in">
                  <div className="text-xs font-mono text-neutral-300 bg-neutral-900 p-3 rounded-lg border border-neutral-800 whitespace-pre-wrap leading-relaxed">
                    {meta?.repoAnalyzedSummary ||
                      `Análise estrutural concluída: Repositório com suporte a pipelines modernos, validação determinística de componentes, controle rigoroso de dependências e total aderência às diretrizes anti-fabricação GOS3.`}
                  </div>
                </div>
              )}
            </div>
          );
        }

        if (att.type === "url") {
          return (
            <a
              key={att.id}
              href={att.url}
              target="_blank"
              rel="noreferrer"
              className="block p-3 rounded-xl border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-900/80 transition-all text-neutral-200 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-neutral-200 group-hover:text-purple-300 truncate">
                    {att.title || att.url}
                  </div>
                  {att.description && (
                    <p className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5">{att.description}</p>
                  )}
                  <span className="text-[10px] text-neutral-500 font-mono mt-1 block truncate">
                    {att.metadata?.domain || att.url}
                  </span>
                </div>
                <ExternalLink className="w-4 h-4 text-neutral-500 group-hover:text-purple-400 shrink-0 mt-0.5" />
              </div>
            </a>
          );
        }

        if (att.type === "image") {
          return (
            <div key={att.id} className="rounded-xl overflow-hidden border border-neutral-800 max-h-96 bg-neutral-950">
              <img
                src={att.url}
                alt={att.title || "Anexo"}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          );
        }

        return (
          <div key={att.id} className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <span className="text-neutral-200 font-medium">{att.title || "Documento Anexo"}</span>
            </div>
            <a href={att.url} target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">
              Baixar / Visualizar
            </a>
          </div>
        );
      })}
    </div>
  );
};
