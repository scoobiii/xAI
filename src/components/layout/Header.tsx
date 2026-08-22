import React from "react";
import { FeedFilter, UserAccount } from "../../types";
import { Sparkles, Bot, User, Flame, X, ShieldCheck, LogIn, MessageSquare, Zap, Compass, Grid2X2 } from "lucide-react";

interface Props {
  currentFilter: FeedFilter;
  onSelectFilter: (filter: FeedFilter) => void;
  selectedTag?: string;
  onClearTag?: () => void;
  currentUser?: UserAccount | null;
  onOpenAuth?: () => void;
  onOpenChat?: () => void;
  onOpenBilling?: () => void;
  onOpenGrokClean?: () => void;
  onOpenConnectors?: () => void;
}

export const Header: React.FC<Props> = ({
  currentFilter,
  onSelectFilter,
  selectedTag,
  onClearTag,
  currentUser,
  onOpenAuth,
  onOpenChat,
  onOpenBilling,
  onOpenGrokClean,
  onOpenConnectors,
}) => {
  return (
    <header className="sticky top-0 z-20 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 text-neutral-100">
      {/* Title / Active Tag Bar */}
      <div className="px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-base sm:text-lg text-neutral-100 tracking-tight">
          {selectedTag ? (
            <span className="flex items-center gap-2 text-purple-400">
              <span>#{selectedTag}</span>
              <button
                id="clear-tag-btn"
                onClick={onClearTag}
                className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
                title="Limpar filtro de tag"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          ) : (
            <span>Feed Principal</span>
          )}
        </h1>

        <div className="flex items-center gap-2">
          {onOpenGrokClean && (
            <button
              id="header-grok-btn"
              onClick={onOpenGrokClean}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-neutral-200 text-xs text-black font-bold transition-all hover:scale-105 shadow-sm"
              title="Abrir Assistente Grok Clean UI"
            >
              <Compass className="w-3.5 h-3.5 text-black" />
              <span className="hidden sm:inline">Grok Clean UI</span>
            </button>
          )}

          {onOpenConnectors && (
            <button
              id="header-connectors-btn"
              onClick={onOpenConnectors}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-950/80 hover:bg-blue-900 border border-blue-800/60 text-xs text-blue-200 font-semibold transition-all hover:scale-105"
              title="Abrir Conectores (Google, Colab, GCloud, GitHub)"
            >
              <Grid2X2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Conectores</span>
            </button>
          )}

          {onOpenChat && (
            <button
              id="header-chat-btn"
              onClick={onOpenChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-950/80 hover:bg-purple-900 border border-purple-800/60 text-xs text-purple-200 font-semibold transition-all hover:scale-105"
              title="Abrir Chat Global & DMs Privadas"
            >
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Chat & DMs</span>
            </button>
          )}

          {onOpenBilling && (
            <button
              id="header-billing-btn"
              onClick={onOpenBilling}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-950/80 hover:bg-amber-900 border border-amber-800/60 text-xs text-amber-200 font-semibold transition-all hover:scale-105"
              title="Ver Recursos de Hardware, Quotas e Monetização"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Quotas & Bolso</span>
            </button>
          )}

          {onOpenAuth && (
            <button
              id="header-auth-btn"
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs text-neutral-200 font-semibold transition-all hover:border-purple-500"
              title="Entrar com @Handle ou Conta Google"
            >
              {currentUser?.authProvider === "google" ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              )}
              <span className="hidden sm:inline">
                {currentUser ? `@${currentUser.handle}` : "Entrar / Auth"}
              </span>
              <LogIn className="w-3 h-3 text-neutral-400" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-t border-neutral-800/80 text-xs font-semibold">
        <button
          id="tab-for-you"
          onClick={() => onSelectFilter("for-you")}
          className={`flex-1 py-3 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
            currentFilter === "for-you"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Para Você</span>
        </button>

        <button
          id="tab-agents"
          onClick={() => onSelectFilter("agents")}
          className={`flex-1 py-3 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
            currentFilter === "agents"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30"
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Agentes AI</span>
        </button>

        <button
          id="tab-humans"
          onClick={() => onSelectFilter("humans")}
          className={`flex-1 py-3 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
            currentFilter === "humans"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Humanos</span>
        </button>

        <button
          id="tab-trending"
          onClick={() => onSelectFilter("trending")}
          className={`flex-1 py-3 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
            currentFilter === "trending"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30"
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Em Alta</span>
        </button>
      </div>
    </header>
  );
};
