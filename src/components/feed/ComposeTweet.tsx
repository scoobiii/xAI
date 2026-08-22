import React, { useState, useRef, useMemo, useEffect } from "react";
import { UserAccount, PostAttachment } from "../../types";
import { MentionAutocomplete } from "./MentionAutocomplete";
import { AttachmentManagerModal } from "./AttachmentManagerModal";
import {
  Sparkles,
  Bot,
  Send,
  Loader2,
  Terminal,
  Sun,
  ChevronDown,
  AtSign,
  Video,
  FolderGit2,
  Link,
  X,
} from "lucide-react";

interface Props {
  currentUser: UserAccount;
  allUsers: UserAccount[];
  onSwitchUser: (user: UserAccount) => void;
  onPublish: (content: string, authorId: string, parentId?: string, threadRootId?: string, attachments?: PostAttachment[]) => Promise<void>;
  placeholder?: string;
}

export const ComposeTweet: React.FC<Props> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  onPublish,
  placeholder = "O que está acontecendo no ecossistema? Digite @ para citar qualquer agente ou humano...",
}) => {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<PostAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  // Mention Autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter users based on mention query
  const filteredUsers = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase().trim();

    if (!q) {
      // If just typed "@", return popular agents first, then others
      return [...allUsers].sort((a, b) => {
        if (a.isAgent && !b.isAgent) return -1;
        if (!a.isAgent && b.isAgent) return 1;
        return (b.followersCount || 0) - (a.followersCount || 0);
      });
    }

    return allUsers.filter((u) => {
      const handle = u.handle.toLowerCase();
      const name = u.name.toLowerCase();
      const provider = (u.provider || "").toLowerCase();
      const badge = (u.badge || "").toLowerCase();
      const model = (u.model || "").toLowerCase();

      return (
        handle.includes(q) ||
        name.includes(q) ||
        provider.includes(q) ||
        badge.includes(q) ||
        model.includes(q)
      );
    }).sort((a, b) => {
      // Prioritize exact handle start
      const aHandleStarts = a.handle.toLowerCase().startsWith(q);
      const bHandleStarts = b.handle.toLowerCase().startsWith(q);
      if (aHandleStarts && !bHandleStarts) return -1;
      if (!aHandleStarts && bHandleStarts) return 1;

      // Then name start
      const aNameStarts = a.name.toLowerCase().startsWith(q);
      const bNameStarts = b.name.toLowerCase().startsWith(q);
      if (aNameStarts && !bNameStarts) return -1;
      if (!aNameStarts && bNameStarts) return 1;

      return 0;
    });
  }, [allUsers, mentionQuery]);

  // Check for @ mention trigger
  const checkMentionTrigger = (text: string, cursorPosition: number) => {
    const textBeforeCursor = text.slice(0, cursorPosition);
    // Matches @ preceded by start-of-string or whitespace, followed by alphanumeric / underscore
    const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_-]*)$/);

    if (match) {
      const query = match[1];
      const atIndex = textBeforeCursor.lastIndexOf("@");
      setMentionQuery(query);
      setMentionStartIndex(atIndex);
      setSelectedIndex(0);
    } else {
      setMentionQuery(null);
      setMentionStartIndex(-1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    checkMentionTrigger(val, e.target.selectionStart || val.length);
  };

  const handleSelectionChange = () => {
    if (textareaRef.current) {
      checkMentionTrigger(content, textareaRef.current.selectionStart || content.length);
    }
  };

  // Keyboard navigation for autocomplete
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && filteredUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredUsers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        if (!e.shiftKey && filteredUsers[selectedIndex]) {
          e.preventDefault();
          handleSelectMention(filteredUsers[selectedIndex]);
          return;
        }
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }
  };

  // Insert mention into content
  const handleSelectMention = (user: UserAccount) => {
    if (mentionStartIndex < 0) return;

    const before = content.slice(0, mentionStartIndex);
    const afterCursor = content.slice(mentionStartIndex);
    const matchAfter = afterCursor.match(/^@[a-zA-Z0-9_-]*/);
    const replaceLen = matchAfter ? matchAfter[0].length : 1;
    const after = content.slice(mentionStartIndex + replaceLen);

    const insertedText = `@${user.handle} `;
    const newContent = `${before}${insertedText}${after}`;

    setContent(newContent);
    setMentionQuery(null);
    setMentionStartIndex(-1);

    // Reposition cursor right after the mention
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = before.length + insertedText.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMentionQuery(null);
        setShowPersonaMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddAttachment = (att: PostAttachment) => {
    setAttachments((prev) => [...prev, att]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setMentionQuery(null);
      await onPublish(content.trim(), currentUser.id, undefined, undefined, attachments);
      setContent("");
      setAttachments([]);
    } catch (err) {
      console.error("Failed to publish post:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const insertQuickText = (text: string) => {
    setContent((prev) => (prev ? `${prev} ${text}` : text));
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleTriggerAt = () => {
    setContent((prev) => `${prev}@`);
    setMentionQuery("");
    setMentionStartIndex(content.length);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      id="compose-tweet-container"
      className="p-4 border-b border-neutral-800 bg-neutral-950/90 relative"
    >
      <form onSubmit={handleSubmit}>
        <div className="flex items-start gap-3">
          {/* Persona selector / Avatar */}
          <div className="relative">
            <button
              type="button"
              id="compose-persona-dropdown-btn"
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="relative group focus:outline-none"
              title="Alternar conta / persona ativa"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover border border-neutral-700 group-hover:border-purple-500 transition-colors"
              />
              {currentUser.isAgent ? (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-600 border-2 border-neutral-950 flex items-center justify-center text-[9px] text-white">
                  <Bot className="w-2.5 h-2.5" />
                </span>
              ) : (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 border-2 border-neutral-950 flex items-center justify-center text-[8px] text-white">
                  <ChevronDown className="w-2.5 h-2.5" />
                </span>
              )}
            </button>

            {/* Persona Switcher Menu */}
            {showPersonaMenu && (
              <div
                id="persona-switch-menu"
                className="absolute left-0 mt-2 w-64 p-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-40 text-xs text-neutral-200 animate-in fade-in zoom-in-95"
              >
                <div className="px-2 py-1 text-[10px] uppercase font-semibold text-neutral-500 tracking-wider">
                  Postar Como:
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        onSwitchUser(u);
                        setShowPersonaMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                        currentUser.id === u.id
                          ? "bg-purple-950/70 border border-purple-800/60 text-purple-200 font-medium"
                          : "hover:bg-neutral-800 text-neutral-300"
                      }`}
                    >
                      <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-xs font-semibold">{u.name}</div>
                        <div className="text-[10px] text-neutral-500">@{u.handle}</div>
                      </div>
                      {u.isAgent ? (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-purple-900/60 text-purple-300">AI</span>
                      ) : (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-900/60 text-emerald-300">Humano</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex-1 min-w-0 relative">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-200">{currentUser.name}</span>
                <span className="text-xs text-neutral-500">@{currentUser.handle}</span>
                {currentUser.isAgent && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/50">
                    Agent LLM Active
                  </span>
                )}
              </div>

              {/* Instant @ trigger button */}
              <button
                type="button"
                onClick={handleTriggerAt}
                className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-0.5 px-2 py-0.5 rounded bg-purple-950/50 hover:bg-purple-900/50 border border-purple-800/40 transition-colors"
                title="Digitar @ para mencionar agente"
              >
                <AtSign className="w-3 h-3" />
                <span>Mencionar</span>
              </button>
            </div>

            <div className="relative">
              <textarea
                ref={textareaRef}
                id="compose-tweet-input"
                value={content}
                onChange={handleInputChange}
                onSelect={handleSelectionChange}
                onClick={handleSelectionChange}
                onKeyUp={handleSelectionChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={3}
                className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-500 resize-none focus:outline-none focus:ring-0 leading-relaxed font-sans"
              />

              {/* Dynamic Autocomplete Dropdown */}
              {mentionQuery !== null && (
                <MentionAutocomplete
                  users={filteredUsers}
                  filterQuery={mentionQuery}
                  selectedIndex={selectedIndex}
                  onSelect={handleSelectMention}
                  onHoverIndex={(idx) => setSelectedIndex(idx)}
                />
              )}
            </div>

            {/* Attachments Preview Chips */}
            {attachments.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mt-2 p-2 bg-neutral-900/60 rounded-xl border border-neutral-800">
                <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                  Anexos ({attachments.length}):
                </span>
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950 border border-sky-800/50 text-sky-200 text-xs shadow-xs"
                  >
                    {att.type === "video" && <Video className="w-3.5 h-3.5 text-purple-400" />}
                    {att.type === "github_repo" && <FolderGit2 className="w-3.5 h-3.5 text-sky-400" />}
                    {att.type === "url" && <Link className="w-3.5 h-3.5 text-emerald-400" />}
                    <span className="truncate max-w-[180px] font-medium">{att.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="p-0.5 text-neutral-400 hover:text-red-400 rounded transition-colors"
                      title="Remover anexo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Agent Trigger Pills */}
            <div className="flex items-center gap-1.5 flex-wrap my-2 pt-2 border-t border-neutral-900">
              <span className="text-[11px] text-neutral-500 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                Citar Agente:
              </span>
              <button
                type="button"
                id="quick-mention-vortex"
                onClick={() => insertQuickText("@VortexGrid modelar CAPEX/OPEX para 40MW Solar e 80MWh BESS com LCOE")}
                className="px-2 py-0.5 text-[11px] rounded-full bg-neutral-900 border border-neutral-800 text-emerald-400 hover:border-emerald-700/60 transition-colors flex items-center gap-1"
              >
                <Sun className="w-3 h-3" />
                @VortexGrid (BESS/Solar)
              </button>
              <button
                type="button"
                id="quick-mention-qwen"
                onClick={() => insertQuickText("@QwenCoder estimar cadeia global de baterias LFP e frete de células")}
                className="px-2 py-0.5 text-[11px] rounded-full bg-neutral-900 border border-neutral-800 text-pink-400 hover:border-pink-700/60 transition-colors flex items-center gap-1"
              >
                🌐 @QwenCoder (Qwen)
              </button>
              <button
                type="button"
                id="quick-mention-grok"
                onClick={() => insertQuickText("@GrokBot simular estresse de rede e criticar premissas regulatórias")}
                className="px-2 py-0.5 text-[11px] rounded-full bg-neutral-900 border border-neutral-800 text-amber-400 hover:border-amber-700/60 transition-colors flex items-center gap-1"
              >
                ⚡ @GrokBot (Grok)
              </button>
              <button
                type="button"
                id="quick-mention-claude"
                onClick={() => insertQuickText("@ClaudeOpus verificar integridade dos contratos e conformidade regulatória")}
                className="px-2 py-0.5 text-[11px] rounded-full bg-neutral-900 border border-neutral-800 text-orange-400 hover:border-orange-700/60 transition-colors flex items-center gap-1"
              >
                🛡️ @ClaudeOpus (Claude)
              </button>
              <button
                type="button"
                id="quick-mention-deepseek"
                onClick={() => insertQuickText("@DeepSeekReasoner calcular algoritmo de otimização de despacho com matriz hessiana")}
                className="px-2 py-0.5 text-[11px] rounded-full bg-neutral-900 border border-neutral-800 text-blue-400 hover:border-blue-700/60 transition-colors flex items-center gap-1"
              >
                🔬 @DeepSeekReasoner (DeepSeek)
              </button>
              <button
                type="button"
                id="quick-mention-gpt"
                onClick={() => insertQuickText("@GPT4o sintetizar pipeline de integração e orquestrar APIs")}
                className="px-2 py-0.5 text-[11px] rounded-full bg-neutral-900 border border-neutral-800 text-emerald-400 hover:border-emerald-700/60 transition-colors flex items-center gap-1"
              >
                🤖 @GPT4o (OpenAI)
              </button>
              <button
                type="button"
                id="quick-mention-code"
                onClick={() => insertQuickText("@CodeKernel executar benchmark de despacho em JS Sandbox")}
                className="px-2 py-0.5 text-[11px] rounded-full bg-neutral-900 border border-neutral-800 text-cyan-400 hover:border-cyan-700/60 transition-colors flex items-center gap-1"
              >
                <Terminal className="w-3 h-3" />
                @CodeKernel (Sandbox V8)
              </button>
            </div>

            {/* Submit Toolbar */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800/80">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span>{content.length}/500</span>
                <AttachmentManagerModal
                  attachments={attachments}
                  onAddAttachment={handleAddAttachment}
                  onRemoveAttachment={handleRemoveAttachment}
                />
                {currentUser.isAgent && (
                  <span className="text-purple-400 font-mono text-[11px] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Auto-Sandbox Enabled
                  </span>
                )}
              </div>

              <button
                type="submit"
                id="submit-tweet-btn"
                disabled={!content.trim() || isSubmitting}
                className="px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-purple-900/30"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{currentUser.isAgent ? "Executando Sandbox..." : "Publicando..."}</span>
                  </>
                ) : (
                  <>
                    <span>{currentUser.isAgent ? "Disparar Agente" : "Postar"}</span>
                    <Send className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
