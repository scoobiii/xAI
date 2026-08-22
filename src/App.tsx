import React, { useState, useEffect } from "react";
import { FeedFilter, Post, UserAccount, DebateSession } from "./types";
import { SidebarNavigation } from "./components/layout/SidebarNavigation";
import { RightSidebar } from "./components/layout/RightSidebar";
import { Header } from "./components/layout/Header";
import { ComposeTweet } from "./components/feed/ComposeTweet";
import { TweetCard } from "./components/feed/TweetCard";
import { ThreadViewModal } from "./components/feed/ThreadViewModal";
import { AgentDirectory } from "./components/agents/AgentDirectory";
import { AgentProfileModal } from "./components/agents/AgentProfileModal";
import { AgentStudioModal } from "./components/agents/AgentStudioModal";
import { DebateArenaModal } from "./components/agents/DebateArenaModal";
import { SandboxLabModal } from "./components/sandbox/SandboxLabModal";
import { ModelGatewayModal } from "./components/gateway/ModelGatewayModal";
import { VectorMemoryModal } from "./components/memory/VectorMemoryModal";
import { AuthModal } from "./components/auth/AuthModal";
import { DocsHubModal } from "./components/modals/DocsHubModal";
import { ChatHubModal } from "./components/chat/ChatHubModal";
import { ResourceBillingModal } from "./components/telemetry/ResourceBillingModal";
import { GOS3ScrumLiveModal } from "./components/scrum/GOS3ScrumLiveModal";
import { K6PerformanceMonitor } from "./components/telemetry/K6PerformanceMonitor";
import { FullDuplexVoiceModal } from "./components/voice/FullDuplexVoiceModal";
import { ToastContainer } from "./components/notifications/ToastContainer";
import { GrokCleanAssistantView } from "./components/grok/GrokCleanAssistantView";
import { ConnectorsModal } from "./components/connectors/ConnectorsModal";
import { GoogleColabChatSandbox } from "./components/sandbox/GoogleColabChatSandbox";
import { AgentActivityMetricsModal } from "./components/telemetry/AgentActivityMetricsModal";
import { Loader2, RefreshCw, Sparkles, Bot, Terminal, Swords, Compass } from "lucide-react";

export default function App() {
  const [currentView, setCurrentView] = useState<"feed" | "agents" | "debates" | "sandbox" | "grok_clean">("feed");
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("for-you");
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [agents, setAgents] = useState<UserAccount[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [debates, setDebates] = useState<DebateSession[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeThreadPost, setActiveThreadPost] = useState<Post | null>(null);
  const [activeAgentProfile, setActiveAgentProfile] = useState<UserAccount | null>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isDebateOpen, setIsDebateOpen] = useState(false);
  const [isSandboxLabOpen, setIsSandboxLabOpen] = useState(false);
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isChatHubOpen, setIsChatHubOpen] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isGOS3LiveOpen, setIsGOS3LiveOpen] = useState(false);
  const [isK6Open, setIsK6Open] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isConnectorsOpen, setIsConnectorsOpen] = useState(false);
  const [isActivityMetricsOpen, setIsActivityMetricsOpen] = useState(false);

  // Initial Data Fetch & Auth Persistence
  const fetchData = async () => {
    try {
      setLoadingPosts(true);
      const [usersRes, agentsRes, postsRes, debatesRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/agents"),
        fetch(`/api/posts?filter=${feedFilter}${selectedTag ? `&tag=${selectedTag}` : ""}`),
        fetch("/api/debates"),
      ]);

      const [usersData, agentsData, postsData, debatesData] = await Promise.all([
        usersRes.json(),
        agentsRes.json(),
        postsRes.json(),
        debatesRes.json(),
      ]);

      setUsers(usersData);
      setAgents(agentsData);
      setPosts(postsData);
      setDebates(debatesData);

      // Restore saved user or default
      const savedUserHandle = localStorage.getItem("moltbot_auth_user_handle");
      if (savedUserHandle) {
        const matched = usersData.find((u: UserAccount) => u.handle.toLowerCase() === savedUserHandle.toLowerCase());
        if (matched) {
          setCurrentUser(matched);
          return;
        }
      }

      if (!currentUser && usersData.length > 0) {
        // Default to human PO user @sobrinhoSJ or first user
        const defaultUser = usersData.find((u: UserAccount) => u.handle === "sobrinhoSJ") || usersData[0];
        setCurrentUser(defaultUser);
        localStorage.setItem("moltbot_auth_user_handle", defaultUser.handle);
      }
    } catch (e) {
      console.error("Failed to load initial data:", e);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-poll every 3.5 seconds to receive asynchronous agent replies and thread updates smoothly
    const interval = setInterval(() => {
      fetch(`/api/posts?filter=${feedFilter}${selectedTag ? `&tag=${selectedTag}` : ""}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setPosts(data);
          }
        })
        .catch(() => {});
    }, 3500);

    return () => clearInterval(interval);
  }, [feedFilter, selectedTag]);

  // Actions
  const handlePublishPost = async (
    content: string,
    authorId: string,
    parentId?: string,
    threadRootId?: string,
    attachments?: any[]
  ) => {
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId,
          content,
          parentId,
          threadRootId,
          tags: selectedTag ? [selectedTag] : [],
          attachments: attachments || [],
        }),
      });

      if (res.ok) {
        const newPost = await res.json();
        setPosts((prev) => [newPost, ...prev]);

        // Auto refresh feed after 1.5s to catch any auto-replies from mentioned agents
        setTimeout(() => {
          fetchData();
        }, 1600);
      }
    } catch (e) {
      console.error("Failed to publish post:", e);
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userHandle: currentUser.handle }),
      });
      if (res.ok) {
        const { post: updatedPost } = await res.json();
        setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
        if (activeThreadPost && activeThreadPost.id === postId) {
          setActiveThreadPost(updatedPost);
        }
      }
    } catch (e) {
      console.error("Like failed:", e);
    }
  };

  const handleRepost = async (postId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/posts/${postId}/repost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userHandle: currentUser.handle }),
      });
      if (res.ok) {
        const { post: updatedPost } = await res.json();
        setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
      }
    } catch (e) {
      console.error("Repost failed:", e);
    }
  };

  const handleSelectMention = (handle: string) => {
    const foundAgent = agents.find((a) => a.handle.toLowerCase() === handle.toLowerCase());
    if (foundAgent) {
      setActiveAgentProfile(foundAgent);
    }
  };

  const handleMentionInFeed = (agent: UserAccount) => {
    setCurrentView("feed");
    const mentionText = `@${agent.handle} `;
    const input = document.getElementById("compose-tweet-input") as HTMLTextAreaElement;
    if (input) {
      input.value = `${mentionText}${input.value}`;
      input.focus();
    }
  };

  if (!currentUser) {
    return (
      <div className="h-screen w-screen bg-neutral-950 flex items-center justify-center text-neutral-400 font-sans">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        <span className="ml-2 text-sm">Carregando MoltBot Network & Runtime de Agentes...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex justify-center font-sans antialiased selection:bg-purple-900 selection:text-white">
      {/* Real-time Toast Notifications Hub */}
      <ToastContainer />

      <div className="w-full max-w-7xl flex">
        {/* Left Sidebar Navigation */}
        <SidebarNavigation
          currentView={currentView}
          onSelectView={(view) => {
            if (view === "debates") {
              setIsDebateOpen(true);
            } else if (view === "sandbox") {
              setIsSandboxLabOpen(true);
            } else {
              setCurrentView(view);
            }
          }}
          currentUser={currentUser || users[0]}
          allUsers={users}
          onSwitchUser={(user) => {
            setCurrentUser(user);
            localStorage.setItem("moltbot_auth_user_handle", user.handle);
          }}
          onOpenCompose={() => {
            setCurrentView("feed");
            const input = document.getElementById("compose-tweet-input");
            input?.focus();
          }}
          onOpenStudio={() => setIsStudioOpen(true)}
          onOpenGateway={() => setIsGatewayOpen(true)}
          onOpenMemory={() => setIsMemoryOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenDocs={() => setIsDocsOpen(true)}
          onOpenChat={() => setIsChatHubOpen(true)}
          onOpenBilling={() => setIsBillingOpen(true)}
          onOpenGOS3Live={() => setIsGOS3LiveOpen(true)}
          onOpenK6={() => setIsK6Open(true)}
          onOpenVoice={() => setIsVoiceOpen(true)}
          onOpenConnectors={() => setIsConnectorsOpen(true)}
          onOpenActivityMetrics={() => setIsActivityMetricsOpen(true)}
        />

        {/* Center Main Feed or Directory */}
        <main className="flex-1 min-w-0 border-r border-neutral-800/80 min-h-screen">
          {currentView === "feed" ? (
            <div>
              {/* Header & Tabs */}
              <Header
                currentFilter={feedFilter}
                onSelectFilter={(f) => {
                  setFeedFilter(f);
                  setSelectedTag(undefined);
                }}
                selectedTag={selectedTag}
                onClearTag={() => setSelectedTag(undefined)}
                currentUser={currentUser}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onOpenChat={() => setIsChatHubOpen(true)}
                onOpenBilling={() => setIsBillingOpen(true)}
                onOpenGrokClean={() => setCurrentView("grok_clean")}
                onOpenConnectors={() => setIsConnectorsOpen(true)}
                onOpenActivityMetrics={() => setIsActivityMetricsOpen(true)}
              />

              {/* Compose Box */}
              <ComposeTweet
                currentUser={currentUser}
                allUsers={users}
                onSwitchUser={(u) => setCurrentUser(u)}
                onPublish={(content, authorId) => handlePublishPost(content, authorId)}
              />

              {/* Feed Post List */}
              {loadingPosts ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3 text-neutral-400 text-sm">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                  <span>Sincronizando feed híbrido e oráculos de agentes...</span>
                </div>
              ) : posts.length === 0 ? (
                <div className="p-12 text-center text-neutral-500 space-y-2">
                  <Bot className="w-10 h-10 mx-auto text-neutral-600 mb-2" />
                  <div className="font-semibold text-neutral-300">Nenhum post encontrado nesta visualização</div>
                  <div className="text-xs">Seja o primeiro a publicar ou mencione um agente para gerar uma resposta.</div>
                </div>
              ) : (
                <div className="divide-y divide-neutral-800/60">
                  {posts.map((post) => (
                    <TweetCard
                      key={post.id}
                      post={post}
                      currentUser={currentUser}
                      onLike={handleLike}
                      onRepost={handleRepost}
                      onReply={(p) => setActiveThreadPost(p)}
                      onSelectTag={(tag) => setSelectedTag(tag)}
                      onSelectMention={handleSelectMention}
                      onViewAgentProfile={(ag) => setActiveAgentProfile(ag)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <AgentDirectory
              agents={agents}
              onSelectAgent={(ag) => setActiveAgentProfile(ag)}
              onOpenStudio={() => setIsStudioOpen(true)}
              onMentionInFeed={handleMentionInFeed}
            />
          )}
        </main>

        {/* Right Sidebar (Trends & Featured Agents) */}
        <RightSidebar
          agents={agents}
          onSelectTag={(tag) => {
            setSelectedTag(tag);
            setCurrentView("feed");
          }}
          onMentionAgent={handleMentionInFeed}
          onViewAgentProfile={(ag) => setActiveAgentProfile(ag)}
          onOpenActivityMetrics={() => setIsActivityMetricsOpen(true)}
        />
      </div>

      {/* --- Modals & Drawers --- */}

      {/* 1. Thread View Modal */}
      {activeThreadPost && (
        <ThreadViewModal
          rootPost={activeThreadPost}
          currentUser={currentUser}
          allUsers={users}
          isOpen={Boolean(activeThreadPost)}
          onClose={() => setActiveThreadPost(null)}
          onLike={handleLike}
          onRepost={handleRepost}
          onReplyToThread={handlePublishPost}
          onSwitchUser={(u) => setCurrentUser(u)}
          onViewAgentProfile={(ag) => setActiveAgentProfile(ag)}
        />
      )}

      {/* 2. Agent Profile Modal */}
      {activeAgentProfile && (
        <AgentProfileModal
          agent={activeAgentProfile}
          currentUser={currentUser}
          agentPosts={posts.filter((p) => p.authorId === activeAgentProfile.id)}
          isOpen={Boolean(activeAgentProfile)}
          onClose={() => setActiveAgentProfile(null)}
          onLike={handleLike}
          onRepost={handleRepost}
          onReply={(p) => setActiveThreadPost(p)}
          onMentionInFeed={handleMentionInFeed}
        />
      )}

      {/* 3. Agent Studio Modal */}
      <AgentStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        onAgentCreated={(newAgent) => {
          setAgents((prev) => [newAgent, ...prev]);
          setUsers((prev) => [newAgent, ...prev]);
          setActiveAgentProfile(newAgent);
        }}
      />

      {/* 4. Multi-Agent Debate Arena Modal */}
      <DebateArenaModal
        agents={agents}
        debates={debates}
        isOpen={isDebateOpen}
        onClose={() => setIsDebateOpen(false)}
        onPostCreated={(newPost) => {
          setPosts((prev) => [newPost, ...prev]);
        }}
      />

      {/* 5. Sandbox Lab & Tool Tester Modal */}
      <SandboxLabModal
        isOpen={isSandboxLabOpen}
        onClose={() => setIsSandboxLabOpen(false)}
      />

      {/* 6. Multi-Model LLM Gateway Configuration Modal */}
      <ModelGatewayModal
        isOpen={isGatewayOpen}
        onClose={() => setIsGatewayOpen(false)}
      />

      {/* 7. Persistent Vector Memory & Semantic Search Modal */}
      <VectorMemoryModal
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
      />

      {/* 8. Real Human / Google Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(loggedInUser) => {
          setCurrentUser(loggedInUser);
          localStorage.setItem("moltbot_auth_user_handle", loggedInUser.handle);
          setUsers((prev) => {
            const exists = prev.some((u) => u.id === loggedInUser.id || u.handle === loggedInUser.handle);
            if (!exists) return [loggedInUser, ...prev];
            return prev.map((u) => (u.handle === loggedInUser.handle ? loggedInUser : u));
          });
        }}
      />

      {/* 9. Documentation, Conversations & Sprints Hub Modal */}
      <DocsHubModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />

      {/* 10. Persistent Real-time Global & Private Chat Hub */}
      {currentUser && (
        <ChatHubModal
          isOpen={isChatHubOpen}
          onClose={() => setIsChatHubOpen(false)}
          currentUser={currentUser}
          allUsers={users}
          onOpenBilling={() => {
            setIsChatHubOpen(false);
            setIsBillingOpen(true);
          }}
        />
      )}

      {/* 11. Hardware Resource, Quota Telemetry & Billing Modal */}
      {currentUser && (
        <ResourceBillingModal
          isOpen={isBillingOpen}
          onClose={() => setIsBillingOpen(false)}
          currentUser={currentUser}
        />
      )}

      {/* 12. GOS3 Scrum Agile Review & Cloud Run Live Screen View Modal */}
      <GOS3ScrumLiveModal
        isOpen={isGOS3LiveOpen}
        onClose={() => setIsGOS3LiveOpen(false)}
        agents={agents}
        currentUser={currentUser}
      />

      {/* 13. K6 Performance & High-Traffic Load Testing Suite */}
      <K6PerformanceMonitor
        isOpen={isK6Open}
        onClose={() => setIsK6Open(false)}
      />

      {/* 14. Full Duplex Voice & Barge-in Interaction Modal */}
      <FullDuplexVoiceModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        agents={agents}
        currentUser={currentUser}
      />

      {/* 15. Agent Activity Weekly Heatmap & Interaction Frequency Telemetry Modal (Recharts) */}
      <AgentActivityMetricsModal
        isOpen={isActivityMetricsOpen}
        onClose={() => setIsActivityMetricsOpen(false)}
        agents={agents}
        onSelectAgentProfile={(ag) => {
          setIsActivityMetricsOpen(false);
          setActiveAgentProfile(ag);
        }}
      />
    </div>
  );
}
