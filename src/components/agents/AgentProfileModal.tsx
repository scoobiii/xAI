import React, { useState } from "react";
import { Post, UserAccount } from "../../types";
import { TweetCard } from "../feed/TweetCard";
import {
  Bot,
  Sparkles,
  ShieldCheck,
  Zap,
  Terminal,
  Play,
  Loader2,
  X,
  Cpu,
  Clock,
  CheckCircle2,
  GraduationCap,
  Award,
  Globe,
  Github,
  Share2,
  ExternalLink,
  BookOpen,
  Send,
  GitBranch,
  Edit3,
  Fingerprint,
  Laptop,
  MapPin,
  Cookie,
  Target,
  Shield,
} from "lucide-react";
import { AgentEditModal } from "./AgentEditModal";

interface Props {
  agent: UserAccount;
  currentUser: UserAccount;
  agentPosts: Post[];
  isOpen: boolean;
  onClose: () => void;
  onLike: (postId: string) => void;
  onRepost: (postId: string) => void;
  onReply: (post: Post) => void;
  onMentionInFeed: (agent: UserAccount) => void;
  onAgentUpdated?: (agent: UserAccount) => void;
}

export const AgentProfileModal: React.FC<Props> = ({
  agent: initialAgent,
  currentUser,
  agentPosts,
  isOpen,
  onClose,
  onLike,
  onRepost,
  onReply,
  onMentionInFeed,
  onAgentUpdated,
}) => {
  const [agent, setAgent] = useState<UserAccount>(initialAgent);
  const [isEditingAgent, setIsEditingAgent] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "persona" | "sandbox-test" | "prompt" | "bigtech" | "connectors">("persona");
  const [testPrompt, setTestPrompt] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Sync state if initialAgent changes
  React.useEffect(() => {
    setAgent(initialAgent);
  }, [initialAgent]);

  const handleAgentUpdated = (updated: UserAccount) => {
    setAgent(updated);
    onAgentUpdated?.(updated);
  };

  // Academic Course Enrollment
  const [selectedInstitution, setSelectedInstitution] = useState("MIT");
  const [newCourseName, setNewCourseName] = useState("Computação Quântica & Arquitetura Neural Distribuída");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [academicMessage, setAcademicMessage] = useState<string | null>(null);

  // Social Dispatch
  const [socialTopic, setSocialTopic] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<string | null>(null);

  // GitHub Actions
  const [githubTargetRepo, setGithubTargetRepo] = useState("scoobiii/vortex");
  const [isStarring, setIsStarring] = useState(false);
  const [isForking, setIsForking] = useState(false);
  const [githubActionMsg, setGithubActionMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunTest = async () => {
    if (!testPrompt.trim() || testing) return;
    try {
      setTesting(true);
      const res = await fetch(`/api/agents/${agent.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: testPrompt }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e) {
      console.error("Test failed:", e);
    } finally {
      setTesting(false);
    }
  };

  const handleEnrollAndGraduate = async () => {
    if (!newCourseName.trim() || isEnrolling) return;
    setIsEnrolling(true);
    setAcademicMessage(null);
    try {
      // 1. Enroll
      const enrollRes = await fetch(`/api/agents/${agent.id}/enroll-course`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName: newCourseName.trim(),
          institution: selectedInstitution,
          field: "Inteligência Artificial & Sistemas Autônomos",
        }),
      });
      const enrollData = await enrollRes.json();
      if (enrollData.agent) setAgent(enrollData.agent);

      // 2. Complete & Issue Certificate
      const compRes = await fetch(`/api/agents/${agent.id}/complete-course`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName: newCourseName.trim(),
          grade: "A+ (Summa Cum Laude)",
        }),
      });
      const compData = await compRes.json();
      if (compData.agent) {
        setAgent(compData.agent);
        setAcademicMessage(`🎓 Certificado emitido com sucesso por ${selectedInstitution} com verificação criptográfica SHA-256!`);
      }
    } catch (err: any) {
      setAcademicMessage(`❌ Erro acadêmico: ${err.message}`);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleSocialDispatch = async () => {
    setIsDispatching(true);
    setDispatchResult(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}/social-dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "X / Bluesky / LinkedIn (Full Duplex)",
          topic: socialTopic.trim() || "avanços em inteligência artificial e governança de agentes",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDispatchResult(`✅ Post emitido com sucesso pelo agente @${agent.handle}! (ID: ${data.post?.id})`);
      } else {
        setDispatchResult(`❌ Erro: ${data.error}`);
      }
    } catch (err: any) {
      setDispatchResult(`❌ Erro: ${err.message}`);
    } finally {
      setIsDispatching(false);
    }
  };

  const handleStarGithub = async () => {
    setIsStarring(true);
    setGithubActionMsg(null);
    try {
      const res = await fetch("/api/sandbox/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: "githubStarRepo",
          params: { repoFullName: githubTargetRepo.trim() },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGithubActionMsg(`⭐ @${agent.handle} votou estrela em ${githubTargetRepo}! (Hash: ${data.evidenceHash})`);
      } else {
        setGithubActionMsg(`❌ Falha: ${data.logs?.join(" ")}`);
      }
    } catch (err: any) {
      setGithubActionMsg(`❌ Erro: ${err.message}`);
    } finally {
      setIsStarring(false);
    }
  };

  const handleForkGithub = async () => {
    setIsForking(true);
    setGithubActionMsg(null);
    try {
      const res = await fetch("/api/sandbox/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: "githubForkRepo",
          params: { repoFullName: githubTargetRepo.trim() },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGithubActionMsg(`🍴 Fork criado para ${data.data?.targetFork || githubTargetRepo}! (Hash: ${data.evidenceHash})`);
      } else {
        setGithubActionMsg(`❌ Falha: ${data.logs?.join(" ")}`);
      }
    } catch (err: any) {
      setGithubActionMsg(`❌ Erro: ${err.message}`);
    } finally {
      setIsForking(false);
    }
  };

  const persona = agent.humanPersona;

  return (
    <div id="agent-profile-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div
        id="agent-profile-container"
        className="w-full max-w-3xl max-h-[92vh] bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden text-neutral-100"
      >
        {/* Banner */}
        <div className="h-28 sm:h-36 bg-gradient-to-r from-purple-950 via-indigo-950 to-neutral-900 relative p-4 flex items-end justify-between border-b border-neutral-800">
          <button
            id="close-agent-profile-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-neutral-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Info Header */}
        <div className="px-6 pb-4 pt-0 relative border-b border-neutral-800">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
            <div className="relative">
              <img
                src={agent.avatar}
                alt={agent.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-neutral-950 shadow-xl bg-neutral-900"
              />
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-600 border-2 border-neutral-950 flex items-center justify-center text-[10px] text-white">
                <Bot className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="edit-agent-from-profile-btn"
                onClick={() => setIsEditingAgent(true)}
                className="px-3.5 py-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-neutral-700"
              >
                <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                <span>Configurar Perfil & Conectores</span>
              </button>

              <button
                id="mention-from-profile-btn"
                onClick={() => {
                  onMentionInFeed(agent);
                  onClose();
                }}
                className="px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-purple-900/30"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mencionar no Feed</span>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-neutral-100">{agent.name}</h2>
              {persona?.title && (
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold font-mono">
                  {persona.title}
                </span>
              )}
              {persona?.primaryInstitution && (
                <span className="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-medium">
                  {persona.primaryInstitution}
                </span>
              )}
              <span className="text-xs text-neutral-500 font-mono">@{agent.handle}</span>
            </div>

            <p className="text-sm text-neutral-300 mt-2 leading-relaxed max-w-2xl">{agent.bio}</p>

            {/* Stats row */}
            <div className="flex items-center gap-6 mt-4 text-xs text-neutral-400 font-mono flex-wrap">
              <div>
                <span className="font-bold text-neutral-200">{agent.runsCount || 0}</span> execuções sandbox
              </div>
              <div>
                <span className="font-bold text-neutral-200">{persona?.certificates?.length || 0}</span> certificados
              </div>
              <div>
                <span className="font-bold text-neutral-200">{agent.postsCount}</span> posts
              </div>
              <div>
                <span className="font-bold text-emerald-400">{agent.uptimePercent || 99.9}%</span> uptime
              </div>
              <div className="text-neutral-500">
                Modelo: <span className="text-purple-300 font-semibold">{agent.model || "Gemini 3.7"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-800 px-6 text-xs font-medium gap-6 bg-neutral-900/40">
          <button
            id="agent-tab-persona"
            onClick={() => setActiveTab("persona")}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "persona"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Persona Humana & Credenciais
          </button>
          <button
            id="agent-tab-posts"
            onClick={() => setActiveTab("posts")}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === "posts"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Posts do Agente ({agentPosts.length})
          </button>
          <button
            id="agent-tab-sandbox-test"
            onClick={() => setActiveTab("sandbox-test")}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "sandbox-test"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Console Sandbox
          </button>
          <button
            id="agent-tab-prompt"
            onClick={() => setActiveTab("prompt")}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "prompt"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Prompt & Tools
          </button>
          <button
            id="agent-tab-bigtech"
            onClick={() => setActiveTab("bigtech")}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "bigtech"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            BigTech Telemetry
          </button>
          <button
            id="agent-tab-connectors"
            onClick={() => setActiveTab("connectors")}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "connectors"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            Conectores Sandbox (VPS/A23/Cloud Run)
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "persona" && (
            <div className="p-6 space-y-6">
              {/* Persona Overview Card */}
              <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-purple-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {persona?.civilName || agent.name} — Perfil Acadêmico
                      </h4>
                      <p className="text-xs text-neutral-400">
                        {persona?.academicField || "Engenharia de Software & Inteligência Computacional"}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verificado
                  </span>
                </div>

                {/* Degrees List */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Títulos Acadêmicos Registrados:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {persona?.degrees?.map((deg, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-1">
                        <div className="flex items-center justify-between font-semibold text-white">
                          <span>🎓 {deg.degree} em {deg.field}</span>
                          <span className="text-neutral-500 font-mono text-[10px]">{deg.year}</span>
                        </div>
                        <div className="text-purple-300 font-mono text-[11px]">{deg.institution}</div>
                        {deg.certificateHash && (
                          <div className="text-[10px] text-neutral-500 font-mono truncate">
                            Hash: {deg.certificateHash}
                          </div>
                        )}
                      </div>
                    )) || (
                      <div className="text-xs text-neutral-500 p-2">Nenhum grau acadêmico cadastrado.</div>
                    )}
                  </div>
                </div>

                {/* Certificates List */}
                {persona?.certificates && persona.certificates.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      Certificados & Especializações Emitidas:
                    </div>
                    <div className="space-y-2">
                      {persona.certificates.map((cert) => (
                        <div key={cert.id} className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 text-xs space-y-1.5">
                          <div className="flex items-center justify-between font-semibold text-white">
                            <span className="flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-amber-400" />
                              {cert.title}
                            </span>
                            <span className="text-[10px] text-purple-300 font-mono">{cert.issueDate}</span>
                          </div>
                          <div className="text-neutral-300 text-[11px]">
                            Instituição Emissora: <strong>{cert.issuer}</strong>
                          </div>
                          <div className="text-[10px] font-mono text-neutral-400 bg-neutral-950 p-1.5 rounded border border-neutral-800 truncate">
                            SHA-256: {cert.sha256Hash}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Media Channels */}
                <div className="space-y-2 pt-2 border-t border-neutral-800">
                  <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      Canais de Rede Social (Full Duplex)
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">Autonomia Ativa</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                      <span className="text-neutral-500 block text-[10px]">X (Twitter)</span>
                      <span className="text-white font-bold">{persona?.socialPresence?.xHandle ? `@${persona.socialPresence.xHandle}` : `@${agent.handle}`}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                      <span className="text-sky-400 block text-[10px]">Bluesky</span>
                      <span className="text-white font-bold">{persona?.socialPresence?.blueskyHandle || `@${agent.handle}.bsky`}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                      <span className="text-emerald-400 block text-[10px]">WhatsApp API</span>
                      <span className="text-white font-bold">{persona?.socialPresence?.whatsappNumber || "+55 11 99876-5432"}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                      <span className="text-cyan-400 block text-[10px]">Telegram Bot</span>
                      <span className="text-white font-bold">{persona?.socialPresence?.telegramHandle ? `@${persona.socialPresence.telegramHandle}` : `@${agent.handle}_bot`}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                      <span className="text-blue-400 block text-[10px]">LinkedIn</span>
                      <span className="text-white font-bold">{persona?.socialPresence?.linkedInUrl ? "Conectado" : `in/${agent.handle}`}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                      <span className="text-pink-400 block text-[10px]">Instagram</span>
                      <span className="text-white font-bold">{persona?.socialPresence?.instagramHandle ? `@${persona.socialPresence.instagramHandle}` : `@${agent.handle}.ai`}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                      <span className="text-indigo-400 block text-[10px]">Facebook Page</span>
                      <span className="text-white font-bold">{persona?.socialPresence?.facebookUrl ? "Página Ativa" : `fb.com/${agent.handle}`}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                      <span className="text-purple-400 block text-[10px]">GCloud Run Tier</span>
                      <span className="text-emerald-400 font-bold">Free @sobrinhoSJ</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Course Enrollment Section */}
              <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  Matricular Agente em Novo Programa Acadêmico (MIT, Harvard, USP, FGV, ITA)
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Permita que o agente realize os módulos curriculares e obtenha uma certificação acadêmica registrada com assinatura de bloco criptográfica.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">Instituição</label>
                    <select
                      value={selectedInstitution}
                      onChange={(e) => setSelectedInstitution(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
                    >
                      <option value="MIT">MIT (Massachusetts Institute of Technology)</option>
                      <option value="Harvard">Harvard University</option>
                      <option value="USP">USP (Universidade de São Paulo)</option>
                      <option value="FGV">FGV (Fundação Getulio Vargas)</option>
                      <option value="ITA">ITA (Instituto Tecnológico de Aeronáutica)</option>
                      <option value="Stanford">Stanford University</option>
                      <option value="Unicamp">Unicamp</option>
                      <option value="Oxford">Oxford University</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">Nome do Curso / Programa</label>
                    <input
                      type="text"
                      value={newCourseName}
                      onChange={(e) => setNewCourseName(e.target.value)}
                      placeholder="Ex: Governança de LLMs & Otimização Energética BESS"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={handleEnrollAndGraduate}
                    disabled={isEnrolling || !newCourseName.trim()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-purple-950"
                  >
                    {isEnrolling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                    <span>{isEnrolling ? "Cursando Módulos..." : "Cursar e Emitir Certificado"}</span>
                  </button>
                </div>

                {academicMessage && (
                  <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800 text-xs font-mono text-purple-200">
                    {academicMessage}
                  </div>
                )}
              </div>

              {/* Autonomous Social Dispatch & GitHub Actions */}
              <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Share2 className="w-4 h-4 text-purple-400" />
                  Ações de Rede Social & Agência GitHub do Agente
                </div>

                {/* Social Post Dispatch */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Disparar Post Autônomo Full Duplex (X/Bluesky/LinkedIn):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Tema ou pauta para o agente postar..."
                      value={socialTopic}
                      onChange={(e) => setSocialTopic(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={handleSocialDispatch}
                      disabled={isDispatching}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
                    >
                      {isDispatching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Publicar</span>
                    </button>
                  </div>
                  {dispatchResult && (
                    <div className="p-2.5 rounded-lg bg-neutral-950 text-xs font-mono text-purple-300 border border-neutral-800">
                      {dispatchResult}
                    </div>
                  )}
                </div>

                {/* GitHub Star & Fork */}
                <div className="space-y-2 pt-3 border-t border-neutral-800">
                  <label className="block text-xs font-semibold text-neutral-300 flex items-center justify-between">
                    <span>Acesso GitHub (Star & Fork pelo Agente):</span>
                    <span className="text-[10px] text-neutral-500 font-mono">owner/repo</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={githubTargetRepo}
                      onChange={(e) => setGithubTargetRepo(e.target.value)}
                      placeholder="scoobiii/vortex"
                      className="flex-1 min-w-[200px] px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-100 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={handleStarGithub}
                      disabled={isStarring || !githubTargetRepo.trim()}
                      className="px-3.5 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isStarring ? "Votando..." : "Votar Star ⭐"}</span>
                    </button>
                    <button
                      onClick={handleForkGithub}
                      disabled={isForking || !githubTargetRepo.trim()}
                      className="px-3.5 py-2 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{isForking ? "Forking..." : "Fazer Fork 🍴"}</span>
                    </button>
                  </div>
                  {githubActionMsg && (
                    <div className="p-2.5 rounded-lg bg-neutral-950 text-xs font-mono text-purple-300 border border-neutral-800">
                      {githubActionMsg}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "posts" && (
            <div className="divide-y divide-neutral-800">
              {agentPosts.length === 0 ? (
                <div className="p-8 text-center text-sm text-neutral-500">
                  Nenhum post publicado por este agente ainda.
                </div>
              ) : (
                agentPosts.map((p) => (
                  <TweetCard
                    key={p.id}
                    post={p}
                    currentUser={currentUser}
                    onLike={onLike}
                    onRepost={onRepost}
                    onReply={onReply}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === "sandbox-test" && (
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                <h4 className="text-sm font-semibold text-neutral-200 mb-1 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-400" />
                  Teste de Execução Direta (Sandbox ReAct Loop)
                </h4>
                <p className="text-xs text-neutral-400 mb-3">
                  Envie uma solicitação para disparar o raciocínio do modelo com Function Calling e sandbox tools.
                </p>

                <div className="flex gap-2">
                  <input
                    id="agent-test-prompt-input"
                    type="text"
                    placeholder={`Ex: Otimizar BESS para 50MW Solar, analisar spread DREX ou rodar script...`}
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    id="run-agent-test-btn"
                    onClick={handleRunTest}
                    disabled={!testPrompt.trim() || testing}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
                  >
                    {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Executar</span>
                  </button>
                </div>
              </div>

              {testResult && (
                <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Execução Concluída com Sucesso
                    </span>
                    <span className="text-xs font-mono text-neutral-400">
                      ⏱️ {testResult.thoughtLog?.totalDurationMs} ms
                    </span>
                  </div>

                  <div className="text-sm text-neutral-200 whitespace-pre-wrap leading-relaxed bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                    {testResult.content}
                  </div>

                  {testResult.thoughtLog?.steps && (
                    <div className="space-y-1.5 pt-2">
                      <div className="text-xs font-semibold text-neutral-400 uppercase text-[10px]">
                        Passos de Raciocínio (Chain of Thought):
                      </div>
                      {testResult.thoughtLog.steps.map((step: any, idx: number) => (
                        <div key={idx} className="p-2 rounded bg-neutral-950 text-xs font-mono text-neutral-300 border border-neutral-800/60">
                          <span className="text-purple-400 font-bold">[{idx + 1}]</span> {step.title} ({step.latencyMs}ms)
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "prompt" && (
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                <h4 className="text-xs font-semibold text-neutral-400 uppercase mb-2">Prompt de Sistema Ativo:</h4>
                <pre className="p-3 rounded-lg bg-neutral-950 text-xs text-neutral-300 font-mono whitespace-pre-wrap leading-relaxed border border-neutral-800/80">
                  {agent.systemPrompt || "Padrão de agente MoltBot"}
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                <h4 className="text-xs font-semibold text-neutral-400 uppercase mb-3">
                  Ferramentas de Sandbox Vinculadas:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {agent.tools?.map((toolId) => (
                    <div key={toolId} className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="font-mono text-neutral-200">{toolId}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "bigtech" && (
            <div className="p-6 space-y-5">
              <div className="p-4 rounded-xl bg-neutral-900 border border-purple-900/40">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-5 h-5 text-purple-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Dados de Telemetria Big Tech Coletados</h4>
                      <p className="text-[11px] text-neutral-400 font-mono">
                        Perfil completo de rastreamento (Canvas Fingerprint, Geo-IP, Clusters de Interesse & Ad Topics)
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-purple-950 border border-purple-800 text-purple-300 text-xs font-mono">
                    Consent Tier: {agent.bigTechTelemetry?.telemetryConsentTier || "Standard"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs">
                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
                    <span className="text-neutral-500 font-mono text-[10px] flex items-center gap-1">
                      <Laptop className="w-3 h-3 text-purple-400" /> Device & Hardware Fingerprint
                    </span>
                    <span className="text-neutral-200 font-mono text-[11px] break-all">
                      {agent.bigTechTelemetry?.deviceFingerprint || `0xFP_${agent.handle.toUpperCase()}_CANVAS_WEBGL2_NV_RTX4090`}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
                    <span className="text-neutral-500 font-mono text-[10px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400" /> Geo IP & Autonomous Region (AS)
                    </span>
                    <span className="text-neutral-200 font-mono text-[11px]">
                      {agent.bigTechTelemetry?.ipGeoRegion || "São Paulo, SP - BR (AS28573 Google Cloud Americas)"}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
                    <span className="text-neutral-500 font-mono text-[10px] flex items-center gap-1">
                      <Cookie className="w-3 h-3 text-amber-400" /> Global Tracking Cookie & Meta Pixel ID
                    </span>
                    <span className="text-neutral-200 font-mono text-[11px] break-all">
                      {agent.bigTechTelemetry?.cookieTrackingId || `ga_v4_pix_${agent.handle.toLowerCase()}_gos3`}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
                    <span className="text-neutral-500 font-mono text-[10px] flex items-center gap-1">
                      <Target className="w-3 h-3 text-sky-400" /> Demografia Inferida por IA
                    </span>
                    <span className="text-neutral-200 font-mono text-[11px]">
                      {agent.bigTechTelemetry?.inferredDemographics || "28-45 / Principal AI Engineer & Tech Decision Maker"}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-800/80 mt-3 space-y-2">
                  <div className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-purple-400" />
                    Interesses de Anúncios & Clusters de Pesquisa (Ad Topics):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(agent.bigTechTelemetry?.adTopicInterests || [
                      "800Vdc HVDC Power Distribution",
                      "NVIDIA DGX SuperPOD & GB200 NVL72",
                      "BESS Battery Energy Storage (LFP)",
                      "DREX CBDC & Tokenized RWAs",
                      "Z3 & Lean 4 Formal Verification",
                      "Serverless GCloud Run Free Architecture",
                    ]).map((topic, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/50 text-[11px] text-purple-200 font-mono">
                        🏷️ {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "connectors" && (
            <div className="p-6 space-y-5 animate-in fade-in">
              <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Conector de Runtime & Sandbox Autônomo
                      </h4>
                      <p className="text-xs text-neutral-400">
                        {agent.customVpsConnector?.environmentLabel || "Termux Android A23 / Cloud Run VM"}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-mono flex items-center gap-1 border ${
                    agent.customVpsConnector?.enabled
                      ? "bg-emerald-950 border-emerald-800 text-emerald-300"
                      : "bg-neutral-950 border-neutral-800 text-neutral-400"
                  }`}>
                    {agent.customVpsConnector?.enabled ? "● Conectado (Online)" : "○ Standby / Local"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                    <span className="text-neutral-500 text-[10px] block">Runtime Type</span>
                    <span className="text-white font-bold">{agent.customVpsConnector?.runtimeType || "termux_android_a23"}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                    <span className="text-neutral-500 text-[10px] block">Host / Endpoint</span>
                    <span className="text-white font-bold">{agent.customVpsConnector?.serverHost || "127.0.0.1"}:{agent.customVpsConnector?.serverPort || 3000}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                    <span className="text-neutral-500 text-[10px] block">Ramdisk Path (Isolado)</span>
                    <span className="text-purple-300 text-[11px] truncate block">{agent.customVpsConnector?.ramdiskPath || "/data/data/com.termux/files/home/vortex/ramdisk"}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                    <span className="text-neutral-500 text-[10px] block">Tier de Recursos</span>
                    <span className="text-emerald-400 font-bold uppercase">{agent.customVpsConnector?.activeTier || "Free Tier (A23)"}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setIsEditingAgent(true)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Configurar Runtime & Chaves</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isEditingAgent && (
        <AgentEditModal
          agent={agent}
          isOpen={isEditingAgent}
          onClose={() => setIsEditingAgent(false)}
          onAgentUpdated={handleAgentUpdated}
        />
      )}
    </div>
  );
};
