import React, { useState } from "react";
import { InteractiveChartEmbed } from "../feed/InteractiveChartEmbed";
import {
  Terminal,
  Zap,
  Play,
  Loader2,
  X,
  Sun,
  Coins,
  Code2,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Activity,
  HardDrive,
  Server,
  AlertTriangle,
  FolderCheck,
  Cpu,
  Lock,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SandboxLabModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTool, setActiveTool] = useState<"energy" | "crypto" | "js" | "nanoclaw" | "diagnostic" | "benchmark">("benchmark");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Form states
  const [solarMW, setSolarMW] = useState(30);
  const [bessMWh, setBessMWh] = useState(60);
  const [energyPrice, setEnergyPrice] = useState(50);

  const [assetSymbol, setAssetSymbol] = useState("DREX-ENERGY-REC");
  const [timeframe, setTimeframe] = useState("30D");

  const [nanoCluster, setNanoCluster] = useState("main-v8-isolate");
  const [nanoAction, setNanoAction] = useState<"inspect_kernel" | "verify_bytecode" | "isolate_subtask">("inspect_kernel");

  const [jsCode, setJsCode] = useState(`// Benchmark de Despacho e Arbitragem
const solarMW = 25;
const bessCapacity = 50;
const peakRate = 68; // $/MWh
const offPeakRate = 22; // $/MWh

const arbitrageGainAnnual = bessCapacity * 0.9 * 360 * (peakRate - offPeakRate);
console.log("Arbitrage Anual Estimado: $" + (arbitrageGainAnnual / 1e6).toFixed(2) + "M");
return { arbitrageGainAnnual, roiFactor: 1.42 };`);

  if (!isOpen) return null;

  const handleExecute = async () => {
    try {
      setRunning(true);
      let payload: any = {};

      if (activeTool === "benchmark") {
        payload = {
          toolName: "runBenchmark",
          params: {},
        };
      } else if (activeTool === "diagnostic") {
        payload = {
          toolName: "runtimeCheck",
          params: { testFsWrite: true },
        };
      } else if (activeTool === "energy") {
        payload = {
          toolName: "calculateEnergyBESS",
          params: { solarCapacityMW: solarMW, bessCapacityMWh: bessMWh, energyPricePerMWh: energyPrice },
        };
      } else if (activeTool === "crypto") {
        payload = {
          toolName: "analyzeMarketCrypto",
          params: { assetSymbol, timeframe },
        };
      } else if (activeTool === "js") {
        payload = {
          toolName: "executeJavaScript",
          params: { code: jsCode },
        };
      } else if (activeTool === "nanoclaw") {
        payload = {
          toolName: "inspectNanoClawRuntime",
          params: { targetCluster: nanoCluster, actionType: nanoAction },
        };
      }

      const res = await fetch("/api/sandbox/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error("Sandbox execution failed:", e);
    } finally {
      setRunning(false);
    }
  };

  const diagData = activeTool === "diagnostic" && result?.data ? result.data : null;
  const benchmarkData = activeTool === "benchmark" && result?.data ? result.data : null;

  return (
    <div id="sandbox-lab-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div
        id="sandbox-lab-container"
        className="w-full max-w-4xl max-h-[92vh] bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden text-neutral-100"
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-neutral-100 flex items-center gap-2">
                Sandbox Runtime & Tools Lab
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-800/50">
                  GOS3 V8 Core
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Execute ferramentas de sandbox diretamente, teste diagnósticos de filesystem e audite hashes criptográficos.
              </p>
            </div>
          </div>
          <button
            id="close-sandbox-lab-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tool Selector Bar */}
        <div className="flex border-b border-neutral-800 px-6 text-xs font-medium gap-2 pt-2 bg-neutral-900/30 overflow-x-auto">
          <button
            id="sandbox-tab-benchmark"
            onClick={() => {
              setActiveTool("benchmark");
              setResult(null);
            }}
            className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTool === "benchmark"
                ? "border-emerald-500 text-emerald-400 font-semibold"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Agent Tools Benchmark (100% Cobertura)
          </button>
          <button
            id="sandbox-tab-diagnostic"
            onClick={() => {
              setActiveTool("diagnostic");
              setResult(null);
            }}
            className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTool === "diagnostic"
                ? "border-amber-500 text-amber-400 font-semibold"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Activity className="w-4 h-4 text-amber-400" />
            Diagnostic (Runtime Check)
          </button>
          <button
            id="sandbox-tab-energy"
            onClick={() => {
              setActiveTool("energy");
              setResult(null);
            }}
            className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTool === "energy"
                ? "border-emerald-500 text-emerald-400 font-semibold"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Sun className="w-4 h-4 text-emerald-400" />
            Solar & BESS Calculator
          </button>
          <button
            id="sandbox-tab-crypto"
            onClick={() => {
              setActiveTool("crypto");
              setResult(null);
            }}
            className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTool === "crypto"
                ? "border-sky-500 text-sky-400 font-semibold"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Coins className="w-4 h-4 text-sky-400" />
            Market & DREX Analyzer
          </button>
          <button
            id="sandbox-tab-js"
            onClick={() => {
              setActiveTool("js");
              setResult(null);
            }}
            className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTool === "js"
                ? "border-purple-500 text-purple-400 font-semibold"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Code2 className="w-4 h-4 text-purple-400" />
            JavaScript Sandbox VM
          </button>
          <button
            id="sandbox-tab-nanoclaw"
            onClick={() => {
              setActiveTool("nanoclaw");
              setResult(null);
            }}
            className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTool === "nanoclaw"
                ? "border-pink-500 text-pink-400 font-semibold"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-pink-400" />
            NanoClaw Kernel Guard
          </button>
        </div>

        {/* Tool Parameters Form & Execution */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTool === "benchmark" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-emerald-300 flex items-center gap-2">
                    Suite de Benchmark Determinístico GOS3 (100% de Cobertura)
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-700/50">
                      25 Ferramentas Sandbox & Agentes
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-200/80 leading-relaxed">
                    Executa a suite completa e determinística de testes em todas as 25 ferramentas registradas no runtime GOS3 (Node VM, Python, Bash, GitHub, Filesystem, Scheduler, Subagents, Vector Memory, BESS e NanoClaw). Cada execução gera um recibo criptográfico SHA-256 à prova de fraude para auditoria.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-neutral-400 text-[10px]">Total de Ferramentas</div>
                    <div className="font-semibold text-neutral-200">25 Ferramentas de Agentes</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <div className="text-neutral-400 text-[10px]">Conformidade GOS3</div>
                    <div className="font-semibold text-neutral-200">100% Determinístico</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <div className="text-neutral-400 text-[10px]">Assinaturas de Prova</div>
                    <div className="font-semibold text-neutral-200">Evidence Hashes SHA-256</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTool === "diagnostic" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 flex items-start gap-3">
                <Activity className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-300 flex items-center gap-2">
                    Runtime Diagnostic & Storage Constraint Prober
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-900/60 text-amber-200 border border-amber-700/50">
                      GOS3 v1.0 Spec
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-200/80 leading-relaxed">
                    Executa uma sonda determinística e não-invasiva no ambiente de runtime para verificar o <code className="bg-amber-950 px-1 py-0.5 rounded text-amber-300">env_tag</code>, auditar a integridade de leitura/escrita no filesystem, inspecionar partições de disco e diagnosticar diferenças entre o host Android/Termux e o Proot Alpine.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center gap-2.5">
                  <Server className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-neutral-400 text-[10px]">Detecção de Ambiente</div>
                    <div className="font-semibold text-neutral-200">Tag & Arquitetura SO</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center gap-2.5">
                  <FolderCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-neutral-400 text-[10px]">Integridade FS</div>
                    <div className="font-semibold text-neutral-200">Sonda R/W .data</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center gap-2.5">
                  <HardDrive className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <div className="text-neutral-400 text-[10px]">Diagnóstico Armazenamento</div>
                    <div className="font-semibold text-neutral-200">df -h & Quotas Alpine</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTool === "nanoclaw" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-pink-950/30 border border-pink-800/40 text-xs text-pink-200 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-pink-400 shrink-0" />
                <div>
                  <div className="font-bold">Agente Nativo NanoClaw v1.4 Runtime</div>
                  <div className="text-[11px] text-pink-300/80">
                    Inspeção do kernel de micro-isolamento V8, alocação de memória por isolate e integridade de processos de agentes.
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Cluster / Isolate Alvo</label>
                  <input
                    type="text"
                    value={nanoCluster}
                    onChange={(e) => setNanoCluster(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Ação de Auditoria</label>
                  <select
                    value={nanoAction}
                    onChange={(e) => setNanoAction(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-100"
                  >
                    <option value="inspect_kernel">Inspecionar Kernel & Isolates</option>
                    <option value="verify_bytecode">Validar Bytecode & Assinaturas</option>
                    <option value="isolate_subtask">Confinar Subtarefa Seccomp-BPF</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTool === "energy" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Capacidade Solar (MW)</label>
                  <input
                    type="number"
                    value={solarMW}
                    onChange={(e) => setSolarMW(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">BESS Bateria (MWh)</label>
                  <input
                    type="number"
                    value={bessMWh}
                    onChange={(e) => setBessMWh(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Tarifa Base ($/MWh)</label>
                  <input
                    type="number"
                    value={energyPrice}
                    onChange={(e) => setEnergyPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-100"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTool === "crypto" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Símbolo / Ticker do Ativo</label>
                <input
                  type="text"
                  value={assetSymbol}
                  onChange={(e) => setAssetSymbol(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Janela Temporal (Timeframe)</label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-100"
                >
                  <option value="24H">24 Horas</option>
                  <option value="7D">7 Dias</option>
                  <option value="30D">30 Dias</option>
                  <option value="1Y">1 Ano</option>
                </select>
              </div>
            </div>
          )}

          {activeTool === "js" && (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Script JavaScript (Isolado no Node VM)
              </label>
              <textarea
                rows={6}
                value={jsCode}
                onChange={(e) => setJsCode(e.target.value)}
                className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-100 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

          {/* Run Action */}
          <div className="flex justify-end">
            <button
              id="execute-sandbox-tool-btn"
              onClick={handleExecute}
              disabled={running}
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg disabled:opacity-50 ${
                activeTool === "diagnostic"
                  ? "bg-amber-600 hover:bg-amber-500 shadow-amber-900/30"
                  : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30"
              }`}
            >
              {running ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {activeTool === "benchmark"
                      ? "Executando Benchmark 100% de Cobertura..."
                      : activeTool === "diagnostic"
                      ? "Executando Sonda de Diagnóstico..."
                      : "Executando Ferramenta..."}
                  </span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>
                    {activeTool === "benchmark"
                      ? "Executar Benchmark Completo (25 Ferramentas)"
                      : activeTool === "diagnostic"
                      ? "Executar Runtime-Check"
                      : "Executar Ferramenta"}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Benchmark Results Visual Dashboard */}
          {benchmarkData && (
            <div className="space-y-4 animate-in fade-in">
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
                  <div className="text-[10px] uppercase font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Taxa de Sucesso / Cobertura
                  </div>
                  <div className="text-sm font-bold text-emerald-400">
                    {benchmarkData.coveragePercent}% ({benchmarkData.passedCount}/{benchmarkData.totalCount} Passou)
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1">
                    Conformidade determinística GOS3 v1.0
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
                  <div className="text-[10px] uppercase font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-sky-400" />
                    Latência Acumulada
                  </div>
                  <div className="text-sm font-bold text-sky-300">
                    {result?.executionTimeMs || 0} ms
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1">
                    Média de ~{(Number(result?.executionTimeMs || 0) / Number(benchmarkData.totalCount || 1)).toFixed(1)} ms por ferramenta
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
                  <div className="text-[10px] uppercase font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-purple-400" />
                    Hash de Prova Geral
                  </div>
                  <div className="text-xs font-mono font-bold text-purple-300 truncate">
                    {result?.evidenceHash || "0xN/A"}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1">
                    Recibo criptográfico auditável
                  </div>
                </div>
              </div>

              {/* Suite Results Table */}
              <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800">
                <div className="text-[10px] uppercase font-semibold text-neutral-400 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-neutral-200">
                    <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                    Tabela Detalhada das 25 Ferramentas de Sandbox
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                    100% Auditadas
                  </span>
                </div>

                <div className="overflow-x-auto max-h-60 border border-neutral-800 rounded-lg">
                  <table className="w-full text-left text-[11px] font-mono">
                    <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 sticky top-0">
                      <tr>
                        <th className="p-2">Status</th>
                        <th className="p-2">Ferramenta</th>
                        <th className="p-2">Latência</th>
                        <th className="p-2">Evidence Hash</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                      {benchmarkData.suiteResults?.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-neutral-800/30 transition-colors">
                          <td className="p-2 font-semibold">
                            {item.success ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 flex items-center gap-1 w-max text-[10px]">
                                <CheckCircle2 className="w-3 h-3" /> PASS
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-800/50 flex items-center gap-1 w-max text-[10px]">
                                <AlertTriangle className="w-3 h-3" /> FAIL
                              </span>
                            )}
                          </td>
                          <td className="p-2 font-medium text-neutral-200">{item.tool}</td>
                          <td className="p-2 text-neutral-400">{item.latencyMs} ms</td>
                          <td className="p-2 text-emerald-400 text-[10px]">{item.evidenceHash}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Diagnostic Visual Dashboard when available */}
          {diagData && (
            <div className="space-y-4 animate-in fade-in">
              {/* Summary Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* 1. env_tag */}
                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
                  <div className="text-[10px] uppercase font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-amber-400" />
                    Runtime Env Tag
                  </div>
                  <div className="text-xs font-mono font-bold text-amber-300 break-all">
                    {diagData.env_tag}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1">
                    {diagData.osInfo?.platform} ({diagData.osInfo?.arch}) · Node {diagData.osInfo?.nodeVersion}
                  </div>
                </div>

                {/* 2. Filesystem */}
                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
                  <div className="text-[10px] uppercase font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
                    <FolderCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Filesystem R/W
                  </div>
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {diagData.filesystem?.accessible ? "Acessível & Gravável" : "Falha na Gravação"}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1">
                    Latência: {diagData.filesystem?.probeLatencyMs} ms
                  </div>
                </div>

                {/* 3. Memory RSS */}
                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
                  <div className="text-[10px] uppercase font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-purple-400" />
                    Memória Processo
                  </div>
                  <div className="text-xs font-bold text-purple-300">
                    RSS: {diagData.memory?.processRssMb} MB
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1">
                    Heap: {diagData.memory?.heapUsedMb} / {diagData.memory?.heapTotalMb} MB
                  </div>
                </div>

                {/* 4. Credentials & Security */}
                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
                  <div className="text-[10px] uppercase font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-sky-400" />
                    GOS3 & Segredos
                  </div>
                  <div className="text-xs font-bold text-sky-300 flex items-center gap-1">
                    Gemini: {diagData.securityAndEnv?.hasGeminiApiKey ? "✓ Ativa" : "✗ Ausente"}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1">
                    .env: {diagData.securityAndEnv?.envFilePresent ? "Presente" : "Não encontrado"}
                  </div>
                </div>
              </div>

              {/* Storage Advisory Card */}
              {diagData.filesystem?.storageAdvisory && (
                <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-800/40 text-xs text-sky-200 flex items-start gap-2.5">
                  <HardDrive className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-semibold text-sky-300">Análise de Partições & Termux/Alpine</div>
                    <div className="text-[11px] text-sky-200/90 leading-relaxed">
                      {diagData.filesystem.storageAdvisory}
                    </div>
                  </div>
                </div>
              )}

              {/* Disk Mounts Table if available */}
              {diagData.filesystem?.diskMounts && diagData.filesystem.diskMounts.length > 0 && (
                <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800">
                  <div className="text-[10px] uppercase font-semibold text-neutral-400 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                      Pontos de Montagem Inspecionados (df -h)
                    </span>
                    <span className="text-[10px] font-normal text-neutral-500">
                      Total: {diagData.filesystem.diskMounts.length}
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-48 border border-neutral-800 rounded-lg">
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
                        <tr>
                          <th className="p-2">Filesystem</th>
                          <th className="p-2">Tamanho</th>
                          <th className="p-2">Usado</th>
                          <th className="p-2">Disponível</th>
                          <th className="p-2">Uso %</th>
                          <th className="p-2">Montado Em</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                        {diagData.filesystem.diskMounts.map((mount: any, idx: number) => {
                          const isFull = mount.usePercent === "100%";
                          return (
                            <tr key={idx} className={isFull ? "bg-amber-950/10 text-amber-200" : ""}>
                              <td className="p-2 font-medium">{mount.filesystem}</td>
                              <td className="p-2">{mount.size}</td>
                              <td className="p-2">{mount.used}</td>
                              <td className="p-2 font-semibold text-emerald-400">{mount.available}</td>
                              <td className="p-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                  isFull ? "bg-amber-900/60 text-amber-300 font-bold" : "bg-neutral-800 text-neutral-300"
                                }`}>
                                  {mount.usePercent}
                                </span>
                              </td>
                              <td className="p-2 text-neutral-400">{mount.mountedOn}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Result Inspection Box */}
          {result && (
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Retorno da Sandbox ({result.executionTimeMs} ms)
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
                  Evidence Hash: <strong className="text-emerald-300">{result.evidenceHash}</strong>
                </span>
              </div>

              {result.logs && result.logs.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-semibold text-neutral-400 mb-1">Logs de Execução:</div>
                  <pre className="p-2.5 rounded-lg bg-neutral-950 text-xs font-mono text-neutral-300 overflow-x-auto border border-neutral-800 max-h-44">
                    {result.logs.join("\n")}
                  </pre>
                </div>
              )}

              <div>
                <div className="text-[10px] uppercase font-semibold text-neutral-400 mb-1">Payload Estruturado:</div>
                <pre className="p-2.5 rounded-lg bg-neutral-950 text-xs font-mono text-emerald-300 overflow-x-auto border border-neutral-800 max-h-56">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

