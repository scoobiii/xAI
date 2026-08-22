import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Zap,
  GraduationCap,
  ArrowRight
} from "lucide-react";
import { useToast, ToastNotification } from "../../context/ToastContext";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div
      id="global-toast-container"
      aria-live="polite"
      className="fixed top-5 right-5 z-[99999] flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface ToastItemProps {
  toast: ToastNotification;
  onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const isAgentTask = toast.type === "agent_task_complete" || toast.type === "gos3_deliberation";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.94, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -15, scale: 0.9, filter: "blur(2px)", transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 450, damping: 30 }}
      id={`toast-item-${toast.id}`}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl p-4 shadow-2xl backdrop-blur-xl border transition-all duration-200 ${
        isAgentTask
          ? "bg-neutral-950/95 border-purple-500/40 shadow-purple-950/30 text-white"
          : toast.type === "success"
          ? "bg-neutral-950/95 border-emerald-500/40 shadow-emerald-950/30 text-white"
          : toast.type === "error"
          ? "bg-neutral-950/95 border-rose-500/40 shadow-rose-950/30 text-white"
          : toast.type === "warning"
          ? "bg-neutral-950/95 border-amber-500/40 shadow-amber-950/30 text-white"
          : "bg-neutral-950/95 border-blue-500/40 shadow-blue-950/30 text-white"
      }`}
    >
      {/* Background ambient gradient glow */}
      <div
        className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none ${
          isAgentTask
            ? "bg-purple-500"
            : toast.type === "success"
            ? "bg-emerald-500"
            : toast.type === "error"
            ? "bg-rose-500"
            : "bg-blue-500"
        }`}
      />

      {/* Header bar / Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {isAgentTask ? (
            <div className="relative">
              <img
                src={
                  toast.agent?.avatar ||
                  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80"
                }
                alt={toast.agent?.name || "Agent"}
                className="w-10 h-10 rounded-full object-cover border-2 border-purple-500/60 shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-neutral-950 p-0.5 rounded-full ring-2 ring-neutral-950">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
          ) : (
            <div
              className={`p-2 rounded-xl border ${
                toast.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : toast.type === "error"
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  : toast.type === "warning"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-blue-500/10 text-blue-400 border-blue-500/20"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : toast.type === "error" ? (
                <AlertCircle className="w-5 h-5" />
              ) : toast.type === "warning" ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Info className="w-5 h-5" />
              )}
            </div>
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              {isAgentTask && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                  GOS3 Scrum Delivery
                </span>
              )}
              {toast.score && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {toast.score}
                </span>
              )}
            </div>
            <span className="text-sm font-bold text-white leading-tight mt-0.5">
              {toast.title}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800/60 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Task detail card for Agent Task Completion */}
      {isAgentTask && toast.taskTitle && (
        <div className="mt-3 p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800/90 text-xs">
          <div className="text-[11px] text-neutral-400 flex items-center justify-between mb-1">
            <span className="font-semibold text-purple-300 flex items-center gap-1">
              <Zap className="w-3 h-3 text-purple-400" />
              {toast.agent?.handle || "@GAIStudioDev"}
            </span>
            <span className="font-mono text-neutral-500">{toast.sprintId || "Sprint #42"}</span>
          </div>
          <p className="font-medium text-neutral-200 line-clamp-2 leading-relaxed">
            {toast.taskTitle}
          </p>

          {toast.evidenceHash && (
            <div className="mt-2 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px]">
              <span className="text-neutral-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Lean 4 / Z3 Proved
              </span>
              <span className="font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                {toast.evidenceHash.substring(0, 14)}...
              </span>
            </div>
          )}
        </div>
      )}

      {/* General text message if provided */}
      {!isAgentTask && toast.message && (
        <p className="mt-2 text-xs text-neutral-300 leading-relaxed">
          {toast.message}
        </p>
      )}

      {/* Interactive Action Button */}
      {toast.onAction && (
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            onClick={() => {
              toast.onAction?.();
              onClose();
            }}
            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-900/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>{toast.actionLabel || "Ver Detalhes"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Auto-dismiss progress bar */}
      {toast.durationMs && toast.durationMs > 0 && (
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: toast.durationMs / 1000, ease: "linear" }}
          className={`absolute bottom-0 left-0 h-0.5 ${
            isAgentTask
              ? "bg-gradient-to-r from-purple-500 to-indigo-400"
              : toast.type === "success"
              ? "bg-emerald-500"
              : toast.type === "error"
              ? "bg-rose-500"
              : "bg-blue-500"
          }`}
        />
      )}
    </motion.div>
  );
};
