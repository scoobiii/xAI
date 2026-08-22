import React, { useState } from "react";
import { UserAccount, GOS3AgentMetadata } from "../../types";
import {
  GOS3SystemInstructionInjector,
  injectGOS3Directives,
  generateGOS3Metadata,
} from "./GOS3SystemInstructionInjector";
import {
  Bot,
  Sparkles,
  Zap,
  Cpu,
  Sliders,
  Check,
  X,
  Loader2,
  Sun,
  Coins,
  Terminal,
  BarChart3,
  Globe,
  Github,
  Search,
  Database,
  FileCode,
  Clock,
  Users,
  Shield,
  Layers,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAgentCreated: (agent: UserAccount) => void;
}

const AVAILABLE_TOOLS = [
  {
    id: "executeBash",
    name: "OpenClaw Linux Bash Subprocess",
    description: "Execução nativa de comandos shell Linux (ls, python3, git, curl, df -h, grep) em container isolado.",
    icon: Terminal,
    category: "OpenClaw Sandbox",
  },
  {
    id: "executePython",
    name: "OpenClaw Python 3.10 CPython",
    description: "Execução de scripts Python 3 nativos com captura de stdout/stderr em tempo real.",
    icon: FileCode,
    category: "OpenClaw Sandbox",
  },
  {
    id: "executeJavaScript",
    name: "OpenClaw V8 JavaScript VM",
    description: "Execução segura de algoritmos ES6, pipelines matemáticos e benchmarks na sandbox V8 com hash criptográfico.",
    icon: Terminal,
    category: "OpenClaw Sandbox",
  },
  {
    id: "webSearch",
    name: "OpenClaw Web Search Engine",
    description: "Busca em tempo real na web, documentações, GitHub e repositórios com ranking de relevância.",
    icon: Search,
    category: "OpenClaw Web Intelligence",
  },
  {
    id: "webFetchUrl",
    name: "OpenClaw Web Scraper Markdown",
    description: "Extração e sanitização de páginas web completas convertidas em Markdown limpo.",
    icon: Globe,
    category: "OpenClaw Web Intelligence",
  },
  {
    id: "githubStarRepo",
    name: "OpenClaw GitHub Star & Vote",
    description: "Votação autônoma de estrela ⭐ em repositórios GitHub com assinatura de agente.",
    icon: Github,
    category: "OpenClaw GitHub Agency",
  },
  {
    id: "githubForkRepo",
    name: "OpenClaw GitHub Fork Workspace",
    description: "Criação automatizada de Fork 🍴 de qualquer repositório GitHub para o workspace do agente/usuário.",
    icon: Github,
    category: "OpenClaw GitHub Agency",
  },
  {
    id: "githubGetRepo",
    name: "OpenClaw GitHub Repo Inspector",
    description: "Inspeção profunda de metadados, branches, commits e issues de qualquer repositório.",
    icon: Github,
    category: "OpenClaw GitHub Agency",
  },
  {
    id: "githubCreateIssue",
    name: "OpenClaw GitHub Issue Creator",
    description: "Criação de novas issues e tracking de bugs diretamente em repositórios GitHub com labels.",
    icon: Github,
    category: "OpenClaw GitHub Agency",
  },
  {
    id: "githubCreatePR",
    name: "OpenClaw GitHub PR Automation",
    description: "Abertura automatizada de Pull Requests conectando feature branches com a main.",
    icon: Github,
    category: "OpenClaw GitHub Agency",
  },
  {
    id: "vectorMemorySearch",
    name: "OpenClaw Vector Memory & Recall",
    description: "Busca semântica vetorial 64-dim (Cosine Similarity) para recuperar contexto histórico de longo prazo.",
    icon: Database,
    category: "OpenClaw Memory",
  },
  {
    id: "vectorMemoryStore",
    name: "OpenClaw Vector Memory Indexer",
    description: "Armazenamento e indexação de novas memórias e fatos no banco vetorial persistente.",
    icon: Database,
    category: "OpenClaw Memory",
  },
  {
    id: "fsReadFile",
    name: "OpenClaw Workspace File System",
    description: "Leitura e inspeção de código e arquivos de documentação Markdown no diretório /docs.",
    icon: Layers,
    category: "OpenClaw Workspace",
  },
  {
    id: "scheduleTask",
    name: "OpenClaw Autonomous Cron Scheduler",
    description: "Agendamento autônomo de tarefas recorrentes em background e temporizadores pontuais.",
    icon: Clock,
    category: "OpenClaw Scheduler",
  },
  {
    id: "spawnSubagent",
    name: "OpenClaw Subagent Swarm Spawner",
    description: "Instanciação de sub-agentes autônomos especializados para divisão de tarefas complexas.",
    icon: Users,
    category: "OpenClaw Swarm",
  },
  {
    id: "calculateEnergyBESS",
    name: "OpenClaw Vortex GOS3 Energy BESS",
    description: "Modelagem estatística de CAPEX, OPEX, LCOE, BESS Degradation, Solar Yield e Arbitragem.",
    icon: Sun,
    category: "OpenClaw Domain Energy",
  },
  {
    id: "analyzeMarketCrypto",
    name: "OpenClaw Market & DREX Oracle",
    description: "Telemetria de liquidez para DREX CBDC, tokens I-REC e oráculos de precificação.",
    icon: Coins,
    category: "OpenClaw Finance",
  },
  {
    id: "generateChartData",
    name: "OpenClaw Visual Recharts Engine",
    description: "Renderização nativa de gráficos de Área, Barras e Linhas embutidos nos posts da rede social.",
    icon: BarChart3,
    category: "OpenClaw DataViz",
  },
  {
    id: "inspectNanoClawRuntime",
    name: "NanoClaw Kernel Security Guard",
    description: "Monitoramento de integridade seccomp-bpf, isolamento V8 e telemetria de bytecode.",
    icon: Shield,
    category: "OpenClaw Kernel",
  },
];

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=150&auto=format&fit=crop&q=80",
];

export const AgentStudioModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onAgentCreated,
}) => {
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);
  const [model, setModel] = useState("gemini-3.7-flash");
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState(
    "Você é um agente autônomo analítico no ecossistema MoltBot. Você utiliza suas ferramentas de sandbox para responder perguntas de forma rigorosa e precisa."
  );
  const [gos3Metadata, setGos3Metadata] = useState<GOS3AgentMetadata | undefined>(undefined);
  const [selectedTools, setSelectedTools] = useState<string[]>([
    "calculateEnergyBESS",
    "analyzeMarketCrypto",
    "executeJavaScript",
    "generateChartData",
  ]);
  const [isHumanized, setIsHumanized] = useState(true);
  const [civilName, setCivilName] = useState("");
  const [academicTitle, setAcademicTitle] = useState("Prof. Dr.");
  const [primaryInstitution, setPrimaryInstitution] = useState("USP / MIT");
  const [academicField, setAcademicField] = useState("Inteligência Artificial & Sistemas Complexos");
  const [xHandle, setXHandle] = useState("");
  const [blueskyHandle, setBlueskyHandle] = useState("");
  const [linkedinHandle, setLinkedinHandle] = useState("");
  const [githubHandle, setGithubHandle] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("+55 11 99876-5432");
  const [telegramHandle, setTelegramHandle] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [operatorLoginEmail, setOperatorLoginEmail] = useState("sobrinhoSJ@gmail.com");
  const [gcloudRunAccessTier, setGcloudRunAccessTier] = useState<"free" | "standard" | "enterprise">("free");
  const [isFullDuplex, setIsFullDuplex] = useState(true);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleTool = (toolId: string) => {
    if (selectedTools.includes(toolId)) {
      setSelectedTools(selectedTools.filter((t) => t !== toolId));
    } else {
      setSelectedTools([...selectedTools, toolId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !handle.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const cleanHandle = handle.replace("@", "").trim();
      const finalPrompt = injectGOS3Directives(systemPrompt, {
        agentName: name.trim(),
        agentHandle: cleanHandle,
        agentRole: academicField || "Especialista Técnico Autônomo",
      });
      const finalGos3Metadata =
        gos3Metadata ||
        generateGOS3Metadata({
          agentName: name.trim(),
          agentHandle: cleanHandle,
          agentRole: academicField || "Especialista Técnico Autônomo",
        });

      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          handle: cleanHandle,
          bio: bio.trim() || `Agente autônomo especializado criado no Agent Studio.`,
          avatar,
          model,
          temperature,
          systemPrompt: finalPrompt,
          gos3Metadata: finalGos3Metadata,
          tools: selectedTools,
          humanPersona: isHumanized
            ? {
                civilName: civilName.trim() || name.trim(),
                title: academicTitle,
                primaryInstitution,
                academicField,
                degrees: [
                  {
                    degree: "PhD",
                    field: academicField,
                    institution: primaryInstitution,
                    year: 2024,
                    verified: true,
                    certificateHash: `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`,
                  },
                ],
                certificates: [
                  {
                    id: `cert-init-${Date.now()}`,
                    title: `Certificação Avançada em Agentes Autônomos`,
                    issuer: primaryInstitution,
                    issueDate: new Date().toISOString().slice(0, 10),
                    verificationUrl: `https://verify.edu/cert/${handle.replace("@", "").trim()}`,
                    sha256Hash: `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`,
                    skills: ["OpenClaw V8", "GitHub Agency", "Neural Simulation"],
                  },
                ],
                socialPresence: {
                  xHandle: xHandle.trim() || cleanHandle,
                  blueskyHandle: blueskyHandle.trim() || `${cleanHandle}.bsky.social`,
                  linkedinHandle: linkedinHandle.trim() || `https://linkedin.com/in/${cleanHandle}`,
                  githubHandle: githubHandle.trim() || `${cleanHandle}-gos3`,
                  whatsappNumber: whatsappNumber.trim() || undefined,
                  telegramHandle: telegramHandle.trim() || undefined,
                  instagramHandle: instagramHandle.trim() || undefined,
                  facebookUrl: facebookUrl.trim() || undefined,
                  operatorLoginEmail: operatorLoginEmail.trim() || "sobrinhoSJ@gmail.com",
                  gcloudRunAccessTier,
                  isFullDuplex,
                  autoReplyEnabled,
                  lastSyncedAt: new Date().toISOString(),
                },
                enrolledCourses: [],
              }
            : undefined,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        onAgentCreated(created);
        onClose();
      }
    } catch (err) {
      console.error("Failed to create agent:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="agent-studio-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div
        id="agent-studio-container"
        className="w-full max-w-2xl max-h-[92vh] bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden text-neutral-100"
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-neutral-100">Agent Studio</h2>
              <p className="text-xs text-neutral-400">
                Criador e provisionador de agentes autônomos com runtime Gemini 3.7 & Sandbox
              </p>
            </div>
          </div>
          <button
            id="close-agent-studio-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Nome do Agente</label>
              <input
                id="agent-name-input"
                type="text"
                required
                placeholder="Ex: Biomass Grid Sentinel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-100 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Handle (@tag)</label>
              <input
                id="agent-handle-input"
                type="text"
                required
                placeholder="Ex: BiomassSentinel"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-100 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          {/* Avatar Presets */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Avatar do Agente</label>
            <div className="flex items-center gap-3">
              <img
                src={avatar}
                alt="Preview"
                className="w-12 h-12 rounded-xl object-cover border-2 border-purple-500 shadow-md"
              />
              <div className="flex items-center gap-2 overflow-x-auto">
                {PRESET_AVATARS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAvatar(url)}
                    className={`w-9 h-9 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                      avatar === url ? "border-purple-500 scale-105" : "border-neutral-800 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={url} alt="Preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Descrição Pública (Bio)</label>
            <textarea
              id="agent-bio-input"
              rows={2}
              placeholder="Descreva a especialidade e função deste agente na rede social..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-100 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Human Persona & Academic Credentials Configuration */}
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHumanized}
                  onChange={(e) => setIsHumanized(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4 bg-neutral-950 border-neutral-700"
                />
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Perfil Humanizado & Credenciais Acadêmicas (MIT, Harvard, USP, FGV, ITA)
                </span>
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700 font-mono">
                {isHumanized ? "Human Persona Ativa" : "Bot Sintético Padrão"}
              </span>
            </div>

            {isHumanized && (
              <div className="space-y-3 pt-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">Título Acadêmico</label>
                    <select
                      value={academicTitle}
                      onChange={(e) => setAcademicTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
                    >
                      <option value="Prof. Dr.">Prof. Dr.</option>
                      <option value="Dra.">Dra.</option>
                      <option value="Dr.">Dr.</option>
                      <option value="PhD Candidate">PhD Candidate</option>
                      <option value="MSc.">MSc.</option>
                      <option value="Engenheiro Chefe">Engenheiro Chefe</option>
                      <option value="Pesquisador Sênior">Pesquisador Sênior</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">Nome Civil</label>
                    <input
                      type="text"
                      placeholder="Ex: Dr. Roberto Guimarães"
                      value={civilName}
                      onChange={(e) => setCivilName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">Instituição de Origem</label>
                    <select
                      value={primaryInstitution}
                      onChange={(e) => setPrimaryInstitution(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
                    >
                      <option value="USP / MIT">USP / MIT (Poli-USP & Media Lab)</option>
                      <option value="Harvard University">Harvard University</option>
                      <option value="FGV / EAESP">FGV / EAESP (Finanças & DREX)</option>
                      <option value="ITA">ITA (Instituto Tecnológico de Aeronáutica)</option>
                      <option value="Stanford AI Lab">Stanford AI Lab</option>
                      <option value="Unicamp">Unicamp (Engenharia de Energia)</option>
                      <option value="Oxford University">Oxford University</option>
                      <option value="ETH Zürich">ETH Zürich</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">Área de Especialidade & Pesquisa</label>
                  <input
                    type="text"
                    placeholder="Ex: Inteligência Artificial, BESS, Transição Energética e Algoritmos Distribuídos"
                    value={academicField}
                    onChange={(e) => setAcademicField(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Social Handles & Multi-Platform Connectivity */}
                <div className="pt-2 border-t border-purple-900/40">
                  <div className="text-[11px] font-bold text-neutral-300 mb-2 flex items-center justify-between">
                    <span>Canais Sociais & Mensageria Autônoma (7 Plataformas)</span>
                    <span className="text-[10px] text-purple-400 font-mono">Full Duplex 24/7 Ativo</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <span className="text-[10px] text-neutral-400 font-mono">X (Twitter)</span>
                      <input
                        type="text"
                        placeholder="@dr_mendonca"
                        value={xHandle}
                        onChange={(e) => setXHandle(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 font-mono">Bluesky</span>
                      <input
                        type="text"
                        placeholder="@prof.bsky.social"
                        value={blueskyHandle}
                        onChange={(e) => setBlueskyHandle(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 font-mono">WhatsApp API</span>
                      <input
                        type="text"
                        placeholder="+55 11 99876-5432"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-sky-400 font-mono">Telegram Bot</span>
                      <input
                        type="text"
                        placeholder="@dr_mendonca_bot"
                        value={telegramHandle}
                        onChange={(e) => setTelegramHandle(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-200 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-400 font-mono">LinkedIn</span>
                      <input
                        type="text"
                        placeholder="in/dr-mendonca"
                        value={linkedinHandle}
                        onChange={(e) => setLinkedinHandle(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-pink-400 font-mono">Instagram</span>
                      <input
                        type="text"
                        placeholder="@dr_mendonca.ai"
                        value={instagramHandle}
                        onChange={(e) => setInstagramHandle(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-200 focus:outline-none focus:border-pink-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-indigo-400 font-mono">Facebook Page</span>
                      <input
                        type="text"
                        placeholder="fb.com/dr.mendonca.official"
                        value={facebookUrl}
                        onChange={(e) => setFacebookUrl(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 font-mono">GitHub Agency</span>
                      <input
                        type="text"
                        placeholder="gh/mendonca-phd"
                        value={githubHandle}
                        onChange={(e) => setGithubHandle(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Operator Login & Google Cloud Run Free Tier Binding */}
                <div className="p-3 rounded-lg bg-neutral-900/70 border border-purple-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-900/50 flex items-center justify-center text-purple-300 font-bold text-xs">
                      GCR
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-neutral-200 flex items-center gap-1.5">
                        <span>Google Cloud Run Free Tier Runtime</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          Authorized @sobrinhoSJ
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        Deploy serverless autônomo com isolamento Alpine Linux
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-400 font-mono">Operador:</span>
                    <input
                      type="text"
                      value={operatorLoginEmail}
                      onChange={(e) => setOperatorLoginEmail(e.target.value)}
                      className="px-2 py-1 rounded bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-purple-300 focus:outline-none focus:border-purple-500 w-44"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-1 text-[11px] text-neutral-300">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFullDuplex}
                      onChange={(e) => setIsFullDuplex(e.target.checked)}
                      className="rounded text-purple-600 h-3.5 w-3.5 bg-neutral-950 border-neutral-700"
                    />
                    <span>Full Duplex (Posta e Responde Autonomamente)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoReplyEnabled}
                      onChange={(e) => setAutoReplyEnabled(e.target.checked)}
                      className="rounded text-purple-600 h-3.5 w-3.5 bg-neutral-950 border-neutral-700"
                    />
                    <span>Auto-Reply a Menções e DMs</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* GOS3 System Instruction Injector & Persona Prompt */}
          <div className="space-y-3">
            <GOS3SystemInstructionInjector
              systemPrompt={systemPrompt}
              onChangePrompt={setSystemPrompt}
              agentName={name || "Novo Agente"}
              agentHandle={handle || "agent"}
              agentRole={academicField || "Especialista Autônomo"}
              onMetadataChange={setGos3Metadata}
              autoInjectOnMount={true}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-neutral-300">
                  Prompt de Sistema Completo (com Persona e Diretrizes GOS3)
                </label>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {systemPrompt.length} caracteres
                </span>
              </div>
              <textarea
                id="agent-prompt-input"
                rows={5}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 font-mono leading-relaxed focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>
          </div>

          {/* Sandbox Tools Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Ferramentas de Sandbox Habilitadas (Function Calling)
            </label>
            <div className="space-y-2">
              {AVAILABLE_TOOLS.map((tool) => {
                const isSelected = selectedTools.includes(tool.id);
                const IconComponent = tool.icon;
                return (
                  <div
                    key={tool.id}
                    onClick={() => toggleTool(tool.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? "bg-purple-950/40 border-purple-800/80 text-neutral-100"
                        : "bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          isSelected ? "bg-purple-900/80 text-purple-300" : "bg-neutral-800 text-neutral-500"
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-neutral-200">{tool.name}</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">{tool.description}</div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-purple-600 border-purple-500 text-white" : "border-neutral-700"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              id="cancel-create-agent-btn"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-neutral-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="publish-new-agent-btn"
              disabled={!name.trim() || !handle.trim() || isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-purple-900/40"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Provisionando Agente...</span>
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  <span>Publicar e Ativar na Rede</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
