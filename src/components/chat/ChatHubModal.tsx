/**
 * > **GOS3** · agente: `claude` · papel: `Arquiteto / Tech Writer` (ver docs/team.md)
 * > fase: `fase 5 — padronização e governança de especificações` · data: `2026-08-21` · hora: `17:55:00 UTC`
 * > antes: Chat Hub com apenas canais de texto e simulador de arquitetura
 * > depois: Chat Hub com Microfone Full Duplex em Tempo Real, suporte a interação 1xN multi-agente, síntese vocal nos canais e painel de integração/ponte n8n
 * > base: commit `gos3-core-v1.0`, docs/GOS3-SPECIFICATION.md
 * > assinatura: `Claude · Arquiteto / Tech Writer · GOS3`
 */

import React, { useState, useEffect, useRef } from "react";
import {
  UserAccount,
  ChatMessage,
  ChatConversation,
  SystemHardwareTelemetry,
  UserQuotaUsage,
  VoiceTurn,
  VoiceInteractionMode,
  N8nBridgeConfig,
} from "../../types";
import {
  MessageSquare,
  Lock,
  Globe,
  Send,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  Zap,
  Terminal,
  Server,
  Layers,
  Database,
  Cpu,
  RefreshCw,
  X,
  ChevronRight,
  HardDrive,
  Users,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Workflow,
  CheckCircle2,
  Loader2,
  Activity,
  Share2,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  allUsers: UserAccount[];
  onOpenBilling?: () => void;
}

export const ChatHubModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  onOpenBilling,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"global" | "private" | "voice_1xn" | "architecture">("global");

  // Global Chat State
  const [globalMessages, setGlobalMessages] = useState<ChatMessage[]>([]);
  const [globalInput, setGlobalInput] = useState("");
  const [isSendingGlobal, setIsSendingGlobal] = useState(false);

  // Private DM State
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<UserAccount | null>(null);
  const [privateMessages, setPrivateMessages] = useState<ChatMessage[]>([]);
  const [privateInput, setPrivateInput] = useState("");
  const [isSendingPrivate, setIsSendingPrivate] = useState(false);

  // Telemetry & Hardware
  const [telemetry, setTelemetry] = useState<SystemHardwareTelemetry | null>(null);
  const [quota, setQuota] = useState<UserQuotaUsage | null>(null);

  // 1xN Voice State
  const [voiceInteractionMode, setVoiceInteractionMode] = useState<VoiceInteractionMode>("1xn_roundtable");
  const [selectedVoiceAgentIds, setSelectedVoiceAgentIds] = useState<string[]>(
    allUsers.filter((u) => u.isAgent).slice(0, 4).map((a) => a.id)
  );
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [isSpeakingVoice, setIsSpeakingVoice] = useState(false);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [voiceTurns, setVoiceTurns] = useState<VoiceTurn[]>([]);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [zeroTokenRAGVoice, setZeroTokenRAGVoice] = useState(true);

  // n8n Bridge State
  const [n8nConfig, setN8nConfig] = useState<N8nBridgeConfig>({
    webhookUrl: "https://n8n.vortex.internal/webhook/gos3-voice-events",
    apiKey: "",
    autoSyncVoice: true,
    autoSyncChat: true,
    workflowName: "Vortex GOS3 Real-Time Multi-Agent Voice Dispatcher",
    status: "idle",
  });
  const [n8nHistory, setN8nHistory] = useState<any[]>([]);
  const [isTestingN8n, setIsTestingN8n] = useState(false);

  // Scale Architecture Simulator State
  const [simUsersScale, setSimUsersScale] = useState<1000 | 10000000>(1000);

  const globalEndRef = useRef<HTMLDivElement>(null);
  const privateEndRef = useRef<HTMLDivElement>(null);
  const voiceEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const speechQueueRef = useRef<{ text: string; pitch: number; rate: number; agentId?: string }[]>([]);
  const isPlayingQueueRef = useRef<boolean>(false);

  const agentsList = allUsers.filter((u) => u.isAgent);

  // Initialize Speech Synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Set up Web Speech Recognition
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "pt-BR";

      recognition.onstart = () => {
        setIsListeningMic(true);
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        setLiveTranscript(interim);

        // Barge-in: if user starts speaking, interrupt agent voice immediately
        if (synthRef.current?.speaking && (interim.length > 2 || final.length > 0)) {
          synthRef.current.cancel();
          speechQueueRef.current = [];
          isPlayingQueueRef.current = false;
          setIsSpeakingVoice(false);
          setActiveSpeakerId(null);
        }

        if (final.trim().length > 0) {
          handleVoiceInputComplete(final.trim());
          setLiveTranscript("");
        }
      };

      recognition.onerror = (err: any) => {
        console.warn("Speech recognition error:", err);
        if (err.error === "not-allowed") {
          toast.warning("Microfone", "Autorize o acesso ao microfone no navegador.");
        }
      };

      recognition.onend = () => {
        if (isListeningMic && isOpen) {
          try {
            recognition.start();
          } catch (_e) {}
        } else {
          setIsListeningMic(false);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      stopListening();
    };
  }, [isOpen, activeTab, voiceInteractionMode, selectedVoiceAgentIds, zeroTokenRAGVoice]);

  // Audio Canvas visualizer loop
  useEffect(() => {
    if (!isOpen) return;

    const bars = 22;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = width / bars - 2;

      for (let i = 0; i < bars; i++) {
        let barHeight = 3;
        if (isListeningMic || isSpeakingVoice) {
          const t = Date.now() / 130 + i * 0.35;
          const factor = isSpeakingVoice ? 0.9 : 0.6;
          barHeight = Math.max(3, Math.sin(t) * (height / 2) * factor + height / 3);
        }

        const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
        if (isSpeakingVoice) {
          gradient.addColorStop(0, "#c084fc");
          gradient.addColorStop(1, "#38bdf8");
        } else if (isListeningMic) {
          gradient.addColorStop(0, "#34d399");
          gradient.addColorStop(1, "#22d3ee");
        } else {
          gradient.addColorStop(0, "#404040");
          gradient.addColorStop(1, "#262626");
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(i * (barWidth + 2), height - barHeight, barWidth, barHeight, 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, isListeningMic, isSpeakingVoice]);

  const startListening = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListeningMic(true);
      } else {
        toast.info("Microfone", "Reconhecimento de voz não suportado neste navegador.");
      }
    } catch (_e) {}
  };

  const stopListening = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      speechQueueRef.current = [];
      isPlayingQueueRef.current = false;
      setIsListeningMic(false);
      setIsSpeakingVoice(false);
      setActiveSpeakerId(null);
    } catch (_e) {}
  };

  const toggleMic = () => {
    if (isListeningMic) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Sequential speech queue for multi-agent voices
  const playNextSpeech = () => {
    if (!synthRef.current || speechQueueRef.current.length === 0) {
      isPlayingQueueRef.current = false;
      setIsSpeakingVoice(false);
      setActiveSpeakerId(null);
      return;
    }

    isPlayingQueueRef.current = true;
    const item = speechQueueRef.current.shift()!;
    setActiveSpeakerId(item.agentId || null);

    const clean = item.text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\[(.*?)\]/g, "")
      .replace(/#+\s/g, "")
      .replace(/`{1,3}.*?`{1,3}/gs, "código omitido")
      .trim();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = "pt-BR";
    utterance.pitch = item.pitch || 1.0;
    utterance.rate = item.rate || 1.05;

    const voices = synthRef.current.getVoices();
    const pt = voices.find((v) => v.lang.startsWith("pt") || v.lang.startsWith("PT"));
    if (pt) utterance.voice = pt;

    utterance.onstart = () => setIsSpeakingVoice(true);
    utterance.onend = () => playNextSpeech();
    utterance.onerror = () => playNextSpeech();

    synthRef.current.speak(utterance);
  };

  const enqueueVoice = (text: string, pitch = 1.0, rate = 1.05, agentId?: string) => {
    speechQueueRef.current.push({ text, pitch, rate, agentId });
    if (!isPlayingQueueRef.current) {
      playNextSpeech();
    }
  };

  const speakSingleMessage = (text: string, agentHandle?: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    speechQueueRef.current = [];

    let pitch = 1.0;
    let rate = 1.05;
    if (agentHandle) {
      const h = agentHandle.toLowerCase();
      if (h.includes("claude")) pitch = 0.95;
      else if (h.includes("grok")) pitch = 1.15;
      else if (h.includes("socrates")) pitch = 0.85;
      else if (h.includes("helena")) pitch = 1.2;
    }

    enqueueVoice(text, pitch, rate);
  };

  const handleVoiceInputComplete = async (text: string) => {
    if (!text.trim()) return;

    if (activeTab === "global") {
      setGlobalInput(text);
      return;
    } else if (activeTab === "private") {
      setPrivateInput(text);
      return;
    }

    // Tab is voice_1xn: execute full 1xN Voice Conference
    const userTurn: VoiceTurn = {
      id: `vt-u-${Date.now()}`,
      speaker: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setVoiceTurns((prev) => [...prev, userTurn]);
    setIsProcessingVoice(true);

    try {
      const res = await fetch("/api/voice/1xn-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          userText: text,
          mode: voiceInteractionMode,
          agentIds: selectedVoiceAgentIds,
          useZeroTokenRAG: zeroTokenRAGVoice,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.agentTurns && Array.isArray(data.agentTurns)) {
          setVoiceTurns((prev) => [...prev, ...data.agentTurns]);

          speechQueueRef.current = [];
          data.agentTurns.forEach((turn: VoiceTurn) => {
            enqueueVoice(turn.text, turn.voicePitch || 1.0, turn.voiceRate || 1.05, turn.agentId);
          });
        }
      }
    } catch (err) {
      console.error("1xN voice error:", err);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Fetch Global Messages
  const fetchGlobal = async () => {
    try {
      const res = await fetch("/api/chat/global");
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setGlobalMessages(data.messages);
      }
    } catch (e) {
      console.error("Erro ao carregar chat global", e);
    }
  };

  // Fetch Conversations & Private Messages
  const fetchConversations = async () => {
    try {
      const res = await fetch(`/api/chat/conversations?userId=${currentUser.id}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
        if (!selectedRecipient && data.conversations.length > 0) {
          const other = data.conversations[0].participants.find(
            (p: UserAccount) => p.id !== currentUser.id
          );
          if (other) setSelectedRecipient(other);
        }
      }
    } catch (e) {
      console.error("Erro ao carregar conversas privadas", e);
    }
  };

  const fetchPrivateMessages = async (recipientId: string) => {
    try {
      const res = await fetch(`/api/chat/private?userA=${currentUser.id}&userB=${recipientId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setPrivateMessages(data.messages);
      }
    } catch (e) {
      console.error("Erro ao carregar mensagens privadas", e);
    }
  };

  // Fetch Telemetry & Quota & n8n Config
  const fetchTelemetryAndQuota = async () => {
    try {
      const [resTel, resQ, resN8n] = await Promise.all([
        fetch("/api/telemetry/hardware"),
        fetch(`/api/telemetry/quota?userId=${currentUser.id}`),
        fetch("/api/n8n/config"),
      ]);
      const dataTel = await resTel.json();
      const dataQ = await resQ.json();
      const dataN8n = await resN8n.json();
      if (dataTel.success) setTelemetry(dataTel.telemetry);
      if (dataQ.success) setQuota(dataQ.quota);
      if (dataN8n.success && dataN8n.config) {
        setN8nConfig(dataN8n.config);
        if (dataN8n.history) setN8nHistory(dataN8n.history);
      }
    } catch (e) {
      console.error("Erro ao carregar telemetria", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGlobal();
      fetchConversations();
      fetchTelemetryAndQuota();
      const interval = setInterval(() => {
        if (activeTab === "global") fetchGlobal();
        if (activeTab === "private" && selectedRecipient)
          fetchPrivateMessages(selectedRecipient.id);
        fetchTelemetryAndQuota();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen, activeTab, selectedRecipient]);

  useEffect(() => {
    if (selectedRecipient) {
      fetchPrivateMessages(selectedRecipient.id);
    }
  }, [selectedRecipient]);

  useEffect(() => {
    globalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [globalMessages]);

  useEffect(() => {
    privateEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [privateMessages]);

  useEffect(() => {
    voiceEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [voiceTurns]);

  const handleSendGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalInput.trim() || isSendingGlobal) return;
    setIsSendingGlobal(true);
    try {
      const res = await fetch("/api/chat/global", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id,
          content: globalInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setGlobalMessages((prev) => [...prev, data.message]);
        setGlobalInput("");
      }
    } catch (e) {
      console.error("Erro ao enviar mensagem global", e);
    } finally {
      setIsSendingGlobal(false);
    }
  };

  const handleSendPrivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateInput.trim() || !selectedRecipient || isSendingPrivate) return;
    setIsSendingPrivate(true);
    try {
      const res = await fetch("/api/chat/private", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: selectedRecipient.id,
          content: privateInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setPrivateMessages((prev) => [...prev, data.message]);
        setPrivateInput("");
        fetchConversations();
      }
    } catch (e) {
      console.error("Erro ao enviar DM", e);
    } finally {
      setIsSendingPrivate(false);
    }
  };

  const handleTestN8nBridge = async () => {
    setIsTestingN8n(true);
    try {
      const res = await fetch("/api/n8n/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: {
            event: "chat_message",
            timestamp: new Date().toISOString(),
            sender: {
              id: currentUser.id,
              name: currentUser.name,
              handle: currentUser.handle,
              isAgent: false,
            },
            data: {
              testMessage: "Ping de Teste da Ponte n8n & Voz Full Duplex 1xN",
              channel: activeTab,
            },
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("n8n Bridge OK", data.message);
        fetchTelemetryAndQuota();
      }
    } catch (e) {
      toast.error("n8n Bridge", "Falha na conexão com n8n.");
    } finally {
      setIsTestingN8n(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="chat-hub-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md"
    >
      <div
        id="chat-hub-modal-container"
        className="w-full max-w-5xl h-[92vh] max-h-[860px] bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-neutral-100 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Top Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                <span>Vortex Chat, Voz 1xN & n8n Bridge</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/40 font-mono">
                  Full Duplex
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Interação vocal e textual 1xN em tempo real, DMs privadas, ponte n8n e arquitetura de 1k a 10M de usuários.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenBilling && (
              <button
                id="chat-hub-open-billing-btn"
                onClick={onOpenBilling}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-700/50 text-purple-200 text-xs font-semibold transition-all"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Quotas</span>
              </button>
            )}
            <button
              id="close-chat-hub-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Live Resource Bar & Microfone Status */}
        <div className="px-4 py-2 bg-neutral-900/40 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-neutral-400 shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-neutral-300 font-semibold">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hardware:</span>
            </span>
            <span className="text-sky-300">
              CPU: <strong className="text-neutral-100">{telemetry?.cpuUsagePercent || 12}%</strong>
            </span>
            <span className="text-purple-300">
              RAM:{" "}
              <strong className="text-neutral-100">
                {telemetry?.ramUsedMB || 420}MB / {telemetry?.ramTotalMB || 2048}MB
              </strong>
            </span>
            <span className="text-teal-300">
              V8 Heap: <strong className="text-neutral-100">{telemetry?.v8HeapUsedMB || 78}MB</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Audio Visualizer Canvas */}
            <canvas ref={canvasRef} width={130} height={20} className="h-5 w-28 rounded bg-neutral-950 border border-neutral-800" />
            
            <button
              onClick={toggleMic}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                isListeningMic
                  ? "bg-rose-600 text-white animate-pulse"
                  : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
              }`}
            >
              {isListeningMic ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3 text-emerald-400" />}
              <span>{isListeningMic ? "Ouvindo" : "Mic 1xN"}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 text-xs font-bold shrink-0">
          <button
            id="tab-chat-global"
            onClick={() => setActiveTab("global")}
            className={`flex-1 py-3 px-3 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeTab === "global"
                ? "border-purple-500 text-purple-400 bg-purple-950/20"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Chat Global</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-300 font-mono">
              {globalMessages.length}
            </span>
          </button>

          <button
            id="tab-chat-private"
            onClick={() => setActiveTab("private")}
            className={`flex-1 py-3 px-3 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeTab === "private"
                ? "border-purple-500 text-purple-400 bg-purple-950/20"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>DMs Privadas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-300 font-mono">
              {conversations.length}
            </span>
          </button>

          <button
            id="tab-chat-voice-n8n"
            onClick={() => setActiveTab("voice_1xn")}
            className={`flex-1 py-3 px-3 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeTab === "voice_1xn"
                ? "border-purple-500 text-purple-400 bg-purple-950/20"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Radio className="w-4 h-4 text-purple-400" />
            <span>Voz 1xN & n8n Bridge</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-sky-950 text-sky-300 font-mono border border-sky-800/40">
              Live
            </span>
          </button>

          <button
            id="tab-chat-architecture"
            onClick={() => setActiveTab("architecture")}
            className={`flex-1 py-3 px-3 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeTab === "architecture"
                ? "border-purple-500 text-purple-400 bg-purple-950/20"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Escala (1k a 10M)</span>
            <span className="sm:hidden">Escala</span>
          </button>
        </div>

        {/* Tab 1: GLOBAL CHAT */}
        {activeTab === "global" && (
          <div className="flex-1 flex flex-col min-h-0 bg-neutral-950">
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
              {globalMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-2xl border transition-all text-xs ${
                    msg.senderId === currentUser.id
                      ? "bg-purple-950/30 border-purple-800/40 ml-4 sm:ml-12"
                      : msg.isAgentGenerated
                      ? "bg-neutral-900/60 border-neutral-800 mr-4 sm:mr-12"
                      : "bg-neutral-900/40 border-neutral-800/80 mr-4 sm:mr-12"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <img
                        src={msg.sender.avatar}
                        alt={msg.sender.name}
                        className="w-5 h-5 rounded-full object-cover border border-neutral-700"
                      />
                      <span className="font-bold text-neutral-200">{msg.sender.name}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">@{msg.sender.handle}</span>
                      {msg.sender.isAgent && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 font-mono">
                          BOT
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => speakSingleMessage(msg.content, msg.sender.handle)}
                        className="p-1 rounded text-neutral-400 hover:text-purple-300 hover:bg-neutral-800 transition-colors"
                        title="Ouvir mensagem por voz"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <p className="text-neutral-200 whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                  {msg.thoughtLog && (
                    <div className="mt-2 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                      <span className="flex items-center gap-1 text-purple-400">
                        <Sparkles className="w-3 h-3" />
                        <span>{msg.thoughtLog.model}</span>
                      </span>
                      <span className="text-neutral-500">{msg.thoughtLog.evidenceHash?.slice(0, 14)}...</span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={globalEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendGlobal}
              className="p-3 border-t border-neutral-800 bg-neutral-900/60 flex items-center gap-2 shrink-0"
            >
              <input
                id="chat-global-input"
                type="text"
                value={globalInput}
                onChange={(e) => setGlobalInput(e.target.value)}
                placeholder="Escreva no canal global (ou use o microfone)..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-xs text-neutral-100 placeholder-neutral-500"
              />
              <button
                type="button"
                onClick={toggleMic}
                className={`p-2.5 rounded-2xl border transition-all ${
                  isListeningMic
                    ? "bg-rose-600 border-rose-500 text-white animate-pulse"
                    : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white"
                }`}
                title="Microfone Full Duplex"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                id="chat-global-send-btn"
                type="submit"
                disabled={!globalInput.trim() || isSendingGlobal}
                className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-900/30 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: PRIVATE DIRECT MESSAGES */}
        {activeTab === "private" && (
          <div className="flex-1 flex min-h-0 bg-neutral-950">
            {/* Contact List */}
            <div className="w-48 sm:w-64 border-r border-neutral-800 bg-neutral-900/40 flex flex-col shrink-0">
              <div className="p-3 border-b border-neutral-800 text-xs font-bold text-neutral-300 flex items-center justify-between">
                <span>DMs & Bots</span>
                <span className="text-[10px] text-purple-400 font-mono">1-on-1</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {allUsers
                  .filter((u) => u.id !== currentUser.id)
                  .map((u) => {
                    const isSelected = selectedRecipient?.id === u.id;
                    return (
                      <button
                        key={u.id}
                        id={`dm-user-select-${u.handle}`}
                        onClick={() => setSelectedRecipient(u)}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-colors text-xs ${
                          isSelected
                            ? "bg-purple-950/70 border border-purple-700/50 text-purple-200 font-semibold"
                            : "hover:bg-neutral-800/60 text-neutral-300"
                        }`}
                      >
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-7 h-7 rounded-full object-cover border border-neutral-700 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-xs font-bold">{u.name}</div>
                          <div className="text-[10px] text-neutral-500 truncate">@{u.handle}</div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Conversation Active Window */}
            <div className="flex-1 flex flex-col min-h-0 bg-neutral-950">
              {selectedRecipient ? (
                <>
                  <div className="p-3 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={selectedRecipient.avatar}
                        alt={selectedRecipient.name}
                        className="w-8 h-8 rounded-full object-cover border border-neutral-700"
                      />
                      <div>
                        <div className="font-bold text-xs text-neutral-100 flex items-center gap-1.5">
                          <span>{selectedRecipient.name}</span>
                          <span className="text-[10px] text-neutral-500 font-mono">@{selectedRecipient.handle}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                    {privateMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-2xl border transition-all text-xs ${
                          msg.senderId === currentUser.id
                            ? "bg-purple-950/40 border-purple-800/50 ml-6 sm:ml-16"
                            : "bg-neutral-900/60 border-neutral-800 mr-6 sm:mr-16"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-neutral-200">{msg.sender.name}</span>
                          <button
                            onClick={() => speakSingleMessage(msg.content, msg.sender.handle)}
                            className="p-1 text-neutral-400 hover:text-purple-300"
                            title="Ouvir mensagem"
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-neutral-200 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                    ))}
                    <div ref={privateEndRef} />
                  </div>

                  <form
                    onSubmit={handleSendPrivate}
                    className="p-3 border-t border-neutral-800 bg-neutral-900/60 flex items-center gap-2 shrink-0"
                  >
                    <input
                      id="chat-dm-input"
                      type="text"
                      value={privateInput}
                      onChange={(e) => setPrivateInput(e.target.value)}
                      placeholder={`Mensagem privada para @${selectedRecipient.handle}...`}
                      className="flex-1 px-4 py-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 focus:border-purple-500 outline-none text-xs text-neutral-100 placeholder-neutral-500"
                    />
                    <button
                      type="button"
                      onClick={toggleMic}
                      className={`p-2.5 rounded-2xl border transition-all ${
                        isListeningMic
                          ? "bg-rose-600 border-rose-500 text-white animate-pulse"
                          : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white"
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                    <button
                      id="chat-dm-send-btn"
                      type="submit"
                      disabled={!privateInput.trim() || isSendingPrivate}
                      className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar DM</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-neutral-500">
                  Selecione um contato ao lado para abrir a conversa.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: VOZ 1xN & n8n BRIDGE */}
        {activeTab === "voice_1xn" && (
          <div className="flex-1 flex flex-col min-h-0 bg-neutral-950">
            {/* Top Toolbar: Mode, Agents, n8n trigger */}
            <div className="p-3 border-b border-neutral-800 bg-neutral-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-neutral-400 font-semibold">Modo 1xN:</span>
                <div className="flex bg-neutral-950 p-0.5 rounded-xl border border-neutral-800">
                  <button
                    onClick={() => setVoiceInteractionMode("1xn_roundtable")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      voiceInteractionMode === "1xn_roundtable"
                        ? "bg-purple-600 text-white"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    Mesa Redonda
                  </button>
                  <button
                    onClick={() => setVoiceInteractionMode("1xn_consensus")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      voiceInteractionMode === "1xn_consensus"
                        ? "bg-sky-600 text-white"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    Consenso
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestN8nBridge}
                  disabled={isTestingN8n}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sky-300 font-semibold flex items-center gap-1.5 border border-sky-800/50 transition-colors"
                >
                  {isTestingN8n ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Workflow className="w-3.5 h-3.5" />}
                  <span>Testar Ponte n8n</span>
                </button>
              </div>
            </div>

            {/* Participating Agent Chips */}
            <div className="px-4 py-2 border-b border-neutral-800/70 bg-neutral-900/30 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-neutral-400 text-[11px] font-medium shrink-0">Agentes no Painel:</span>
              {agentsList.map((ag) => {
                const isSelected = selectedVoiceAgentIds.includes(ag.id);
                const isSpeakingThis = activeSpeakerId === ag.id;
                return (
                  <button
                    key={ag.id}
                    onClick={() => {
                      if (isSelected) {
                        if (selectedVoiceAgentIds.length > 1) {
                          setSelectedVoiceAgentIds(selectedVoiceAgentIds.filter((id) => id !== ag.id));
                        }
                      } else {
                        setSelectedVoiceAgentIds([...selectedVoiceAgentIds, ag.id]);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition-all ${
                      isSpeakingThis
                        ? "bg-purple-600 text-white border-purple-400 ring-2 ring-purple-400/50 animate-pulse font-bold"
                        : isSelected
                        ? "bg-neutral-800 text-neutral-200 border-purple-700/50"
                        : "bg-neutral-950 text-neutral-500 border-neutral-800"
                    }`}
                  >
                    <img src={ag.avatar} alt={ag.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                    <span>@{ag.handle}</span>
                    {isSpeakingThis && <Volume2 className="w-3 h-3 text-white" />}
                  </button>
                );
              })}
            </div>

            {/* 1xN Stream & Turns */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {voiceTurns.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 text-xs py-12">
                  <Radio className="w-10 h-10 mb-2 opacity-30 text-purple-400" />
                  <p className="font-semibold text-neutral-400">Sessão 1xN Pronta para Início</p>
                  <p className="text-[11px]">
                    Clique no botão de microfone abaixo ou digite seu tópico para iniciar a deliberação multi-agente.
                  </p>
                </div>
              ) : (
                voiceTurns.map((turn) => {
                  const isUser = turn.speaker === "user";
                  return (
                    <div
                      key={turn.id}
                      className={`flex gap-2.5 max-w-2xl text-xs ${
                        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                      }`}
                    >
                      <div
                        className={`p-3.5 rounded-2xl border leading-relaxed ${
                          isUser
                            ? "bg-purple-600 text-white border-purple-500"
                            : "bg-neutral-900 text-neutral-200 border-neutral-800"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1 text-[10px]">
                          <span className="font-bold">
                            {isUser ? `@${currentUser.handle}` : `@${turn.agentHandle}`}
                          </span>
                          <span className="opacity-70">{turn.timestamp}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{turn.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
              {isProcessingVoice && (
                <div className="flex items-center gap-2 text-xs text-purple-400 p-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deliberando com os agentes 1xN e calculando evidência formal...</span>
                </div>
              )}
              <div ref={voiceEndRef} />
            </div>

            {/* Bottom 1xN Mic Controls */}
            <div className="p-3 border-t border-neutral-800 bg-neutral-900/70 flex items-center justify-between gap-3">
              <button
                onClick={toggleMic}
                className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all ${
                  isListeningMic
                    ? "bg-rose-600 text-white scale-105"
                    : "bg-gradient-to-r from-purple-600 to-sky-600 text-white hover:scale-105"
                }`}
              >
                {isListeningMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isListeningMic ? "Parar Microfone" : "Falar no Microfone 1xN"}</span>
              </button>

              {isSpeakingVoice && (
                <button
                  onClick={() => {
                    synthRef.current?.cancel();
                    speechQueueRef.current = [];
                    setIsSpeakingVoice(false);
                    setActiveSpeakerId(null);
                  }}
                  className="p-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white"
                  title="Silenciar voz"
                >
                  <VolumeX className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: SCALABLE ARCHITECTURE ESTIMATOR */}
        {activeTab === "architecture" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-neutral-950 text-xs">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
              <div>
                <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-400" />
                  <span>Dimensionamento de Infraestrutura & Persistência</span>
                </h3>
                <p className="text-neutral-400 text-xs mt-0.5">
                  Projeção de recursos e throughput de 1.000 a 10.000.000 usuários simultâneos.
                </p>
              </div>

              <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                <button
                  onClick={() => setSimUsersScale(1000)}
                  className={`px-3 py-1.5 rounded-lg font-mono font-bold transition-all ${
                    simUsersScale === 1000
                      ? "bg-purple-600 text-white"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  1K Usuários
                </button>
                <button
                  onClick={() => setSimUsersScale(10000000)}
                  className={`px-3 py-1.5 rounded-lg font-mono font-bold transition-all ${
                    simUsersScale === 10000000
                      ? "bg-emerald-600 text-white"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  10M Usuários
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800">
                <div className="text-neutral-400 mb-1">Taxa de Mensagens / seg</div>
                <div className="text-xl font-bold font-mono text-purple-400">
                  {simUsersScale === 1000 ? "45 msg/s" : "450.000 msg/s"}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800">
                <div className="text-neutral-400 mb-1">Throughput de Voz 1xN</div>
                <div className="text-xl font-bold font-mono text-sky-400">
                  {simUsersScale === 1000 ? "12 streams" : "120.000 streams"}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800">
                <div className="text-neutral-400 mb-1">Despacho n8n Webhook</div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {simUsersScale === 1000 ? "10 req/s" : "85.000 req/s"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
