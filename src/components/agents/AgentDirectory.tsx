import React, { useState } from "react";
import { UserAccount } from "../../types";
import {
  Bot,
  Sparkles,
  Zap,
  ShieldCheck,
  Search,
  Plus,
  Terminal,
  Activity,
  ChevronRight,
  Sun,
  Coins,
  Cpu,
} from "lucide-react";

interface Props {
  agents: UserAccount[];
  onSelectAgent: (agent: UserAccount) => void;
  onOpenStudio: () => void;
  onMentionInFeed: (agent: UserAccount) => void;
}

export const AgentDirectory: React.FC<Props> = ({
  agents,
  onSelectAgent,
  onOpenStudio,
  onMentionInFeed,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTool, setFilterTool] = useState<string>("all");

  const filteredAgents = agents.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.handle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.bio.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterTool === "all") return matchesSearch;
    return matchesSearch && a.tools?.includes(filterTool);
  });

  return (
    <div id="agent-directory-view" className="p-4 sm:p-6 text-neutral-100 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bot className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100">
              Diretório de Agentes Autônomos
            </h1>
          </div>
          <p className="text-sm text-neutral-400">
            Contas de IA oficiais com runtime de sandbox isolado, ferramentas analíticas e modelo Gemini 3.7.
          </p>
        </div>

        <button
          id="create-new-agent-btn"
          onClick={onOpenStudio}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-purple-900/30 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Agente (Agent Studio)</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-agents-input"
            type="text"
            placeholder="Buscar agentes por nome, persona ou especialidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            id="filter-tool-all"
            onClick={() => setFilterTool("all")}
            className={`px-3 py-2 rounded-xl font-medium border transition-colors whitespace-nowrap ${
              filterTool === "all"
                ? "bg-purple-950/80 border-purple-700/80 text-purple-300"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Todos ({agents.length})
          </button>
          <button
            id="filter-tool-energy"
            onClick={() => setFilterTool("calculateEnergyBESS")}
            className={`px-3 py-2 rounded-xl font-medium border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              filterTool === "calculateEnergyBESS"
                ? "bg-emerald-950/80 border-emerald-700/80 text-emerald-300"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-emerald-400" />
            Solar & BESS
          </button>
          <button
            id="filter-tool-crypto"
            onClick={() => setFilterTool("analyzeMarketCrypto")}
            className={`px-3 py-2 rounded-xl font-medium border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              filterTool === "analyzeMarketCrypto"
                ? "bg-sky-950/80 border-sky-700/80 text-sky-300"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-sky-400" />
            DREX & RWA
          </button>
          <button
            id="filter-tool-code"
            onClick={() => setFilterTool("executeJavaScript")}
            className={`px-3 py-2 rounded-xl font-medium border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              filterTool === "executeJavaScript"
                ? "bg-purple-950/80 border-purple-700/80 text-purple-300"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            JS Sandbox
          </button>
        </div>
      </div>

      {/* Grid of Agents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAgents.map((agent) => (
          <div
            key={agent.id}
            id={`agent-card-${agent.handle}`}
            className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700 transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="w-12 h-12 rounded-xl object-cover border border-neutral-700 group-hover:border-purple-500 transition-colors"
                    />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-600 border border-neutral-900 flex items-center justify-center text-[9px] text-white">
                      <Bot className="w-2.5 h-2.5" />
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-sm text-neutral-100">{agent.name}</h3>
                      {agent.isOfficial && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/60 font-medium">
                          Official
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 font-mono">@{agent.handle}</div>
                  </div>
                </div>

                <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 font-mono">
                  {agent.model || "Gemini 3.7"}
                </span>
              </div>

              {/* Bio */}
              <p className="text-xs text-neutral-300 line-clamp-3 leading-relaxed mb-4">
                {agent.bio}
              </p>

              {/* Tools Tags */}
              <div className="flex items-center gap-1.5 flex-wrap mb-4">
                {agent.tools?.map((toolId) => (
                  <span
                    key={toolId}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 text-neutral-400 font-mono flex items-center gap-1"
                  >
                    <Zap className="w-2.5 h-2.5 text-purple-400" />
                    {toolId}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer Stats & Actions */}
            <div className="pt-3 border-t border-neutral-800/60 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3 text-neutral-400 font-mono text-[11px]">
                <span title="Execuções na sandbox">⚡ {agent.runsCount || 0} runs</span>
                <span title="Uptime garantido">🛡️ {agent.uptimePercent || 99.9}%</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id={`mention-agent-btn-${agent.handle}`}
                  onClick={() => onMentionInFeed(agent)}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
                >
                  Mencionar
                </button>
                <button
                  id={`view-agent-profile-btn-${agent.handle}`}
                  onClick={() => onSelectAgent(agent)}
                  className="px-3 py-1.5 rounded-lg bg-purple-600/80 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Perfil</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
