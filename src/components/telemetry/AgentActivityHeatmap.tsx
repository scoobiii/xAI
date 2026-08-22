import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  Activity,
  Calendar,
  Clock,
  Bot,
  Zap,
  TrendingUp,
  Cpu,
  Layers,
  Filter,
  RefreshCw,
  Sparkles,
  Info,
  ChevronRight,
  Flame,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export interface HeatmapHour {
  hour: number;
  hourLabel: string;
  interactions: number;
  intensity: number;
  topAgent: string;
  toolsUsed: number;
  avgLatencyMs: number;
}

export interface HeatmapDay {
  day: string;
  shortDay: string;
  date: string;
  totalInteractions: number;
  avgLatencyMs: number;
  tokensK: number;
  hours: HeatmapHour[];
  agentBreakdown: Record<string, number>;
}

export interface AgentLeaderboardItem {
  id: string;
  handle: string;
  name: string;
  avatar: string;
  role: string;
  provider: string;
  model: string;
  interactions: number;
  sharePercent: number;
  tokensK: number;
  avgLatencyMs: number;
  toolsExecuted: number;
  lastActive: string;
}

export interface HeatmapDataResponse {
  success: boolean;
  summary: {
    totalWeeklyInteractions: number;
    totalToolInvocations: number;
    peakDay: string;
    peakHour: string;
    mostActiveAgent: string;
    avgResponseLatencyMs: number;
    p95LatencyMs: number;
    activeAgentsCount: number;
    timestamp: string;
  };
  daysOfWeek: HeatmapDay[];
  dailyTrend: any[];
  hourlyDistribution: Array<{
    hour: string;
    interactions: number;
    toolCalls: number;
    avgLatencyMs: number;
  }>;
  agentLeaderboard: AgentLeaderboardItem[];
  toolDistribution: Array<{
    toolName: string;
    count: number;
    percentage: number;
    category: string;
  }>;
  providerDistribution: Array<{
    provider: string;
    count: number;
    color: string;
    share: number;
  }>;
  prominentHandles: string[];
}

interface Props {
  compact?: boolean;
  onOpenDetailedModal?: () => void;
  selectedAgentFilter?: string;
  onSelectAgent?: (handle: string) => void;
}

const AGENT_COLORS: Record<string, string> = {
  VortexGrid: "#8b5cf6", // Purple
  CryptoQuant: "#06b6d4", // Cyan
  ClaudeOpus: "#ec4899", // Pink
  GrokBot: "#f59e0b", // Amber
  NanoClaw: "#10b981", // Emerald
  QwenCoder: "#3b82f6", // Blue
  GPT4o: "#14b8a6", // Teal
  DeepSeekReasoner: "#6366f1", // Indigo
  Others: "#64748b", // Slate
};

const PIE_COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#6366f1"];

export const AgentActivityHeatmap: React.FC<Props> = ({
  compact = false,
  onOpenDetailedModal,
  selectedAgentFilter = "ALL",
  onSelectAgent,
}) => {
  const [data, setData] = useState<HeatmapDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedHour, setSelectedHour] = useState<HeatmapHour | null>(null);
  const [chartViewMode, setChartViewMode] = useState<"stacked" | "area" | "tools">("stacked");
  const [activeMetric, setActiveMetric] = useState<"interactions" | "tokens" | "latency">("interactions");
  const [activeTab, setActiveTab] = useState<"heatmap" | "frequency" | "breakdown">("heatmap");

  const fetchHeatmapData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/telemetry/agent-activity-heatmap");
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        throw new Error(json.error || "Falha ao processar métricas do heatmap");
      }
    } catch (err: any) {
      setError(err.message || "Erro de conexão com o servidor de telemetria");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatmapData();
  }, []);

  // Intensity to CSS background & border helper
  const getCellClasses = (intensity: number) => {
    if (intensity === 0) return "bg-neutral-900/40 border-neutral-800/30 hover:border-neutral-700";
    if (intensity < 20) return "bg-purple-950/30 border-purple-900/40 hover:border-purple-600/60 text-purple-300";
    if (intensity < 45) return "bg-purple-900/50 border-purple-700/60 hover:border-purple-500 text-purple-200";
    if (intensity < 70) return "bg-indigo-600/70 border-indigo-500/80 hover:border-indigo-400 text-white shadow-sm";
    if (intensity < 90) return "bg-purple-600 border-purple-400 hover:border-purple-300 text-white shadow-sm";
    return "bg-emerald-500 border-emerald-300 text-black font-extrabold shadow-md shadow-emerald-500/20";
  };

  if (loading && !data) {
    return (
      <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 text-neutral-300 flex flex-col items-center justify-center min-h-[260px] gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
        <span className="text-xs font-mono text-neutral-400">Compilando matriz de heatmap e frequências...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-neutral-950 border border-red-900/40 text-red-300 flex flex-col items-center justify-center gap-3">
        <Info className="w-6 h-6 text-red-400" />
        <span className="text-xs">{error || "Não foi possível carregar o heatmap."}</span>
        <button
          onClick={fetchHeatmapData}
          className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-xs font-mono text-neutral-200 border border-neutral-700"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  // --- COMPACT WIDGET VIEW (For Sidebar) ---
  if (compact) {
    return (
      <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800/80 text-neutral-100 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-xs sm:text-sm text-neutral-100">Atividade Semanal</h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/50">
            {data.summary.totalWeeklyInteractions} reqs
          </span>
        </div>

        {/* Mini 7-day bar chart with Recharts */}
        <div className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.dailyTrend} margin={{ top: 4, right: 2, left: -24, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#737373" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0a0a0a",
                  borderColor: "#262626",
                  borderRadius: "10px",
                  fontSize: "11px",
                }}
                formatter={(value: any) => [`${value} interações`, "Volume"]}
                labelFormatter={(label) => `Dia: ${label}`}
              />
              <Bar dataKey="total" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Mini stats summary */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-neutral-400 pt-1 border-t border-neutral-800/60">
          <div>
            <span className="text-neutral-500 text-[10px] block">Pico Diário:</span>
            <span className="text-neutral-200 font-semibold">{data.summary.peakDay} ({data.summary.peakHour})</span>
          </div>
          <div>
            <span className="text-neutral-500 text-[10px] block">Top Agente:</span>
            <span className="text-purple-300 font-semibold truncate block">{data.summary.mostActiveAgent}</span>
          </div>
        </div>

        {onOpenDetailedModal && (
          <button
            onClick={onOpenDetailedModal}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all hover:scale-[1.01]"
          >
            <span>Ver Heatmap & Métricas Recharts</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // --- FULL DETAILED VIEW ---
  return (
    <div className="space-y-6 text-neutral-100 select-none">
      {/* Top Metrics Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Interações Semanais</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {data.summary.totalWeeklyInteractions.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>+18.4% vs semana anterior</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Execuções de Tools</span>
            <Cpu className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {data.summary.totalToolInvocations.toLocaleString()}
          </div>
          <div className="text-[10px] text-neutral-400 font-mono">
            Média: 1.8 tools/resposta
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Janela de Pico</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-base font-bold text-purple-200 truncate">
            {data.summary.peakDay}
          </div>
          <div className="text-[10px] text-neutral-400 font-mono">
            {data.summary.peakHour}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Latência Média</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-300 tracking-tight">
            {data.summary.avgResponseLatencyMs} <span className="text-xs font-normal text-neutral-400">ms</span>
          </div>
          <div className="text-[10px] text-neutral-400 font-mono">
            p95: {data.summary.p95LatencyMs}ms (Sandbox V8)
          </div>
        </div>
      </div>

      {/* Navigation View Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-neutral-900/80 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => setActiveTab("heatmap")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "heatmap"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Matriz Heatmap (7 Dias x 24h)</span>
          </button>
          <button
            onClick={() => setActiveTab("frequency")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "frequency"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Frequência & Linha do Tempo</span>
          </button>
          <button
            onClick={() => setActiveTab("breakdown")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "breakdown"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Agentes & Provedores</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHeatmapData}
            title="Atualizar métricas de telemetria"
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* --- TAB 1: WEEKLY HEATMAP MATRIX (7 Days x 24h) --- */}
      {activeTab === "heatmap" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  Matriz de Calor: Densidade de Interação Horária
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Visualização da intensidade de mensagens e acionamentos de agentes por hora ao longo da semana.
                </p>
              </div>

              {/* Heat scale legend */}
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800">
                <span>Baixa</span>
                <span className="w-3 h-3 rounded-sm bg-neutral-900 border border-neutral-800 inline-block" />
                <span className="w-3 h-3 rounded-sm bg-purple-950 border border-purple-900 inline-block" />
                <span className="w-3 h-3 rounded-sm bg-purple-900 border border-purple-700 inline-block" />
                <span className="w-3 h-3 rounded-sm bg-indigo-600 border border-indigo-500 inline-block" />
                <span className="w-3 h-3 rounded-sm bg-purple-600 border border-purple-400 inline-block" />
                <span className="w-3 h-3 rounded-sm bg-emerald-500 border border-emerald-300 inline-block" />
                <span>Pico</span>
              </div>
            </div>

            {/* Heatmap Grid container */}
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[760px] space-y-1.5">
                {/* Hourly Header Labels (0h to 23h) */}
                <div className="grid grid-cols-[64px_repeat(24,1fr)] gap-1 text-[10px] font-mono text-neutral-500 text-center">
                  <div className="text-left font-semibold text-neutral-400">Dia</div>
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className="truncate">
                      {i % 3 === 0 ? `${i}h` : ""}
                    </div>
                  ))}
                </div>

                {/* Day Rows */}
                {data.daysOfWeek.map((dayData) => (
                  <div
                    key={dayData.day}
                    className="grid grid-cols-[64px_repeat(24,1fr)] gap-1 items-center"
                  >
                    {/* Day label */}
                    <div className="text-xs font-semibold text-neutral-300 flex items-center justify-between pr-2">
                      <span>{dayData.shortDay}</span>
                      <span className="text-[9px] font-mono text-neutral-500">{dayData.totalInteractions}</span>
                    </div>

                    {/* 24 Hours cells */}
                    {dayData.hours.map((hourData) => (
                      <button
                        key={`${dayData.day}-${hourData.hour}`}
                        onClick={() => {
                          setSelectedDay(dayData.day);
                          setSelectedHour(hourData);
                        }}
                        className={`h-7 rounded-md border transition-all relative group flex items-center justify-center ${getCellClasses(
                          hourData.intensity
                        )} ${
                          selectedHour?.hour === hourData.hour && selectedDay === dayData.day
                            ? "ring-2 ring-white scale-110 z-10"
                            : ""
                        }`}
                        title={`${dayData.day} às ${hourData.hourLabel}: ${hourData.interactions} interações (${hourData.topAgent})`}
                      >
                        {/* Hover Tooltip inside matrix */}
                        <span className="sr-only">
                          {hourData.interactions} interações
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Cell Detail Banner */}
            {selectedHour && selectedDay && (
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-purple-500/40 text-xs flex items-center justify-between flex-wrap gap-3 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-mono font-bold">
                    {selectedHour.hourLabel}
                  </div>
                  <div>
                    <div className="font-bold text-neutral-200">
                      {selectedDay} às {selectedHour.hourLabel}
                    </div>
                    <div className="text-neutral-400 text-[11px]">
                      Interações: <span className="text-purple-300 font-semibold">{selectedHour.interactions}</span> · Top Agente: <span className="text-sky-300 font-semibold">{selectedHour.topAgent}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-neutral-400 font-mono text-[11px]">
                  <div>
                    <span className="text-neutral-500 block text-[9px]">Tools Acionadas:</span>
                    <span className="text-neutral-200">{selectedHour.toolsUsed} chamadas</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[9px]">Latência Média:</span>
                    <span className="text-emerald-300">{selectedHour.avgLatencyMs}ms</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedHour(null);
                      setSelectedDay(null);
                    }}
                    className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Diurnal 24h Area Curve */}
          <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                Curva de Distribuição Diurna das 24 Horas
              </h4>
              <span className="text-[10px] text-neutral-500 font-mono">Agregação semanal horária</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.hourlyDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hourInteractionsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#737373" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0a0a0a",
                      borderColor: "#333",
                      borderRadius: "10px",
                      fontSize: "11px",
                    }}
                    formatter={(val: any, name: string) => [
                      name === "interactions" ? `${val} interações` : `${val} calls`,
                      name === "interactions" ? "Volume Total" : "Execuções de Tools",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="interactions"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#hourInteractionsGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: FREQUENCY & TIMELINE (Recharts Stacked Bar / Area) --- */}
      {activeTab === "frequency" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  Frequência de Interação por Agente na Semana
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Volume diário segmentado pelos principais agentes autônomos do cluster.
                </p>
              </div>

              {/* View mode toggle */}
              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
                <button
                  onClick={() => setChartViewMode("stacked")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    chartViewMode === "stacked"
                      ? "bg-purple-600 text-white"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  Empilhado por Agente
                </button>
                <button
                  onClick={() => setChartViewMode("area")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    chartViewMode === "area"
                      ? "bg-purple-600 text-white"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  Throughput Total & Tokens
                </button>
              </div>
            </div>

            {/* Main Recharts Chart */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartViewMode === "stacked" ? (
                  <BarChart data={data.dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#d4d4d4" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#737373" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0a0a0a",
                        borderColor: "#333",
                        borderRadius: "10px",
                        fontSize: "11px",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                      iconType="circle"
                      iconSize={8}
                    />
                    {data.prominentHandles.map((handle) => (
                      <Bar
                        key={handle}
                        dataKey={handle}
                        stackId="a"
                        fill={AGENT_COLORS[handle] || "#64748b"}
                        name={`@${handle}`}
                      />
                    ))}
                  </BarChart>
                ) : (
                  <AreaChart data={data.dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="totalInteractionsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="tokensGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#d4d4d4" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#737373" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0a0a0a",
                        borderColor: "#333",
                        borderRadius: "10px",
                        fontSize: "11px",
                      }}
                      formatter={(value: any, name: string) => [
                        name === "total" ? `${value} interações` : `${value}k tokens`,
                        name === "total" ? "Interações Totais" : "Throughput de Tokens",
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#totalInteractionsGrad)"
                      name="Interações Totais"
                    />
                    <Area
                      type="monotone"
                      dataKey="tokensK"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#tokensGrad)"
                      name="Tokens (k)"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tool Distribution Bar Chart */}
          <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                Frequência de Invocação por Tool / Sandbox Skill
              </h4>
              <span className="text-[10px] text-neutral-500 font-mono">Total: {data.summary.totalToolInvocations} execuções</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.toolDistribution}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: "#737373" }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="toolName"
                    tick={{ fontSize: 10, fill: "#a3a3a3" }}
                    axisLine={false}
                    tickLine={false}
                    width={130}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0a0a0a",
                      borderColor: "#333",
                      borderRadius: "10px",
                      fontSize: "11px",
                    }}
                    formatter={(val: any) => [`${val} chamadas`, "Volume"]}
                  />
                  <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: AGENTS & PROVIDERS BREAKDOWN --- */}
      {activeTab === "breakdown" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Provider Pie Chart */}
            <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 space-y-3 md:col-span-1">
              <h4 className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                Divisão por Provedor LLM
              </h4>

              <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.providerDistribution}
                      dataKey="count"
                      nameKey="provider"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {data.providerDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0a0a0a",
                        borderColor: "#333",
                        borderRadius: "10px",
                        fontSize: "11px",
                      }}
                      formatter={(val: any) => [`${val} interações`, "Volume"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Pie legend items */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-800 text-[11px] font-mono">
                {data.providerDistribution.map((p) => (
                  <div key={p.provider} className="flex items-center justify-between text-neutral-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: p.color }} />
                      <span className="truncate">{p.provider}</span>
                    </span>
                    <span className="font-semibold text-neutral-400">{p.share}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard Table of Agents */}
            <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-emerald-400" />
                  Ranking de Atividade dos Agentes (Top 8)
                </h4>
                <span className="text-[10px] text-neutral-500 font-mono">Ordenado por volume semanal</span>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {data.agentLeaderboard.slice(0, 8).map((agent, idx) => (
                  <div
                    key={agent.id || agent.handle}
                    onClick={() => onSelectAgent && onSelectAgent(agent.handle)}
                    className="p-2.5 rounded-xl bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-800/80 transition-all flex items-center justify-between gap-2 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 font-mono text-xs text-neutral-500 text-center font-bold">
                        #{idx + 1}
                      </span>
                      <img
                        src={agent.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=agent"}
                        alt={agent.name}
                        className="w-7 h-7 rounded-lg border border-neutral-700 bg-neutral-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-neutral-200 group-hover:text-purple-300 transition-colors truncate">
                          @{agent.handle}
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate">
                          {agent.role}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 font-mono text-right text-xs">
                      <div>
                        <div className="font-bold text-neutral-100">{agent.interactions}</div>
                        <div className="text-[9px] text-neutral-500">{agent.sharePercent}% share</div>
                      </div>
                      <div className="hidden sm:block">
                        <div className="text-emerald-400">{agent.avgLatencyMs}ms</div>
                        <div className="text-[9px] text-neutral-500">{agent.toolsExecuted} tools</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
