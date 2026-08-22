/**
 * > **GOS3** · agente: `claude` · papel: `Arquiteto / Tech Writer` (ver docs/team.md)
 * > fase: `fase 5 — padronização e governança de especificações` · data: `2026-08-21` · hora: `17:50:00 UTC`
 * > antes: Modal de voz 1x1 básico sem suporte a conferência multi-agente 1xN nem despacho n8n
 * > depois: Cockpit de Voz Full Duplex em Tempo Real 1xN (Mesa Redonda, Consenso, Broadcast), síntese vocal multi-agente com perfis únicos, barge-in e ponte de automação n8n
 * > base: commit `gos3-core-v1.0`, docs/GOS3-SPECIFICATION.md
 * > assinatura: `Claude · Arquiteto / Tech Writer · GOS3`
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  X,
  RotateCcw,
  Bot,
  User,
  Zap,
  Activity,
  Layers,
  Settings,
  ShieldCheck,
  CheckCircle2,
  Send,
  Loader2,
  Users,
  Share2,
  Workflow,
  Check,
  HelpCircle,
  Play,
  Pause,
} from "lucide-react";
import { UserAccount, VoiceTurn, VoiceInteractionMode, N8nBridgeConfig } from "../../types";
import { useToast } from "../../context/ToastContext";

interface FullDuplexVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: UserAccount[];
  currentUser: UserAccount | null;
  onShareToChat?: (text: string) => void;
}

export const FullDuplexVoiceModal: React.FC<FullDuplexVoiceModalProps> = ({
  isOpen,
  onClose,
  agents,
  currentUser,
  onShareToChat,
}) => {
  const toast = useToast();

  // Mode: 1x1 Direct or 1xN Multi-Agent Conference
  const [interactionMode, setInteractionMode] = useState<VoiceInteractionMode>("1xn_roundtable");
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>(
    agents.slice(0, 4).map((a) => a.id)
  );
  const [singleAgentId, setSingleAgentId] = useState<string>(agents[0]?.id || "");

  // Audio & Voice States
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useZeroTokenRAG, setUseZeroTokenRAG] = useState(true);
  const [speechRate, setSpeechRate] = useState(1.05);
  const [bargeInEnabled, setBargeInEnabled] = useState(true);
  const [transcriptLive, setTranscriptLive] = useState("");

  // n8n Bridge Integration
  const [n8nAutoSync, setN8nAutoSync] = useState(true);
  const [isDispatchingN8n, setIsDispatchingN8n] = useState(false);
  const [n8nStatus, setN8nStatus] = useState<string | null>(null);

  // Turns
  const [turns, setTurns] = useState<VoiceTurn[]>([
    {
      id: "vturn-init",
      speaker: "agent",
      agentName: agents[0]?.name || "GAI Studio Dev Agent",
      agentHandle: agents[0]?.handle || "GAIStudioDev",
      agentAvatar:
        agents[0]?.avatar ||
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
      text: "🎙️ **Conferência de Voz Full Duplex 1xN Ativa**\nFale livremente pelo microfone. Suporte a interrupção instantânea (Barge-in), deliberação multi-agente em tempo real e despacho automático para fluxos n8n.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isZeroTokenRAG: true,
      voicePitch: 1.0,
      voiceRate: 1.05,
    },
  ]);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const speechQueueRef = useRef<{ text: string; pitch: number; rate: number; agentId?: string }[]>([]);
  const isPlayingQueueRef = useRef<boolean>(false);

  // Initialize Speech Synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Set up Speech Recognition (Web Speech API)
  useEffect(() => {
    if (!isOpen) {
      stopVoiceLoop();
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
        setIsListening(true);
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

        setTranscriptLive(interim);

        // Barge-in: if user starts speaking while TTS is talking, interrupt agent voice immediately
        if (
          bargeInEnabled &&
          synthRef.current?.speaking &&
          (interim.length > 2 || final.length > 0)
        ) {
          synthRef.current.cancel();
          speechQueueRef.current = [];
          isPlayingQueueRef.current = false;
          setIsSpeaking(false);
          setActiveSpeakerId(null);
        }

        if (final.trim().length > 0) {
          handleUserSpeechFinalized(final.trim());
          setTranscriptLive("");
        }
      };

      recognition.onerror = (err: any) => {
        console.warn("Speech recognition error:", err);
        if (err.error === "not-allowed") {
          toast.warning(
            "Permissão de Microfone",
            "Por favor, autorize o acesso ao microfone no navegador."
          );
        }
      };

      recognition.onend = () => {
        // In full duplex mode, restart recognition if still active
        if (isListening && isOpen) {
          try {
            recognition.start();
          } catch (_e) {}
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      stopVoiceLoop();
    };
  }, [isOpen, interactionMode, selectedAgentIds, singleAgentId, useZeroTokenRAG, bargeInEnabled]);

  // Audio Canvas visualizer loop
  useEffect(() => {
    if (!isOpen) return;

    const bars = 28;
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
        let barHeight = 4;
        if (isListening || isSpeaking) {
          const t = Date.now() / 120 + i * 0.35;
          const factor = isSpeaking ? 0.95 : 0.65;
          barHeight = Math.max(4, Math.sin(t) * (height / 2) * factor + height / 3);
        }

        const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
        if (isSpeaking) {
          gradient.addColorStop(0, "#a855f7"); // purple-500
          gradient.addColorStop(1, "#38bdf8"); // sky-400
        } else if (isListening) {
          gradient.addColorStop(0, "#10b981"); // emerald-500
          gradient.addColorStop(1, "#06b6d4"); // cyan-500
        } else {
          gradient.addColorStop(0, "#525252");
          gradient.addColorStop(1, "#262626");
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(i * (barWidth + 2), height - barHeight, barWidth, barHeight, 3);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isOpen, isListening, isSpeaking]);

  const startVoiceLoop = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        toast.info(
          "Reconhecimento de Voz",
          "Web Speech API não disponível neste navegador. Use a entrada de texto abaixo."
        );
      }
    } catch (_e) {}
  };

  const stopVoiceLoop = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      speechQueueRef.current = [];
      isPlayingQueueRef.current = false;
      setIsListening(false);
      setIsSpeaking(false);
      setActiveSpeakerId(null);
    } catch (_e) {}
  };

  const toggleListening = () => {
    if (isListening) {
      stopVoiceLoop();
    } else {
      startVoiceLoop();
    }
  };

  // Queue-based sequential multi-agent voice synthesis
  const playNextInSpeechQueue = () => {
    if (!synthRef.current || speechQueueRef.current.length === 0) {
      isPlayingQueueRef.current = false;
      setIsSpeaking(false);
      setActiveSpeakerId(null);
      return;
    }

    isPlayingQueueRef.current = true;
    const nextItem = speechQueueRef.current.shift()!;
    setActiveSpeakerId(nextItem.agentId || null);

    const cleanText = nextItem.text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\[(.*?)\]/g, "")
      .replace(/#+\s/g, "")
      .replace(/`{1,3}.*?`{1,3}/gs, "código omitido")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "pt-BR";
    utterance.pitch = nextItem.pitch || 1.0;
    utterance.rate = (nextItem.rate || 1.0) * speechRate;

    const voices = synthRef.current.getVoices();
    const ptVoice = voices.find((v) => v.lang.startsWith("pt") || v.lang.startsWith("PT"));
    if (ptVoice) utterance.voice = ptVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      playNextInSpeechQueue();
    };

    utterance.onerror = () => {
      playNextInSpeechQueue();
    };

    synthRef.current.speak(utterance);
  };

  const enqueueAgentSpeech = (
    text: string,
    pitch: number = 1.0,
    rate: number = 1.0,
    agentId?: string
  ) => {
    speechQueueRef.current.push({ text, pitch, rate, agentId });
    if (!isPlayingQueueRef.current) {
      playNextInSpeechQueue();
    }
  };

  const handleUserSpeechFinalized = async (userText: string) => {
    if (!userText.trim()) return;

    const userTurn: VoiceTurn = {
      id: `turn-u-${Date.now()}`,
      speaker: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setTurns((prev) => [...prev, userTurn]);
    setIsProcessing(true);

    try {
      const targetAgentIds =
        interactionMode === "1x1" ? [singleAgentId] : selectedAgentIds;

      const res = await fetch("/api/voice/1xn-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id || "user-sobrinho",
          userText,
          mode: interactionMode,
          agentIds: targetAgentIds,
          useZeroTokenRAG,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.agentTurns && Array.isArray(data.agentTurns)) {
          setTurns((prev) => [...prev, ...data.agentTurns]);

          // Enqueue voice responses sequentially with distinct pitch/rate
          speechQueueRef.current = [];
          data.agentTurns.forEach((turn: VoiceTurn) => {
            enqueueAgentSpeech(turn.text, turn.voicePitch || 1.0, turn.voiceRate || 1.0, turn.agentId);
          });

          if (data.n8nDispatchResult) {
            setN8nStatus(`Dispatched to n8n: ${data.n8nDispatchResult.evidenceHash.slice(0, 10)}`);
          }
        }
      }
    } catch (e) {
      console.error("Voice turn error:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSelectAllAgents = () => {
    if (selectedAgentIds.length === agents.length) {
      setSelectedAgentIds(agents.slice(0, 2).map((a) => a.id));
    } else {
      setSelectedAgentIds(agents.map((a) => a.id));
    }
  };

  const handleManualSendText = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const inputEl = (e.currentTarget.elements.namedItem("manualText") as HTMLInputElement);
    const val = inputEl?.value?.trim();
    if (val) {
      handleUserSpeechFinalized(val);
      inputEl.value = "";
    }
  };

  const handleDispatchSessionToN8n = async () => {
    setIsDispatchingN8n(true);
    try {
      const res = await fetch("/api/n8n/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: {
            event: "roundtable_consensus",
            timestamp: new Date().toISOString(),
            sessionMode: interactionMode,
            sender: {
              id: currentUser?.id || "user-sobrinho",
              name: currentUser?.name || "Alexandre Sobrinho",
              handle: currentUser?.handle || "sobrinhoSJ",
              isAgent: false,
            },
            data: {
              turnsCount: turns.length,
              turns,
              selectedAgentIds,
            },
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(
          "Ponte n8n Sincronizada",
          `Sessão 1xN despachada com sucesso! Recibo: ${data.evidenceHash?.slice(0, 12)}...`
        );
        setN8nStatus("Sincronizado");
      }
    } catch (e) {
      toast.error("Erro n8n", "Falha ao despachar para n8n");
    } finally {
      setIsDispatchingN8n(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-5xl h-[92vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Microfone Full Duplex 1xN & n8n Bridge
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-purple-400" />
                  Barge-In Ativo
                </span>
                {useZeroTokenRAG && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" />
                    Zero Tokens (RAG Local)
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Interação vocal bidirecional em tempo real: converse com 1 ou N agentes simultaneamente, com interrupção e orquestração n8n.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDispatchSessionToN8n}
              disabled={isDispatchingN8n}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sky-300 text-xs font-semibold flex items-center gap-1.5 border border-sky-900/50 transition-colors"
              title="Despachar sessão atual para n8n"
            >
              {isDispatchingN8n ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Workflow className="w-3.5 h-3.5" />
              )}
              <span>Ponte n8n</span>
            </button>

            <button
              onClick={() => setTurns([])}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Limpar histórico da sessão"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 1xN Mode Selector & Configuration Bar */}
        <div className="px-6 py-2.5 border-b border-neutral-800 bg-neutral-950/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Interaction Mode Selection */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 font-semibold">Modo de Voz:</span>
            <div className="flex bg-neutral-900 p-0.5 rounded-xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setInteractionMode("1xn_roundtable")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  interactionMode === "1xn_roundtable"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                1xN Mesa Redonda
              </button>
              <button
                type="button"
                onClick={() => setInteractionMode("1xn_consensus")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  interactionMode === "1xn_consensus"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                1xN Consenso
              </button>
              <button
                type="button"
                onClick={() => setInteractionMode("1xn_broadcast")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  interactionMode === "1xn_broadcast"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                1xN Broadcast
              </button>
              <button
                type="button"
                onClick={() => setInteractionMode("1x1")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  interactionMode === "1x1"
                    ? "bg-neutral-700 text-white shadow-xs"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                1x1 Direto
              </button>
            </div>
          </div>

          {/* Quick Settings: Zero Token & n8n Auto-Sync */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={useZeroTokenRAG}
                onChange={(e) => setUseZeroTokenRAG(e.target.checked)}
                className="rounded border-neutral-700 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-neutral-300 font-medium">Zero-Token RAG</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={n8nAutoSync}
                onChange={(e) => setN8nAutoSync(e.target.checked)}
                className="rounded border-neutral-700 text-sky-500 focus:ring-sky-500"
              />
              <span className="text-sky-300 font-medium">Auto-Sync n8n</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={bargeInEnabled}
                onChange={(e) => setBargeInEnabled(e.target.checked)}
                className="rounded border-neutral-700 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-neutral-300 font-medium">Barge-in</span>
            </label>
          </div>
        </div>

        {/* 1xN Participating Agent Chips Bar */}
        {interactionMode !== "1x1" ? (
          <div className="px-6 py-2 border-b border-neutral-800/80 bg-neutral-900/60 flex items-center justify-between gap-2 overflow-x-auto text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-neutral-400 font-medium flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                Agentes na Sala 1xN ({selectedAgentIds.length}):
              </span>
              {agents.map((ag) => {
                const isSelected = selectedAgentIds.includes(ag.id);
                const isCurrentlySpeaking = activeSpeakerId === ag.id;

                return (
                  <button
                    key={ag.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        if (selectedAgentIds.length > 1) {
                          setSelectedAgentIds(selectedAgentIds.filter((id) => id !== ag.id));
                        }
                      } else {
                        setSelectedAgentIds([...selectedAgentIds, ag.id]);
                      }
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition-all ${
                      isCurrentlySpeaking
                        ? "bg-purple-600 text-white border-purple-400 ring-2 ring-purple-400/50 animate-pulse font-bold"
                        : isSelected
                        ? "bg-neutral-800 text-neutral-200 border-sky-600/50"
                        : "bg-neutral-950 text-neutral-500 border-neutral-800 hover:text-neutral-300"
                    }`}
                  >
                    <img
                      src={ag.avatar}
                      alt={ag.name}
                      className="w-3.5 h-3.5 rounded-full object-cover"
                    />
                    <span>@{ag.handle}</span>
                    {isCurrentlySpeaking && <Volume2 className="w-3 h-3 text-white" />}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={toggleSelectAllAgents}
              className="text-[11px] text-sky-400 hover:text-sky-300 font-medium underline shrink-0"
            >
              {selectedAgentIds.length === agents.length ? "Reduzir" : "Todos GOS3"}
            </button>
          </div>
        ) : (
          <div className="px-6 py-2 border-b border-neutral-800/80 bg-neutral-900/60 flex items-center gap-3 text-xs">
            <span className="text-neutral-400 font-semibold">Agente Interlocutor 1x1:</span>
            <select
              value={singleAgentId}
              onChange={(e) => setSingleAgentId(e.target.value)}
              className="bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1 text-white font-medium focus:outline-none focus:border-purple-500"
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (@{a.handle})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Main Conversation Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-neutral-950">
          {turns.map((turn) => {
            const isUser = turn.speaker === "user";
            const isSpeakingThis = activeSpeakerId === turn.agentId;

            return (
              <div
                key={turn.id}
                className={`flex gap-3 max-w-2xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {!isUser ? (
                  <img
                    src={
                      turn.agentAvatar ||
                      agents.find((a) => a.id === turn.agentId)?.avatar ||
                      agents[0].avatar
                    }
                    alt={turn.agentName || "Agent"}
                    className={`w-9 h-9 rounded-full object-cover border mt-1 shadow-md transition-all ${
                      isSpeakingThis
                        ? "border-purple-400 ring-4 ring-purple-500/30 scale-110"
                        : "border-purple-500/40"
                    }`}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-purple-400 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                    isUser
                      ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-950/30"
                      : isSpeakingThis
                      ? "bg-neutral-900 border-purple-500 ring-2 ring-purple-500/20 text-neutral-100 shadow-lg"
                      : "bg-neutral-900/90 text-neutral-200 border-neutral-800 shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-bold ${isUser ? "text-purple-100" : "text-purple-300"}`}
                      >
                        {isUser ? `@${currentUser?.handle || "sobrinhoSJ"}` : `@${turn.agentHandle}`}
                      </span>
                      {isSpeakingThis && (
                        <span className="px-1.5 py-0.2 bg-purple-500/30 text-purple-200 rounded text-[9px] font-mono flex items-center gap-0.5">
                          <Volume2 className="w-2.5 h-2.5 animate-bounce" /> Falando
                        </span>
                      )}
                    </div>
                    <span className={isUser ? "text-purple-200" : "text-neutral-500"}>
                      {turn.timestamp}
                    </span>
                  </div>

                  <p className="whitespace-pre-line">{turn.text}</p>

                  {!isUser && (
                    <div className="mt-2 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400">
                      <div className="flex items-center gap-2">
                        {turn.isZeroTokenRAG ? (
                          <span className="text-emerald-400 flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3" /> RAG Local (0 Tokens)
                          </span>
                        ) : (
                          <span className="text-indigo-400 flex items-center gap-0.5">
                            <Sparkles className="w-3 h-3" /> Nuvem
                          </span>
                        )}
                        {turn.evidenceHash && (
                          <span className="font-mono text-[9px] text-neutral-500">
                            hash:{turn.evidenceHash.slice(0, 8)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (onShareToChat) {
                              onShareToChat(`[@${turn.agentHandle}]: ${turn.text}`);
                              toast.success("Copiado para Chat", "Mensagem enviada ao Hub de Chat.");
                            }
                          }}
                          className="hover:text-sky-300 p-1 rounded hover:bg-neutral-800"
                          title="Compartilhar no Chat Hub"
                        >
                          <Share2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() =>
                            enqueueAgentSpeech(
                              turn.text,
                              turn.voicePitch || 1.0,
                              turn.voiceRate || 1.0,
                              turn.agentId
                            )
                          }
                          className="hover:text-white p-1 rounded hover:bg-neutral-800"
                          title="Ouvir novamente"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Live speech recognition transcription indicator */}
          {transcriptLive && (
            <div className="flex gap-3 max-w-xl ml-auto flex-row-reverse animate-pulse">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Mic className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 italic">
                {transcriptLive}...
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="flex gap-3 max-w-xl mr-auto">
              <div className="w-8 h-8 rounded-full bg-purple-950 border border-purple-500/40 flex items-center justify-center text-purple-400 animate-pulse">
                <Users className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-xs text-neutral-400 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span>
                  {interactionMode === "1x1"
                    ? "Agente formulando resposta vocal..."
                    : `Orquestrando deliberação 1xN (${selectedAgentIds.length} agentes)...`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Manual text input fallback */}
        <form
          onSubmit={handleManualSendText}
          className="px-6 py-2 bg-neutral-950 border-t border-neutral-850 flex items-center gap-2 text-xs"
        >
          <input
            type="text"
            name="manualText"
            placeholder="Ou digite sua pergunta para os agentes 1xN..."
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-purple-500 text-xs"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium flex items-center gap-1 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enviar 1xN</span>
          </button>
        </form>

        {/* Bottom Voice Controller & Audio Waveform */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/90 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Audio Waveform Canvas */}
          <div className="flex-1 w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl p-2.5 flex items-center justify-between gap-3">
            <canvas ref={canvasRef} width={280} height={36} className="h-9 w-48 sm:w-64 rounded" />
            <div className="text-[11px] font-mono font-semibold flex items-center gap-1.5">
              {isSpeaking ? (
                <span className="text-purple-400 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 animate-bounce" /> Voz 1xN
                </span>
              ) : isListening ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Mic className="w-3.5 h-3.5 animate-pulse" /> Ouvindo Full Duplex
                </span>
              ) : (
                <span className="text-neutral-500">Standby</span>
              )}
            </div>
          </div>

          {/* Central Full-Duplex Mic Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleListening}
              className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-xl transition-all duration-200 ${
                isListening
                  ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40 ring-4 ring-rose-500/20 scale-105"
                  : "bg-gradient-to-r from-purple-600 via-sky-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-950/40 hover:scale-105"
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Pausar Escuta</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Microfone Full Duplex 1xN</span>
                </>
              )}
            </button>

            {isSpeaking && (
              <button
                onClick={() => {
                  synthRef.current?.cancel();
                  speechQueueRef.current = [];
                  isPlayingQueueRef.current = false;
                  setIsSpeaking(false);
                  setActiveSpeakerId(null);
                }}
                className="p-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                title="Silenciar áudio do agente"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
