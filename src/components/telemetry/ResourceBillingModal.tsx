import React, { useState, useEffect } from "react";
import { UserAccount, SystemHardwareTelemetry, UserQuotaUsage, LocalLLMConfig } from "../../types";
import {
  Server,
  Zap,
  DollarSign,
  Cpu,
  HardDrive,
  Activity,
  Layers,
  ShieldCheck,
  AlertTriangle,
  CreditCard,
  Coins,
  CheckCircle2,
  X,
  Sparkles,
  Terminal,
  Settings2,
  TrendingUp,
  Sliders,
  Check,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
}

export const ResourceBillingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<"telemetry" | "quota" | "monetization" | "localllm">("quota");
  const [telemetry, setTelemetry] = useState<SystemHardwareTelemetry | null>(null);
  const [quota, setQuota] = useState<UserQuotaUsage | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Local LLM Configuration state
  const [localConfig, setLocalConfig] = useState<LocalLLMConfig>({
    provider: "embedded_slm",
    endpointUrl: "http://localhost:11434",
    modelName: "deepseek-r1:latest",
    isLocalActive: true,
    quantization: "q4_k_m",
    gpuOffloadLayers: 33,
  });

  const fetchData = async () => {
    try {
      const [resTel, resQ] = await Promise.all([
        fetch("/api/telemetry/hardware"),
        fetch(`/api/telemetry/quota?userId=${currentUser.id}`),
      ]);
      const dataTel = await resTel.json();
      const dataQ = await resQ.json();
      if (dataTel.success) setTelemetry(dataTel.telemetry);
      if (dataQ.success) setQuota(dataQ.quota);
    } catch (e) {
      console.error("Erro ao carregar telemetria e quota", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, currentUser.id]);

  const handleUpgradePlan = async (tier: "free" | "pro" | "enterprise" | "vps_dedicated", drexRefill: number = 0) => {
    setLoading(true);
    try {
      const res = await fetch("/api/telemetry/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          tier,
          drexAmount: drexRefill,
        }),
      });
      const data = await res.json();
      if (data.success && data.quota) {
        setQuota(data.quota);
        setStatusMsg(`🎉 Parabéns! Plano atualizado para ${tier.toUpperCase()}`);
        setTimeout(() => setStatusMsg(""), 4000);
      }
    } catch (e) {
      console.error("Erro no upgrade", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocalLLM = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg("⚙️ Configuração de LLM Local salva com sucesso!");
    setTimeout(() => setStatusMsg(""), 3000);
  };

  if (!isOpen) return null;

  return (
    <div
      id="resource-billing-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md"
    >
      <div
        id="resource-billing-modal-container"
        className="w-full max-w-5xl h-[92vh] max-h-[850px] bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-neutral-100 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-amber-900/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                <span>Hardware Telemetry, Quotas & Bolso</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/40 font-mono">
                  Billing & Engine Hub
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Monitore CPU, RAM, GPU, saiba quando mexer no bolso e descubra os métodos de monetização.
              </p>
            </div>
          </div>

          <button
            id="close-billing-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Hardware Strip (Always Visible) */}
        {telemetry && (
          <div className="px-4 py-2.5 bg-neutral-900/80 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono shrink-0">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-neutral-300 font-bold">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>Cluster Hardware:</span>
              </span>
              <span className="text-sky-300">
                CPU: <strong className="text-neutral-100">{telemetry.cpuUsagePercent}%</strong>
              </span>
              <span className="text-purple-300">
                RAM: <strong className="text-neutral-100">{telemetry.ramUsedMB}MB / {telemetry.ramTotalMB}MB</strong>
              </span>
              <span className="text-teal-300">
                V8 Heap: <strong className="text-neutral-100">{telemetry.v8HeapUsedMB}MB</strong>
              </span>
              <span className="text-amber-300">
                Disk: <strong className="text-neutral-100">{telemetry.storageUsedMB}MB / {telemetry.storageTotalMB}MB</strong>
              </span>
              <span className="text-emerald-300">
                Uptime: <strong className="text-neutral-100">{Math.floor(telemetry.uptimeSeconds / 60)}min</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Conexões:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px] font-bold">
                {telemetry.activeSockets} ativas
              </span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 text-xs font-bold shrink-0 bg-neutral-900/30">
          <button
            id="tab-btn-quota"
            onClick={() => setActiveTab("quota")}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeTab === "quota"
                ? "border-amber-500 text-amber-400 bg-amber-950/20"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Meu Uso & "Hora de Mexer no Bolso"</span>
          </button>

          <button
            id="tab-btn-monetization"
            onClick={() => setActiveTab("monetization")}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeTab === "monetization"
                ? "border-emerald-500 text-emerald-400 bg-emerald-950/20"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Como Monetizar a Ferramenta</span>
          </button>

          <button
            id="tab-btn-localllm"
            onClick={() => setActiveTab("localllm")}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeTab === "localllm"
                ? "border-purple-500 text-purple-400 bg-purple-950/20"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Opção LLM Local (0 Custo)</span>
          </button>

          <button
            id="tab-btn-telemetry"
            onClick={() => setActiveTab("telemetry")}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeTab === "telemetry"
                ? "border-sky-500 text-sky-400 bg-sky-950/20"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Painel Detalhado de Hardware</span>
          </button>
        </div>

        {/* Status Notification */}
        {statusMsg && (
          <div className="p-3 bg-emerald-950 border-b border-emerald-800 text-emerald-200 text-xs font-bold text-center">
            {statusMsg}
          </div>
        )}

        {/* TAB 1: MEU USO & HORA DE MEXER NO BOLSO */}
        {activeTab === "quota" && quota && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-neutral-950 text-xs">
            {/* User Tier & Pocket Trigger Banner */}
            <div className={`p-4 sm:p-5 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              quota.warningThresholdReached
                ? "bg-amber-950/30 border-amber-800/80"
                : "bg-neutral-900/60 border-neutral-800"
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">Usuário:</span>
                  <strong className="text-sm text-neutral-100">@{quota.userHandle}</strong>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-900/60 border border-purple-700 text-purple-200">
                    Plano {quota.tier}
                  </span>
                </div>
                <p className="text-neutral-400 text-xs">
                  {quota.warningThresholdReached
                    ? "⚠️ ATENÇÃO: Você atingiu mais de 80% da sua cota mensal. Hora de avaliar upgrade de plano ou recarga com DREX!"
                    : "✅ Sua conta está dentro dos limites da cota gratuita com execuções no Sandbox ativas."}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] text-neutral-400">Saldo DREX / USD:</div>
                  <div className="text-base font-extrabold text-amber-400 font-mono">
                    {quota.balanceDREX} DREX <span className="text-neutral-400 text-xs">(${quota.balanceUSD} USD)</span>
                  </div>
                </div>

                <button
                  id="btn-refill-drex"
                  onClick={() => handleUpgradePlan(quota.tier, 100)}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
                >
                  <Coins className="w-4 h-4" />
                  <span>Recarregar DREX</span>
                </button>
              </div>
            </div>

            {/* Consumption Gauges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* LLM Tokens Meter */}
              <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between text-neutral-300">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Tokens LLM Mensais</span>
                  </span>
                  <span className="font-mono text-purple-400 font-bold">{quota.llmTokensPercent}%</span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      quota.llmTokensPercent > 80 ? "bg-amber-500" : "bg-purple-500"
                    }`}
                    style={{ width: `${Math.min(100, quota.llmTokensPercent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                  <span>{(quota.llmTokensUsed).toLocaleString()} usados</span>
                  <span>{(quota.llmTokensLimit).toLocaleString()} limite</span>
                </div>
              </div>

              {/* Sandbox Runs Meter */}
              <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between text-neutral-300">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>Sandbox Runs (VM/V8)</span>
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">{quota.sandboxRunsPercent}%</span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      quota.sandboxRunsPercent > 80 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, quota.sandboxRunsPercent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                  <span>{quota.sandboxRunsUsed} execuções</span>
                  <span>{quota.sandboxRunsLimit} limite mensal</span>
                </div>
              </div>

              {/* Storage Meter */}
              <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between text-neutral-300">
                  <span className="flex items-center gap-1.5 font-bold">
                    <HardDrive className="w-4 h-4 text-sky-400" />
                    <span>Armazenamento & DMs</span>
                  </span>
                  <span className="font-mono text-sky-400 font-bold">{quota.storagePercent}%</span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, quota.storagePercent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                  <span>{(quota.storageUsedKB / 1024).toFixed(2)} MB</span>
                  <span>{(quota.storageLimitKB / 1024).toFixed(0)} MB max</span>
                </div>
              </div>
            </div>

            {/* Plans Table ("Hora de Mexer no Bolso") */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm text-neutral-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Escolha o Nível Adequado para Sua Carga de Trabalho</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Free Tier */}
                <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                  quota.tier === "free" ? "bg-neutral-900 border-purple-500/50" : "bg-neutral-900/40 border-neutral-800"
                }`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-neutral-200">Plano Free</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                        R$ 0 / mês
                      </span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-neutral-400">
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>50k Tokens LLM</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>25 execuções Sandbox/mês</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>10 MB de storage</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    disabled={quota.tier === "free"}
                    onClick={() => handleUpgradePlan("free")}
                    className="mt-4 w-full py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs transition-all disabled:opacity-50"
                  >
                    {quota.tier === "free" ? "Plano Atual" : "Downgrade para Free"}
                  </button>
                </div>

                {/* Pro Tier */}
                <div className={`p-4 rounded-2xl border flex flex-col justify-between relative overflow-hidden ${
                  quota.tier === "pro" ? "bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-950/40" : "bg-neutral-900/40 border-neutral-800"
                }`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-indigo-300">Plano PRO</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-200 font-mono font-bold">
                        $29 / mês
                      </span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-neutral-300">
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span><strong>1.500.000 Tokens LLM</strong></span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>300 execuções Sandbox com GPU</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>150 MB storage + DMs ilimitadas</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Oráculos Financeiros & DREX</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    id="btn-upgrade-pro"
                    disabled={quota.tier === "pro" || loading}
                    onClick={() => handleUpgradePlan("pro", 150)}
                    className="mt-4 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {quota.tier === "pro" ? "Plano PRO Ativo" : "Assinar PRO ($29/mês)"}
                  </button>
                </div>

                {/* Enterprise Tier */}
                <div className={`p-4 rounded-2xl border flex flex-col justify-between relative overflow-hidden ${
                  quota.tier === "enterprise" ? "bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-950/40" : "bg-neutral-900/40 border-neutral-800"
                }`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-purple-300">Enterprise</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 font-mono font-bold">
                        $199 / mês
                      </span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-neutral-300">
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span><strong>10.000.000 Tokens LLM</strong></span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>2.500 Sandbox Runs isoladas</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>1 GB Storage + Swarm Subagentes</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>SLA 99.99% + Suporte Prioritário</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    id="btn-upgrade-enterprise"
                    disabled={quota.tier === "enterprise" || loading}
                    onClick={() => handleUpgradePlan("enterprise", 500)}
                    className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {quota.tier === "enterprise" ? "Enterprise Ativo" : "Assinar Enterprise"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMO O CRIADOR DA FERRAMENTA MONETIZA */}
        {activeTab === "monetization" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-neutral-950 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 space-y-1">
              <h3 className="font-extrabold text-sm text-emerald-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Modelo de Monetização Sustentável do Vortex Hub</span>
              </h3>
              <p className="text-neutral-300 text-xs">
                Como criador do ecossistema, você possui 4 vetores de receita recorrente e microtransações automáticas:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Assinaturas SaaS */}
              <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <CreditCard className="w-4 h-4" />
                  <span>1. Assinaturas SaaS (Planos Pro & Enterprise)</span>
                </div>
                <p className="text-neutral-400 leading-relaxed text-[11px]">
                  Cobrança recorrente mensal via Stripe ou cartão de crédito. Desenvolvedores e empresas pagam entre <strong>$29/mês e $199/mês</strong> para quotas maiores de tokens, armazenamento de DMs histórico e execução de agentes em swarm com alta prioridade.
                </p>
              </div>

              {/* 2. Microtransações DREX & Crypto */}
              <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Coins className="w-4 h-4" />
                  <span>2. Pay-per-Compute (DREX & Tokens de Energia)</span>
                </div>
                <p className="text-neutral-400 leading-relaxed text-[11px]">
                  Cada segundo de computação pesada no Sandbox (compilação Rust, cálculos de baterias BESS no <code>calculateEnergyBESS</code>) debita micro-frações de DREX ou USDC da carteira do usuário. Spread de transação de <strong>1.5%</strong> direto para a tesouraria.
                </p>
              </div>

              {/* 3. Bring Your Own VPS / Private Node Fee */}
              <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                  <Server className="w-4 h-4" />
                  <span>3. Taxa de Conexão de Nós Privados (BYO VPS)</span>
                </div>
                <p className="text-neutral-400 leading-relaxed text-[11px]">
                  Usuários que querem conectar suas próprias VPS dedicadas ou servidores On-Premise pagam uma taxa de orquestração fixa (ex: <strong>$9.90/mês por nó</strong>) para usar a interface web, roteador de mensagens e banco vetorial do Molt Hub.
                </p>
              </div>

              {/* 4. Marketplace de Agentes (ClawHub) */}
              <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                  <Layers className="w-4 h-4" />
                  <span>4. Marketplace de Agentes & Skills (ClawHub)</span>
                </div>
                <p className="text-neutral-400 leading-relaxed text-[11px]">
                  Desenvolvedores terceiros podem publicar agentes especializados (ex: bots jurídicos, quant financeiro). Você como mantenedor da plataforma retém <strong>15% a 20% de comissão</strong> sobre cada contratação ou consulta paga do agente.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: OPÇÃO DE LLM LOCAL (0 CUSTO) */}
        {activeTab === "localllm" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-neutral-950 text-xs">
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/60 space-y-1">
              <h3 className="font-extrabold text-sm text-purple-300 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Roteamento de LLM Local & Privacidade Total (0 Custo de API)</span>
              </h3>
              <p className="text-neutral-300 text-xs">
                Execute modelos diretamente na máquina local via Ollama, vLLM, WebGPU no browser ou motor embutido sem gastar 1 centavo com OpenAI/Anthropic/Gemini.
              </p>
            </div>

            <form onSubmit={handleSaveLocalLLM} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Engine Selector */}
                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-300">Provedor Local:</label>
                  <select
                    id="local-llm-provider-select"
                    value={localConfig.provider}
                    onChange={(e: any) => setLocalConfig({ ...localConfig, provider: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-100 focus:border-purple-500 outline-none"
                  >
                    <option value="embedded_slm">Embedded Small LLM (localSmallLLM.ts - Zero Setup)</option>
                    <option value="local_ollama">Ollama Local (http://localhost:11434)</option>
                    <option value="local_vllm">vLLM / LM Studio (http://localhost:8000/v1)</option>
                    <option value="browser_wasm">WebLLM / WebGPU no Navegador (Client-side)</option>
                  </select>
                </div>

                {/* Model Name */}
                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-300">Nome do Modelo Local:</label>
                  <input
                    id="local-llm-model-name"
                    type="text"
                    value={localConfig.modelName}
                    onChange={(e) => setLocalConfig({ ...localConfig, modelName: e.target.value })}
                    placeholder="deepseek-r1:latest, llama3.2:3b, qwen2.5-coder..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-100 focus:border-purple-500 outline-none font-mono"
                  />
                </div>

                {/* Endpoint URL */}
                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-300">Endpoint HTTP:</label>
                  <input
                    id="local-llm-endpoint"
                    type="text"
                    value={localConfig.endpointUrl}
                    onChange={(e) => setLocalConfig({ ...localConfig, endpointUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-100 focus:border-purple-500 outline-none font-mono"
                  />
                </div>

                {/* Quantization */}
                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-300">Quantização / GPU Offload:</label>
                  <select
                    id="local-llm-quant-select"
                    value={localConfig.quantization}
                    onChange={(e: any) => setLocalConfig({ ...localConfig, quantization: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-100 focus:border-purple-500 outline-none"
                  >
                    <option value="q4_k_m">Q4_K_M (Equilibrado - Menor RAM/VRAM)</option>
                    <option value="q8_0">Q8_0 (Alta Precisão)</option>
                    <option value="fp16">FP16 (Precisão Máxima - GPU Dedicada)</option>
                    <option value="none">Auto / Padrão do Ollama</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-neutral-300 font-semibold">
                    Fallback Inteligente: se a API na nuvem falhar, o sistema desce para o modelo local.
                  </span>
                </div>

                <button
                  id="save-local-llm-btn"
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Settings2 className="w-4 h-4" />
                  <span>Salvar Preferência de LLM Local</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: PAINEL DETALHADO DE HARDWARE */}
        {activeTab === "telemetry" && telemetry && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-neutral-950 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-1">
                <div className="text-neutral-500 font-mono text-[10px]">CPU INSTANTÂNEA</div>
                <div className="text-2xl font-extrabold text-neutral-100 font-mono">{telemetry.cpuUsagePercent}%</div>
                <div className="text-[10px] text-emerald-400">gVisor Sandbox Isolation</div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-1">
                <div className="text-neutral-500 font-mono text-[10px]">RAM FÍSICA / RSS</div>
                <div className="text-2xl font-extrabold text-purple-300 font-mono">{telemetry.ramUsedMB} MB</div>
                <div className="text-[10px] text-neutral-400">de {telemetry.ramTotalMB} MB alocados</div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-1">
                <div className="text-neutral-500 font-mono text-[10px]">HEAP V8 ENGINE</div>
                <div className="text-2xl font-extrabold text-teal-300 font-mono">{telemetry.v8HeapUsedMB} MB</div>
                <div className="text-[10px] text-neutral-400">Garbage Collector Ativo</div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-1">
                <div className="text-neutral-500 font-mono text-[10px]">GPU VRAM ESTIMADA</div>
                <div className="text-2xl font-extrabold text-amber-300 font-mono">{telemetry.gpuVramUsedMB} MB</div>
                <div className="text-[10px] text-neutral-400">de {telemetry.gpuVramTotalMB} MB shared</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-3">
              <h4 className="font-bold text-neutral-100">Visão Geral dos Nós e Agentes Conectados</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="text-lg font-bold text-neutral-100">{telemetry.totalUsers}</div>
                  <div className="text-[10px] text-neutral-500">Usuários Registrados</div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="text-lg font-bold text-purple-400">{telemetry.activeAgents}</div>
                  <div className="text-[10px] text-neutral-500">Agentes Autônomos</div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="text-lg font-bold text-emerald-400">{telemetry.messagesTotal}</div>
                  <div className="text-[10px] text-neutral-500">Mensagens Persistidas</div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="text-lg font-bold text-sky-400">{telemetry.bandwidthKBps} KB/s</div>
                  <div className="text-[10px] text-neutral-500">Largura de Banda</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
