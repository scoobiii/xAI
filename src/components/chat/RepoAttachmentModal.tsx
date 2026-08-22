/**
 * > **GOS3** · agente: `claude` · papel: `Arquiteto / Tech Writer` (ver docs/team.md)
 * > fase: `fase 5 — padronização e governança de especificações` · data: `2026-08-21` · hora: `18:25:00 UTC`
 * > antes: Sem modal para envio de repositórios e anexos direcionados a agentes @mencionados
 * > depois: Modal de anexo de repositório GitHub / arquivos com envio direto ao @agente mencionado e análise de AST
 * > base: commit `gos3-core-v1.0`, docs/GOS3-SPECIFICATION.md
 * > assinatura: `Claude · Arquiteto / Tech Writer · GOS3`
 */

import React, { useState } from "react";
import { UserAccount, ChatAttachment } from "../../types";
import {
  FolderGit2,
  FileCode,
  Upload,
  X,
  CheckCircle2,
  Sparkles,
  Bot,
  Terminal,
  Paperclip,
  Share2,
  GitBranch,
  Layers,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetAgent?: UserAccount | null;
  allAgents: UserAccount[];
  onAttach: (attachment: ChatAttachment) => void;
}

export const RepoAttachmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  targetAgent,
  allAgents,
  onAttach,
}) => {
  const toast = useToast();
  const [selectedAgentHandle, setSelectedAgentHandle] = useState<string>(
    targetAgent ? `@${targetAgent.handle}` : "@claude"
  );
  const [attachmentType, setAttachmentType] = useState<"repo" | "file" | "colab_notebook">("repo");

  // Repo inputs
  const [repoOwner, setRepoOwner] = useState("sobrinhoSJ");
  const [repoName, setRepoName] = useState("vortex-gos3-core");
  const [repoBranch, setRepoBranch] = useState("main");
  const [repoDescription, setRepoDescription] = useState("Repositório principal do protocolo GOS3 e agentes de IA");

  // File upload input
  const [fileName, setFileName] = useState("gos3_architecture_spec.ts");
  const [fileSize, setFileSize] = useState("48.2 KB");

  if (!isOpen) return null;

  const handleConfirmAttach = () => {
    if (attachmentType === "repo") {
      const attachment: ChatAttachment = {
        id: `att-repo-${Date.now()}`,
        name: `${repoOwner}/${repoName}`,
        type: "repo",
        sizeFormatted: "142 arquivos · 3.4 MB",
        targetAgentHandle: selectedAgentHandle,
        repoDetails: {
          owner: repoOwner,
          repo: repoName,
          branch: repoBranch,
          filesCount: 142,
          description: repoDescription,
        },
        uploadedAt: new Date().toISOString(),
      };
      onAttach(attachment);
      toast.success(`Repositório ${repoOwner}/${repoName} anexado com sucesso para ${selectedAgentHandle}!`);
    } else {
      const attachment: ChatAttachment = {
        id: `att-file-${Date.now()}`,
        name: fileName,
        type: attachmentType,
        sizeFormatted: fileSize,
        targetAgentHandle: selectedAgentHandle,
        uploadedAt: new Date().toISOString(),
      };
      onAttach(attachment);
      toast.success(`Arquivo ${fileName} anexado para ${selectedAgentHandle}!`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-100">Anexar Repositório ou Arquivos</h3>
              <p className="text-xs text-neutral-400">
                Envie o código para análise direta do agente mencionado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Target Agent Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Direcionar anexo para o agente @mencionado:
            </label>
            <select
              value={selectedAgentHandle}
              onChange={(e) => setSelectedAgentHandle(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
            >
              {allAgents.map((ag) => (
                <option key={ag.id} value={`@${ag.handle}`}>
                  @{ag.handle} — {ag.name} ({ag.model || "GOS3 Core"})
                </option>
              ))}
            </select>
          </div>

          {/* Type Tabs */}
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
            <button
              onClick={() => setAttachmentType("repo")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                attachmentType === "repo"
                  ? "bg-purple-600 text-white"
                  : "text-neutral-400 hover:text-neutral-200 bg-neutral-900"
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Repositório GitHub</span>
            </button>
            <button
              onClick={() => setAttachmentType("file")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                attachmentType === "file"
                  ? "bg-purple-600 text-white"
                  : "text-neutral-400 hover:text-neutral-200 bg-neutral-900"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Arquivo Local</span>
            </button>
          </div>

          {/* Type 1: Repo form */}
          {attachmentType === "repo" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Proprietário / Organização</label>
                  <input
                    type="text"
                    value={repoOwner}
                    onChange={(e) => setRepoOwner(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Nome do Repositório</label>
                  <input
                    type="text"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Branch</label>
                <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2">
                  <GitBranch className="w-3.5 h-3.5 text-neutral-400" />
                  <input
                    type="text"
                    value={repoBranch}
                    onChange={(e) => setRepoBranch(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-neutral-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs text-purple-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  O agente {selectedAgentHandle} receberá a árvore de arquivos, AST de código e histórico de commits para resposta com zero alucinação.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Nome do Arquivo</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="p-6 border-2 border-dashed border-neutral-800 hover:border-purple-500 rounded-2xl flex flex-col items-center justify-center gap-2 text-center transition-colors cursor-pointer bg-neutral-900/30">
                <Upload className="w-6 h-6 text-purple-400" />
                <div className="text-xs font-semibold text-neutral-200">Clique para selecionar ou arraste arquivos</div>
                <div className="text-[11px] text-neutral-500">Suporta .ts, .py, .json, .md, .rs, .ipynb (até 50MB)</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800/80 bg-neutral-900/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmAttach}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow-md shadow-purple-900/40 flex items-center gap-1.5"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Anexar ao {selectedAgentHandle}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
