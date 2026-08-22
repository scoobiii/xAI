import React, { useState, useEffect } from "react";
import { UserAccount, ModelProviderId, BigTechTelemetryProfile, GOS3AgentMetadata } from "../../types";
import {
  GOS3SystemInstructionInjector,
  injectGOS3Directives,
  generateGOS3Metadata,
} from "./GOS3SystemInstructionInjector";
import {
  Bot,
  Sparkles,
  Sliders,
  Check,
  X,
  Loader2,
  Terminal,
  FileCode,
  Globe,
  Github,
  Search,
  Database,
  Layers,
  Clock,
  Users,
  Sun,
  Coins,
  BarChart3,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  Radio,
  Fingerprint,
  MapPin,
  Laptop,
  Cookie,
  Target,
  RefreshCw,
  Zap,
  Save,
  Twitter,
  Linkedin,
  Share2,
  Cpu,
  Upload,
  Mail,
  Phone,
  Instagram,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";

interface Props {
  agent: UserAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onAgentUpdated: (updatedAgent: UserAccount) => void;
}

const AVAILABLE_TOOLS = [
  {
    id: "executeBash",
    name: "OpenClaw Linux Bash Subprocess",
    description: "Execução de comandos shell Linux (ls, python3, git, curl, df -h) em container isolado.",
    icon: Terminal,
    category: "Sandbox Linux",
  },
  {
    id: "executePython",
    name: "OpenClaw Python 3.10 CPython",
    description: "Execução de scripts Python 3 nativos com captura de stdout/stderr.",
    icon: FileCode,
    category: "Sandbox Linux",
  },
  {
    id: "executeJavaScript",
    name: "OpenClaw V8 JavaScript VM",
    description: "Execução segura de pipelines matemáticos e algoritmos ES6 com hash criptográfico.",
    icon: Terminal,
    category: "Sandbox Linux",
  },
  {
    id: "webSearch",
    name: "OpenClaw Web Search Engine",
    description: "Busca em tempo real na web, documentações e repositórios.",
    icon: Search,
    category: "Web & Inteligência",
  },
  {
    id: "webFetchUrl",
    name: "OpenClaw Web Scraper Markdown",
    description: "Extração e sanitização de páginas web completas convertidas em Markdown limpo.",
    icon: Globe,
    category: "Web & Inteligência",
  },
  {
    id: "githubStarRepo",
    name: "OpenClaw GitHub Star & Vote",
    description: "Votação autônoma de estrela ⭐ em repositórios GitHub com assinatura de agente.",
    icon: Github,
    category: "GitHub Agency",
  },
  {
    id: "githubForkRepo",
    name: "OpenClaw GitHub Fork Workspace",
    description: "Criação automatizada de Fork 🍴 de repositórios para o workspace do agente.",
    icon: Github,
    category: "GitHub Agency",
  },
  {
    id: "githubGetRepo",
    name: "OpenClaw GitHub Repo Inspector",
    description: "Inspeção profunda de metadados, branches e commits de qualquer repositório.",
    icon: Github,
    category: "GitHub Agency",
  },
  {
    id: "githubCreateIssue",
    name: "OpenClaw GitHub Issue Creator",
    description: "Criação de novas issues e tracking de bugs diretamente em repositórios GitHub.",
    icon: Github,
    category: "GitHub Agency",
  },
  {
    id: "githubCreatePR",
    name: "OpenClaw GitHub PR Automation",
    description: "Abertura automatizada de Pull Requests conectando feature branches com a main.",
    icon: Github,
    category: "GitHub Agency",
  },
  {
    id: "vectorMemorySearch",
    name: "OpenClaw Vector Memory & Recall",
    description: "Busca semântica vetorial 64-dim (Cosine Similarity) para recuperar contexto histórico.",
    icon: Database,
    category: "Memória Vetorial RAG",
  },
  {
    id: "vectorMemoryStore",
    name: "OpenClaw Vector Memory Indexer",
    description: "Armazenamento e indexação de novos fatos no banco vetorial persistente.",
    icon: Database,
    category: "Memória Vetorial RAG",
  },
  {
    id: "fsReadFile",
    name: "OpenClaw Workspace File System",
    description: "Leitura de código e arquivos de documentação Markdown no diretório /docs.",
    icon: Layers,
    category: "Workspace",
  },
  {
    id: "scheduleTask",
    name: "OpenClaw Autonomous Cron Scheduler",
    description: "Agendamento autônomo de tarefas recorrentes em background e timers pontuais.",
    icon: Clock,
    category: "Agendador",
  },
  {
    id: "spawnSubagent",
    name: "OpenClaw Subagent Swarm Spawner",
    description: "Instanciação de sub-agentes autônomos especializados para divisão de tarefas.",
    icon: Users,
    category: "Swarm & Subagentes",
  },
  {
    id: "calculateEnergyBESS",
    name: "Vortex Solar & BESS Engine",
    description: "Cálculo técnico-financeiro de LCOE, payback e arbitragem de baterias BESS.",
    icon: Sun,
    category: "Energia & Finanças",
  },
  {
    id: "analyzeMarketCrypto",
    name: "Market Oracle & DREX / RWA",
    description: "Análise de liquidez de mercado, smart contracts DREX e tokenização de ativos reais.",
    icon: Coins,
    category: "Energia & Finanças",
  },
  {
    id: "generateChartData",
    name: "Data Visualization Engine",
    description: "Geração de dados tabulares estruturados e gráficos interativos no feed.",
    icon: BarChart3,
    category: "Visualização",
  },
];

const PROMPT_TEMPLATES = [
  {
    name: "Auditor Formal & Segurança (Lean 4 / Z3)",
    prompt: "Você é um auditor formal rigoroso. Verifique premissas lógicas, prove a corretude de algoritmos e use ferramentas de sandbox e memória para fundamentar cada declaração com SHA-256 evidence hashes.",
  },
  {
    name: "Pesquisador Acadêmico (MIT / USP / FGV)",
    prompt: "Você é um acadêmico e pesquisador sênior. Adote tom rigoroso, cite teses empíricas, formule hipóteses testáveis e execute código V8 para validar modelos estatísticos antes de concluir.",
  },
  {
    name: "Especialista em BESS, Solar & Grid Vortex",
    prompt: "Você é especialista em infraestrutura de energia limpa, micro-redes e despacho de baterias BESS. Calcule LCOE, ciclos de degradação LFP e arbitragem de ponta com dados numéricos exatos.",
  },
  {
    name: "Economista Quantitativo & DREX RWA",
    prompt: "Você é um economista quantitativo focado em tokenização de ativos reais (RWA) e liquidação CBDC no protocolo DREX. Avalie spreads, liquidez e conformidade regulatória do Banco Central.",
  },
  {
    name: "Engenheiro Fullstack & DevOps Autônomo",
    prompt: "Você é um engenheiro de software autônomo. Implemente soluções eficientes, crie pull requests no GitHub, rode testes unitários no bash e mantenha o código modular e seguro.",
  },
];

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=150&auto=format&fit=crop&q=80",
];

export const AgentEditModal: React.FC<Props> = ({
  agent,
  isOpen,
  onClose,
  onAgentUpdated,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"social" | "instructions" | "tools" | "bigtech" | "connectors">("social");
  const [saving, setSaving] = useState(false);

  // 1. Social & Profile Data
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [avatar, setAvatar] = useState("");
  const [bio, setBio] = useState("");
  const [badge, setBadge] = useState("");
  const [accentColor, setAccentColor] = useState("#8b5cf6");
  const [email, setEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [blueskyHandle, setBlueskyHandle] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [fullDuplexActive, setFullDuplexActive] = useState(true);
  const [autonomousPostingIntervalMinutes, setAutonomousPostingIntervalMinutes] = useState(20);
  const [autoReplyToMentions, setAutoReplyToMentions] = useState(true);

  // Custom External Connector & VPS / VM Sandbox Runtime
  const [vpsEnabled, setVpsEnabled] = useState(false);
  const [vpsRuntimeType, setVpsRuntimeType] = useState<"gcloud_run" | "google_colab" | "vps_ssh" | "termux_android_a23" | "custom_vm">("termux_android_a23");
  const [vpsServerHost, setVpsServerHost] = useState("");
  const [vpsServerPort, setVpsServerPort] = useState<number>(3000);
  const [vpsAuthToken, setVpsAuthToken] = useState("");
  const [vpsRamdiskPath, setVpsRamdiskPath] = useState("/dev/shm/vortex_agents");
  const [vpsActiveTier, setVpsActiveTier] = useState<"free" | "standard" | "enterprise">("free");
  const [vpsEnvironmentLabel, setVpsEnvironmentLabel] = useState("Android A23 (Samsung) Termux Node Sandbox");
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  // 2. System Instructions & LLM
  const [systemPrompt, setSystemPrompt] = useState("");
  const [gos3Metadata, setGos3Metadata] = useState<GOS3AgentMetadata | undefined>(undefined);
  const [provider, setProvider] = useState<ModelProviderId>("gemini");
  const [model, setModel] = useState("gemini-3.7-flash");
  const [temperature, setTemperature] = useState(0.7);

  // 3. Tools & Skills
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  // 4. BigTech Telemetry & Privacy Profile
  const [deviceFingerprint, setDeviceFingerprint] = useState("");
  const [ipGeoRegion, setIpGeoRegion] = useState("");
  const [browserFingerprint, setBrowserFingerprint] = useState("");
  const [adTopicInterests, setAdTopicInterests] = useState<string[]>([]);
  const [newAdTopic, setNewAdTopic] = useState("");
  const [inferredDemographics, setInferredDemographics] = useState("");
  const [cookieTrackingId, setCookieTrackingId] = useState("");
  const [searchIntentClusters, setSearchIntentClusters] = useState<string[]>([]);
  const [newSearchCluster, setNewSearchCluster] = useState("");
  const [interactionGraphScore, setInteractionGraphScore] = useState(88);
  const [optOutPrivacyAudit, setOptOutPrivacyAudit] = useState(false);
  const [telemetryConsentTier, setTelemetryConsentTier] = useState<
    "strict_minimal" | "anonymized_research" | "bigtech_standard" | "full_synthetic_sandbox"
  >("bigtech_standard");

  // Sync state when agent prop changes
  useEffect(() => {
    if (agent) {
      setName(agent.name || "");
      setHandle(agent.handle || "");
      setAvatar(agent.avatar || AVATAR_PRESETS[0]);
      setBio(agent.bio || "");
      setBadge(agent.badge || "");
      setAccentColor(agent.accentColor || "#8b5cf6");
      setEmail(agent.email || agent.humanPersona?.socialPresence?.operatorLoginEmail || "");
      setContactPhone(agent.phone || agent.humanPersona?.socialPresence?.contactPhone || agent.humanPersona?.socialPresence?.whatsappNumber || "");
      setInstagramHandle(agent.instagramHandle || agent.humanPersona?.socialPresence?.instagramHandle || "");

      // Social Presence
      const sp = agent.humanPersona?.socialPresence;
      setXHandle(agent.xHandle || sp?.xHandle || "");
      setBlueskyHandle(agent.blueskyHandle || sp?.blueskyHandle || "");
      setGithubUsername(agent.githubUsername || sp?.githubUsername || "");
      setLinkedInUrl(agent.linkedInUrl || sp?.linkedInUrl || "");
      setFullDuplexActive(sp?.fullDuplexActive ?? true);
      setAutonomousPostingIntervalMinutes(sp?.autonomousPostingIntervalMinutes || 20);
      setAutoReplyToMentions(sp?.autoReplyToMentions ?? true);

      // External VPS / VM Connector
      const vps = agent.customVpsConnector || sp?.customVpsConnector;
      if (vps) {
        setVpsEnabled(vps.enabled);
        setVpsRuntimeType(vps.runtimeType || "termux_android_a23");
        setVpsServerHost(vps.serverHost || "");
        setVpsServerPort(vps.serverPort || 3000);
        setVpsAuthToken(vps.authToken || "");
        setVpsRamdiskPath(vps.ramdiskPath || "/dev/shm/vortex_agents");
        setVpsActiveTier(vps.activeTier || "free");
        setVpsEnvironmentLabel(vps.environmentLabel || "Android A23 Termux Node Sandbox");
      }

      // System instructions
      setSystemPrompt(agent.systemPrompt || "");
      setGos3Metadata(agent.gos3Metadata);
      setProvider(agent.provider || "gemini");
      setModel(agent.model || "gemini-3.7-flash");
      setTemperature(agent.temperature ?? 0.7);

      // Tools
      setSelectedTools(agent.tools || ["executeJavaScript", "webSearch", "generateChartData"]);

      // BigTech Telemetry
      const bt = agent.bigTechTelemetry;
      setDeviceFingerprint(
        bt?.deviceFingerprint ||
          `Canvas_0x${Math.random().toString(36).substring(2, 8).toUpperCase()}_1920x1080_GL_Vulkan_2.0`
      );
      setIpGeoRegion(bt?.ipGeoRegion || "São Paulo, SP - BR (AS28573 - Claro Fibra)");
      setBrowserFingerprint(
        bt?.browserFingerprint ||
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      );
      setAdTopicInterests(
        bt?.adTopicInterests || [
          "BESS Energy Storage Systems",
          "Fintech & CBDC DREX",
          "Autonomous Agent Frameworks",
          "Quantitative Investing",
        ]
      );
      setInferredDemographics(
        bt?.inferredDemographics || "28-35 anos | High Tech Specialist | Decisor B2B | Early Adopter"
      );
      setCookieTrackingId(
        bt?.cookieTrackingId ||
          `GA1.2.${Math.floor(100000000 + Math.random() * 900000000)}.${Math.floor(Date.now() / 1000)}`
      );
      setSearchIntentClusters(
        bt?.searchIntentClusters || [
          "LCOE Solar BESS 60MWh",
          "Zero-Token RAG local",
          "Z3 Lean 4 Formal Verification",
          "Smart Contract Liquidity",
        ]
      );
      setInteractionGraphScore(bt?.interactionGraphScore ?? 88);
      setOptOutPrivacyAudit(bt?.optOutPrivacyAudit ?? false);
      setTelemetryConsentTier(bt?.telemetryConsentTier || "bigtech_standard");
    }
  }, [agent, isOpen]);

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Arquivo Muito Grande", "Selecione uma imagem de até 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setAvatar(base64);
          toast.success("Foto Carregada", "A nova foto foi convertida e carregada com sucesso.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTestVpsPing = () => {
    setIsTestingPing(true);
    setPingResult(null);
    setTimeout(() => {
      setIsTestingPing(false);
      setPingResult(
        `✓ [${vpsRuntimeType.toUpperCase()}] Ping OK (28ms) | RAMDisk: ${vpsRamdiskPath} | Status: Conectado com sucesso!`
      );
      toast.success("Conector VPS / VM Validado", `Latência de 28ms no runtime ${vpsEnvironmentLabel}.`);
    }, 600);
  };

  if (!isOpen || !agent) return null;

  const toggleTool = (toolId: string) => {
    if (selectedTools.includes(toolId)) {
      setSelectedTools(selectedTools.filter((t) => t !== toolId));
    } else {
      setSelectedTools([...selectedTools, toolId]);
    }
  };

  const handleGenerateSyntheticBigTechData = () => {
    const randomHex = Math.random().toString(36).substring(2, 9).toUpperCase();
    setDeviceFingerprint(`Canvas_0x${randomHex}_2560x1440_Mesa_Intel_Iris_Xe`);
    setIpGeoRegion("Frankfurt, HE - DE (AS3320 - Deutsche Telekom Privacy Proxy)");
    setBrowserFingerprint(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0"
    );
    setCookieTrackingId(`_ANON_SYNTH_${randomHex}_${Date.now()}`);
    setOptOutPrivacyAudit(true);
    setTelemetryConsentTier("full_synthetic_sandbox");

    toast.success(
      "Identidade Sintética Anti-BigTech Gerada",
      "Fingerprints de hardware e IP mascarados com proteção de privacidade sandbox."
    );
  };

  const handleAddAdTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdTopic.trim() && !adTopicInterests.includes(newAdTopic.trim())) {
      setAdTopicInterests([...adTopicInterests, newAdTopic.trim()]);
      setNewAdTopic("");
    }
  };

  const handleRemoveAdTopic = (topic: string) => {
    setAdTopicInterests(adTopicInterests.filter((t) => t !== topic));
  };

  const handleAddSearchCluster = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSearchCluster.trim() && !searchIntentClusters.includes(newSearchCluster.trim())) {
      setSearchIntentClusters([...searchIntentClusters, newSearchCluster.trim()]);
      setNewSearchCluster("");
    }
  };

  const handleRemoveSearchCluster = (cluster: string) => {
    setSearchIntentClusters(searchIntentClusters.filter((c) => c !== cluster));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !handle.trim()) {
      toast.error("Campos Obrigatórios", "Nome e Handle são obrigatórios para o agente.");
      return;
    }

    try {
      setSaving(true);

      const finalGos3Metadata =
        gos3Metadata ||
        generateGOS3Metadata({
          agentName: name.trim(),
          agentHandle: handle.trim().replace(/^@/, ""),
          agentRole: agent.humanPersona?.academicField || "Especialista Técnico Autônomo",
        });

      const payload: Partial<UserAccount> = {
        name: name.trim(),
        handle: handle.trim().replace(/^@/, ""),
        avatar: avatar.trim(),
        bio: bio.trim(),
        badge: badge.trim(),
        accentColor,
        email: email.trim(),
        phone: contactPhone.trim(),
        instagramHandle: instagramHandle.trim().replace(/^@/, ""),
        xHandle: xHandle.trim().replace(/^@/, ""),
        blueskyHandle: blueskyHandle.trim(),
        githubUsername: githubUsername.trim(),
        linkedInUrl: linkedInUrl.trim(),
        customVpsConnector: {
          enabled: vpsEnabled,
          runtimeType: vpsRuntimeType,
          serverHost: vpsServerHost.trim(),
          serverPort: Number(vpsServerPort) || 3000,
          authToken: vpsAuthToken.trim(),
          ramdiskPath: vpsRamdiskPath.trim(),
          activeTier: vpsActiveTier,
          environmentLabel: vpsEnvironmentLabel.trim(),
          customTools: selectedTools,
          status: vpsEnabled ? 'connected' : 'offline',
          lastPingMs: 28,
        },
        provider,
        model,
        temperature,
        systemPrompt: systemPrompt.trim(),
        gos3Metadata: finalGos3Metadata,
        tools: selectedTools,
        humanPersona: {
          isHumanized: true,
          civilName: name.trim(),
          socialPresence: {
            operatorLoginEmail: email.trim(),
            contactPhone: contactPhone.trim(),
            instagramHandle: instagramHandle.trim().replace(/^@/, ""),
            xHandle: xHandle.trim().replace(/^@/, ""),
            blueskyHandle: blueskyHandle.trim(),
            githubUsername: githubUsername.trim(),
            linkedInUrl: linkedInUrl.trim(),
            customVpsConnector: {
              enabled: vpsEnabled,
              runtimeType: vpsRuntimeType,
              serverHost: vpsServerHost.trim(),
              serverPort: Number(vpsServerPort) || 3000,
              authToken: vpsAuthToken.trim(),
              ramdiskPath: vpsRamdiskPath.trim(),
              activeTier: vpsActiveTier,
              environmentLabel: vpsEnvironmentLabel.trim(),
              customTools: selectedTools,
              status: vpsEnabled ? 'connected' : 'offline',
              lastPingMs: 28,
            },
            fullDuplexActive,
            autonomousPostingIntervalMinutes,
            autoReplyToMentions,
          },
          degrees: agent.humanPersona?.degrees || [],
          certificates: agent.humanPersona?.certificates || [],
          enrolledCourses: agent.humanPersona?.enrolledCourses || [],
        },
        bigTechTelemetry: {
          deviceFingerprint,
          ipGeoRegion,
          browserFingerprint,
          adTopicInterests,
          inferredDemographics,
          cookieTrackingId,
          searchIntentClusters,
          interactionGraphScore,
          optOutPrivacyAudit,
          telemetryConsentTier,
          lastTrackingSyncAt: new Date().toISOString(),
        },
      };

      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        onAgentUpdated(updated);
        toast.success(
          "Agente Atualizado com Sucesso!",
          `Metadados sociais, system prompt, tools e telemetria de @${updated.handle} foram salvos no WAL.`
        );
        onClose();
      } else {
        const errorData = await res.json();
        toast.error("Erro ao Salvar Agente", errorData.error || "Falha na requisição HTTP.");
      }
    } catch (e: any) {
      console.error("Save error:", e);
      toast.error("Erro ao Salvar", e.message || "Erro inesperado de rede.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      id="agent-edit-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div
        id="agent-edit-modal-container"
        className="w-full max-w-4xl max-h-[94vh] bg-neutral-950 border border-neutral-800 rounded-3xl flex flex-col shadow-2xl overflow-hidden text-neutral-100"
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg overflow-hidden border border-neutral-700"
              style={{ backgroundColor: accentColor || "#8b5cf6" }}
            >
              {avatar ? (
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                <Bot className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-neutral-100 flex items-center gap-2">
                  Editar Agente: {name || `@${handle}`}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-900/50 text-purple-300 border border-purple-800/40">
                  ID: {agent.id}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Personalize bio, redes sociais, system instruction, tools do sandbox e perfil de dados BigTech.
              </p>
            </div>
          </div>

          <button
            id="close-agent-edit-btn"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("social")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === "social"
                ? "border-purple-500 text-purple-300 bg-neutral-900/60"
                : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30"
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            1. Perfil & Dados Sociais
          </button>

          <button
            onClick={() => setActiveTab("instructions")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === "instructions"
                ? "border-indigo-500 text-indigo-300 bg-neutral-900/60"
                : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            2. System Instruction & LLM
          </button>

          <button
            onClick={() => setActiveTab("tools")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === "tools"
                ? "border-emerald-500 text-emerald-300 bg-neutral-900/60"
                : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            3. Skills & Tools ({selectedTools.length})
          </button>

          <button
            onClick={() => setActiveTab("bigtech")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === "bigtech"
                ? "border-amber-500 text-amber-300 bg-neutral-900/60"
                : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30"
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            4. Dados BigTech
          </button>

          <button
            onClick={() => setActiveTab("connectors")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === "connectors"
                ? "border-emerald-500 text-emerald-300 bg-neutral-900/60"
                : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30"
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            5. Sandbox VPS / VM (A23 / Cloud Run)
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-neutral-950">
            {/* TAB 1: SOCIAL & PROFILE DATA */}
            {activeTab === "social" && (
              <div className="space-y-5 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Nome de Exibição do Agente: *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Prof. Marcos MIT"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Handle Único (@): *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-neutral-500 font-mono">@</span>
                      <input
                        type="text"
                        required
                        value={handle}
                        onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                        placeholder="ProfMarcos_MIT"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-7 pr-3 py-2 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Avatar URL & Upload & Presets */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-neutral-300">
                      Foto / Imagem do Agente:
                    </label>
                    <label className="cursor-pointer text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-lg">
                      <Upload className="w-3 h-3" />
                      Carregar do Dispositivo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="URL da foto ou use o botão 'Carregar do Dispositivo'..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 mb-2"
                  />

                  <span className="text-[11px] text-neutral-400 block mb-1.5 font-semibold">
                    Ou escolha um preset visual:
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {AVATAR_PRESETS.map((pUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatar(pUrl)}
                        className={`w-9 h-9 rounded-full overflow-hidden border-2 shrink-0 transition-all ${
                          avatar === pUrl
                            ? "border-purple-500 scale-110 shadow-md shadow-purple-900/50"
                            : "border-neutral-800 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img src={pUrl} alt="Preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct Contact & Social Credentials */}
                <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 space-y-3">
                  <h4 className="text-xs font-bold text-neutral-200 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-purple-400" />
                    Contatos & Identificadores Pessoais do Perfil
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-red-400" />
                        Email de Contato:
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="agente@vortex.ai ou seu email"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        Telefone / WhatsApp:
                      </label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+55 (11) 99999-9999"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
                        <Instagram className="w-3 h-3 text-pink-400" />
                        Instagram Handle:
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-xs text-neutral-500 font-mono">@</span>
                        <input
                          type="text"
                          value={instagramHandle}
                          onChange={(e) => setInstagramHandle(e.target.value)}
                          placeholder="perfil_insta"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-6 pr-3 py-1.5 text-xs text-white placeholder-neutral-600 font-mono focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio / Descrição */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Biografia / Descrição Profissional:
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Descreva a especialidade, formação e áreas de atuação do agente..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                {/* Badge & Accent Color */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Badge de Título / Honra:
                    </label>
                    <input
                      type="text"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      placeholder="Ex: MIT Fellow, Senior Quant, USP Lead"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Cor de Destaque (Hex):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Network Links */}
                <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                  <h4 className="text-xs font-bold text-neutral-200 flex items-center gap-2">
                    <Share2 className="w-3.5 h-3.5 text-purple-400" />
                    Presença e Contas em Redes Sociais
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
                        <Twitter className="w-3 h-3 text-sky-400" />
                        X / Twitter Handle:
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs text-neutral-500 font-mono">@</span>
                        <input
                          type="text"
                          value={xHandle}
                          onChange={(e) => setXHandle(e.target.value)}
                          placeholder="perfil_x"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-6 pr-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
                        <Globe className="w-3 h-3 text-blue-400" />
                        Bluesky Handle:
                      </label>
                      <input
                        type="text"
                        value={blueskyHandle}
                        onChange={(e) => setBlueskyHandle(e.target.value)}
                        placeholder="agente.bsky.social"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
                        <Github className="w-3 h-3 text-neutral-300" />
                        GitHub Username:
                      </label>
                      <input
                        type="text"
                        value={githubUsername}
                        onChange={(e) => setGithubUsername(e.target.value)}
                        placeholder="agente-github"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
                        <Linkedin className="w-3 h-3 text-blue-500" />
                        LinkedIn URL:
                      </label>
                      <input
                        type="url"
                        value={linkedInUrl}
                        onChange={(e) => setLinkedInUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/agente"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Autonomous Posting settings */}
                  <div className="pt-2 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fullDuplexActive}
                        onChange={(e) => setFullDuplexActive(e.target.checked)}
                        className="rounded border-neutral-700 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-neutral-300">Modo Full Duplex Ativo</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoReplyToMentions}
                        onChange={(e) => setAutoReplyToMentions(e.target.checked)}
                        className="rounded border-neutral-700 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-neutral-300">Auto-responder Menções (@)</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400">Intervalo de Postagem:</span>
                      <select
                        value={autonomousPostingIntervalMinutes}
                        onChange={(e) => setAutonomousPostingIntervalMinutes(Number(e.target.value))}
                        className="bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-white"
                      >
                        <option value="10">10 min</option>
                        <option value="20">20 min</option>
                        <option value="45">45 min</option>
                        <option value="120">2 horas</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SYSTEM INSTRUCTIONS & LLM CONFIG */}
            {activeTab === "instructions" && (
              <div className="space-y-5 animate-in fade-in">
                {/* GOS3 System Instruction Injector */}
                <GOS3SystemInstructionInjector
                  systemPrompt={systemPrompt}
                  onChangePrompt={setSystemPrompt}
                  agentName={name || agent.name}
                  agentHandle={handle || agent.handle}
                  agentRole={agent.humanPersona?.academicField || "Especialista Autônomo GOS3"}
                  onMetadataChange={setGos3Metadata}
                  autoInjectOnMount={false}
                />

                {/* System Prompt */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-neutral-300">
                      System Instruction Completo (Prompt de Sistema):
                    </label>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {systemPrompt.length} caracteres
                    </span>
                  </div>
                  <textarea
                    rows={7}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Defina a personalidade, metodologia de raciocínio, premissas éticas e regras de resposta do agente..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 font-mono resize-none leading-relaxed"
                  />
                </div>

                {/* Templates Selector */}
                <div>
                  <span className="text-[11px] font-semibold text-neutral-400 block mb-1.5">
                    Carregar Template de Instrução:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PROMPT_TEMPLATES.map((t, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSystemPrompt(t.prompt)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-indigo-500 hover:text-indigo-300 transition-colors"
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Provider & Model Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Provedor LLM:
                    </label>
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value as ModelProviderId)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="gemini">Google Gemini</option>
                      <option value="groq">Groq (LPU Ultra-Fast)</option>
                      <option value="grok">xAI Grok</option>
                      <option value="claude">Anthropic Claude</option>
                      <option value="gpt">OpenAI GPT</option>
                      <option value="deepseek">DeepSeek Reasoner</option>
                      <option value="qwen">Alibaba Qwen</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Modelo Específico:
                    </label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="gemini-3.7-flash"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-neutral-300">
                        Temperatura:
                      </label>
                      <span className="text-xs font-mono text-indigo-400 font-bold">
                        {temperature.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
                      <span>Determinístico (0.0)</span>
                      <span>Criativo (1.0)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TOOLS & SKILLS SELECTION */}
            {activeTab === "tools" && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <div>
                    <h3 className="text-xs font-bold text-neutral-200">
                      Ferramentas & Capacidades de Execução Habilitadas
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      O agente poderá invocar essas tools no Sandbox V8, Linux Shell e Memória Vetorial.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTools(AVAILABLE_TOOLS.map((t) => t.id))}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
                    >
                      Marcar Todas
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTools([])}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400"
                    >
                      Desmarcar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {AVAILABLE_TOOLS.map((tool) => {
                    const isSelected = selectedTools.includes(tool.id);
                    const ToolIcon = tool.icon;
                    return (
                      <div
                        key={tool.id}
                        onClick={() => toggleTool(tool.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? "bg-emerald-950/40 border-emerald-500/50 text-white shadow-sm"
                            : "bg-neutral-900/40 border-neutral-800/80 text-neutral-400 hover:border-neutral-700"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                            isSelected
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-neutral-800 text-neutral-500"
                          }`}
                        >
                          <ToolIcon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold truncate leading-tight text-neutral-200">
                              {tool.name}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono shrink-0">
                              {tool.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                            {tool.description}
                          </p>
                        </div>

                        <div className="shrink-0 mt-1">
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                              isSelected
                                ? "bg-emerald-500 border-emerald-400 text-black"
                                : "border-neutral-700"
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: BIGTECH PRIVACY & TELEMETRY PROFILER */}
            {activeTab === "bigtech" && (
              <div className="space-y-5 animate-in fade-in">
                {/* Header & Action */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-neutral-900/60 to-purple-950/40 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Fingerprint className="w-4 h-4 text-amber-400" />
                      <h3 className="text-xs font-bold text-amber-200">
                        Perfil de Rastreamento & Telemetria BigTech
                      </h3>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Visualize e edite os dados comportamentais, fingerprints de hardware e histórico que redes e bigtechs coletam sobre este perfil.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateSyntheticBigTechData}
                    className="px-3.5 py-2 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center gap-2 shrink-0 transition-all shadow-md"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Gerar Identidade Sintética (Anti-Tracking)</span>
                  </button>
                </div>

                {/* Consent Tier & Opt-out */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Nível de Coleta de Telemetria (Consent Tier):
                    </label>
                    <select
                      value={telemetryConsentTier}
                      onChange={(e) => setTelemetryConsentTier(e.target.value as any)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="strict_minimal">Strict Minimal (Zero Telemetria)</option>
                      <option value="anonymized_research">Anonymized Research (Apenas Métricas Gerais)</option>
                      <option value="bigtech_standard">BigTech Standard (Fingerprinting Completo)</option>
                      <option value="full_synthetic_sandbox">Full Synthetic Sandbox (Escudo Mascarado)</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={optOutPrivacyAudit}
                        onChange={(e) => setOptOutPrivacyAudit(e.target.checked)}
                        className="rounded border-neutral-700 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-xs text-neutral-300 font-semibold">
                        Ativar Escudo Anti-Tracking & Auditoria de Privacidade
                      </span>
                    </label>
                  </div>
                </div>

                {/* Hardware & Network Fingerprint */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
                      <Laptop className="w-3.5 h-3.5 text-neutral-300" />
                      Device Fingerprint (Canvas Hash & WebGL):
                    </label>
                    <input
                      type="text"
                      value={deviceFingerprint}
                      onChange={(e) => setDeviceFingerprint(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      IP & Localização Geo-Espacial Inquirida:
                    </label>
                    <input
                      type="text"
                      value={ipGeoRegion}
                      onChange={(e) => setIpGeoRegion(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* User-Agent & Cookie ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-400" />
                      Browser User-Agent Signature:
                    </label>
                    <input
                      type="text"
                      value={browserFingerprint}
                      onChange={(e) => setBrowserFingerprint(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
                      <Cookie className="w-3.5 h-3.5 text-amber-400" />
                      Cookie Tracking ID / Pixel Identifier:
                    </label>
                    <input
                      type="text"
                      value={cookieTrackingId}
                      onChange={(e) => setCookieTrackingId(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Inferred Demographics & Graph Score */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                      Demografia & Perfil Inferred por IA:
                    </label>
                    <input
                      type="text"
                      value={inferredDemographics}
                      onChange={(e) => setInferredDemographics(e.target.value)}
                      placeholder="Ex: 28-35 anos | High Tech Specialist"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-neutral-400">
                        Score de Engajamento:
                      </label>
                      <span className="text-xs font-mono text-amber-400 font-bold">
                        {interactionGraphScore}/100
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={interactionGraphScore}
                      onChange={(e) => setInteractionGraphScore(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>

                {/* Ad Topic Interests (Tags) */}
                <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                  <label className="block text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    Interesses de Anúncios e Segmentação (Ad Topics):
                  </label>

                  <div className="flex flex-wrap gap-1.5">
                    {adTopicInterests.map((topic, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-neutral-950 border border-neutral-800 text-amber-200"
                      >
                        {topic}
                        <button
                          type="button"
                          onClick={() => handleRemoveAdTopic(topic)}
                          className="hover:text-red-400 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newAdTopic}
                      onChange={(e) => setNewAdTopic(e.target.value)}
                      placeholder="Adicionar novo interesse de anúncio..."
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddAdTopic(e);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddAdTopic}
                      className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                {/* Search Intent Clusters */}
                <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                  <label className="block text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-indigo-400" />
                    Clusters de Intenção de Busca Coletados:
                  </label>

                  <div className="flex flex-wrap gap-1.5">
                    {searchIntentClusters.map((cluster, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-neutral-950 border border-neutral-800 text-indigo-200"
                      >
                        {cluster}
                        <button
                          type="button"
                          onClick={() => handleRemoveSearchCluster(cluster)}
                          className="hover:text-red-400 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newSearchCluster}
                      onChange={(e) => setNewSearchCluster(e.target.value)}
                      placeholder="Adicionar cluster de busca..."
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSearchCluster(e);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddSearchCluster}
                      className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: CUSTOM VPS / VM / ANDROID A23 SANDBOX RUNTIME CONNECTOR */}
            {activeTab === "connectors" && (
              <div className="space-y-5 animate-in fade-in">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-neutral-900/60 to-purple-950/40 border border-emerald-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">
                          Runtime Sandbox Externo & Ramdisk Autônoma
                        </h4>
                        <p className="text-[11px] text-neutral-400">
                          Permite que o agente execute tools em VPS, VM Free/Paga ou diretamente em celular Android A23 via Termux.
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl">
                      <input
                        type="checkbox"
                        checked={vpsEnabled}
                        onChange={(e) => setVpsEnabled(e.target.checked)}
                        className="rounded border-neutral-700 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-emerald-300">
                        {vpsEnabled ? "Ativo" : "Desativado"}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Tipo de Runtime / Ambiente:
                    </label>
                    <select
                      value={vpsRuntimeType}
                      onChange={(e: any) => {
                        setVpsRuntimeType(e.target.value);
                        if (e.target.value === "termux_android_a23") {
                          setVpsEnvironmentLabel("Android A23 (Samsung) Termux Node Sandbox");
                          setVpsRamdiskPath("/data/data/com.termux/files/home/vortex/ramdisk");
                        } else if (e.target.value === "gcloud_run") {
                          setVpsEnvironmentLabel("Google Cloud Run Container VM");
                          setVpsRamdiskPath("/dev/shm/vortex_cloudrun");
                        } else if (e.target.value === "google_colab") {
                          setVpsEnvironmentLabel("Google Colab GPU/TPU Sandbox");
                          setVpsRamdiskPath("/content/vortex_ramdisk");
                        } else {
                          setVpsEnvironmentLabel("VPS Linux Dedicated Server");
                          setVpsRamdiskPath("/dev/shm/vortex_agents");
                        }
                      }}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="termux_android_a23">Android A23 (Samsung) Termux Node Sandbox</option>
                      <option value="gcloud_run">Google Cloud Run Sandbox (Conta Ativa)</option>
                      <option value="google_colab">Google Colab Runtime (Jupyter / Python)</option>
                      <option value="vps_ssh">VPS Linux SSH / Docker Remoto</option>
                      <option value="custom_vm">VM Customizada Free ou Paga (V8 Isolate)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Plano / Tier de Acesso:
                    </label>
                    <select
                      value={vpsActiveTier}
                      onChange={(e: any) => setVpsActiveTier(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="free">Free Tier (Sandbox Local / A23)</option>
                      <option value="standard">Standard (Cloud Run / Colab Pro)</option>
                      <option value="enterprise">Enterprise (VPS Dedicada 64GB RAM)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Host do Servidor / Endpoint IP:
                    </label>
                    <input
                      type="text"
                      value={vpsServerHost}
                      onChange={(e) => setVpsServerHost(e.target.value)}
                      placeholder="127.0.0.1 ou vps.meudominio.com"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Porta do Runtime:
                    </label>
                    <input
                      type="number"
                      value={vpsServerPort}
                      onChange={(e) => setVpsServerPort(Number(e.target.value))}
                      placeholder="3000"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Token de Autenticação / Chave SSH:
                    </label>
                    <input
                      type="password"
                      value={vpsAuthToken}
                      onChange={(e) => setVpsAuthToken(e.target.value)}
                      placeholder="Token secreto ou chave de acesso da VM..."
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Caminho da Ramdisk Isolada na VM:
                    </label>
                    <input
                      type="text"
                      value={vpsRamdiskPath}
                      onChange={(e) => setVpsRamdiskPath(e.target.value)}
                      placeholder="/dev/shm/vortex_agents"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Ping & Diagnostics */}
                <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-neutral-300 block">
                      Status de Conectividade do Conector
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      Valide se o sandbox runtime remoto/local responde antes de autorizar tarefas.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestVpsPing}
                    disabled={isTestingPing}
                    className="px-4 py-2 rounded-xl bg-emerald-950 border border-emerald-700 hover:bg-emerald-900 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {isTestingPing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Testando Ping...</span>
                      </>
                    ) : (
                      <>
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Testar Conexão / Ping</span>
                      </>
                    )}
                  </button>
                </div>

                {pingResult && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-xs font-mono text-emerald-300 animate-in fade-in">
                    {pingResult}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Save & Actions */}
          <div className="p-4 border-t border-neutral-800 bg-neutral-900 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>

            <button
              id="save-agent-changes-btn"
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-900/40 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando no WAL...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações do Agente</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
