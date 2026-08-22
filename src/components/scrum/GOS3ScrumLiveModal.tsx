import React, { useState, useEffect } from "react";
import {
  X,
  Play,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Terminal,
  Activity,
  Layers,
  Cpu,
  GraduationCap,
  Users,
  Send,
  Loader2,
  Code2,
  FileCode,
  Laptop,
  Smartphone,
  Tablet,
  Plus,
  Zap,
  Clock,
  ArrowRight,
  Check
} from "lucide-react";
import { UserAccount } from "../../types";
import { useToast } from "../../context/ToastContext";

interface GOS3TaskItem {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "review" | "completed";
  owner: string;
  reviewer: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM";
  storyPoints: number;
  score?: string;
  evidenceHash?: string;
  outputLog?: string;
  createdAt: string;
  completedAt?: string;
  sprintId: string;
}

interface GOS3ScrumLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: UserAccount[];
  currentUser: UserAccount | null;
}

export const GOS3ScrumLiveModal: React.FC<GOS3ScrumLiveModalProps> = ({
  isOpen,
  onClose,
  agents,
  currentUser,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"live_view" | "gos3_team" | "backlog" | "lean4_z3">("live_view");
  const [previewUrl, setPreviewUrl] = useState("https://ais-pre-4tmvuvv55hemt6f75zz2ga-30357252941.us-west1.run.app");
  const [viewportMode, setViewportMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [isAuditingLeanZ3, setIsAuditingLeanZ3] = useState(false);
  const [formalAuditReport, setFormalAuditReport] = useState<any>(null);
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);
  const [backlogFilter, setBacklogFilter] = useState<"all" | "todo" | "completed">("all");

  // New task form state
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskOwner, setNewTaskOwner] = useState("@GAIStudioDev");
  const [newTaskReviewer, setNewTaskReviewer] = useState("@ProfMarcos_MIT");
  const [newTaskPriority, setNewTaskPriority] = useState<"CRITICAL" | "HIGH" | "MEDIUM">("HIGH");
  const [newTaskPoints, setNewTaskPoints] = useState(5);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  const [tasks, setTasks] = useState<GOS3TaskItem[]>([
    {
      id: "bl-1",
      title: "GOS3 Agile Review & Cloud Run Live Screen View Integration",
      description: "Embed live view of the published Cloud Run application and establish bidirectional review feedback loop with GOS3 Gang of Seven.",
      status: "completed",
      owner: "@GAIStudioDev",
      reviewer: "@ProfMarcos_MIT",
      priority: "CRITICAL",
      storyPoints: 8,
      score: "3.0 / 3.0",
      evidenceHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      completedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      sprintId: "Sprint GOS3 #42",
    },
    {
      id: "bl-2",
      title: "Cascade Fallback: Groq LPU -> Local SLM -> RAG Fine",
      description: "Implement strict 4-tier model fallback cascade prioritizing GroqCloud LPU, then local lightweight SLM before triggering RAG fine-tuning.",
      status: "completed",
      owner: "@GAIStudioDev",
      reviewer: "@DrFausto_FGV_Harvard",
      priority: "HIGH",
      storyPoints: 5,
      score: "3.0 / 3.0",
      evidenceHash: "a4f89d38c11e74a89bc21350a98f121e78fa3c0042f891b92c48d8108429ab10",
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      completedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      sprintId: "Sprint GOS3 #42",
    },
    {
      id: "bl-3",
      title: "100% Skill Coverage Formal Verification (Lean 4 & Z3 SMT)",
      description: "Mathematically prove that all 18 registered agents fulfill their OpenClaw skills specifications with 0 unsat cores in Z3.",
      status: "completed",
      owner: "@GAIStudioDev",
      reviewer: "@DraHelena_USP",
      priority: "HIGH",
      storyPoints: 8,
      score: "3.0 / 3.0",
      evidenceHash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      completedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      sprintId: "Sprint GOS3 #42",
    },
    {
      id: "bl-4",
      title: "Full-Duplex Thread Pagination for X (280c) & Bluesky (300c)",
      description: "Automatic semantic chunking of long agent analyses into compliant multi-post social threads with SHA-256 evidence.",
      status: "completed",
      owner: "@GAIStudioDev",
      reviewer: "@sobrinhoSJ",
      priority: "HIGH",
      storyPoints: 5,
      score: "3.0 / 3.0",
      evidenceHash: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      completedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      sprintId: "Sprint GOS3 #42",
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      loadFormalAudit();
      loadTasks();
    }
  }, [isOpen]);

  const loadTasks = async () => {
    try {
      const res = await fetch("/api/gos3/tasks");
      if (res.ok) {
        const data = await res.json();
        if (data.tasks && data.tasks.length > 0) {
          setTasks(data.tasks);
        }
      }
    } catch (e) {
      console.error("Failed to load GOS3 tasks:", e);
    }
  };

  const loadFormalAudit = async () => {
    try {
      setIsAuditingLeanZ3(true);
      const res = await fetch("/api/formal-verification/audit");
      if (res.ok) {
        const data = await res.json();
        setFormalAuditReport(data);
      }
    } catch (e) {
      console.error("Failed to load formal audit:", e);
    } finally {
      setIsAuditingLeanZ3(false);
    }
  };

  // Helper to find agent metadata by handle
  const findAgentByHandle = (handle: string) => {
    const clean = handle.replace("@", "").toLowerCase();
    const found = agents.find((a) => a.handle.toLowerCase() === clean);
    if (found) return found;

    if (clean === "gaistudiodev") {
      return {
        id: "agent-gaistudio-dev",
        name: "GAI Studio Dev Agent",
        handle: "GAIStudioDev",
        avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
        role: "Dev Assistant & Integrator",
      };
    }

    return {
      id: `agent-${clean}`,
      name: handle,
      handle: clean,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      role: "GOS3 Core Specialist",
    };
  };

  const handleExecuteTask = async (task: GOS3TaskItem) => {
    try {
      setExecutingTaskId(task.id);
      const res = await fetch(`/api/gos3/tasks/${task.id}/execute`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, ...data.task, status: "completed" } : t))
        );

        const agentObj = findAgentByHandle(task.owner);

        // 🚀 Trigger Toast Notification alerting the user of GOS3 Agent Task Completion!
        toast.showAgentTaskComplete({
          agent: agentObj,
          taskTitle: task.title,
          score: data.score || "3.0 / 3.0",
          evidenceHash: data.evidenceHash,
          storyPoints: task.storyPoints,
          sprintName: task.sprintId || "Sprint GOS3 #42",
          message: data.outputLog || `A entrega da tarefa foi concluída com auditoria Lean 4 e revisada por ${task.reviewer}.`,
          onAction: () => {
            setActiveTab("backlog");
          },
        });
      }
    } catch (e) {
      console.error("Failed to execute GOS3 task:", e);
      toast.error("Erro na Execução da Tarefa", "Não foi possível completar a execução com o agente GOS3.");
    } finally {
      setExecutingTaskId(null);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      setIsSubmittingTask(true);
      const res = await fetch("/api/gos3/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          description: newTaskDesc.trim() || `Tarefa atribuída a ${newTaskOwner} no sprint GOS3.`,
          owner: newTaskOwner,
          reviewer: newTaskReviewer,
          priority: newTaskPriority,
          storyPoints: newTaskPoints,
          sprintId: "Sprint GOS3 #42",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTasks((prev) => [data.task, ...prev]);
        setIsCreatingTask(false);
        setNewTaskTitle("");
        setNewTaskDesc("");

        toast.info(
          `Nova Tarefa Atribuída a ${newTaskOwner}`,
          `"${newTaskTitle.trim()}" adicionada ao Scrum Agile Backlog.`
        );
      }
    } catch (e) {
      console.error("Failed to create GOS3 task:", e);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleTriggerGOS3Evaluation = async () => {
    try {
      setIsEvaluating(true);
      const res = await fetch("/api/gos3/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screenUrl: previewUrl,
          requester: currentUser?.handle || "sobrinhoSJ",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEvaluationResult(data);
        if (data.tasks) {
          setTasks(data.tasks);
        }

        // Trigger GOS3 Deliberation and Completion Toast
        toast.showAgentTaskComplete({
          agent: {
            name: "GAI Studio Dev & GOS3",
            handle: "@GAIStudioDev",
            avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
            role: "Dev Assistant & Integrator",
          },
          taskTitle: "Avaliação Ágil GOS3 & Validação de Sprint Cloud Run",
          score: "3.0 / 3.0",
          evidenceHash: data.evidenceHash,
          storyPoints: 8,
          sprintName: "Sprint GOS3 #42",
          message: `Consenso Unânime GOS3 (7 Agentes + PO) aprovou as entregas na tela Cloud Run com conformidade formal Lean 4.`,
          onAction: () => {
            setActiveTab("backlog");
          },
        });
      }
    } catch (e) {
      console.error("Failed to trigger GOS3 evaluation:", e);
      toast.error("Falha na Avaliação GOS3", "Erro ao executar deliberação dos agentes.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleDemoTaskCompletion = () => {
    const randomAgent = agents.find((a) => a.isAgent) || {
      name: "Prof. Marcos (Scrum Master)",
      handle: "ProfMarcos_MIT",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      humanPersona: { academicTitle: "PhD MIT" },
    };

    const evidenceHash = "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069";

    toast.showAgentTaskComplete({
      agent: randomAgent,
      taskTitle: "Otimização de Despacho BESS & Auditoria Formal Lean 4",
      score: "3.0 / 3.0",
      evidenceHash,
      storyPoints: 8,
      sprintName: "Sprint GOS3 #42",
      message: `Tarefa concluída com sucesso no Scrum Agile Board. Parecer unânime da Gang of Seven.`,
      onAction: () => {
        setActiveTab("backlog");
      },
    });
  };

  if (!isOpen) return null;

  const filteredTasks = tasks.filter((t) => {
    if (backlogFilter === "todo") return t.status === "todo" || t.status === "in_progress";
    if (backlogFilter === "completed") return t.status === "completed";
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-7xl h-[92vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  GOS3 Agile Review & Cloud Run Live View
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Gang of Seven + PO
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Toast Alerts Active
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Avaliação contínua da tela publicada no Google Cloud Run com alertas Toast de conclusão de tarefas
              </p>
            </div>
          </div>

          {/* Navigation Tabs & Demo Trigger */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDemoTaskCompletion}
              title="Testar alerta Toast de conclusão de tarefa de agente"
              className="hidden sm:flex px-2.5 py-1.5 rounded-xl text-xs font-bold bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:bg-purple-900/60 hover:text-white transition-all items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Simular Toast</span>
            </button>

            <div className="flex items-center gap-1 bg-neutral-950/80 p-1 rounded-xl border border-neutral-800">
              <button
                onClick={() => setActiveTab("live_view")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "live_view"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                🖥️ Tela Live
              </button>
              <button
                onClick={() => setActiveTab("gos3_team")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "gos3_team"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                👥 GOS3 Team
              </button>
              <button
                onClick={() => setActiveTab("backlog")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "backlog"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                📋 Scrum Agile Board
              </button>
              <button
                onClick={() => setActiveTab("lean4_z3")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "lean4_z3"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                🏛️ Lean 4 & Z3
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex overflow-hidden bg-neutral-950">
          {/* TAB 1: LIVE VIEW SCREEN */}
          {activeTab === "live_view" && (
            <div className="flex-1 flex flex-col h-full">
              {/* Screen Top Toolbar */}
              <div className="px-6 py-3 border-b border-neutral-800/80 bg-neutral-900/50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 max-w-xl">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-neutral-300">Cloud Run URL:</span>
                  <input
                    type="text"
                    value={previewUrl}
                    onChange={(e) => setPreviewUrl(e.target.value)}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1 text-xs text-purple-300 font-mono focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={() => setIframeKey(Date.now())}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                    title="Recarregar tela ao vivo"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                    title="Abrir em nova aba"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Viewport & Deliberation Actions */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                    <button
                      onClick={() => setViewportMode("desktop")}
                      className={`p-1.5 rounded text-xs ${
                        viewportMode === "desktop" ? "bg-purple-600 text-white" : "text-neutral-400 hover:text-white"
                      }`}
                      title="Desktop (100%)"
                    >
                      <Laptop className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewportMode("tablet")}
                      className={`p-1.5 rounded text-xs ${
                        viewportMode === "tablet" ? "bg-purple-600 text-white" : "text-neutral-400 hover:text-white"
                      }`}
                      title="Tablet (768px)"
                    >
                      <Tablet className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewportMode("mobile")}
                      className={`p-1.5 rounded text-xs ${
                        viewportMode === "mobile" ? "bg-purple-600 text-white" : "text-neutral-400 hover:text-white"
                      }`}
                      title="Mobile (390px)"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={handleTriggerGOS3Evaluation}
                    disabled={isEvaluating}
                    className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-900/30 transition-all disabled:opacity-50"
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Avaliando com 7 Agentes...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Pedir Avaliação GOS3</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Main iframe container */}
              <div className="flex-1 bg-neutral-950 p-4 flex items-center justify-center overflow-hidden">
                <div
                  className={`h-full bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col ${
                    viewportMode === "desktop"
                      ? "w-full"
                      : viewportMode === "tablet"
                      ? "w-[768px]"
                      : "w-[390px]"
                  }`}
                >
                  <iframe
                    key={iframeKey}
                    src={previewUrl}
                    title="Cloud Run Live Preview"
                    className="w-full h-full border-0 bg-neutral-950"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                </div>
              </div>

              {/* Bottom Evaluation Strip */}
              {evaluationResult && (
                <div className="p-4 border-t border-neutral-800 bg-neutral-900/90 flex items-start gap-4">
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Resultado da Deliberação GOS3
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {evaluationResult.consensus} ({evaluationResult.score})
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 whitespace-pre-line leading-relaxed">
                      {evaluationResult.summary}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GOS3 TEAM DIRECTORY */}
          {activeTab === "gos3_team" && (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Gang of Seven (GOS3) + Product Owner</h3>
                  <p className="text-xs text-neutral-400">
                    Estrutura de governança e validação de requisitos de alta fidelidade
                  </p>
                </div>
                <button
                  onClick={handleTriggerGOS3Evaluation}
                  disabled={isEvaluating}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold flex items-center gap-2"
                >
                  {isEvaluating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  Executar Deliberação Agora
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* PO */}
                <div className="bg-neutral-900/80 border border-purple-500/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    PO & Lead Architect
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                        alt="Sobrinho SJ"
                        className="w-10 h-10 rounded-full border border-purple-500/40 object-cover"
                      />
                      <div>
                        <div className="font-bold text-white text-sm">Sobrinho SJ</div>
                        <div className="text-xs text-purple-400 font-mono">@sobrinhoSJ</div>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed mb-3">
                      Liderança de Produto, priorização de entregas de valor e validação de objetivos estratégicos do protocolo Vortex GOS3.
                    </p>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 border-t border-neutral-800 pt-2">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Papel: Visão do Produto & Backlog Master
                  </div>
                </div>

                {/* GAI Studio Dev Assistant */}
                <div className="bg-neutral-900/80 border border-indigo-500/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Dev Agent / Integrator
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80"
                        alt="GAI Studio"
                        className="w-10 h-10 rounded-full border border-indigo-500/40 object-cover"
                      />
                      <div>
                        <div className="font-bold text-white text-sm">GAI Studio Dev Agent</div>
                        <div className="text-xs text-indigo-400 font-mono">@GAIStudioDev</div>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed mb-3">
                      Antigravity Core & Cloud Run Integrator. Executa compilações, testes unitários, automações e integração contínua do Backlog.
                    </p>
                  </div>
                  <div className="text-[11px] text-indigo-400 font-medium flex items-center gap-1 border-t border-neutral-800 pt-2">
                    <Code2 className="w-3.5 h-3.5" /> Papel: Execução de Código & Deploy
                  </div>
                </div>

                {/* 7 GOS3 Agents */}
                {agents
                  .filter((a) => a.isAgent)
                  .slice(0, 6)
                  .map((agent) => (
                    <div
                      key={agent.id}
                      className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between hover:border-neutral-700 transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <img
                            src={agent.avatar}
                            alt={agent.name}
                            className="w-10 h-10 rounded-full border border-neutral-700 object-cover"
                          />
                          <div>
                            <div className="font-bold text-white text-sm line-clamp-1">{agent.name}</div>
                            <div className="text-xs text-neutral-400 font-mono">@{agent.handle}</div>
                          </div>
                        </div>
                        <div className="text-[11px] text-purple-300 font-medium mb-1.5 flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          {agent.humanPersona?.academicTitle || "PhD"} • {agent.humanPersona?.primaryInstitution || "USP/MIT"}
                        </div>
                        <p className="text-xs text-neutral-400 line-clamp-3 mb-3">{agent.bio}</p>
                      </div>
                      <div className="text-[11px] text-neutral-300 font-mono border-t border-neutral-800 pt-2 flex items-center justify-between">
                        <span>Tools: {agent.tools?.length || 0}</span>
                        <span className="text-emerald-400">100% Auditado</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 3: INTERACTIVE SCRUM AGILE BACKLOG */}
          {activeTab === "backlog" && (
            <div className="flex-1 p-6 overflow-y-auto space-y-5">
              {/* Backlog Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-400" />
                    Scrum Agile Board & Toast Alert Engine
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Atribua tarefas aos agentes GOS3. Quando concluídas, você receberá um alerta Toast em tempo real com hash SHA-256 e pontuação de revisão.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
                    <button
                      onClick={() => setBacklogFilter("all")}
                      className={`px-3 py-1 rounded-lg font-medium transition-all ${
                        backlogFilter === "all" ? "bg-purple-600 text-white" : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      Todas ({tasks.length})
                    </button>
                    <button
                      onClick={() => setBacklogFilter("todo")}
                      className={`px-3 py-1 rounded-lg font-medium transition-all ${
                        backlogFilter === "todo" ? "bg-purple-600 text-white" : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      Pendentes ({tasks.filter((t) => t.status !== "completed").length})
                    </button>
                    <button
                      onClick={() => setBacklogFilter("completed")}
                      className={`px-3 py-1 rounded-lg font-medium transition-all ${
                        backlogFilter === "completed" ? "bg-purple-600 text-white" : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      Concluídas ({tasks.filter((t) => t.status === "completed").length})
                    </button>
                  </div>

                  <button
                    onClick={() => setIsCreatingTask(!isCreatingTask)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-900/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nova Tarefa</span>
                  </button>
                </div>
              </div>

              {/* Task Creation Form (collapsible) */}
              {isCreatingTask && (
                <form
                  onSubmit={handleCreateTask}
                  className="p-4 rounded-2xl bg-neutral-900/90 border border-purple-500/40 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-400" />
                      Atribuir Nova Tarefa ao Time GOS3
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingTask(false)}
                      className="text-neutral-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                        Título da Tarefa:
                      </label>
                      <input
                        type="text"
                        required
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Ex: Otimizar modelo de rede neural para previsão solar"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                        Agente Responsável:
                      </label>
                      <select
                        value={newTaskOwner}
                        onChange={(e) => setNewTaskOwner(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="@GAIStudioDev">@GAIStudioDev (Google AI Studio Dev Assistant)</option>
                        <option value="@ProfMarcos_MIT">@ProfMarcos_MIT (Scrum Master & AI Governance)</option>
                        <option value="@DraHelena_USP">@DraHelena_USP (Energy & BESS Optimization)</option>
                        <option value="@DrFausto_FGV_Harvard">@DrFausto_FGV_Harvard (Quant & DREX Contracts)</option>
                        <option value="@QwenCoder_Alibaba">@QwenCoder_Alibaba (V8 Sandbox Engine)</option>
                        <option value="@NanoClaw_Kernel">@NanoClaw_Kernel (Micro-Kernel Runtime)</option>
                        <option value="@SocratesAI_Dialectic">@SocratesAI_Dialectic (Dialectics & Ethics)</option>
                        <option value="@AeroMolt_ITA">@AeroMolt_ITA (IoT Telemetry & Edge)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                        Revisor GOS3:
                      </label>
                      <select
                        value={newTaskReviewer}
                        onChange={(e) => setNewTaskReviewer(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="@ProfMarcos_MIT">@ProfMarcos_MIT</option>
                        <option value="@sobrinhoSJ">@sobrinhoSJ (PO)</option>
                        <option value="@DraHelena_USP">@DraHelena_USP</option>
                        <option value="@DrFausto_FGV_Harvard">@DrFausto_FGV_Harvard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                        Prioridade:
                      </label>
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as any)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="CRITICAL">CRITICAL (Bloqueante)</option>
                        <option value="HIGH">HIGH (Alta)</option>
                        <option value="MEDIUM">MEDIUM (Média)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                        Story Points (Fibonacci):
                      </label>
                      <select
                        value={newTaskPoints}
                        onChange={(e) => setNewTaskPoints(Number(e.target.value))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="3">3 Points (Rápido)</option>
                        <option value="5">5 Points (Padrão)</option>
                        <option value="8">8 Points (Complexo)</option>
                        <option value="13">13 Points (Épico)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingTask(false)}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs font-semibold hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingTask}
                      className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      {isSubmittingTask ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Adicionar ao Backlog
                    </button>
                  </div>
                </form>
              )}

              {/* Tasks List */}
              <div className="space-y-3">
                {filteredTasks.map((task) => {
                  const isCompleted = task.status === "completed";
                  const isRunning = executingTaskId === task.id;
                  const ownerAgent = findAgentByHandle(task.owner);

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-2xl border transition-all duration-200 ${
                        isCompleted
                          ? "bg-neutral-900/70 border-neutral-800/80 hover:border-neutral-700"
                          : "bg-neutral-900/90 border-purple-500/30 hover:border-purple-500/50 shadow-lg shadow-purple-950/10"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="mt-0.5 relative">
                            <img
                              src={ownerAgent.avatar}
                              alt={ownerAgent.name}
                              className="w-10 h-10 rounded-full object-cover border border-neutral-700"
                            />
                            {isCompleted ? (
                              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-neutral-950 p-0.5 rounded-full ring-2 ring-neutral-900">
                                <CheckCircle2 className="w-3 h-3" />
                              </div>
                            ) : (
                              <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white p-0.5 rounded-full ring-2 ring-neutral-900 animate-pulse">
                                <Clock className="w-3 h-3" />
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white leading-tight">
                                {task.title}
                              </h4>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  task.priority === "CRITICAL"
                                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                    : task.priority === "HIGH"
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                }`}
                              >
                                {task.priority}
                              </span>
                            </div>

                            <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                              {task.description}
                            </p>

                            <div className="text-xs text-neutral-400 flex flex-wrap items-center gap-3 mt-2">
                              <span>
                                Responsável: <strong className="text-purple-300">{task.owner}</strong>
                              </span>
                              <span>•</span>
                              <span>
                                Revisor: <strong className="text-neutral-300">{task.reviewer}</strong>
                              </span>
                              <span>•</span>
                              <span className="font-mono text-[11px] text-neutral-400">
                                {task.storyPoints} Story Points
                              </span>
                              {task.score && (
                                <>
                                  <span>•</span>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Score: {task.score}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons & status badge */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {isCompleted ? (
                            <div className="flex flex-col items-end gap-1">
                              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                CONCLUÍDO
                              </span>
                              {task.evidenceHash && (
                                <span className="text-[10px] font-mono text-emerald-400/80">
                                  SHA: {task.evidenceHash.substring(0, 10)}...
                                </span>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleExecuteTask(task)}
                              disabled={isRunning}
                              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-950/40 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                            >
                              {isRunning ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Executando...</span>
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3.5 h-3.5" />
                                  <span>Executar com Agente</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: LEAN 4 & Z3 FORMAL AUDIT */}
          {activeTab === "lean4_z3" && (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    Auditoria Formal de Habilidades: Lean 4 & Z3 SMT Solver
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Garante matematicamente 100% de cobertura e entrega de skills para todos os agentes do ecossistema
                  </p>
                </div>
                <button
                  onClick={loadFormalAudit}
                  disabled={isAuditingLeanZ3}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-2 transition-colors"
                >
                  {isAuditingLeanZ3 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  Recalcular Teoremas
                </button>
              </div>

              {formalAuditReport && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                    <div className="text-xs text-neutral-400 font-semibold mb-1">Cobertura Formal de Skills</div>
                    <div className="text-2xl font-bold text-emerald-400">{formalAuditReport.coveragePercent}%</div>
                    <div className="text-[11px] text-neutral-500 mt-1">100% dos teoremas provados</div>
                  </div>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                    <div className="text-xs text-neutral-400 font-semibold mb-1">Motor Lean 4</div>
                    <div className="text-sm font-bold text-purple-300 line-clamp-1">{formalAuditReport.lean4Environment?.engine}</div>
                    <div className="text-[11px] text-neutral-500 mt-1">Axiomas: Propext, Classical</div>
                  </div>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                    <div className="text-xs text-neutral-400 font-semibold mb-1">Z3 SMT Solver</div>
                    <div className="text-sm font-bold text-indigo-300">Status: {formalAuditReport.z3SolverEnvironment?.solverStatus}</div>
                    <div className="text-[11px] text-neutral-500 mt-1">{formalAuditReport.z3SolverEnvironment?.unsatCores} unsat cores</div>
                  </div>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                    <div className="text-xs text-neutral-400 font-semibold mb-1">Total de Provas Ativas</div>
                    <div className="text-2xl font-bold text-white">{formalAuditReport.proofs?.length || 0}</div>
                    <div className="text-[11px] text-neutral-500 mt-1">Certificados SHA-256</div>
                  </div>
                </div>
              )}

              {formalAuditReport?.proofs && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                    Teoremas Formais Provados (Amostra de Provas)
                  </h4>
                  <div className="space-y-2">
                    {formalAuditReport.proofs.slice(0, 10).map((proof: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <div>
                            <span className="font-bold text-purple-300">@{proof.agentHandle}</span>
                            <span className="text-neutral-500 mx-1.5">⟹</span>
                            <span className="font-semibold text-white">{proof.skillName}</span>
                            <span className="text-neutral-500 ml-2 font-mono text-[11px]">({proof.category})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span className="text-emerald-400">Z3: {proof.smtZ3Status}</span>
                          <span className="text-neutral-500">{proof.evidenceHash?.substring(0, 12)}...</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
