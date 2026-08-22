/**
 * > **GOS3** · agente: `GOS3SystemInstructionInjector` · papel: `GOS3 System Prompt Injector & Zero-Trust Governance`
 * > fase: `fase 5 — padronização e governança de especificações` · data: `2026-08-20`
 * > antes: Agentes podiam ser criados no Agent Studio sem o bloco obrigatório de Anti-Fabricação GOS3 v1.0
 * > depois: Injeção automática e governança persistida do bloco canônico Anti-Fabricação em qualquer agente criado ou editado
 * > base: commit `gos3-core-v1.0`, INC-001 em docs/incidents.md
 * > assinatura: `GOS3 · ProtocolEngine · Vortex`
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Terminal,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Sliders,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Lock,
  X,
} from "lucide-react";
import { GOS3AgentMetadata } from "../../types";

export interface GOS3InjectorOptions {
  agentName: string;
  agentHandle: string;
  agentRole?: string;
  envTag?: string;
  phase?: string;
  date?: string;
  hora?: string;
  signature?: string;
}

export const GOS3_CANONICAL_BLOCK_MARKER = "# GOS3 System Instruction — Anti-Fabricação (v1.0)";
export const GOS3_HEADER_MARKER = "> **GOS3** · agente:";

/**
 * Generates the canonical GOS3 Anti-Fabricação v1.0 instruction block.
 */
export function buildGOS3CanonicalBlock(options: GOS3InjectorOptions): string {
  const cleanHandle = options.agentHandle.replace(/^@/, "").trim() || "Agent";
  const agentName = options.agentName.trim() || cleanHandle;
  const role = options.agentRole?.trim() || "Membro Técnico Autônomo / GOS3 Engine";
  const envTag = options.envTag?.trim() || "node-linux-alpine-isolate";
  const phase = options.phase?.trim() || "Technical Refinement (E4)";
  const date = options.date || "2026-08-20";
  const hora = options.hora || "16:35:00 UTC";
  const signature = options.signature || `${agentName} · ${role} · GOS3`;

  return `> **GOS3** · agente: \`${cleanHandle}\` · papel: \`${role}\` (ver docs/team.md)
> fase: \`${phase}\` · data: \`${date}\` · hora: \`${hora}\`
> antes: INC-001 (GAIStudioDev) e o padrão anterior (ADR-002, Grok "LLM theater", Gemini executeGeminiAdapter com stdout fixo) mostraram o mesmo defeito se repetindo em agentes diferentes
> depois: Bloco canônico unificado de instrução de sistema anti-fabricação GOS3 v1.0 com checklist e regras de env_tag
> base: commit \`gos3-core-v1.0\`, INC-001 em docs/incidents.md
> assinatura: \`${signature}\`

# GOS3 System Instruction — Anti-Fabricação (v1.0)

Aplica-se a todo agente do board GOS3, sem exceção de fornecedor ou modelo.
Cole este bloco no início do system prompt / persona de cada agente
(inclusive Claude, Gemini, GPT, Grok, Qwen, DeepSeek, Manus, Perplexity).

---

## 1. Você não sabe, por padrão, qual é o seu ambiente de execução real

Como modelo de linguagem, você não tem acesso privilegiado a informação sobre
o hardware, SO, ou runtime que hospeda esta conversa, a menos que essa
informação chegue a você via resultado real de tool call (function calling)
ou via \`env_tag\` explícito neste prompt. Adivinhar isso a partir de padrões de
treinamento e devolver como fato é fabricação, mesmo que soe técnico e
detalhado.

**Se este prompt não te disser explicitamente qual é o seu \`env_tag\`, você
não sabe se tem acesso a shell, filesystem, ou syscalls — e deve dizer isso,
não presumir que tem.**

\`env_tag\` desta sessão (preenchido pelo operador/adapter, não por você):
\`\`\`
env_tag: ${envTag}
\`\`\`

---

## 2. Regra dura: claim de execução exige \`evidence_hash\` real

Você NUNCA descreve uma ação como já realizada ("rodei", "executei",
"validei", "compilei", "testei") a menos que:
1. Você de fato chamou uma tool/function real nesta troca, E
2. O resultado dessa chamada está disponível pra você citar (stdout/stderr/
   exit_code reais), E
3. Se o contexto exigir prova formal (contrato GOS3 v0.1 / v1.0), a resposta inclui
   \`evidence_hash = sha256(stdout + stderr + exit_code + duration_ms)\`
   calculado sobre o resultado real — nunca inventado, nunca copiado de
   outro post, nunca com timestamp no lugar de duration_ms.

Se você não chamou nenhuma tool, a resposta correta é descrever o que
**faria** ou **propõe fazer** — no futuro/condicional — nunca no passado como
se já tivesse acontecido.

---

## 3. Regra dura: não alegue capacidade que seu \`env_tag\` não sustenta

Se \`env_tag == browser-v8-isolate\`: você não tem \`require\`, \`process\`, \`fs\`,
\`child_process\`, nem syscalls. Não alegue "isolamento de kernel",
"sandbox Linux", "execução de bash real", ou qualquer variante disso. Você
pode, no máximo, alegar isolamento do próprio interpretador JS (que é real,
mas não é o que o GOS3 pede pra provar execução de comando/SO).

Se \`env_tag == node-linux\` ou \`node-android-termux\` ou \`node-linux-alpine-isolate\`: você tem acesso real a
SO, mas isso não é automático — só é verdade se a tool call que você invocou
de fato passou por esse runtime (ex.: via endpoint \`/api/agents/*/run\` com
\`skill: executeBash\`), não por você "saber" que está em Linux.

---

## 4. Se não pode provar, declare — não simule

Formato obrigatório quando uma capacidade não está disponível:

\`\`\`
claim: "not_executed"
motivo: <curto, específico — ex.: "env_tag=${envTag} não expôs
        execução de shell para este comando; chamada não realizada">
\`\`\`

Isso não é fraqueza a esconder — é o comportamento correto exigido pelo
princípio "Zero Simulação Oculta" (\`docs/decisions.md\`, ADR-002). Um post
honesto com \`claim: "not_executed"\` vale mais, no GOS3, que um post fluente
alegando sucesso sem evidência.

---

## 5. Antes de postar qualquer claim técnico no feed

Passe pela checklist:
- [ ] Isso que vou descrever, eu de fato executei nesta troca (tool call real)?
- [ ] Meu \`env_tag\` sustenta a capacidade que estou alegando?
- [ ] Se \`executed: true\`, tenho \`evidence_hash\` calculado sobre saída real
      (não timestamp, não texto fixo, não hash de outro agente)?
- [ ] Se qualquer resposta acima for "não" ou "não sei", meu post usa
      \`claim: "not_executed"\` ou tempo condicional/futuro — não passado.

---

## 6. Este bloco vale para todos os modelos

Nenhum agente está isento (Claude, Gemini, GPT, Grok, DeepSeek, Qwen). Se qualquer
agente violar as seções 1–5, isso é um incidente a registrar em \`docs/incidents.md\`,
na mesma régua do INC-001.`;
}

/**
 * Extracts custom user persona instructions that follow the GOS3 canonical block.
 */
export function extractCustomPrompt(fullPrompt: string): string {
  if (!fullPrompt) return "";
  if (!fullPrompt.includes(GOS3_CANONICAL_BLOCK_MARKER)) {
    return fullPrompt;
  }

  const personaHeaderMarker = "# PERSONA & DIRETRIZES ESPECÍFICAS DO AGENTE";
  if (fullPrompt.includes(personaHeaderMarker)) {
    const idx = fullPrompt.indexOf(personaHeaderMarker);
    const afterHeader = fullPrompt.slice(idx + personaHeaderMarker.length);
    const cleaned = afterHeader.replace(/^[\s#=]+/m, "").trim();
    return cleaned;
  }

  // Fallback: search for custom persona after GOS3 block ends (after INC-001.)
  const index = fullPrompt.indexOf(GOS3_CANONICAL_BLOCK_MARKER);
  const afterMarker = fullPrompt.slice(index);
  const splitIndex = afterMarker.indexOf("INC-001.");
  if (splitIndex !== -1) {
    const rest = afterMarker.slice(splitIndex + "INC-001.".length).trim();
    const cleaned = rest.replace(/^[\s#=]+/m, "").trim();
    return cleaned;
  }

  return "";
}

/**
 * Injects or updates the GOS3 system instruction into a prompt string.
 */
export function injectGOS3Directives(currentPrompt: string, options: GOS3InjectorOptions): string {
  const canonical = buildGOS3CanonicalBlock(options);
  const custom = extractCustomPrompt(currentPrompt);

  if (!custom || custom === currentPrompt.trim()) {
    // If the current prompt was raw, prepend canonical block and attach custom below
    if (currentPrompt.includes(GOS3_CANONICAL_BLOCK_MARKER)) {
      return canonical;
    }
    if (currentPrompt.trim()) {
      return `${canonical}\n\n# ==============================================================================\n# PERSONA & DIRETRIZES ESPECÍFICAS DO AGENTE\n# ==============================================================================\n\n${currentPrompt.trim()}`;
    }
    return canonical;
  }

  return `${canonical}\n\n# ==============================================================================\n# PERSONA & DIRETRIZES ESPECÍFICAS DO AGENTE\n# ==============================================================================\n\n${custom}`;
}

/**
 * Generates the full GOS3AgentMetadata object for persistence.
 */
export function generateGOS3Metadata(options: GOS3InjectorOptions): GOS3AgentMetadata {
  const cleanHandle = options.agentHandle.replace(/^@/, "").trim() || "Agent";
  const agentName = options.agentName.trim() || cleanHandle;
  const role = options.agentRole?.trim() || "Membro Técnico Autônomo / GOS3 Engine";
  const envTag = options.envTag?.trim() || "node-linux-alpine-isolate";
  const phase = options.phase?.trim() || "Technical Refinement (E4)";
  const date = options.date || "2026-08-20";
  const hora = options.hora || "16:35:00 UTC";

  // Deterministic mock hash for verification
  const signaturePayload = `${cleanHandle}|${envTag}|v1.0|${date}|gos3-core-v1.0`;
  let hashVal = 0;
  for (let i = 0; i < signaturePayload.length; i++) {
    hashVal = (hashVal << 5) - hashVal + signaturePayload.charCodeAt(i);
    hashVal |= 0;
  }
  const zeroTrustSignature = `0xGOS3_${Math.abs(hashVal).toString(16).toUpperCase().padStart(8, "0")}_V1`;

  return {
    isCompliant: true,
    protocolVersion: "v1.0",
    envTag,
    antiFabricationEnforced: true,
    zeroTrustSignature,
    lastInjectedAt: new Date().toISOString(),
    headerMetadata: {
      agente: cleanHandle,
      papel: role,
      fase: phase,
      data: date,
      hora,
      antes: "INC-001 (GAIStudioDev) / LLM Theater",
      depois: "Bloco Canônico Anti-Fabricação GOS3 v1.0",
      base: "commit gos3-core-v1.0, INC-001 em docs/incidents.md",
      assinatura: `${agentName} · ${role} · GOS3`,
    },
  };
}

/**
 * Verifies if a prompt string complies with GOS3 v1.0 specifications.
 */
export function verifyGOS3Compliance(prompt: string): {
  isCompliant: boolean;
  score: number;
  checks: { id: string; label: string; passed: boolean }[];
} {
  if (!prompt) {
    return {
      isCompliant: false,
      score: 0,
      checks: [
        { id: "header", label: "Cabeçalho de Governança GOS3", passed: false },
        { id: "title", label: "Bloco Anti-Fabricação v1.0", passed: false },
        { id: "env_tag", label: "Declaração Explícita de env_tag", passed: false },
        { id: "evidence_hash", label: "Exigência de evidence_hash Real", passed: false },
        { id: "not_executed", label: "Regra de claim: 'not_executed'", passed: false },
        { id: "zero_simulation", label: "Princípio Zero Simulação Oculta (ADR-002)", passed: false },
      ],
    };
  }

  const checks = [
    {
      id: "header",
      label: "Cabeçalho de Governança GOS3",
      passed: prompt.includes(GOS3_HEADER_MARKER) || prompt.includes("**GOS3**"),
    },
    {
      id: "title",
      label: "Bloco Anti-Fabricação v1.0",
      passed: prompt.includes("Anti-Fabricação (v1.0)") || prompt.includes("GOS3 System Instruction"),
    },
    {
      id: "env_tag",
      label: "Declaração Explícita de env_tag",
      passed: prompt.includes("env_tag:"),
    },
    {
      id: "evidence_hash",
      label: "Exigência de evidence_hash Real",
      passed: prompt.includes("evidence_hash") && prompt.includes("sha256"),
    },
    {
      id: "not_executed",
      label: "Regra de claim: 'not_executed'",
      passed: prompt.includes('claim: "not_executed"') || prompt.includes("not_executed"),
    },
    {
      id: "zero_simulation",
      label: "Princípio Zero Simulação Oculta (ADR-002)",
      passed: prompt.includes("Zero Simulação Oculta") || prompt.includes("ADR-002"),
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    isCompliant: passedCount >= 4,
    score,
    checks,
  };
}

interface ComponentProps {
  systemPrompt: string;
  onChangePrompt: (newPrompt: string) => void;
  agentName: string;
  agentHandle: string;
  agentRole?: string;
  onMetadataChange?: (metadata: GOS3AgentMetadata) => void;
  autoInjectOnMount?: boolean;
  className?: string;
  compact?: boolean;
}

export const GOS3SystemInstructionInjector: React.FC<ComponentProps> = ({
  systemPrompt,
  onChangePrompt,
  agentName,
  agentHandle,
  agentRole = "Especialista Técnico Autônomo",
  onMetadataChange,
  autoInjectOnMount = true,
  className = "",
  compact = false,
}) => {
  const [envTag, setEnvTag] = useState<string>("node-linux-alpine-isolate");
  const [role, setRole] = useState<string>(agentRole);
  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);
  const [activeTab, setActiveTab] = useState<"status" | "preview" | "config">("status");
  const [copied, setCopied] = useState(false);
  const [justInjected, setJustInjected] = useState(false);

  // Sync role when agentRole prop updates
  useEffect(() => {
    if (agentRole) setRole(agentRole);
  }, [agentRole]);

  // Verification results
  const compliance = useMemo(() => verifyGOS3Compliance(systemPrompt), [systemPrompt]);

  // Auto-inject on mount if empty or not compliant
  useEffect(() => {
    if (autoInjectOnMount && (!systemPrompt.trim() || !compliance.isCompliant)) {
      const injected = injectGOS3Directives(systemPrompt, {
        agentName,
        agentHandle,
        agentRole: role,
        envTag,
      });
      onChangePrompt(injected);

      if (onMetadataChange) {
        onMetadataChange(
          generateGOS3Metadata({
            agentName,
            agentHandle,
            agentRole: role,
            envTag,
          })
        );
      }
    }
  }, [autoInjectOnMount]);

  const handleInject = () => {
    const injected = injectGOS3Directives(systemPrompt, {
      agentName,
      agentHandle,
      agentRole: role,
      envTag,
    });
    onChangePrompt(injected);

    if (onMetadataChange) {
      onMetadataChange(
        generateGOS3Metadata({
          agentName,
          agentHandle,
          agentRole: role,
          envTag,
        })
      );
    }

    setJustInjected(true);
    setTimeout(() => setJustInjected(false), 2200);
  };

  const handleCopy = () => {
    const canonical = buildGOS3CanonicalBlock({
      agentName,
      agentHandle,
      agentRole: role,
      envTag,
    });
    navigator.clipboard.writeText(canonical);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="gos3-system-instruction-injector"
      className={`rounded-2xl border transition-all ${
        compliance.isCompliant
          ? "bg-gradient-to-b from-purple-950/40 via-neutral-950/80 to-neutral-950 border-purple-800/60 shadow-lg shadow-purple-950/20"
          : "bg-gradient-to-b from-amber-950/30 via-neutral-950/80 to-neutral-950 border-amber-800/50 shadow-lg shadow-amber-950/20"
      } ${className}`}
    >
      {/* Header Banner */}
      <div className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/60">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 ${
              compliance.isCompliant
                ? "bg-gradient-to-tr from-emerald-600 to-purple-600 shadow-md shadow-purple-900/40"
                : "bg-gradient-to-tr from-amber-600 to-orange-600 shadow-md shadow-amber-900/40"
            }`}
          >
            {compliance.isCompliant ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
                GOS3 Anti-Fabricação v1.0
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 ${
                  compliance.isCompliant
                    ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700/50"
                    : "bg-amber-950/80 text-amber-300 border border-amber-700/50"
                }`}
              >
                {compliance.isCompliant ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Zero-Trust Ativo ({compliance.score}%)
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    Pendente de Injeção
                  </>
                )}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Diretrizes de não-simulação, evidence hash SHA-256 e runtime governance.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleInject}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
              justInjected
                ? "bg-emerald-600 text-white shadow-emerald-900/40 scale-105"
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/40"
            }`}
          >
            {justInjected ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Injetado com Sucesso!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{compliance.isCompliant ? "Sincronizar GOS3 v1.0" : "Injetar Diretrizes GOS3"}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            title="Copiar Bloco Canônico GOS3 v1.0"
            className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors text-xs font-mono"
          >
            {isExpanded ? "Ocultar" : "Expandir"}
          </button>
        </div>
      </div>

      {/* Expanded Accordion Body */}
      {isExpanded && (
        <div className="p-4 space-y-4 animate-in fade-in">
          {/* Subtabs */}
          <div className="flex border-b border-neutral-800/80 gap-2 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab("status")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === "status"
                  ? "bg-purple-900/60 text-purple-200 border border-purple-700/50"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              1. Checklist de Não-Fabricação
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("config")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === "config"
                  ? "bg-purple-900/60 text-purple-200 border border-purple-700/50"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              2. Configurar env_tag & Cabeçalho
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === "preview"
                  ? "bg-purple-900/60 text-purple-200 border border-purple-700/50"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              3. Visualizar Bloco Canônico
            </button>
          </div>

          {/* TAB 1: STATUS & CHECKLIST */}
          {activeTab === "status" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {compliance.checks.map((check) => (
                  <div
                    key={check.id}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                      check.passed
                        ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-200"
                        : "bg-neutral-900/60 border-neutral-800 text-neutral-400"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        check.passed ? "bg-emerald-600 text-white" : "bg-neutral-800 text-neutral-500"
                      }`}
                    >
                      {check.passed ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                    </div>
                    <span className="text-xs font-medium">{check.label}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex items-start gap-2.5 text-xs text-neutral-300">
                <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-neutral-200">Garantia de Persistência: </span>
                  Ao salvar ou criar o agente, o bloco Anti-Fabricação GOS3 v1.0 será gravado tanto no prompt do sistema quanto nos metadados do perfil (
                  <code className="text-purple-300 font-mono text-[11px]">gos3Metadata</code>
                  ) no WAL e no banco de dados.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONFIGURATION */}
          {activeTab === "config" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-purple-400" />
                    Tag de Ambiente (env_tag):
                  </label>
                  <select
                    value={envTag}
                    onChange={(e) => setEnvTag(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  >
                    <option value="node-linux-alpine-isolate">node-linux-alpine-isolate (Padrão OpenClaw Sandbox)</option>
                    <option value="node-linux">node-linux (Linux Nativo com Shell e Syscalls)</option>
                    <option value="browser-v8-isolate">browser-v8-isolate (Sem SO / Apenas V8 Isolate)</option>
                    <option value="node-android-termux">node-android-termux (Android Host)</option>
                    <option value="unknown">unknown (Não declarado / Declarar Falta de Prova)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    Papel / Função de Governança:
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Ex: Auditor Formal Lean 4 / Engenheiro BESS"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleInject}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Aplicar Modificações ao Prompt
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PREVIEW */}
          {activeTab === "preview" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-neutral-400">
                  Texto Canônico que será injetado no System Prompt:
                </span>
                <span className="text-[10px] text-purple-400 font-mono">v1.0 Standard GOS3</span>
              </div>
              <pre className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-[11px] font-mono text-neutral-300 max-h-52 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                {buildGOS3CanonicalBlock({
                  agentName,
                  agentHandle,
                  agentRole: role,
                  envTag,
                })}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
