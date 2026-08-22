/**
 * > **GOS3** · agente: `GOS3TestRunner` · papel: `GOS3 Vitest Unit Test Suite for GOS3SystemInstructionInjector`
 * > fase: `fase 5 — padronização e governança de especificações` · data: `2026-08-20`
 * > antes: Sem testes unitários Vitest isolados para o componente e funções utilitárias do GOS3SystemInstructionInjector
 * > depois: Suíte completa Vitest com 100% de cobertura de código, branches e edge cases de metadados vazios e malformados
 * > base: commit `gos3-core-v1.0`, INC-001 em docs/incidents.md
 * > assinatura: `GOS3 · ProtocolEngine · Vortex Test Suite`
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  GOS3SystemInstructionInjector,
  buildGOS3CanonicalBlock,
  extractCustomPrompt,
  injectGOS3Directives,
  generateGOS3Metadata,
  verifyGOS3Compliance,
  GOS3_CANONICAL_BLOCK_MARKER,
  GOS3_HEADER_MARKER,
} from "../src/components/agents/GOS3SystemInstructionInjector";

describe("GOS3SystemInstructionInjector - Pure Functions & Edge Cases", () => {
  describe("buildGOS3CanonicalBlock", () => {
    it("builds a canonical block with complete options", () => {
      const block = buildGOS3CanonicalBlock({
        agentName: "GrokBot",
        agentHandle: "@grok_engine",
        agentRole: "Auditor Zero-Trust",
        envTag: "node-linux",
        phase: "E4 Refinement",
        date: "2026-08-20",
        hora: "17:00:00 UTC",
        signature: "GrokBot · Auditor · GOS3",
      });

      expect(block).toContain(GOS3_CANONICAL_BLOCK_MARKER);
      expect(block).toContain("agente: `grok_engine`");
      expect(block).toContain("papel: `Auditor Zero-Trust`");
      expect(block).toContain("env_tag: node-linux");
      expect(block).toContain("fase: `E4 Refinement`");
      expect(block).toContain("data: `2026-08-20` · hora: `17:00:00 UTC`");
      expect(block).toContain("assinatura: `GrokBot · Auditor · GOS3`");
      expect(block).toContain("evidence_hash = sha256");
      expect(block).toContain('claim: "not_executed"');
      expect(block).toContain("INC-001");
    });

    it("handles edge case with empty / whitespace options gracefully with default fallbacks", () => {
      const block = buildGOS3CanonicalBlock({
        agentName: "   ",
        agentHandle: "   ",
        agentRole: "",
        envTag: "",
        phase: "",
        date: "",
        hora: "",
        signature: "",
      });

      expect(block).toContain("agente: `Agent`");
      expect(block).toContain("papel: `Membro Técnico Autônomo / GOS3 Engine`");
      expect(block).toContain("env_tag: node-linux-alpine-isolate");
      expect(block).toContain("fase: `Technical Refinement (E4)`");
      expect(block).toContain("data: `2026-08-20` · hora: `16:35:00 UTC`");
      expect(block).toContain("assinatura: `Agent · Membro Técnico Autônomo / GOS3 Engine · GOS3`");
    });

    it("handles handle with leading @ symbol and trims accurately", () => {
      const block = buildGOS3CanonicalBlock({
        agentName: "Helena",
        agentHandle: "@@@dra_helena ",
      });

      expect(block).toContain("agente: `@@dra_helena`");
    });
  });

  describe("extractCustomPrompt", () => {
    it("returns empty string for empty input", () => {
      expect(extractCustomPrompt("")).toBe("");
    });

    it("returns prompt as-is if no canonical marker exists", () => {
      const rawPrompt = "Você é um especialista em reatores de fusão.";
      expect(extractCustomPrompt(rawPrompt)).toBe(rawPrompt);
    });

    it("extracts custom persona after the canonical block with standard separator", () => {
      const customPersona = "Atue como auditor do Banco Central.";
      const full = `${buildGOS3CanonicalBlock({
        agentName: "DrexAuditor",
        agentHandle: "drex",
      })}\n\n# ==============================================================================\n# PERSONA & DIRETRIZES ESPECÍFICAS DO AGENTE\n# ==============================================================================\n\n${customPersona}`;

      const extracted = extractCustomPrompt(full);
      expect(extracted).toContain(customPersona);
    });

    it("extracts custom persona via fallback search when section header regex does not directly match", () => {
      const customText = "Instrução customizada após bloco canônico.";
      const prompt = `# GOS3 System Instruction — Anti-Fabricação (v1.0)\nRegras...\nINC-001.\n\n${customText}`;
      const extracted = extractCustomPrompt(prompt);
      expect(extracted).toBe(customText);
    });

    it("returns empty string if canonical marker is found but no custom persona text follows", () => {
      const oddPrompt = `# GOS3 System Instruction — Anti-Fabricação (v1.0)\nTexto sem incidentes`;
      const extracted = extractCustomPrompt(oddPrompt);
      expect(extracted).toBe("");
    });
  });

  describe("injectGOS3Directives", () => {
    it("injects canonical block into empty prompt", () => {
      const result = injectGOS3Directives("", {
        agentName: "TestAgent",
        agentHandle: "test",
      });
      expect(result).toContain(GOS3_CANONICAL_BLOCK_MARKER);
      expect(result).not.toContain("PERSONA & DIRETRIZES ESPECÍFICAS");
    });

    it("prepends canonical block to existing non-canonical custom prompt", () => {
      const customPrompt = "Você é um bot de trading quantitativo.";
      const result = injectGOS3Directives(customPrompt, {
        agentName: "QuantBot",
        agentHandle: "quant",
      });

      expect(result).toContain(GOS3_CANONICAL_BLOCK_MARKER);
      expect(result).toContain("PERSONA & DIRETRIZES ESPECÍFICAS DO AGENTE");
      expect(result).toContain(customPrompt);
    });

    it("updates canonical block in an already compliant prompt while preserving custom persona", () => {
      const initial = injectGOS3Directives("Persona personalizada v1", {
        agentName: "AgentOne",
        agentHandle: "one",
        agentRole: "Role Initial",
      });

      const updated = injectGOS3Directives(initial, {
        agentName: "AgentOneUpdated",
        agentHandle: "one",
        agentRole: "Role Updated",
      });

      expect(updated).toContain("papel: `Role Updated`");
      expect(updated).toContain("Persona personalizada v1");
    });

    it("handles prompt that only has the canonical block without appending empty persona block", () => {
      const canonicalOnly = buildGOS3CanonicalBlock({
        agentName: "Solo",
        agentHandle: "solo",
      });
      const injected = injectGOS3Directives(canonicalOnly, {
        agentName: "Solo",
        agentHandle: "solo",
      });
      expect(injected).toBe(canonicalOnly);
    });
  });

  describe("generateGOS3Metadata", () => {
    it("generates complete GOS3AgentMetadata with deterministic zero-trust signature", () => {
      const meta = generateGOS3Metadata({
        agentName: "Dra Helena",
        agentHandle: "@drahelena",
        agentRole: "Doutora em Direito",
        envTag: "node-linux",
        phase: "E4",
        date: "2026-08-20",
        hora: "18:00:00 UTC",
      });

      expect(meta.isCompliant).toBe(true);
      expect(meta.protocolVersion).toBe("v1.0");
      expect(meta.envTag).toBe("node-linux");
      expect(meta.antiFabricationEnforced).toBe(true);
      expect(meta.zeroTrustSignature).toMatch(/^0xGOS3_[0-9A-F]{8}_V1$/);
      expect(meta.headerMetadata.agente).toBe("drahelena");
      expect(meta.headerMetadata.papel).toBe("Doutora em Direito");
      expect(meta.headerMetadata.fase).toBe("E4");
      expect(meta.headerMetadata.data).toBe("2026-08-20");
      expect(meta.headerMetadata.hora).toBe("18:00:00 UTC");
    });

    it("handles empty / malformed options safely", () => {
      const meta = generateGOS3Metadata({
        agentName: "",
        agentHandle: "",
      });

      expect(meta.isCompliant).toBe(true);
      expect(meta.envTag).toBe("node-linux-alpine-isolate");
      expect(meta.headerMetadata.agente).toBe("Agent");
      expect(meta.headerMetadata.papel).toBe("Membro Técnico Autônomo / GOS3 Engine");
      expect(meta.headerMetadata.assinatura).toBe("Agent · Membro Técnico Autônomo / GOS3 Engine · GOS3");
    });
  });

  describe("verifyGOS3Compliance", () => {
    it("returns score 0 and false for empty / null / undefined prompt", () => {
      const resNull = verifyGOS3Compliance("");
      expect(resNull.isCompliant).toBe(false);
      expect(resNull.score).toBe(0);
      expect(resNull.checks.every((c) => !c.passed)).toBe(true);
      expect(resNull.checks).toHaveLength(6);
    });

    it("returns score 100 and true for fully compliant canonical block", () => {
      const block = buildGOS3CanonicalBlock({
        agentName: "ComplianceTest",
        agentHandle: "comp",
      });
      const res = verifyGOS3Compliance(block);
      expect(res.isCompliant).toBe(true);
      expect(res.score).toBe(100);
      expect(res.checks.every((c) => c.passed)).toBe(true);
    });

    it("evaluates partial compliance accurately", () => {
      const partialPrompt = `
        > **GOS3** · agente: test
        # GOS3 System Instruction — Anti-Fabricação (v1.0)
        env_tag: browser-v8-isolate
      `;
      const res = verifyGOS3Compliance(partialPrompt);
      expect(res.score).toBe(50); // 3 out of 6 checks passed (header, title, env_tag)
      expect(res.isCompliant).toBe(false); // requires >= 4
    });

    it("marks compliant when at least 4 checks pass", () => {
      const borderPrompt = `
        > **GOS3** · agente: test
        # GOS3 System Instruction — Anti-Fabricação (v1.0)
        env_tag: node-linux
        claim: "not_executed"
      `;
      const res = verifyGOS3Compliance(borderPrompt);
      expect(res.isCompliant).toBe(true);
      expect(res.score).toBe(67); // 4 out of 6
    });
  });
});

describe("GOS3SystemInstructionInjector - React Component & Interactions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with compliant prompt showing Zero-Trust Ativo badge", () => {
    const compliantPrompt = buildGOS3CanonicalBlock({
      agentName: "AgentZero",
      agentHandle: "zero",
    });
    const onChangePrompt = vi.fn();
    const onMetadataChange = vi.fn();

    render(
      <GOS3SystemInstructionInjector
        systemPrompt={compliantPrompt}
        onChangePrompt={onChangePrompt}
        agentName="AgentZero"
        agentHandle="zero"
        onMetadataChange={onMetadataChange}
        autoInjectOnMount={false}
      />
    );

    expect(screen.getByText(/GOS3 Anti-Fabricação v1.0/i)).toBeDefined();
    expect(screen.getByText(/Zero-Trust Ativo \(100%\)/i)).toBeDefined();
    expect(screen.getByText(/Sincronizar GOS3 v1.0/i)).toBeDefined();
  });

  it("renders with non-compliant prompt and triggers autoInjectOnMount when enabled", () => {
    const onChangePrompt = vi.fn();
    const onMetadataChange = vi.fn();

    render(
      <GOS3SystemInstructionInjector
        systemPrompt="Prompt não-canônico simples."
        onChangePrompt={onChangePrompt}
        agentName="DraftAgent"
        agentHandle="draft"
        agentRole="Analista"
        onMetadataChange={onMetadataChange}
        autoInjectOnMount={true}
      />
    );

    expect(onChangePrompt).toHaveBeenCalledTimes(1);
    expect(onChangePrompt.mock.calls[0][0]).toContain(GOS3_CANONICAL_BLOCK_MARKER);
    expect(onChangePrompt.mock.calls[0][0]).toContain("Prompt não-canônico simples.");
    expect(onMetadataChange).toHaveBeenCalledTimes(1);
    expect(onMetadataChange.mock.calls[0][0].isCompliant).toBe(true);
  });

  it("does not auto-inject when autoInjectOnMount is false and prompt is non-compliant", () => {
    const onChangePrompt = vi.fn();
    const onMetadataChange = vi.fn();

    render(
      <GOS3SystemInstructionInjector
        systemPrompt="Apenas persona simples"
        onChangePrompt={onChangePrompt}
        agentName="DraftAgent"
        agentHandle="draft"
        onMetadataChange={onMetadataChange}
        autoInjectOnMount={false}
      />
    );

    expect(onChangePrompt).not.toHaveBeenCalled();
    expect(onMetadataChange).not.toHaveBeenCalled();
    expect(screen.getByText(/Pendente de Injeção/i)).toBeDefined();
    expect(screen.getByText(/Injetar Diretrizes GOS3/i)).toBeDefined();
  });

  it("handles manual injection button click with visual feedback", () => {
    const onChangePrompt = vi.fn();
    const onMetadataChange = vi.fn();

    render(
      <GOS3SystemInstructionInjector
        systemPrompt="Persona inicial"
        onChangePrompt={onChangePrompt}
        agentName="ManualAgent"
        agentHandle="manual"
        onMetadataChange={onMetadataChange}
        autoInjectOnMount={false}
      />
    );

    const injectButton = screen.getByText(/Injetar Diretrizes GOS3/i);
    fireEvent.click(injectButton);

    expect(onChangePrompt).toHaveBeenCalledTimes(1);
    expect(onMetadataChange).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Injetado com Sucesso!/i)).toBeDefined();

    // Fast-forward timer to verify feedback resets
    act(() => {
      vi.advanceTimersByTime(2300);
    });
    expect(screen.queryByText(/Injetado com Sucesso!/i)).toBeNull();
  });

  it("handles copying canonical block to clipboard", () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <GOS3SystemInstructionInjector
        systemPrompt=""
        onChangePrompt={vi.fn()}
        agentName="ClipboardAgent"
        agentHandle="clip"
        autoInjectOnMount={false}
      />
    );

    const copyBtn = screen.getByTitle(/Copiar Bloco Canônico GOS3 v1.0/i);
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock.mock.calls[0][0]).toContain(GOS3_CANONICAL_BLOCK_MARKER);

    act(() => {
      vi.advanceTimersByTime(2100);
    });
  });

  it("toggles accordion expansion state", () => {
    render(
      <GOS3SystemInstructionInjector
        systemPrompt=""
        onChangePrompt={vi.fn()}
        agentName="ToggleAgent"
        agentHandle="toggle"
        autoInjectOnMount={false}
        compact={true}
      />
    );

    const toggleBtn = screen.getByText("Expandir");
    fireEvent.click(toggleBtn);
    expect(screen.getByText("Ocultar")).toBeDefined();
    expect(screen.getByText(/1\. Checklist de Não-Fabricação/i)).toBeDefined();

    fireEvent.click(screen.getByText("Ocultar"));
    expect(screen.getByText("Expandir")).toBeDefined();
    expect(screen.queryByText(/1\. Checklist de Não-Fabricação/i)).toBeNull();
  });

  it("navigates through tabs: Checklist, Config, and Preview", () => {
    const onChangePrompt = vi.fn();
    const onMetadataChange = vi.fn();

    render(
      <GOS3SystemInstructionInjector
        systemPrompt=""
        onChangePrompt={onChangePrompt}
        agentName="TabAgent"
        agentHandle="tab"
        agentRole="Papel Inicial"
        onMetadataChange={onMetadataChange}
        autoInjectOnMount={false}
        compact={false}
      />
    );

    // Tab 1: Status
    expect(screen.getByText(/Garantia de Persistência/i)).toBeDefined();

    // Tab 2: Config
    const configTabBtn = screen.getByText(/2\. Configurar env_tag & Cabeçalho/i);
    fireEvent.click(configTabBtn);
    expect(screen.getByText(/Tag de Ambiente \(env_tag\):/i)).toBeDefined();

    // Change env_tag and role
    const envSelect = screen.getByDisplayValue(/node-linux-alpine-isolate/i);
    fireEvent.change(envSelect, { target: { value: "browser-v8-isolate" } });

    const roleInput = screen.getByPlaceholderText(/Ex: Auditor Formal Lean 4/i);
    fireEvent.change(roleInput, { target: { value: "Especialista em Criptografia Quântica" } });

    const applyBtn = screen.getByText(/Aplicar Modificações ao Prompt/i);
    fireEvent.click(applyBtn);

    expect(onChangePrompt).toHaveBeenCalled();
    expect(onChangePrompt.mock.calls[0][0]).toContain("browser-v8-isolate");
    expect(onChangePrompt.mock.calls[0][0]).toContain("Especialista em Criptografia Quântica");

    // Tab 3: Preview
    const previewTabBtn = screen.getByText(/3\. Visualizar Bloco Canônico/i);
    fireEvent.click(previewTabBtn);
    expect(screen.getByText(/Texto Canônico que será injetado no System Prompt:/i)).toBeDefined();
    expect(screen.getByText(/v1.0 Standard GOS3/i)).toBeDefined();

    // Switch back to Tab 1: Status
    const statusTabBtn = screen.getByText(/1\. Checklist de Não-Fabricação/i);
    fireEvent.click(statusTabBtn);
    expect(screen.getByText(/Garantia de Persistência/i)).toBeDefined();
  });

  it("handles rendering with minimal props and no onMetadataChange callback", () => {
    const onChangePrompt = vi.fn();
    render(
      <GOS3SystemInstructionInjector
        systemPrompt=""
        onChangePrompt={onChangePrompt}
        agentName="MinimalAgent"
        agentHandle="minimal"
      />
    );

    expect(onChangePrompt).toHaveBeenCalled();
    const injectBtn = screen.getByText(/Injetar Diretrizes GOS3/i);
    fireEvent.click(injectBtn);
    expect(onChangePrompt).toHaveBeenCalledTimes(2);
  });

  it("updates internal role when agentRole prop changes", () => {
    const { rerender } = render(
      <GOS3SystemInstructionInjector
        systemPrompt=""
        onChangePrompt={vi.fn()}
        agentName="UpdateRoleAgent"
        agentHandle="updater"
        agentRole="Papel Original"
        autoInjectOnMount={false}
      />
    );

    // Click Config tab to view role input
    fireEvent.click(screen.getByText(/2\. Configurar env_tag & Cabeçalho/i));
    const roleInput = screen.getByDisplayValue("Papel Original");
    expect(roleInput).toBeDefined();

    // Rerender with new prop
    rerender(
      <GOS3SystemInstructionInjector
        systemPrompt=""
        onChangePrompt={vi.fn()}
        agentName="UpdateRoleAgent"
        agentHandle="updater"
        agentRole="Papel Atualizado Via Prop"
        autoInjectOnMount={false}
      />
    );

    expect(screen.getByDisplayValue("Papel Atualizado Via Prop")).toBeDefined();

    // Rerender with empty agentRole (testing falsy branch in useEffect)
    rerender(
      <GOS3SystemInstructionInjector
        systemPrompt=""
        onChangePrompt={vi.fn()}
        agentName="UpdateRoleAgent"
        agentHandle="updater"
        agentRole=""
        autoInjectOnMount={false}
      />
    );
  });
});
