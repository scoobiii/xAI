import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { UserAccount } from "../types";

export type ToastType =
  | "agent_task_complete"
  | "gos3_deliberation"
  | "success"
  | "info"
  | "warning"
  | "error";

export interface ToastNotification {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  agent?: {
    name: string;
    handle: string;
    avatar?: string;
    role?: string;
  };
  taskTitle?: string;
  sprintId?: string;
  score?: string;
  evidenceHash?: string;
  storyPoints?: number;
  durationMs?: number;
  createdAt: number;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ShowAgentTaskCompleteParams {
  agent: {
    name: string;
    handle: string;
    avatar?: string;
    role?: string;
  } | UserAccount;
  taskTitle: string;
  score?: string;
  evidenceHash?: string;
  storyPoints?: number;
  sprintName?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

interface ToastContextType {
  toasts: ToastNotification[];
  showToast: (toast: Omit<ToastNotification, "id" | "createdAt">) => string;
  showAgentTaskComplete: (params: ShowAgentTaskCompleteParams) => string;
  success: (title: string, message?: string, onAction?: () => void, actionLabel?: string) => string;
  info: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Web Audio API subtle chime synthesizer for task completion notifications
function playChime(type: ToastType) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "agent_task_complete" || type === "gos3_deliberation") {
      // Pleasant two-tone harmonic bell
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.12); // A5
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(1174.66, now + 0.08); // D6
      gain2.gain.setValueAtTime(0.08, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.7);
    } else if (type === "success") {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch (_e) {
    // Audio context may be restricted by autoplay policy until user gesture
  }
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timeoutsRef.current.has(id)) {
      clearTimeout(timeoutsRef.current.get(id));
      timeoutsRef.current.delete(id);
    }
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current.clear();
  }, []);

  const showToast = useCallback(
    (toastData: Omit<ToastNotification, "id" | "createdAt">): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const durationMs = toastData.durationMs ?? (toastData.type === "agent_task_complete" ? 7000 : 5000);

      const newToast: ToastNotification = {
        ...toastData,
        id,
        durationMs,
        createdAt: Date.now(),
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // Keep at most 5 active toasts
      playChime(toastData.type);

      if (durationMs > 0) {
        const timer = setTimeout(() => {
          removeToast(id);
        }, durationMs);
        timeoutsRef.current.set(id, timer);
      }

      return id;
    },
    [removeToast]
  );

  const showAgentTaskComplete = useCallback(
    (params: ShowAgentTaskCompleteParams): string => {
      const agentObj = {
        name: params.agent.name,
        handle: params.agent.handle.startsWith("@") ? params.agent.handle : `@${params.agent.handle}`,
        avatar: (params.agent as any).avatar || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
        role: (params.agent as any).humanPersona?.academicTitle || "GOS3 Core Agent",
      };

      return showToast({
        type: "agent_task_complete",
        title: `Tarefa Concluída por ${agentObj.name}`,
        message: params.message || `O agente ${agentObj.handle} finalizou a entrega com auditoria formal e validação pelo GOS3 Agile.`,
        agent: agentObj,
        taskTitle: params.taskTitle,
        score: params.score || "3.0 / 3.0",
        evidenceHash: params.evidenceHash,
        storyPoints: params.storyPoints || 5,
        sprintId: params.sprintName || "Sprint GOS3 #42",
        actionLabel: params.actionLabel || "Ver no Scrum Agile",
        onAction: params.onAction,
        durationMs: params.durationMs ?? 7500,
      });
    },
    [showToast]
  );

  const success = useCallback(
    (title: string, message?: string, onAction?: () => void, actionLabel?: string): string => {
      return showToast({
        type: "success",
        title,
        message,
        onAction,
        actionLabel,
      });
    },
    [showToast]
  );

  const info = useCallback(
    (title: string, message?: string): string => {
      return showToast({
        type: "info",
        title,
        message,
      });
    },
    [showToast]
  );

  const warning = useCallback(
    (title: string, message?: string): string => {
      return showToast({
        type: "warning",
        title,
        message,
      });
    },
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string): string => {
      return showToast({
        type: "error",
        title,
        message,
        durationMs: 8000,
      });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showAgentTaskComplete,
        success,
        info,
        warning,
        error,
        removeToast,
        clearAll,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
