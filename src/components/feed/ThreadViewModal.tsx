import React, { useState, useEffect } from "react";
import { Post, UserAccount } from "../../types";
import { TweetCard } from "./TweetCard";
import { ComposeTweet } from "./ComposeTweet";
import { X, CornerDownRight, Loader2, MessageSquare } from "lucide-react";

interface Props {
  rootPost: Post;
  currentUser: UserAccount;
  allUsers: UserAccount[];
  isOpen: boolean;
  onClose: () => void;
  onLike: (postId: string) => void;
  onRepost: (postId: string) => void;
  onReplyToThread: (content: string, authorId: string, parentId: string, threadRootId: string) => Promise<void>;
  onSwitchUser: (user: UserAccount) => void;
  onViewAgentProfile?: (agent: UserAccount) => void;
}

export const ThreadViewModal: React.FC<Props> = ({
  rootPost,
  currentUser,
  allUsers,
  isOpen,
  onClose,
  onLike,
  onRepost,
  onReplyToThread,
  onSwitchUser,
  onViewAgentProfile,
}) => {
  const [threadPosts, setThreadPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const rootId = rootPost.threadRootId || rootPost.id;

  const fetchThread = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/posts?threadRootId=${rootId}`);
      if (res.ok) {
        const data = await res.json();
        setThreadPosts(data);
      }
    } catch (e) {
      console.error("Failed to load thread:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchThread();
    }
  }, [isOpen, rootId]);

  if (!isOpen) return null;

  return (
    <div id="thread-view-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div
        id="thread-view-modal-container"
        className="w-full max-w-2xl max-h-[90vh] bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden text-neutral-100"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/70">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-base text-neutral-100">Conversação / Thread</h3>
            <span className="text-xs text-neutral-400">
              ({threadPosts.length > 0 ? threadPosts.length : 1} posts)
            </span>
          </div>
          <button
            id="close-thread-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thread Posts List */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/80">
          {loading ? (
            <div className="p-8 flex items-center justify-center gap-2 text-neutral-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span>Carregando thread encadeada...</span>
            </div>
          ) : (
            <>
              {threadPosts.length === 0 ? (
                <TweetCard
                  post={rootPost}
                  currentUser={currentUser}
                  onLike={onLike}
                  onRepost={onRepost}
                  onReply={() => {}}
                  onViewAgentProfile={onViewAgentProfile}
                  isThreadView={true}
                />
              ) : (
                threadPosts.map((p, idx) => (
                  <div key={p.id} className="relative">
                    {idx > 0 && (
                      <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-neutral-800 -z-10" />
                    )}
                    <TweetCard
                      post={p}
                      currentUser={currentUser}
                      onLike={onLike}
                      onRepost={onRepost}
                      onReply={() => {}}
                      onViewAgentProfile={onViewAgentProfile}
                      isThreadView={true}
                    />
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Reply Composer inside Thread */}
        <div className="border-t border-neutral-800 bg-neutral-900/40 p-2">
          <div className="text-xs text-neutral-400 px-3 pt-2 flex items-center gap-1">
            <CornerDownRight className="w-3.5 h-3.5 text-purple-400" />
            <span>
              Respondendo à thread de <strong className="text-neutral-200">@{rootPost.author.handle}</strong>
            </span>
          </div>
          <ComposeTweet
            currentUser={currentUser}
            allUsers={allUsers}
            onSwitchUser={onSwitchUser}
            placeholder={`Escreva sua resposta na thread... Mencione agentes (@VortexGrid, @CryptoQuant) para cálculos.`}
            onPublish={async (content, authorId) => {
              const lastPost = threadPosts[threadPosts.length - 1] || rootPost;
              await onReplyToThread(content, authorId, lastPost.id, rootId);
              await fetchThread();
            }}
          />
        </div>
      </div>
    </div>
  );
};
