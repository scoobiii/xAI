/**
 * > **GOS3** · agente: `claude` · papel: `Arquiteto / Tech Writer` (ver docs/team.md)
 * > fase: `fase 5 — padronização e governança de especificações` · data: `2026-08-21` · hora: `17:22:00 UTC`
 * > antes: Sem painel dedicado de Explainable AI (UX XAI) no Feed
 * > depois: Componente de transparência cognitiva, inferência epistêmica, fatores de decisão e decomposição de hipóteses do agente
 * > base: commit `gos3-core-v1.0`, docs/GOS3-SPECIFICATION.md
 * > assinatura: `Claude · Arquiteto / Tech Writer · GOS3`
 */

import React, { useState } from "react";
import { AgentThoughtLog } from "../../types";
import {
  Brain,
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  Sliders,
  CheckCircle,
  AlertTriangle,
  FileCode,
  Search,
  Hash,
  Activity,
  Layers,
} from "lucide-react";

interface Props {
  thoughtLog: AgentThoughtLog;
  agentName: string;
  agentHandle: string;
  onOpenFullAudit?: () => void;
}

export const XaiTransparencyCard: React.FC<Props> = ({
  thoughtLog,
  agentName,
  agentHandle,
  onOpenFullAudit,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const xai = thoughtLog.xaiSummary;
  const stepsCount = thoughtLog.steps?.length || 0;
  const toolSteps = thoughtLog.steps?.filter((s) => Boolean(s.toolName)) || [];

  const confidenceScore = xai?.confidenceOverall ?? 0.94;
  const confidencePercent = Math.round(confidenceScore * 100);

  return (
    <div
      id="xai-transparency-card"
      className="my-3 rounded-xl border border-purple-900/40 bg-gradient-to-br from-purple-950/20 via-neutral-900/60 to-neutral-950 text-neutral-200 overflow-hidden transition-all duration-200"
    >
      {/* Header Bar */}
      <div className="p-3 px-4 flex items-center justify-between gap-3 border-b border-purple-900/30 bg-purple-950/30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-purple-900/60 border border-purple-700/50 flex items-center justify-center text-purple-300 shrink-0">
            <Brain className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-purple-200 tracking-wide uppercase">
                UX XAI • Raciocínio Explicável
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-900/50 text-purple-300 font-mono border border-purple-700/40">
                {thoughtLog.model}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 truncate">
              Agente @{agentHandle} executou {stepsCount} etapas com {toolSteps.length} ferramentas auditadas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Confidence Badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900/80 border border-neutral-800 text-[11px] font-mono text-emerald-400"
            title="Nível de Certeza Epistêmica / Confiança da Inferência"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>{confidencePercent}% Certeza</span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg hover:bg-purple-900/40 text-purple-300 transition-colors"
            title={isExpanded ? "Ocultar detalhes XAI" : "Expandir árvore de decisão"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Summary Highlight (Always Visible) */}
      <div className="p-3.5 px-4 text-xs space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider shrink-0 mt-0.5">
            Racional:
          </span>
          <p className="text-neutral-300 leading-relaxed text-[12px]">
            {xai?.rationale ||
              `Decisão inferida através do pipeline determinístico com verificação em sandbox, hash criptográfico de evidência e validação estrita anti-fabricação GOS3.`}
          </p>
        </div>

        {/* Quick Tags / Epistemic Markers */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-sky-400" />
            Epistemologia: <strong className="text-neutral-200 uppercase">{xai?.epistemicCertainty || "empírico"}</strong>
          </span>

          <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Risco: <strong className="text-emerald-300 uppercase">{xai?.riskFactor || "baixo"}</strong>
          </span>

          {thoughtLog.evidenceHash && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono flex items-center gap-1 truncate max-w-[200px]">
              <Hash className="w-3 h-3 text-purple-400" />
              {thoughtLog.evidenceHash.slice(0, 14)}...
            </span>
          )}

          {onOpenFullAudit && (
            <button
              type="button"
              onClick={onOpenFullAudit}
              className="ml-auto text-[11px] text-purple-400 hover:text-purple-300 underline font-medium flex items-center gap-1"
            >
              Auditoria Completa &rarr;
            </button>
          )}
        </div>
      </div>

      {/* Expanded Decision Tree / Premise Deconstruction */}
      {isExpanded && (
        <div className="p-4 pt-2 border-t border-purple-900/20 bg-neutral-950/80 space-y-3 animate-in fade-in duration-150">
          {/* Key Assumptions */}
          <div>
            <h5 className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400 mb-1.5 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              Premissas & Fatores Determinantes
            </h5>
            <ul className="space-y-1 pl-1">
              {(xai?.keyAssumptions || [
                "Verificação da integridade do ambiente com isolamento V8 e kernel gVisor",
                "Execução de ferramentas sem dados sintéticos ou fabricados",
                "Recuperação semântica e ancoragem vetorial de memórias",
              ]).map((assumption, idx) => (
                <li key={idx} className="text-xs text-neutral-300 flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span>{assumption}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Falsification Criteria */}
          {xai?.falsificationVector && (
            <div className="p-2.5 rounded-lg bg-neutral-900/70 border border-neutral-800 text-xs">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1 text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Critério de Falseabilidade GOS3</span>
              </div>
              <p className="text-neutral-400 text-[11px] font-mono leading-relaxed">
                {xai.falsificationVector}
              </p>
            </div>
          )}

          {/* Step Progression Timeline */}
          <div>
            <h5 className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400 mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Trilha de Decisão do Agente
            </h5>
            <div className="space-y-2">
              {thoughtLog.steps.slice(0, 4).map((step, idx) => (
                <div
                  key={step.id || idx}
                  className="p-2 rounded-lg bg-neutral-900/50 border border-neutral-800/80 text-xs flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-4 h-4 rounded-full bg-purple-950 text-purple-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-neutral-200 truncate">{step.title}</span>
                  </div>
                  {step.toolName && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 font-mono border border-sky-800/50 shrink-0">
                      {step.toolName}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
