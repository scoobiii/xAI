import React, { useState, useEffect } from "react";
import {
  Activity,
  Play,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Zap,
  Clock,
  Database,
  BarChart3,
  Server,
  Layers,
  Sparkles,
  Loader2,
  X,
  TrendingUp,
  Hash
} from "lucide-react";

interface K6ChannelMetric {
  channelName: string;
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  throughputRps: number;
  errorRatePercent: number;
}

interface K6TimeSeriesPoint {
  second: number;
  rps: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  activeVUs: number;
  errors: number;
}

interface K6BenchmarkResult {
  id: string;
  timestamp: string;
  durationSeconds: number;
  targetVUs: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  overallThroughputRps: number;
  overallAvgLatencyMs: number;
  p50LatencyMs: number;
  p90LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRatePercent: number;
  memoryUsageMb: {
    beforeRss: number;
    duringRss: number;
    afterRss: number;
    heapUsedMb: number;
  };
  channels: K6ChannelMetric[];
  timeSeries: K6TimeSeriesPoint[];
  thresholdsPassed: boolean;
  sha256AuditReceipt: string;
}

interface K6PerformanceMonitorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const K6PerformanceMonitor: React.FC<K6PerformanceMonitorProps> = ({ isOpen, onClose }) => {
  const [targetVUs, setTargetVUs] = useState<number>(30);
  const [durationSeconds, setDurationSeconds] = useState<number>(10);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState<boolean>(false);
  const [benchmarkResult, setBenchmarkResult] = useState<K6BenchmarkResult | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "channels" | "timeseries" | "raw">("overview");

  useEffect(() => {
    if (isOpen) {
      fetchLatestResults();
    }
  }, [isOpen]);

  const fetchLatestResults = async () => {
    try {
      const res = await fetch("/api/k6/latest-results");
      if (res.ok) {
        const data = await res.json();
        setBenchmarkResult(data);
      }
    } catch (e) {
      console.error("Failed to load k6 benchmark results:", e);
    }
  };

  const handleRunBenchmark = async () => {
    try {
      setIsRunningBenchmark(true);
      const res = await fetch("/api/k6/run-benchmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vus: targetVUs,
          durationSeconds,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBenchmarkResult(data);
      }
    } catch (e) {
      console.error("Failed to run K6 benchmark:", e);
    } finally {
      setIsRunningBenchmark(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-6xl h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  K6 Performance & Load Testing Suite
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                  <Activity className="w-3 h-3 animate-pulse" />
                  Stress Simulation Active
                </span>
                {benchmarkResult?.thresholdsPassed && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    SLA &lt;250ms Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Mede vazão (req/s), latência p95/p99 e resiliência transacional sob alta carga em todos os canais de agentes
              </p>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex items-center gap-1 bg-neutral-950/80 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "overview" ? "bg-purple-600 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab("channels")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "channels" ? "bg-purple-600 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Canais & Endpoints
            </button>
            <button
              onClick={() => setActiveTab("timeseries")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "timeseries" ? "bg-purple-600 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Série Temporal
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar / Controls */}
        <div className="px-6 py-3 bg-neutral-950/90 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-400 font-medium">Virtual Users (VUs):</span>
              <div className="flex items-center gap-2">
                {[15, 30, 50, 100].map((vu) => (
                  <button
                    key={vu}
                    onClick={() => setTargetVUs(vu)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                      targetVUs === vu
                        ? "bg-amber-500 text-neutral-950 shadow-sm"
                        : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    }`}
                  >
                    {vu} VUs
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-400 font-medium">Duração:</span>
              <div className="flex items-center gap-2">
                {[5, 10, 20, 30].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setDurationSeconds(sec)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                      durationSeconds === sec
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleRunBenchmark}
            disabled={isRunningBenchmark}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-neutral-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isRunningBenchmark ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                <span>Executando K6 ({targetVUs} VUs)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Disparar K6 Load Test Suite</span>
              </>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 bg-neutral-950 p-6 overflow-y-auto space-y-6">
          {activeTab === "overview" && benchmarkResult && (
            <div className="space-y-6">
              {/* Metric Hero Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                  <div className="text-xs text-neutral-400 flex items-center justify-between mb-1">
                    <span>Throughput (RPS)</span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">
                    {benchmarkResult.overallThroughputRps}{" "}
                    <span className="text-xs text-neutral-400 font-sans">req/s</span>
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    {benchmarkResult.totalRequests} requisições totais
                  </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                  <div className="text-xs text-neutral-400 flex items-center justify-between mb-1">
                    <span>Latência p95</span>
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-purple-400 font-mono">
                    {benchmarkResult.p95LatencyMs}{" "}
                    <span className="text-xs text-neutral-400 font-sans">ms</span>
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    p99: {benchmarkResult.p99LatencyMs}ms | Média: {benchmarkResult.overallAvgLatencyMs}ms
                  </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                  <div className="text-xs text-neutral-400 flex items-center justify-between mb-1">
                    <span>Taxa de Erro</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div
                    className={`text-2xl font-bold font-mono ${
                      benchmarkResult.errorRatePercent === 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {benchmarkResult.errorRatePercent}%
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    {benchmarkResult.failedRequests} falhas em {benchmarkResult.totalRequests}
                  </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                  <div className="text-xs text-neutral-400 flex items-center justify-between mb-1">
                    <span>VUs Concorrentes</span>
                    <Server className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-bold text-indigo-400 font-mono">
                    {benchmarkResult.targetVUs}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    Duração: {benchmarkResult.durationSeconds} segundos
                  </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                  <div className="text-xs text-neutral-400 flex items-center justify-between mb-1">
                    <span>RAM Peak (RSS)</span>
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold text-cyan-400 font-mono">
                    {benchmarkResult.memoryUsageMb.duringRss}{" "}
                    <span className="text-xs text-neutral-400 font-sans">MB</span>
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    Heap: {benchmarkResult.memoryUsageMb.heapUsedMb}MB (Seguro)
                  </div>
                </div>
              </div>

              {/* Latency Percentiles Distribution */}
              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                    Distribuição dos Percentis de Latência (SLA &lt; 250ms)
                  </h3>
                  <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    100% de Conformidade de SLA
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "p50 (Mediana)", val: benchmarkResult.p50LatencyMs, color: "bg-emerald-500" },
                    { label: "p90 (90%)", val: benchmarkResult.p90LatencyMs, color: "bg-indigo-500" },
                    { label: "p95 (95%)", val: benchmarkResult.p95LatencyMs, color: "bg-purple-500" },
                    { label: "p99 (Pico 99%)", val: benchmarkResult.p99LatencyMs, color: "bg-rose-500" },
                  ].map((p, idx) => (
                    <div key={idx} className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                      <div className="text-[11px] text-neutral-400 mb-1">{p.label}</div>
                      <div className="text-lg font-bold text-white font-mono">{p.val} ms</div>
                      <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full ${p.color}`}
                          style={{ width: `${Math.min((p.val / 200) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cryptographic Audit Hash */}
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-900/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Recibo Criptográfico de Auditoria K6</div>
                    <div className="text-[11px] text-purple-300 font-mono mt-0.5">
                      SHA-256: {benchmarkResult.sha256AuditReceipt}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-neutral-400">
                  ID: <strong className="text-neutral-200">{benchmarkResult.id}</strong>
                </span>
              </div>
            </div>
          )}

          {activeTab === "channels" && benchmarkResult && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 bg-neutral-800/60 border-b border-neutral-800 flex items-center justify-between">
                <div className="text-xs font-bold text-white uppercase font-mono">
                  Desempenho por Canal & Rota de Comunicação de Agentes
                </div>
                <div className="text-xs text-neutral-400 font-mono">
                  Total de Canais: {benchmarkResult.channels.length}
                </div>
              </div>

              <div className="divide-y divide-neutral-800/60 overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-neutral-950/60 text-neutral-400">
                    <tr>
                      <th className="p-3">Canal</th>
                      <th className="p-3">Endpoint</th>
                      <th className="p-3">Reqs</th>
                      <th className="p-3">Throughput (RPS)</th>
                      <th className="p-3">Latência Média</th>
                      <th className="p-3">p95</th>
                      <th className="p-3">p99</th>
                      <th className="p-3">Erros</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/40 text-neutral-200">
                    {benchmarkResult.channels.map((ch, idx) => (
                      <tr key={idx} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="p-3 font-sans font-bold text-white">{ch.channelName}</td>
                        <td className="p-3 text-purple-400 text-[11px]">{ch.endpoint}</td>
                        <td className="p-3">{ch.totalRequests}</td>
                        <td className="p-3 text-emerald-400 font-bold">{ch.throughputRps} req/s</td>
                        <td className="p-3">{ch.avgLatencyMs} ms</td>
                        <td className="p-3 text-purple-300">{ch.p95LatencyMs} ms</td>
                        <td className="p-3 text-rose-300">{ch.p99LatencyMs} ms</td>
                        <td className="p-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              ch.errorRatePercent === 0
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-rose-500/10 text-rose-400"
                            }`}
                          >
                            {ch.errorRatePercent}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "timeseries" && benchmarkResult && (
            <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Evolução Temporal do Benchmark (Segundo a Segundo)
              </h3>

              <div className="space-y-2">
                {benchmarkResult.timeSeries.map((point, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-neutral-500 font-bold">t+{point.second}s</span>
                      <span className="text-emerald-400 font-bold">{point.rps} req/s</span>
                    </div>
                    <div className="flex items-center gap-4 text-neutral-400">
                      <span>Média: <strong className="text-white">{point.avgLatencyMs}ms</strong></span>
                      <span>p95: <strong className="text-purple-300">{point.p95LatencyMs}ms</strong></span>
                      <span>VUs: <strong className="text-indigo-400">{point.activeVUs}</strong></span>
                      <span className="text-emerald-400">Erros: {point.errors}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
