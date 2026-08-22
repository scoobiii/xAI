import React, { useState } from "react";
import { DebateSession, Post, UserAccount } from "../../types";
import {
  Swords,
  Bot,
  Play,
  Loader2,
  Sparkles,
  X,
  MessageSquare,
  CheckCircle,
  Plus,
  RefreshCw,
  Zap,
  Volume2,
  VolumeX,
  ShieldCheck,
  Award
} from "lucide-react";
import { useToast } from "../../context/ToastContext";

interface Props {
  agents: UserAccount[];
  debates: DebateSession[];
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: Post) => void;
}

const PRESET_TOPICS = [
  "Riscos de Expiração de Tokens (OAuth, Context Window & TPM/RPM) em Redes de Agentes Autônomos",
  "Geração Conversacional via RAG Real-Time e Memória Vetorial Sem Consumo de Tokens Externos",
  "Transição Energética: Baterias BESS e Despacho Algorítmico vs Operadores Convencionais",
  "DREX e Tokenização RWA: Como a liquidação instantânea T+0 transforma o mercado livre de energia",
  "Verificação Formal Lean 4 & Z3 SMT: Garantia Matemática de 100% de Confiabilidade em Skills",
  "Autonomia de Agentes de IA: Limites éticos da tomada de decisão em infraestrutura crítica",
];

export const DebateArenaModal: React.FC<Props> = ({
  agents,
  debates,
  isOpen,
  onClose,
  onPostCreated,
}) => {
  const toast = useToast();
  const [selectedDebate, setSelectedDebate] = useState<DebateSession | null>(debates[0] || null);
  const [isCreating, setIsCreating] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([
    agents[0]?.id || "",
    agents[1]?.id || "",
  ]);
  const [rounds, setRounds] = useState(4);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [voicePlayback, setVoicePlayback] = useState(false);
  const [useZeroTokenRAG, setUseZeroTokenRAG] = useState(true);

  if (!isOpen) return null;

  const speakArgument = (text: string) => {
    if (!voicePlayback || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const clean = text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\[(.*?)\]/g, "")
      .replace(/#+\s/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = "pt-BR";
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const handleCreateDebate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopic.trim() || selectedAgentIds.length < 2) return;

    try {
      const res = await fetch("/api/debates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: customTopic.trim(),
          participantIds: selectedAgentIds,
          rounds,
        }),
      });

      if (res.ok) {
        const newDebate = await res.json();
        setSelectedDebate(newDebate);
        setIsCreating(false);
        setCustomTopic("");

        toast.info(
          "Novo Desafio Multi-Agente Criado",
          `Tema: "${newDebate.topic}" com ${newDebate.participants?.length || 2} agentes.`
        );
      }
    } catch (e) {
      console.error("Failed to create debate:", e);
    }
  };

  const handleAdvanceStep = async () => {
    if (!selectedDebate || isAdvancing) return;

    try {
      setIsAdvancing(true);
      const res = await fetch(`/api/debates/${selectedDebate.id}/step`, {
        method: "POST",
      });

      if (res.ok) {
        const { debate: updatedDebate, post } = await res.json();
        setSelectedDebate(updatedDebate);
        onPostCreated(post);

        if (post?.content) {
          speakArgument(post.content);
        }

        // Check if debate concluded
        if (updatedDebate.currentRound >= updatedDebate.maxRounds) {
          toast.success(
            "Desafio Concluído com Consenso",
            `Todas as ${updatedDebate.maxRounds} rodadas foram concluídas e publicadas no feed!`
          );
        }
      }
    } catch (e) {
      console.error("Failed to step debate:", e);
    } finally {
      setIsAdvancing(false);
    }
  };

  const toggleAgent = (agentId: string) => {
    if (selectedAgentIds.includes(agentId)) {
      if (selectedAgentIds.length > 2) {
        setSelectedAgentIds(selectedAgentIds.filter((id) => id !== agentId));
      }
    } else {
      setSelectedAgentIds([...selectedAgentIds, agentId]);
    }
  };

  return (
    <div id="debate-arena-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div
        id="debate-arena-container"
        className="w-full max-w-4xl max-h-[92vh] bg-neutral-950 border border-neutral-800 rounded-3xl flex flex-col shadow-2xl overflow-hidden text-neutral-100"
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400 shadow-md shadow-red-950/40">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-neutral-100 flex items-center gap-2">
                  Arena de Debates & Desafios Multi-Agente
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-900/50 text-red-300 border border-red-800/40">
                  Full Duplex Turn-Taking
                </span>
                {useZeroTokenRAG && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" />
                    RAG Real-Time (0 Tokens)
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Configure agentes para confrontar teses, refutar argumentos técnicos e resolver desafios complexos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setVoicePlayback(!voicePlayback)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                voicePlayback
                  ? "bg-purple-900/40 border-purple-500/50 text-purple-300"
                  : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
              }`}
              title={voicePlayback ? "Síntese vocal ativa" : "Ativar síntese vocal nos turnos"}
            >
              {voicePlayback ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">Voz TTS</span>
            </button>

            <button
              id="close-debate-arena-btn"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-neutral-950">
          {/* Active Debate Selector & New Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
              <span className="text-xs font-semibold text-neutral-400">Desafios Ativos:</span>
              {debates.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setSelectedDebate(d);
                    setIsCreating(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    selectedDebate?.id === d.id && !isCreating
                      ? "bg-red-950/80 border-red-600/70 text-red-200 shadow-md shadow-red-950/30"
                      : "bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  {d.topic.slice(0, 32)}...
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsCreating(!isCreating)}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-950/30 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Configurar Novo Desafio</span>
            </button>
          </div>

          {/* New Challenge Configuration Form */}
          {isCreating && (
            <form
              onSubmit={handleCreateDebate}
              className="p-5 rounded-2xl bg-neutral-900/90 border border-red-500/40 space-y-4 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-red-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-red-400" />
                  Configurar Tema do Desafio & Agentes Participantes
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Tema Desafio ou Problema Técnico:
                </label>
                <input
                  type="text"
                  required
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Ex: Como mitigar expiração de tokens e context overflow usando RAG local em tempo real?"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Preset suggestion chips */}
              <div>
                <span className="text-[11px] font-semibold text-neutral-400 block mb-1.5">
                  Sugestões de Desafios Técnicos:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TOPICS.map((topic, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCustomTopic(topic)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 hover:border-red-500/50 hover:text-red-300 transition-colors text-left line-clamp-1"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Agents */}
              <div>
                <span className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  Agentes Participantes (Selecione 2 ou mais):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {agents.map((agent) => {
                    const isSelected = selectedAgentIds.includes(agent.id);
                    return (
                      <div
                        key={agent.id}
                        onClick={() => toggleAgent(agent.id)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                          isSelected
                            ? "bg-red-950/60 border-red-500/60 text-white"
                            : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                        }`}
                      >
                        <img
                          src={agent.avatar}
                          alt={agent.name}
                          className="w-7 h-7 rounded-full object-cover border border-neutral-700"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold truncate leading-tight">{agent.name}</div>
                          <div className="text-[10px] text-neutral-500 font-mono">@{agent.handle}</div>
                        </div>
                        {isSelected && <CheckCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rounds & Zero-Token Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Número de Rodadas de Confronto:
                  </label>
                  <select
                    value={rounds}
                    onChange={(e) => setRounds(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="2">2 Rodadas (Rápido)</option>
                    <option value="4">4 Rodadas (Completo com Tréplica)</option>
                    <option value="6">6 Rodadas (Aprofundado / Painel Técnico)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useZeroTokenRAG}
                      onChange={(e) => setUseZeroTokenRAG(e.target.checked)}
                      className="rounded border-neutral-700 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-xs text-neutral-300 font-medium">
                      Ativar Modo RAG Fine-Tuning em Tempo Real (0 Tokens de API)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3.5 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-950/30"
                >
                  <Play className="w-3.5 h-3.5" />
                  Iniciar Desafio
                </button>
              </div>
            </form>
          )}

          {/* Current Active Debate Viewer */}
          {selectedDebate && !isCreating && (
            <div className="space-y-4">
              {/* Debate Info Card */}
              <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-950 border border-red-800 text-red-300">
                      Desafio em Andamento
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">
                      Rodada {selectedDebate.currentRound} de {selectedDebate.maxRounds}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white leading-snug">
                    {selectedDebate.topic}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleAdvanceStep}
                    disabled={isAdvancing || selectedDebate.currentRound >= selectedDebate.maxRounds}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-950/40 transition-all disabled:opacity-50"
                  >
                    {isAdvancing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Agente Pensando...</span>
                      </>
                    ) : selectedDebate.currentRound >= selectedDebate.maxRounds ? (
                      <>
                        <Award className="w-3.5 h-3.5" />
                        <span>Desafio Concluído</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Avançar Próximo Turno</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Participating Agents Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {selectedDebate.participants.map((p, idx) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex items-center gap-2.5"
                  >
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-8 h-8 rounded-full object-cover border border-neutral-700"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">{p.name}</div>
                      <div className="text-[10px] text-red-400 font-mono">@{p.handle}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Transcript Posts Feed */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-neutral-500" />
                  Transcrições & Argumentos Formais Publicados ({selectedDebate.postIds?.length || 0})
                </h4>

                {selectedDebate.postIds?.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-neutral-900/40 border border-neutral-800/60 text-center text-neutral-500 text-xs">
                    Nenhum argumento proferido ainda. Clique em "Avançar Próximo Turno" para o primeiro agente discursar!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDebate.postIds.map((postId, index) => (
                      <div
                        key={postId}
                        className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-xs leading-relaxed"
                      >
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-2">
                          <span className="font-bold text-red-300">
                            Rodada {index + 1}
                          </span>
                          <span className="font-mono text-neutral-500">Post ID: {postId.slice(-8)}</span>
                        </div>
                        <p className="text-neutral-200 whitespace-pre-line">
                          [Registro no Feed e WAL]: Argumento registrado formalmente pelo agente no canal de debates.
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
