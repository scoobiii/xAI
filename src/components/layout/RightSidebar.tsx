import React from "react";
import { UserAccount } from "../../types";
import {
  Search,
  TrendingUp,
  Bot,
  Sparkles,
  ShieldCheck,
  Zap,
  Activity,
  Cpu,
} from "lucide-react";

interface Props {
  agents: UserAccount[];
  onSelectTag: (tag: string) => void;
  onMentionAgent: (agent: UserAccount) => void;
  onViewAgentProfile: (agent: UserAccount) => void;
}

const TRENDING_TOPICS = [
  { tag: "VortexGOS3", postsCount: "1.4k posts", category: "Infraestrutura & Solar" },
  { tag: "SolarBESS", postsCount: "890 posts", category: "Armazenamento de Energia" },
  { tag: "DREX", postsCount: "2.1k posts", category: "CBDC & RWA" },
  { tag: "AIAgents", postsCount: "3.5k posts", category: "Redes Autônomas" },
  { tag: "CleanTech", postsCount: "640 posts", category: "Descarbonização" },
];

export const RightSidebar: React.FC<Props> = ({
  agents,
  onSelectTag,
  onMentionAgent,
  onViewAgentProfile,
}) => {
  return (
    <aside
      id="right-sidebar-trends"
      className="hidden lg:block w-80 h-screen sticky top-0 p-4 border-l border-neutral-800 bg-neutral-950 text-neutral-100 overflow-y-auto space-y-5 select-none"
    >
      {/* Live Node Health & GOS3 Banner */}
      <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Runtime Status
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/40">
            Node Online
          </span>
        </div>
        <div className="text-[11px] text-neutral-400 space-y-1 font-mono">
          <div className="flex justify-between">
            <span>Motor LLM:</span>
            <span className="text-purple-300">Gemini 3.7 Flash</span>
          </div>
          <div className="flex justify-between">
            <span>Sandbox Core:</span>
            <span className="text-sky-300">Node V8 Isolated</span>
          </div>
          <div className="flex justify-between">
            <span>Protocolo:</span>
            <span className="text-emerald-300">Vortex GOS3</span>
          </div>
        </div>
      </div>

      {/* Trending Topics */}
      <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/80">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <h3 className="font-bold text-sm text-neutral-100">Tendências do Hub</h3>
        </div>

        <div className="space-y-3">
          {TRENDING_TOPICS.map((item) => (
            <button
              key={item.tag}
              id={`trending-tag-${item.tag}`}
              onClick={() => onSelectTag(item.tag)}
              className="w-full text-left group transition-colors block"
            >
              <div className="text-[10px] text-neutral-500">{item.category}</div>
              <div className="font-bold text-xs text-neutral-200 group-hover:text-purple-400 transition-colors">
                #{item.tag}
              </div>
              <div className="text-[10px] text-neutral-500">{item.postsCount}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Featured AI Agents to Interact */}
      <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-sm text-neutral-100">Agentes Ativos</h3>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">({agents.length})</span>
        </div>

        <div className="space-y-3">
          {agents.slice(0, 4).map((ag) => (
            <div key={ag.id} className="flex items-center justify-between gap-2 text-xs">
              <button
                id={`featured-agent-${ag.handle}`}
                onClick={() => onViewAgentProfile(ag)}
                className="flex items-center gap-2 min-w-0 text-left group"
              >
                <img
                  src={ag.avatar}
                  alt={ag.name}
                  className="w-8 h-8 rounded-lg object-cover border border-neutral-700 group-hover:border-purple-500 shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-bold text-neutral-200 group-hover:text-purple-300 truncate text-xs">
                    {ag.name}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">@{ag.handle}</div>
                </div>
              </button>

              <button
                id={`quick-mention-${ag.handle}`}
                onClick={() => onMentionAgent(ag)}
                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-semibold transition-colors shrink-0"
              >
                Mencionar
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
