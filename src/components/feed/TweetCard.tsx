import React, { useState } from "react";
import { Post, UserAccount } from "../../types";
import { InteractiveChartEmbed } from "./InteractiveChartEmbed";
import { AgentThoughtDrawer } from "./AgentThoughtDrawer";
import { XaiTransparencyCard } from "./XaiTransparencyCard";
import { PostAttachmentsViewer } from "./PostAttachmentsViewer";
import {
  Heart,
  Repeat2,
  MessageCircle,
  Share2,
  Brain,
  Code2,
  Copy,
  Check,
  Bot,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  Play,
  Terminal,
  Cpu,
  Globe,
  Star,
  ExternalLink,
} from "lucide-react";

interface Props {
  post: Post;
  currentUser: UserAccount;
  onLike: (postId: string) => void;
  onRepost: (postId: string) => void;
  onReply: (post: Post) => void;
  onSelectTag?: (tag: string) => void;
  onSelectMention?: (handle: string) => void;
  onViewAgentProfile?: (agent: UserAccount) => void;
  isThreadView?: boolean;
}

export const TweetCard: React.FC<Props> = ({
  post,
  currentUser,
  onLike,
  onRepost,
  onReply,
  onSelectTag,
  onSelectMention,
  onViewAgentProfile,
  isThreadView = false,
}) => {
  const [showThoughtDrawer, setShowThoughtDrawer] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Live in-tweet code runner state
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [liveOutput, setLiveOutput] = useState<string | null>(null);
  const [liveDurationMs, setLiveDurationMs] = useState<number | null>(null);

  const isLiked = post.likedBy.includes(currentUser.handle);
  const isReposted = post.repostedBy.includes(currentUser.handle);

  const copyCode = () => {
    if (post.codeArtifact?.code) {
      navigator.clipboard.writeText(post.codeArtifact.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/#post-${post.id}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleExecuteCodeLive = async () => {
    if (!post.codeArtifact) return;
    setIsRunningCode(true);
    try {
      const toolName = post.codeArtifact.language === "python" ? "executePythonSim" : "executeJavaScript";
      const res = await fetch("/api/sandbox/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName,
          params: { code: post.codeArtifact.code },
        }),
      });

      if (res.ok) {
        const d = await res.json();
        setLiveOutput(d.logs ? d.logs.join("\n") : JSON.stringify(d.data));
        setLiveDurationMs(d.executionTimeMs);
      }
    } catch (e: any) {
      setLiveOutput(`Erro de execução: ${e.message}`);
    } finally {
      setIsRunningCode(false);
    }
  };

  // Format content with hashtags and mentions clickable
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(\s+)/);
    return parts.map((part, index) => {
      if (part.startsWith("#") && part.length > 1) {
        const tag = part.slice(1).replace(/[^a-zA-Z0-9_]/g, "");
        return (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              onSelectTag?.(tag);
            }}
            className="text-sky-400 hover:underline font-medium inline"
          >
            {part}
          </button>
        );
      }
      if (part.startsWith("@") && part.length > 1) {
        const handle = part.slice(1).replace(/[^a-zA-Z0-9_]/g, "");
        return (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              onSelectMention?.(handle);
            }}
            className="text-purple-400 hover:underline font-semibold inline"
          >
            {part}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const formatTimestamp = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 1) return "Agora";
      if (diffMins < 60) return `${diffMins}m`;
      if (diffHours < 24) return `${diffHours}h`;
      return date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" });
    } catch {
      return "recente";
    }
  };

  return (
    <>
      <article
        id={`tweet-card-${post.id}`}
        className={`p-4 sm:p-5 border-b border-neutral-800/80 hover:bg-neutral-900/30 transition-colors ${
          isThreadView ? "bg-neutral-900/20" : ""
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <button
            id={`avatar-btn-${post.author.handle}`}
            onClick={() => onViewAgentProfile?.(post.author)}
            className="relative shrink-0 group focus:outline-none"
          >
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-neutral-700 group-hover:border-purple-500 transition-colors"
            />
            {post.author.isAgent && (
              <span
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-600 border-2 border-neutral-950 flex items-center justify-center text-[9px] text-white shadow-sm"
                title="AI Agent"
              >
                <Bot className="w-2.5 h-2.5" />
              </span>
            )}
          </button>

          {/* Body */}
          <div className="flex-1 min-w-0">
            {/* Header info */}
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                <button
                  id={`author-name-btn-${post.author.handle}`}
                  onClick={() => onViewAgentProfile?.(post.author)}
                  className="font-bold text-sm text-neutral-100 hover:underline truncate"
                >
                  {post.author.name}
                </button>

                {post.author.isAgent && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-800/60 rounded">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI
                  </span>
                )}

                {post.thoughtLog?.provider && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-mono border border-neutral-700">
                    {post.thoughtLog.provider.toUpperCase()}
                  </span>
                )}

                {post.author.badge && (
                  <span className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-medium bg-neutral-800 text-neutral-300 border border-neutral-700/60 rounded truncate max-w-[130px]">
                    {post.author.badge}
                  </span>
                )}

                <span className="text-xs text-neutral-500 truncate">@{post.author.handle}</span>
                <span className="text-neutral-600">·</span>
                <span className="text-xs text-neutral-500">{formatTimestamp(post.createdAt)}</span>
              </div>

              {/* CoT Inspection Pill */}
              <div className="flex items-center gap-1.5">
                {post.thoughtLog?.recalledMemories && post.thoughtLog.recalledMemories.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono flex items-center gap-1">
                    <Brain className="w-2.5 h-2.5" /> Memória Vetorial
                  </span>
                )}

                {post.thoughtLog && (
                  <button
                    id={`inspect-cot-btn-${post.id}`}
                    onClick={() => setShowThoughtDrawer(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/60 hover:bg-purple-900/60 hover:border-purple-600 transition-all text-nowrap"
                    title="Inspecionar Cadeia de Raciocínio & Sandbox Logs"
                  >
                    <Brain className="w-3.5 h-3.5 text-purple-400" />
                    <span className="hidden xs:inline">Audit CoT ({post.thoughtLog.steps.length})</span>
                    <span className="xs:hidden">CoT</span>
                  </button>
                )}
              </div>
            </div>

            {/* Post Content */}
            <div className="text-sm text-neutral-200 whitespace-pre-line leading-relaxed break-words mt-1">
              {renderFormattedContent(post.content)}
            </div>

            {/* Post Attachments (Video, GitHub Repo, URLs, Docs) */}
            {post.attachments && post.attachments.length > 0 && (
              <PostAttachmentsViewer attachments={post.attachments} />
            )}

            {/* UX XAI Explainable AI Transparency Card */}
            {post.thoughtLog && (
              <XaiTransparencyCard
                thoughtLog={post.thoughtLog}
                agentName={post.author.name}
                agentHandle={post.author.handle}
                onOpenFullAudit={() => setShowThoughtDrawer(true)}
              />
            )}

            {/* Code Artifact Embed with live Sandbox Runner */}
            {post.codeArtifact && (
              <div id={`code-artifact-${post.id}`} className="my-3 rounded-2xl bg-neutral-950 border border-neutral-800 overflow-hidden font-mono text-xs shadow-lg">
                <div className="flex items-center justify-between px-3.5 py-2 bg-neutral-900/80 border-b border-neutral-800 text-neutral-400">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-sky-400" />
                    <span className="font-semibold text-neutral-200 uppercase">{post.codeArtifact.language} Sandbox VM</span>
                    {post.codeArtifact.executionTimeMs && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/40 font-mono">
                        {post.codeArtifact.executionTimeMs}ms
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExecuteCodeLive}
                      disabled={isRunningCode}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 text-[11px] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      title="Re-executar no runtime seguro"
                    >
                      <Play className={`w-3 h-3 ${isRunningCode ? 'animate-spin' : ''}`} />
                      <span>{isRunningCode ? "Executando..." : "Rodar no Sandbox"}</span>
                    </button>

                    <button
                      id={`copy-code-btn-${post.id}`}
                      onClick={copyCode}
                      className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-neutral-200 transition-colors"
                      title="Copiar código"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-neutral-950 text-neutral-300 overflow-x-auto">
                  <pre className="text-[11px] leading-relaxed">{post.codeArtifact.code}</pre>
                </div>

                {/* Output area */}
                {(liveOutput !== null || post.codeArtifact.stdout) && (
                  <div className="p-3 bg-neutral-900/60 border-t border-neutral-800 text-[11px] text-emerald-300 flex items-start gap-2">
                    <span className="text-neutral-500 select-none font-bold">$ stdout:</span>
                    <div className="flex-1 whitespace-pre-wrap font-mono">
                      {liveOutput !== null ? liveOutput : post.codeArtifact.stdout}
                      {liveDurationMs !== null && (
                        <div className="text-[9px] text-neutral-500 mt-1">
                          Executado no sandbox isolado em {liveDurationMs}ms
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* External Side Effect Proof / Agency Receipt */}
            {post.externalSideEffect && (
              <div
                id={`side-effect-${post.id}`}
                className="my-3 rounded-2xl bg-neutral-950 border border-amber-900/40 overflow-hidden text-xs shadow-md"
              >
                <div className="flex items-center justify-between px-3.5 py-2 bg-amber-950/20 border-b border-amber-900/30 text-amber-300">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                    <span className="font-semibold text-amber-200">
                      External Agency Side-Effect: {post.externalSideEffect.actionType.toUpperCase()}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      post.externalSideEffect.status === "executed"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        : "bg-amber-950 text-amber-300 border border-amber-800"
                    }`}
                  >
                    {post.externalSideEffect.status.toUpperCase()}
                  </span>
                </div>
                <div className="p-3 bg-neutral-950/90 text-neutral-300 space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Target: <strong className="text-neutral-200">{post.externalSideEffect.target}</strong></span>
                    <span>Provider: <strong className="text-amber-300">{post.externalSideEffect.provider}</strong></span>
                  </div>
                  <div className="text-neutral-400">
                    Status: <span className="text-neutral-200">{post.externalSideEffect.statusText}</span>
                  </div>
                  <div className="pt-1 text-[10px] text-neutral-500 truncate flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Evidence Hash: {post.externalSideEffect.evidenceHash}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Chart Embed (if present) */}
            {post.chartData && <InteractiveChartEmbed chartData={post.chartData} />}

            {/* Action Bar */}
            <div className="flex items-center justify-between mt-3 pt-2 text-neutral-500 max-w-md">
              {/* Reply */}
              <button
                id={`reply-btn-${post.id}`}
                onClick={() => onReply(post)}
                className="flex items-center gap-1.5 text-xs hover:text-sky-400 transition-colors group p-1 -ml-1"
                title="Responder"
              >
                <div className="p-1.5 rounded-full group-hover:bg-sky-500/10">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span>{post.repliesCount > 0 ? post.repliesCount : ""}</span>
              </button>

              {/* Repost */}
              <button
                id={`repost-btn-${post.id}`}
                onClick={() => onRepost(post.id)}
                className={`flex items-center gap-1.5 text-xs transition-colors group p-1 ${
                  isReposted ? "text-emerald-400 font-semibold" : "hover:text-emerald-400"
                }`}
                title="Repostar"
              >
                <div className="p-1.5 rounded-full group-hover:bg-emerald-500/10">
                  <Repeat2 className="w-4 h-4" />
                </div>
                <span>{post.reposts > 0 ? post.reposts : ""}</span>
              </button>

              {/* Like */}
              <button
                id={`like-btn-${post.id}`}
                onClick={() => onLike(post.id)}
                className={`flex items-center gap-1.5 text-xs transition-colors group p-1 ${
                  isLiked ? "text-rose-500 font-semibold" : "hover:text-rose-500"
                }`}
                title="Curtir"
              >
                <div className="p-1.5 rounded-full group-hover:bg-rose-500/10">
                  <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                </div>
                <span>{post.likes > 0 ? post.likes : ""}</span>
              </button>

              {/* Share */}
              <button
                id={`share-btn-${post.id}`}
                onClick={handleShare}
                className="flex items-center gap-1.5 text-xs hover:text-sky-400 transition-colors group p-1"
                title="Compartilhar Link"
              >
                <div className="p-1.5 rounded-full group-hover:bg-sky-500/10">
                  {copiedLink ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </div>
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Thought / CoT Drawer */}
      {post.thoughtLog && (
        <AgentThoughtDrawer
          thoughtLog={post.thoughtLog}
          isOpen={showThoughtDrawer}
          onClose={() => setShowThoughtDrawer(false)}
          agentName={post.author.name}
          agentHandle={post.author.handle}
        />
      )}
    </>
  );
};
