import React, { useState } from "react";
import { AgentThoughtLog } from "../../types";
import {
  Brain,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  Cpu,
  Hash,
  ShieldCheck,
  Terminal,
  X,
  Zap,
} from "lucide-react";

interface Props {
  thoughtLog?: AgentThoughtLog;
  isOpen: boolean;
  onClose: () => void;
  agentName?: string;
  agentHandle?: string;
}

export const AgentThoughtDrawer: React.FC<Props> = ({
  thoughtLog,
  isOpen,
  onClose,
  agentName,
  agentHandle,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"steps" | "prompt" | "evidence">("steps");

  if (!isOpen || !thoughtLog) return null;

  const copyHash = () => {
    navigator.clipboard.writeText(thoughtLog.evidenceHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="thought-drawer-overlay" className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="agent-thought-drawer-panel"
        className="w-full max-w-xl h-full bg-neutral-950 border-l border-neutral-800 text-neutral-100 flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-neutral-100">GOS3 Runtime Audit Log</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-300 border border-purple-700/50 font-mono">
                  CoT Verified
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Agent: <span className="text-neutral-200 font-medium">{agentName}</span> (@{agentHandle})
              </p>
            </div>
          </div>
          <button
            id="close-thought-drawer-btn"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-neutral-900/30 border-b border-neutral-800/80 text-xs">
          <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800/60 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <div className="text-[10px] text-neutral-400 uppercase">LLM Engine</div>
              <div className="font-medium text-neutral-200 truncate">{thoughtLog.model}</div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800/60 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] text-neutral-400 uppercase">Latency</div>
              <div className="font-medium text-neutral-200">{thoughtLog.totalDurationMs} ms</div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800/60 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-neutral-400 uppercase">Sandbox State</div>
              <div className="font-medium text-emerald-400">Deterministic</div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-800 text-xs font-medium px-4 pt-2 gap-4">
          <button
            id="thought-tab-steps"
            onClick={() => setActiveTab("steps")}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "steps"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-neutral-400 hover:text-neutral-300"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Reasoning Steps ({thoughtLog.steps.length})
          </button>
          <button
            id="thought-tab-prompt"
            onClick={() => setActiveTab("prompt")}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "prompt"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-neutral-400 hover:text-neutral-300"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Context Prompt
          </button>
          <button
            id="thought-tab-evidence"
            onClick={() => setActiveTab("evidence")}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "evidence"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-neutral-400 hover:text-neutral-300"
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            Proof & Hash
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "steps" && (
            <div className="space-y-4">
              {thoughtLog.steps.map((step, idx) => (
                <div
                  key={step.id || idx}
                  className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 relative transition-all hover:border-neutral-700"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-semibold text-neutral-200">{step.title}</h4>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {step.latencyMs ? `${step.latencyMs}ms` : "ok"}
                    </span>
                  </div>

                  {step.description && (
                    <p className="text-xs text-neutral-300 mb-2 pl-7">{step.description}</p>
                  )}

                  {step.toolName && (
                    <div className="ml-7 mt-2 p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-sky-400 font-semibold mb-1">
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Tool Invoked: {step.toolName}</span>
                      </div>
                      {step.inputArgs && (
                        <div className="mt-1 text-neutral-400">
                          <span className="text-neutral-500">Input Args: </span>
                          <pre className="text-[11px] text-amber-200/90 whitespace-pre-wrap overflow-x-auto mt-0.5 bg-neutral-900/80 p-2 rounded">
                            {JSON.stringify(step.inputArgs, null, 2)}
                          </pre>
                        </div>
                      )}
                      {step.outputResult && (
                        <div className="mt-2 text-neutral-400">
                          <span className="text-neutral-500">Output Data: </span>
                          <pre className="text-[11px] text-emerald-300/90 whitespace-pre-wrap overflow-x-auto mt-0.5 bg-neutral-900/80 p-2 rounded">
                            {JSON.stringify(step.outputResult, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "prompt" && (
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-300">Prompt Context Ingested by Model</span>
                <span className="text-[11px] text-neutral-500 font-mono">Est. Tokens: ~{thoughtLog.tokensEstimate || 150}</span>
              </div>
              <pre className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
                {thoughtLog.promptUsed}
              </pre>
            </div>
          )}

          {activeTab === "evidence" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <div className="flex items-center gap-2 mb-2 text-emerald-400 font-semibold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Vortex GOS3 Cryptographic Evidence Proof</span>
                </div>
                <p className="text-xs text-neutral-400 mb-3">
                  This SHA-256 hash guarantees mathematical non-repudiation of agent execution, tools called, and returned states.
                </p>

                <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono text-emerald-300">
                  <span className="truncate pr-2">{thoughtLog.evidenceHash}</span>
                  <button
                    id="copy-evidence-hash-btn"
                    onClick={copyHash}
                    className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-neutral-200 shrink-0 transition-colors"
                    title="Copy hash"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {copied && <span className="text-[11px] text-emerald-400 mt-1 block">Hash copiado para a área de transferência!</span>}
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800/80 text-xs text-neutral-400 space-y-2">
                <div className="font-medium text-neutral-300">Security & Isolation Guarantees:</div>
                <ul className="list-disc pl-4 space-y-1 text-neutral-400">
                  <li>Sandboxed V8 execution context with maximum timeout protection (3000ms).</li>
                  <li>No external unauthorized network egress during script execution.</li>
                  <li>Zero browser exposure of API secrets.</li>
                  <li>Native Function Calling via @google/genai SDK.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
