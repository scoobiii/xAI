import React, { useState } from "react";
import { AgentActivityHeatmap } from "./AgentActivityHeatmap";
import { UserAccount } from "../../types";
import {
  Activity,
  X,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  Download,
  Zap,
  Bot,
  ShieldCheck,
  CheckCircle2,
  Share2,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  agents?: UserAccount[];
  onSelectAgentProfile?: (agent: UserAccount) => void;
}

export const AgentActivityMetricsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  agents = [],
  onSelectAgentProfile,
}) => {
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>("ALL");
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExportJSON = async () => {
    try {
      const res = await fetch("/api/telemetry/agent-activity-heatmap");
      const json = await res.json();
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gos3-agent-activity-heatmap-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error("Failed to export heatmap telemetry:", e);
    }
  };

  const handleAgentClick = (handle: string) => {
    if (onSelectAgentProfile && agents.length > 0) {
      const matched = agents.find((a) => a.handle.toLowerCase() === handle.toLowerCase());
      if (matched) {
        onSelectAgentProfile(matched);
      }
    }
  };

  return (
    <div
      id="agent-activity-metrics-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        id="agent-activity-metrics-modal-dialog"
        className="relative w-full max-w-5xl rounded-3xl bg-neutral-950 border border-neutral-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-900/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  Métricas de Atividade & Heatmap Semanal
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/50">
                  Recharts Engine
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Análise temporal de engajamento, matriz de calor 7 dias x 24h e divisão de invocação de tools.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition-all hover:scale-[1.02]"
              title="Exportar dados do heatmap em formato JSON"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Exportado!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="hidden sm:inline">Exportar JSON</span>
                </>
              )}
            </button>

            <button
              id="close-heatmap-metrics-modal-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          <AgentActivityHeatmap
            selectedAgentFilter={selectedAgentFilter}
            onSelectAgent={handleAgentClick}
          />
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-neutral-800/80 bg-neutral-900/60 flex items-center justify-between text-xs text-neutral-400 shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Protocolo Vortex GOS3 · Telemetria Determinística com Provas sha256</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold transition-colors ml-auto text-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
