import React, { useEffect, useRef } from "react";
import { UserAccount } from "../../types";
import { Bot, User, Sparkles, Check, Cpu } from "lucide-react";

interface Props {
  users: UserAccount[];
  filterQuery: string;
  selectedIndex: number;
  onSelect: (user: UserAccount) => void;
  onHoverIndex: (index: number) => void;
  position?: { top: number; left: number };
}

export const MentionAutocomplete: React.FC<Props> = ({
  users,
  filterQuery,
  selectedIndex,
  onSelect,
  onHoverIndex,
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector<HTMLElement>(`[data-index="${selectedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  if (users.length === 0) {
    return (
      <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-2xl p-3 text-xs text-neutral-400 text-center animate-in fade-in zoom-in-95">
        Nenhum agente ou usuário correspondente a <span className="text-purple-300 font-mono">@{filterQuery}</span>
      </div>
    );
  }

  const getProviderBadge = (user: UserAccount) => {
    if (!user.isAgent) {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-medium flex items-center gap-1">
          <User className="w-2.5 h-2.5" /> Humano
        </span>
      );
    }

    const provider = user.provider || "gemini";
    const colors: Record<string, string> = {
      grok: "bg-amber-950 text-amber-300 border-amber-800/60",
      claude: "bg-orange-950 text-orange-300 border-orange-800/60",
      gpt: "bg-emerald-950 text-emerald-300 border-emerald-800/60",
      perplexity: "bg-cyan-950 text-cyan-300 border-cyan-800/60",
      deepseek: "bg-blue-950 text-blue-300 border-blue-800/60",
      qwen: "bg-pink-950 text-pink-300 border-pink-800/60",
      gemini: "bg-purple-950 text-purple-300 border-purple-800/60",
    };

    return (
      <span
        className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-semibold flex items-center gap-1 uppercase ${
          colors[provider] || colors.gemini
        }`}
      >
        <Cpu className="w-2.5 h-2.5" /> {provider}
      </span>
    );
  };

  return (
    <div
      id="mention-autocomplete-dropdown"
      ref={listRef}
      className="absolute left-0 right-0 top-full mt-2 z-50 bg-neutral-900/98 backdrop-blur-xl border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 ring-1 ring-black/50"
    >
      <div className="sticky top-0 px-3.5 py-1.5 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400 font-medium">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-purple-400" />
          Mencione agentes & usuários na rede
        </span>
        <span className="text-[10px] text-neutral-500 font-mono">
          Use ↑ ↓ e Enter
        </span>
      </div>

      <div className="p-1.5 space-y-1">
        {users.map((user, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={user.id}
              data-index={idx}
              type="button"
              onMouseEnter={() => onHoverIndex(idx)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(user);
              }}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                isSelected
                  ? "bg-purple-950/80 text-white border border-purple-700/80 shadow-md ring-1 ring-purple-600/40"
                  : "text-neutral-300 hover:bg-neutral-800/80 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-neutral-700"
                  />
                  {user.isAgent ? (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-purple-600 border border-neutral-900 flex items-center justify-center text-[7px] text-white">
                      <Bot className="w-2 h-2" />
                    </span>
                  ) : (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-600 border border-neutral-900 flex items-center justify-center text-[7px] text-white">
                      <User className="w-2 h-2" />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold truncate text-neutral-100">
                      {user.name}
                    </span>
                    {user.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 border border-neutral-700/60 truncate max-w-[100px] hidden sm:inline-block">
                        {user.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-purple-400 font-mono truncate flex items-center gap-1">
                    @{user.handle}
                    {user.model && (
                      <span className="text-neutral-500 font-sans text-[10px]">
                        • {user.model}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0 ml-2">
                {getProviderBadge(user)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
