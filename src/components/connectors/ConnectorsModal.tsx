/**
 * > **GOS3** · agente: `claude` · papel: `Arquiteto / Tech Writer` (ver docs/team.md)
 * > fase: `fase 5 — padronização e governança de especificações` · data: `2026-08-21` · hora: `18:15:00 UTC`
 * > antes: Sem modal visual dedicado de Conectores estilo Grok
 * > depois: Interface de Conectores (estilo Grok) com busca, Google Workspace, Google Colab & GCloud Sandbox runtime (CLI/GUI), GitHub e automação
 * > base: commit `gos3-core-v1.0`, docs/GOS3-SPECIFICATION.md
 * > assinatura: `Claude · Arquiteto / Tech Writer · GOS3`
 */

import React, { useState } from "react";
import { ExternalConnector, UserAccount } from "../../types";
import { INITIAL_CONNECTORS } from "../../services/connectorsService";
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  Lock,
  Sparkles,
  Terminal,
  Cpu,
  Layers,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  Radio,
  Share2,
  FolderGit2,
  Mail,
  Calendar,
  HardDrive,
  Code2,
  Workflow,
  Plus,
  Flame,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onOpenGoogleSandbox?: (mode: "cli" | "gui_full") => void;
  onSelectConnectorAction?: (connector: ExternalConnector) => void;
}

export const ConnectorsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenGoogleSandbox,
  onSelectConnectorAction,
}) => {
  const toast = useToast();
  const [connectors, setConnectors] = useState<ExternalConnector[]>(INITIAL_CONNECTORS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  if (!isOpen) return null;

  const isGoogleAuthenticated = currentUser?.authProvider === "google" || currentUser?.email?.includes("@gmail.com");

  const handleToggleConnect = (connectorId: string) => {
    setConnectors((prev) =>
      prev.map((conn) => {
        if (conn.id === connectorId) {
          const nextState = !conn.isConnected;
          toast.success(
            nextState
              ? `Conector "${conn.name}" ativado com sucesso!`
              : `Conector "${conn.name}" desconectado.`
          );
          return {
            ...conn,
            isConnected: nextState,
            connectedAt: nextState ? new Date().toISOString() : undefined,
          };
        }
        return conn;
      })
    );
  };

  const filteredConnectors = connectors.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.capabilities.some((cap) => cap.toLowerCase().includes(searchQuery.toLowerCase()));

    if (selectedCategory === "all") return matchesSearch;
    if (selectedCategory === "google") return matchesSearch && (c.isGoogleEcosystem || c.category === "google");
    return matchesSearch && c.category === selectedCategory;
  });

  const getConnectorIcon = (c: ExternalConnector) => {
    switch (c.id) {
      case "gmail":
        return (
          <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400 font-bold">
            <Mail className="w-5 h-5" />
          </div>
        );
      case "calendar":
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400 font-bold">
            <Calendar className="w-5 h-5" />
          </div>
        );
      case "drive":
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 font-bold">
            <HardDrive className="w-5 h-5" />
          </div>
        );
      case "gcolab":
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400 font-bold shadow-sm shadow-amber-900/30">
            <Terminal className="w-5 h-5 text-amber-400" />
          </div>
        );
      case "gcloud":
        return (
          <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400 font-bold">
            <Cpu className="w-5 h-5 text-indigo-400" />
          </div>
        );
      case "github":
        return (
          <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white font-bold">
            <FolderGit2 className="w-5 h-5 text-neutral-100" />
          </div>
        );
      case "n8n":
        return (
          <div className="w-10 h-10 rounded-xl bg-pink-950/80 border border-pink-800/60 flex items-center justify-center text-pink-400 font-bold">
            <Workflow className="w-5 h-5" />
          </div>
        );
      case "firebase":
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-950/90 border border-amber-500/80 flex items-center justify-center text-amber-300 font-bold shadow-md shadow-amber-900/30">
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
        );
      case "gaistudio":
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-950/90 border border-blue-600/80 flex items-center justify-center text-blue-300 font-bold shadow-md shadow-blue-900/30">
            <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
          </div>
        );
      case "vps":
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-950/90 border border-emerald-600/80 flex items-center justify-center text-emerald-300 font-bold shadow-md shadow-emerald-900/30">
            <Cpu className="w-5 h-5 text-emerald-400" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 font-bold">
            <Layers className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header matching Grok style (Screenshot 3) */}
        <div className="px-5 py-4 border-b border-neutral-800/90 flex items-center gap-3 bg-neutral-950 sticky top-0 z-10">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Conectores</h2>
            <p className="text-xs text-neutral-400">
              Os conectores permitem que o Vortex utilize ferramentas e fontes de dados externas.
            </p>
          </div>
        </div>

        {/* Google Sandbox Banner */}
        <div className="px-5 pt-3 pb-1">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-amber-950/30 to-purple-950/40 border border-blue-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
                  <span>Google Auth & Runtime Sandbox</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono">
                    {isGoogleAuthenticated ? "Autenticado: sobrinhoSJ@gmail.com" : "Disponível via OAuth"}
                  </span>
                </div>
                <div className="text-neutral-400 text-[11px] mt-0.5">
                  Habilita execução de código Python com GPU no **Google Colab** e instâncias **Google Cloud** diretamente na tela de chat em modo CLI ou GUI full!
                </div>
              </div>
            </div>

            {onOpenGoogleSandbox && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    onOpenGoogleSandbox("cli");
                    onClose();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[11px] text-amber-300 font-semibold flex items-center gap-1 transition-all"
                >
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Modo CLI</span>
                </button>
                <button
                  onClick={() => {
                    onOpenGoogleSandbox("gui_full");
                    onClose();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-all shadow-sm"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>GUI Full</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar matching Screenshot 3 */}
        <div className="px-5 py-3">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar conectores..."
              className="w-full bg-neutral-900/90 border border-neutral-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
            />
          </div>

          {/* Quick Category Filter Pills */}
          <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {[
              { id: "all", label: "Todos" },
              { id: "google", label: "Google & Sandbox Colab" },
              { id: "destaques", label: "Destaques" },
              { id: "desenvolvimento", label: "Código & GitHub" },
              { id: "automacao", label: "n8n & Webhooks" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full shrink-0 font-medium transition-all ${
                  selectedCategory === cat.id
                    ? "bg-white text-black font-semibold"
                    : "bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-neutral-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* List Section ("Destaques") */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-3">
          <div className="text-xs font-semibold text-neutral-400 px-1">Destaques</div>

          <div className="space-y-2">
            {filteredConnectors.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-2xl bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800/80 transition-all flex items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {getConnectorIcon(c)}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-neutral-100">{c.name}</span>
                      {c.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-800 text-neutral-400 border border-neutral-700 font-mono">
                          {c.badge}
                        </span>
                      )}
                      {c.isConnected && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Ativo</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">{c.description}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {c.capabilities.map((cap, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded-md bg-neutral-950 text-[10px] text-neutral-400 border border-neutral-800/60"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {c.enablesSandbox && onOpenGoogleSandbox && (
                    <button
                      onClick={() => {
                        onOpenGoogleSandbox("cli");
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-800/60 text-xs text-amber-200 font-semibold flex items-center gap-1 transition-all"
                      title="Abrir terminal CLI na tela do chat"
                    >
                      <Terminal className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Terminal</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleConnect(c.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      c.isConnected
                        ? "bg-neutral-800 hover:bg-red-950/60 text-neutral-200 hover:text-red-300 border border-neutral-700 hover:border-red-800"
                        : "bg-white hover:bg-neutral-200 text-neutral-950 shadow-sm"
                    }`}
                  >
                    {c.isConnected ? "Conectado" : "Conectar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800/80 bg-neutral-950/90 flex items-center justify-between text-xs text-neutral-400">
          <span>{connectors.filter((c) => c.isConnected).length} conectores ativos</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-medium transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
