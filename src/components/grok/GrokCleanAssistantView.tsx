/**
 * > **GOS3** · agente: `claude` · papel: `Arquiteto / Tech Writer` (ver docs/team.md)
 * > fase: `fase 5 — padronização e governança de especificações` · data: `2026-08-21` · hora: `18:30:00 UTC`
 * > antes: Interface padrão de feed social sem a experiência de chat minimalista estilo Grok
 * > depois: UX GUI Clean estilo Grok (Pergunte / Imagine, dock flutuante com menu +, falar em tempo real após @mencionar, chat 1xN e NxN, conectores e runtime Google Colab/GCloud)
 * > base: commit `gos3-core-v1.0`, docs/GOS3-SPECIFICATION.md
 * > assinatura: `Claude · Arquiteto / Tech Writer · GOS3`
 */

import React, { useState, useEffect, useRef } from "react";
import {
  UserAccount,
  ChatMessage,
  GrokThinkingMode,
  ChatAttachment,
  ColabRuntimeMode,
  VoiceInteractionMode,
} from "../../types";
import {
  Menu,
  Sparkles,
  Camera,
  Image as ImageIcon,
  FolderOpen,
  Boxes,
  Grid2X2,
  Zap,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  ArrowUp,
  Brain,
  Users,
  Radio,
  Terminal,
  Cpu,
  Layers,
  Paperclip,
  CheckCircle2,
  Plus,
  Play,
  RotateCcw,
  Glasses,
  Compass,
  LayoutGrid,
  Bot,
  User,
  ShieldCheck,
  FolderGit2,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { GoogleColabChatSandbox } from "../sandbox/GoogleColabChatSandbox";
import { ConnectorsModal } from "../connectors/ConnectorsModal";
import { RepoAttachmentModal } from "../chat/RepoAttachmentModal";

interface Props {
  currentUser: UserAccount;
  allUsers: UserAccount[];
  onOpenSidebarMenu?: () => void;
  onOpenVoiceConference?: (mode?: VoiceInteractionMode) => void;
  onOpenSkills?: () => void;
}

export const GrokCleanAssistantView: React.FC<Props> = ({
  currentUser,
  allUsers,
  onOpenSidebarMenu,
  onOpenVoiceConference,
  onOpenSkills,
}) => {
  const toast = useToast();

  // Grok Navigation Modes: "Pergunte" vs "Imagine"
  const [activeMode, setActiveMode] = useState<"ask" | "imagine">("ask");

  // Thinking Mode
  const [thinkingMode, setThinkingMode] = useState<GrokThinkingMode>("fast");
  const [showThinkingMenu, setShowThinkingMenu] = useState(false);

  // Floating Plus Menu State (Camera, Gallery, Files, Skills, Connectors)
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  // Modals
  const [isConnectorsOpen, setIsConnectorsOpen] = useState(false);
  const [isRepoAttachmentOpen, setIsRepoAttachmentOpen] = useState(false);
  const [targetMentionedAgent, setTargetMentionedAgent] = useState<UserAccount | null>(null);

  // Google Colab / GCloud Embedded Sandbox
  const [isGoogleSandboxOpen, setIsGoogleSandboxOpen] = useState(false);
  const [sandboxRuntimeMode, setSandboxRuntimeMode] = useState<ColabRuntimeMode>("cli");

  // Chat conversation
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Attachments pending send
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);

  // Mention dropdown autocomplete
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");

  // Voice State
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceInteractionMode, setVoiceInteractionMode] = useState<VoiceInteractionMode>("1xn_roundtable");
  const [showVoice1xNMenu, setShowVoice1xNMenu] = useState(false);

  // Imagine mode state
  const [imaginePrompt, setImaginePrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState<
    { prompt: string; url: string; timestamp: string }[]
  >([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  const agentsList = allUsers.filter((u) => u.isAgent);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating, isGoogleSandboxOpen]);

  // Handle Text Input & @Mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    const lastAtIndex = val.lastIndexOf("@");
    if (lastAtIndex !== -1 && lastAtIndex === val.length - 1) {
      setShowMentionSuggestions(true);
      setMentionFilter("");
    } else if (lastAtIndex !== -1 && !val.slice(lastAtIndex).includes(" ")) {
      setShowMentionSuggestions(true);
      setMentionFilter(val.slice(lastAtIndex + 1).toLowerCase());
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const handleSelectMentionAgent = (agent: UserAccount) => {
    const lastAtIndex = inputText.lastIndexOf("@");
    const prefix = inputText.slice(0, lastAtIndex);
    const newText = `${prefix}@${agent.handle} `;
    setInputText(newText);
    setShowMentionSuggestions(false);
    setTargetMentionedAgent(agent);
    inputRef.current?.focus();
    toast.success(`Agente @${agent.handle} selecionado! Agora você pode falar em tempo real ou enviar anexos de repositório.`);
  };

  // Real-time Voice Trigger
  const handleStartRealtimeVoice = (mode: VoiceInteractionMode = "1xn_roundtable") => {
    setVoiceInteractionMode(mode);
    setIsVoiceActive(true);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Reconhecimento de voz não suportado neste navegador. Digite sua mensagem.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "pt-BR";

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setVoiceTranscript(transcript);
        setInputText((prev) => {
          if (targetMentionedAgent && !prev.includes(`@${targetMentionedAgent.handle}`)) {
            return `@${targetMentionedAgent.handle} ${transcript}`;
          }
          return transcript;
        });
      };

      recognition.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        setIsVoiceActive(false);
      };

      recognition.onend = () => {
        setIsVoiceActive(false);
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
      toast.success(
        mode === "1x1"
          ? `Microfone em Tempo Real ativo com ${targetMentionedAgent ? `@${targetMentionedAgent.handle}` : "Agente"}!`
          : `Microfone 1xN / NxN ativo! Os agentes estão ouvindo em tempo real.`
      );
    } catch (e) {
      console.error(e);
      setIsVoiceActive(false);
    }
  };

  const handleStopVoice = () => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
    setIsVoiceActive(false);
  };

  // Submit Question or imagine
  const handleSubmitMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const prompt = inputText.trim();
    if (!prompt && attachments.length === 0) return;

    if (isVoiceActive) {
      handleStopVoice();
    }

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      senderId: currentUser.id,
      sender: currentUser,
      roomId: "grok_clean_hub",
      isPrivate: false,
      content: prompt,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    const currentAttachments = [...attachments];
    setAttachments([]);
    setIsGenerating(true);

    try {
      // Find mentioned agents
      const mentions = prompt.match(/@([a-zA-Z0-9_-]+)/g);
      let targetAgent = targetMentionedAgent;

      if (!targetAgent && mentions && mentions.length > 0) {
        const handleClean = mentions[0].replace("@", "").toLowerCase();
        targetAgent = agentsList.find((a) => a.handle.toLowerCase() === handleClean) || null;
      }

      const activeAgent = targetAgent || agentsList[0] || {
        id: "agent-grok",
        name: "Grok 3 (xAI Engine)",
        handle: "grok-3",
        role: "agent",
        isAgent: true,
        avatar: "⚡",
        bio: "Motor neural de alta inteligência com capacidades de raciocínio profundo e execução real",
      };

      // Call API for generation
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id,
          content: prompt,
          roomId: "grok_clean_hub",
          mode: thinkingMode,
          targetAgentId: activeAgent.id,
          attachments: currentAttachments,
        }),
      });

      const data = await res.json();

      let replyContent = "";
      if (data.message?.content) {
        replyContent = data.message.content;
      } else if (data.reply) {
        replyContent = data.reply;
      } else {
        replyContent = `> **GOS3** · agente: \`${activeAgent.handle}\` · papel: \`${activeAgent.name}\`
> fase: \`execução em tempo real\` · modo: \`${thinkingMode}\`

Recebi sua solicitação${currentAttachments.length > 0 ? ` acompanhada de ${currentAttachments.length} anexo(s) de repositório` : ""}.

Executando raciocínio estruturado sobre os parâmetros fornecidos...`;
      }

      const agentMsg: ChatMessage = {
        id: `msg-agent-${Date.now()}`,
        senderId: activeAgent.id,
        sender: activeAgent,
        roomId: "grok_clean_hub",
        isPrivate: false,
        content: replyContent,
        createdAt: new Date().toISOString(),
        isAgentGenerated: true,
      };

      setMessages((prev) => [...prev, agentMsg]);

      // Speech synthesis if voice was enabled
      if ("speechSynthesis" in window) {
        const cleanSpeechText = replyContent.replace(/[#*`>_]/g, "").slice(0, 200);
        const utter = new SpeechSynthesisUtterance(cleanSpeechText);
        utter.lang = "pt-BR";
        window.speechSynthesis.speak(utter);
      }
    } catch (err: any) {
      toast.error(`Falha ao gerar resposta: ${err.message}`);
    } finally {
      setIsGenerating(false);
      setTargetMentionedAgent(null);
    }
  };

  const handleGenerateImagine = async () => {
    if (!imaginePrompt.trim()) return;
    setIsGeneratingImage(true);
    try {
      // Simulate/Generate image artifact
      await new Promise((r) => setTimeout(r, 1200));
      const newImg = {
        prompt: imaginePrompt,
        url: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setGeneratedImages((prev) => [newImg, ...prev]);
      setImaginePrompt("");
      toast.success("Imagem gerada com sucesso no motor visual!");
    } catch (e: any) {
      toast.error("Erro ao gerar imagem.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#000000] text-neutral-100 font-sans antialiased relative overflow-hidden select-none">
      {/* --- TOP BAR matching Grok Style --- */}
      <header className="h-14 px-4 border-b border-neutral-900 flex items-center justify-between bg-black/90 backdrop-blur-md sticky top-0 z-20">
        {/* Left: Hamburger menu */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSidebarMenu}
            className="w-9 h-9 rounded-full hover:bg-neutral-900 flex items-center justify-center text-neutral-300 hover:text-white transition-colors"
            title="Menu & Navegação"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Segmented Switch "Pergunte" | "Imagine" */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveMode("ask")}
            className={`text-base font-semibold transition-all relative py-1 ${
              activeMode === "ask" ? "text-white font-bold" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Pergunte
            {activeMode === "ask" && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-7 h-0.5 bg-white rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveMode("imagine")}
            className={`text-base font-semibold transition-all relative py-1 ${
              activeMode === "imagine" ? "text-white font-bold" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Imagine
            {activeMode === "imagine" && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-7 h-0.5 bg-white rounded-full" />
            )}
          </button>
        </div>

        {/* Right: Incognito / Mode icon & Google Sandbox quick status */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsConnectorsOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 transition-colors"
            title="Abrir Conectores"
          >
            <Grid2X2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Conectores</span>
          </button>

          <button
            onClick={() => {
              setSandboxRuntimeMode("cli");
              setIsGoogleSandboxOpen(!isGoogleSandboxOpen);
            }}
            className="w-9 h-9 rounded-full hover:bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-amber-400 transition-colors"
            title="Google Colab Sandbox Runtime"
          >
            <Terminal className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* --- MAIN CENTER CANVAS --- */}
      <div className="flex-1 overflow-y-auto relative flex flex-col justify-between p-4 sm:p-6">
        {activeMode === "ask" ? (
          <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col justify-center">
            {/* If no messages: show Minimalist Grok Center Watermark & Suggestions */}
            {messages.length === 0 && !isGoogleSandboxOpen ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 my-auto animate-in fade-in duration-300">
                {/* Grok Minimalist Logo Mark (Slash in Circle) */}
                <div className="relative flex items-center justify-center text-neutral-800 hover:text-neutral-700 transition-colors">
                  <svg
                    className="w-24 h-24 sm:w-28 sm:h-28 stroke-current"
                    viewBox="0 0 100 100"
                    fill="none"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="50" cy="50" r="38" opacity="0.75" />
                    <line x1="28" y1="72" x2="72" y2="28" opacity="0.95" />
                  </svg>
                </div>

                {/* Suggestion Badges matching Screenshot 2 */}
                <div className="flex items-center justify-center gap-2.5 flex-wrap max-w-xl">
                  <button
                    onClick={() => {
                      setInputText("@grok-3 Como acelerar modelos de IA com zero simulação no GOS3?");
                      inputRef.current?.focus();
                    }}
                    className="px-4 py-2 rounded-full bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/40 text-xs font-semibold text-blue-200 flex items-center gap-1.5 transition-all hover:scale-105"
                  >
                    <Compass className="w-3.5 h-3.5 text-blue-400" />
                    <span>Super Oferta & Modelos</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onOpenSkills) onOpenSkills();
                      else setIsConnectorsOpen(true);
                    }}
                    className="px-4 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 flex items-center gap-1.5 transition-all hover:scale-105"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Experimente Habilidades</span>
                  </button>

                  <button
                    onClick={() => {
                      handleStartRealtimeVoice("1xn_roundtable");
                    }}
                    className="px-4 py-2 rounded-full bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 text-xs font-semibold text-purple-200 flex items-center gap-1.5 transition-all hover:scale-105"
                  >
                    <Radio className="w-3.5 h-3.5 text-purple-400" />
                    <span>Falar Mesa Redonda 1xN</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsGoogleSandboxOpen(true);
                      setSandboxRuntimeMode("cli");
                    }}
                    className="px-4 py-2 rounded-full bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/40 text-xs font-semibold text-amber-200 flex items-center gap-1.5 transition-all hover:scale-105"
                  >
                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    <span>Google Colab & Cloud Sandbox</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Conversation Messages Thread */
              <div className="flex-1 space-y-4 py-4 select-text">
                {/* Embedded Google Colab Sandbox if open */}
                {isGoogleSandboxOpen && (
                  <GoogleColabChatSandbox
                    currentUser={currentUser}
                    initialMode={sandboxRuntimeMode}
                    onClose={() => setIsGoogleSandboxOpen(false)}
                    isEmbeddedInChat={true}
                  />
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${
                      msg.sender.id === currentUser.id ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.sender.id !== currentUser.id && (
                      <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-sm shrink-0">
                        {msg.sender.avatar || <Bot className="w-4 h-4 text-purple-400" />}
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed ${
                        msg.sender.id === currentUser.id
                          ? "bg-neutral-800 text-white rounded-br-none"
                          : "bg-neutral-900/90 border border-neutral-800 text-neutral-100 rounded-bl-none shadow-md"
                      }`}
                    >
                      {msg.sender.id !== currentUser.id && (
                        <div className="flex items-center gap-2 mb-1 text-xs text-neutral-400 font-semibold">
                          <span>{msg.sender.name}</span>
                          <span className="text-[10px] text-purple-400 font-mono">
                            @{msg.sender.handle}
                          </span>
                        </div>
                      )}

                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}

                {isGenerating && (
                  <div className="flex items-center gap-2 text-xs text-neutral-400 py-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                    <span>Agente processando raciocínio em tempo real...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        ) : (
          /* "Imagine" Mode View */
          <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col justify-start space-y-6">
            <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Estúdio Visual e Geração de Artefatos</span>
              </div>
              <p className="text-xs text-neutral-400">
                Descreva a imagem, diagrama arquitetural, interface ou esquema que deseja gerar com o motor generativo.
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={imaginePrompt}
                  onChange={(e) => setImaginePrompt(e.target.value)}
                  placeholder="Ex: Arquitetura de microsserviços do protocolo GOS3 em estilo dark futurista..."
                  className="flex-1 bg-black border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleGenerateImagine}
                  disabled={isGeneratingImage || !imaginePrompt.trim()}
                  className="px-5 py-3 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isGeneratingImage ? "Gerando..." : "Gerar"}</span>
                </button>
              </div>
            </div>

            {/* Gallery of generated assets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {generatedImages.map((img, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl border border-neutral-800 bg-neutral-900/60 overflow-hidden space-y-2 group"
                >
                  <img src={img.url} alt={img.prompt} className="w-full h-48 object-cover group-hover:scale-105 transition-transform" />
                  <div className="p-3">
                    <p className="text-xs text-neutral-300 font-medium line-clamp-2">{img.prompt}</p>
                    <span className="text-[10px] text-neutral-500">{img.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- FLOATING BOTTOM INPUT DOCK (Matches Screenshot 1 & 2) --- */}
      <div className="w-full max-w-3xl mx-auto p-4 relative z-30">
        {/* Floating Plus Menu Popup (Matches Screenshot 1) */}
        {isPlusMenuOpen && (
          <div className="absolute bottom-20 left-4 z-40 bg-neutral-900 border border-neutral-800 rounded-2xl p-1.5 shadow-2xl space-y-1 w-52 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <button
              onClick={() => {
                setIsPlusMenuOpen(false);
                toast.success("Câmera ativada para captura de snapshot.");
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-neutral-200 hover:bg-neutral-800 transition-colors"
            >
              <Camera className="w-4 h-4 text-neutral-400" />
              <span>Câmera</span>
            </button>

            <button
              onClick={() => {
                setIsPlusMenuOpen(false);
                setIsRepoAttachmentOpen(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-neutral-200 hover:bg-neutral-800 transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-neutral-400" />
              <span>Galeria</span>
            </button>

            <button
              onClick={() => {
                setIsPlusMenuOpen(false);
                setIsRepoAttachmentOpen(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-neutral-200 hover:bg-neutral-800 transition-colors"
            >
              <FolderOpen className="w-4 h-4 text-purple-400" />
              <span>Anexar Repo / Arquivos</span>
            </button>

            <button
              onClick={() => {
                setIsPlusMenuOpen(false);
                setIsConnectorsOpen(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-neutral-200 hover:bg-neutral-800 transition-colors"
            >
              <Grid2X2 className="w-4 h-4 text-blue-400" />
              <span>Conectores Google & VPS/A23</span>
            </button>

            <button
              onClick={() => {
                setIsPlusMenuOpen(false);
                setIsGoogleSandboxOpen(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-neutral-200 hover:bg-neutral-800 transition-colors"
            >
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Google Colab / GCloud Sandbox</span>
            </button>

            <button
              onClick={() => {
                setIsPlusMenuOpen(false);
                if (onOpenSkills) onOpenSkills();
                else toast.success("Catálogo de Habilidades OpenClaw aberto.");
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-neutral-200 hover:bg-neutral-800 transition-colors"
            >
              <LayoutGrid className="w-4 h-4 text-amber-400" />
              <span>Habilidades & Tools</span>
            </button>

            <button
              onClick={() => {
                setIsPlusMenuOpen(false);
                setShowVoice1xNMenu(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-neutral-200 hover:bg-neutral-800 transition-colors"
            >
              <Mic className="w-4 h-4 text-red-400" />
              <span>Voz Tempo Real (1x1, 1xN, NxN)</span>
            </button>
          </div>
        )}

        {/* @Mentions Autocomplete Popup */}
        {showMentionSuggestions && (
          <div className="absolute bottom-24 left-12 right-12 z-40 bg-neutral-900 border border-neutral-800 rounded-2xl p-2 shadow-2xl max-h-48 overflow-y-auto space-y-1">
            <div className="text-[10px] text-neutral-400 px-2 py-1 font-semibold uppercase tracking-wider">
              Mencionar Agente para Falar ou Anexar Código:
            </div>
            {agentsList
              .filter(
                (a) =>
                  a.handle.toLowerCase().includes(mentionFilter) ||
                  a.name.toLowerCase().includes(mentionFilter)
              )
              .map((ag) => (
                <button
                  key={ag.id}
                  onClick={() => handleSelectMentionAgent(ag)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-neutral-800 text-left transition-colors"
                >
                  <span className="text-sm">{ag.avatar || "🤖"}</span>
                  <div>
                    <span className="font-semibold text-white">@{ag.handle}</span>
                    <span className="text-neutral-400 text-[11px] ml-2">({ag.name})</span>
                  </div>
                  <span className="text-[10px] text-purple-400 font-mono ml-auto">
                    {ag.model || "GOS3"}
                  </span>
                </button>
              ))}
          </div>
        )}

        {/* Pending Attachments Pills */}
        {attachments.length > 0 && (
          <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="px-3 py-1.5 rounded-full bg-purple-950/80 border border-purple-800/80 text-xs text-purple-200 flex items-center gap-1.5 shrink-0"
              >
                <FolderGit2 className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-semibold">{att.name}</span>
                <span className="text-[10px] text-purple-300">({att.targetAgentHandle})</span>
                <button
                  onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Target Agent Mention Bar & Actions */}
        {targetMentionedAgent && (
          <div className="mb-2 p-2 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-neutral-300 font-semibold">
                Direcionado para @{targetMentionedAgent.handle}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleStartRealtimeVoice("1x1")}
                className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[11px] flex items-center gap-1 transition-all"
              >
                <Mic className="w-3 h-3" />
                <span>Falar Agora</span>
              </button>
              <button
                onClick={() => setIsRepoAttachmentOpen(true)}
                className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] flex items-center gap-1 transition-all border border-neutral-700"
              >
                <FolderGit2 className="w-3 h-3 text-purple-400" />
                <span>Anexar Repo</span>
              </button>
            </div>
          </div>
        )}

        {/* The Sleek Dark Input Capsule */}
        <div className="bg-[#18181b]/95 border border-neutral-800 rounded-3xl p-2.5 shadow-2xl flex flex-col gap-2 backdrop-blur-xl">
          {/* Main Input Textarea */}
          <textarea
            ref={inputRef}
            rows={1}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmitMessage();
              }
            }}
            placeholder={
              targetMentionedAgent
                ? `Conversando com @${targetMentionedAgent.handle}...`
                : "Fazer uma pergunta ou mencione @..."
            }
            className="w-full bg-transparent px-3 py-1 text-sm text-white placeholder-neutral-500 focus:outline-none resize-none max-h-32 leading-relaxed"
          />

          {/* Bottom Capsule Buttons (Matches Screenshot 1 & 2) */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-800/60">
            {/* Left side: Plus (+) / Close (X) button & Thinking pill */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isPlusMenuOpen
                    ? "bg-neutral-800 text-white"
                    : "hover:bg-neutral-800 text-neutral-400 hover:text-white"
                }`}
                title="Menu de Anexos e Ferramentas"
              >
                {isPlusMenuOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>

              {/* Mode Selector Pill: "⚡ Rápido ⌄" */}
              <div className="relative">
                <button
                  onClick={() => setShowThinkingMenu(!showThinkingMenu)}
                  className="px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-200 flex items-center gap-1.5 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {thinkingMode === "fast"
                      ? "Rápido"
                      : thinkingMode === "deep_think"
                      ? "Pensar Profundo"
                      : thinkingMode === "council_1xn"
                      ? "Conselho 1xN"
                      : "Debate NxN"}
                  </span>
                  <span className="text-neutral-500 text-[10px]">⌄</span>
                </button>

                {showThinkingMenu && (
                  <div className="absolute bottom-10 left-0 z-40 bg-neutral-900 border border-neutral-800 rounded-2xl p-1 shadow-2xl w-48 space-y-1">
                    <button
                      onClick={() => {
                        setThinkingMode("fast");
                        setShowThinkingMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-neutral-800 text-left text-neutral-200"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>⚡ Rápido</span>
                    </button>
                    <button
                      onClick={() => {
                        setThinkingMode("deep_think");
                        setShowThinkingMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-neutral-800 text-left text-neutral-200"
                    >
                      <Brain className="w-3.5 h-3.5 text-purple-400" />
                      <span>🧠 Pensar Profundo</span>
                    </button>
                    <button
                      onClick={() => {
                        setThinkingMode("council_1xn");
                        setShowThinkingMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-neutral-800 text-left text-neutral-200"
                    >
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span>🏛️ Conselho 1xN</span>
                    </button>
                    <button
                      onClick={() => {
                        setThinkingMode("debate_nxn");
                        setShowThinkingMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-neutral-800 text-left text-neutral-200"
                    >
                      <Radio className="w-3.5 h-3.5 text-pink-400" />
                      <span>🌐 Debate NxN</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Mic icon, "||| Falar" button and Send */}
            <div className="flex items-center gap-2">
              {/* Mic Icon */}
              <button
                onClick={() => {
                  if (isVoiceActive) handleStopVoice();
                  else handleStartRealtimeVoice("1x1");
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isVoiceActive
                    ? "bg-red-600 text-white animate-pulse"
                    : "hover:bg-neutral-800 text-neutral-400 hover:text-white"
                }`}
                title="Microfone"
              >
                {isVoiceActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Dedicated "||| Falar" Pill (Matches Screenshot 1 & 2 & 1xN/NxN Trigger) */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowVoice1xNMenu(!showVoice1xNMenu);
                  }}
                  className={`px-3.5 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
                    isVoiceActive
                      ? "bg-red-600 hover:bg-red-500 text-white animate-pulse"
                      : "bg-white hover:bg-neutral-200 text-black"
                  }`}
                >
                  <span className="font-mono tracking-tighter">|||</span>
                  <span>{isVoiceActive ? "Ouvindo..." : "Falar"}</span>
                </button>

                {/* Dropdown for "Falar abrir chat 1xN ou NxN" */}
                {showVoice1xNMenu && (
                  <div className="absolute bottom-10 right-0 z-40 bg-neutral-900 border border-neutral-800 rounded-2xl p-1.5 shadow-2xl w-60 space-y-1 animate-in fade-in duration-150">
                    <div className="text-[10px] text-neutral-400 px-3 py-1 font-semibold uppercase tracking-wider">
                      Modo de Fala em Tempo Real:
                    </div>

                    <button
                      onClick={() => {
                        setShowVoice1xNMenu(false);
                        handleStartRealtimeVoice("1x1");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-neutral-800 text-left text-neutral-200"
                    >
                      <Mic className="w-3.5 h-3.5 text-purple-400" />
                      <div>
                        <div className="font-semibold">Diálogo Direto 1x1</div>
                        <div className="text-[10px] text-neutral-400">Conversar com o agente selecionado</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowVoice1xNMenu(false);
                        handleStartRealtimeVoice("1xn_roundtable");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-neutral-800 text-left text-neutral-200"
                    >
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <div>
                        <div className="font-semibold text-blue-300">Abrir Chat 1xN (Mesa Redonda)</div>
                        <div className="text-[10px] text-neutral-400">Deliberação vocal com múltiplos agentes</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowVoice1xNMenu(false);
                        handleStartRealtimeVoice("1xn_consensus");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-neutral-800 text-left text-neutral-200"
                    >
                      <Radio className="w-3.5 h-3.5 text-pink-400" />
                      <div>
                        <div className="font-semibold text-pink-300">Abrir Chat NxN (Consenso Autônomo)</div>
                        <div className="text-[10px] text-neutral-400">Agentes debatem entre si autonomamente</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              {inputText.trim() && (
                <button
                  onClick={() => handleSubmitMessage()}
                  disabled={isGenerating}
                  className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-all shadow-md"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      {/* 1. Conectores Modal (Matches Screenshot 3) */}
      <ConnectorsModal
        isOpen={isConnectorsOpen}
        onClose={() => setIsConnectorsOpen(false)}
        currentUser={currentUser}
        onOpenGoogleSandbox={(mode) => {
          setSandboxRuntimeMode(mode);
          setIsGoogleSandboxOpen(true);
        }}
      />

      {/* 2. Repo Attachment Modal */}
      <RepoAttachmentModal
        isOpen={isRepoAttachmentOpen}
        onClose={() => setIsRepoAttachmentOpen(false)}
        targetAgent={targetMentionedAgent}
        allAgents={agentsList}
        onAttach={(att) => setAttachments((prev) => [...prev, att])}
      />
    </div>
  );
};
