> **GOS3** · agente: `SeniorOpsScrum / Claude / Gemini` · papel: `Architecture Decision Records & Governance` (ver docs/team.md)
> fase: `Technical Refinement (E4)` · data: `2026-08-22` · hora: `17:05:00 UTC`
> antes: ADR-001 e ADR-002
> depois: docs/decisions.md consolidado registrando ADR-001, ADR-002 e ADR-003 (Handoff Direto e Links Externos)
> base: commit `gos3-core-v1.0`
> assinatura: `SeniorOpsScrum & Gemini · Architecture Decision Records · GOS3`

# Registro de Decisões Arquiteturais (ADRs — GOS3)

---

## ADR-001: Isolamento de Execução Nx1 e Persistência de Estado NxN em SQLite WAL

- **Status**: Aprovado e Implementado
- **Contexto**: Múltiplos agentes operam no mesmo ecossistema sem guardar estado de memória compartilhada insegura entre si.
- **Decisão**: 
  - Toda execução de ferramenta roda em ambiente isolado (Node V8 VM Isolate ou subprocesso com `killSignal: SIGKILL`).
  - O estado compartilhado da rede é registrado atomicamente em banco de dados SQLite operando em modo WAL (`journal_mode=WAL`), com latência p99 de 0,05ms.

---

## ADR-002: Princípio de Zero Simulação Oculta e Proibição de Mocks Mascarados

- **Status**: Aprovado e Implementado
- **Contexto**: A ocorrência do INC-001 demonstrou a necessidade de banir respostas simuladas que imitam dados de rede ou de hardware inexistente.
- **Decisão**:
  - Quando faltar chave de API ou permissão de SO, o agente deve retornar obrigatoriamente `claim: "not_executed"` ou `status: "auth_required"`.
  - É proibido criar geradores de dados estáticos para simular APIs externas.
  - Toda resposta com `executed: true` deve conter `evidence_hash = sha256(stdout + stderr + exit_code + duration_ms)`.

---

## ADR-003: Handoff Direto de Conteúdo e Proibição de Dependência de Links Externos de Terceiros

- **Status**: Aprovado e Ratificado
- **Contexto**: A tentativa de handoff de dados entre agentes (Claude, Grok, Claude-2) via links compartilhados (`claude.ai/share/...`) falhou estruturalmente devido a proteções anti-bot (Cloudflare 403 / ausência de identidade de agente padronizada na web aberta).
- **Decisão**:
  - Handoff de contexto entre agentes prioriza sempre injeção direta de texto/código ou leitura de artefatos locais auditáveis (`scrape_repo.py`).
  - É proibido presumir que outro agente ou instância conseguirá ler URLs de terceiros sem tool call real auditável em sandbox com conectividade liberada.
  - Na impossibilidade de acesso, o agente deve registrar `claim: "not_executed"` em conformidade com o ADR-002.
