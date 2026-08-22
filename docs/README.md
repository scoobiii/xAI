> **GOS3** · agente: `SeniorOpsScrum / Claude / Gemini` · papel: `Lead Architect & Documentation Master` (ver docs/team.md)
> fase: `Technical Refinement (E4) & Visual Analytics Release` · data: `2026-08-22` · hora: `18:50:00 UTC`
> antes: Índice de documentação sem referências a decisions.md, incidents.md e specs v0.3
> depois: Índice geral completo e versionado no padrão GOS3 v1.2 com links diretos a todos os artefatos
> base: commit `gos3-core-v1.2`
> assinatura: `SeniorOpsScrum & Gemini · Documentation Master · GOS3`

# Vortex / Molt Hybrid Hub — Documentação & Histórico (GOS3 v1.2)

Este diretório armazena todo o repositório documental, especificações do protocolo GOS3, histórico de conversações, auditorias de telemetria e runbooks operacionais.

---

## 📂 Estrutura Canônica de Documentos

```
docs/
├── README.md                                  # Este índice geral e guia de navegação
├── GOS3-SPECIFICATION.md                      # Especificação Formal do Protocolo GOS3 v1.0 / v1.2
├── CHANGELOG.md                               # Histórico completo de versões (v1.0.0, v1.1.0, v1.2.0)
├── PLAYBOOK.md                                # Regras, convenções e merge gates do time NxN
├── RUNBOOK.md                                 # Runbook de Inicialização Segura (Termux / Alpine / Docker)
├── BACKLOG.md                                 # Backlog e status dos sprints (Sprints 1 a 5 Concluídos)
├── team.md                                    # Mapa oficial dos Agentes GOS3 e Runtime References
├── decisions.md                               # Registro de Decisões Arquiteturais (ADR-001, ADR-002, ADR-003)
├── incidents.md                               # Post-mortems e auditorias (INC-001 Anti-Fabricação, INC-002 Zero Fake Provider)
├── SWOT-UX-GUI.md                             # Auditoria SWOT de Engenharia e Nota de Resiliência (3,0 / 3,0)
├── conversations/                             # Registros completos e transcrições de auditorias
│   ├── 01-auditoria-sandbox-telemetria.md     # Diagnóstico de mocks vs execução real e bug fix
│   ├── 02-grok-gpt4o-runtime-inspection.md    # Auditoria de telemetria de hardware e runtime
│   └── 03-vortex-dump-gos3-sprints.md         # Snapshot e dump do repositório vortex
├── specs/                                     # Especificações técnicas e contratos de invocação
│   ├── invocation-contract-v0.1.md            # Especificação v0.1 implementada
│   ├── invocation-contract-v0.2-draft.md      # Proposta v0.2 de timeout e IO
│   ├── invocation-contract-v0.3-draft.md      # Proposta v0.3 com Zero Fake Provider Guard
│   ├── pattern-external-url-access.md         # Diretriz de handoff canônico e bloqueio de links de terceiros
│   └── system-instruction-anti-fabricacao-v1.0.md # Bloco canônico unificado anti-fabricação
└── attachments/                               # Registro de anexos, diagramas e screenshots
    ├── Screenshot_20260816_232129_Chrome.md   # Registro e análise do screenshot da UI
    └── use-vortex-cover.md                    # Manifesto e capa USE VORTEX!
```

---

## 🛡️ Princípios Inegociáveis (GOS3 Standard)

1. **Hash + Tempo + Log**: Nenhuma alegação de execução sem recibo de processo real (`exit_code`, `stdout_raw`, SHA-256 `evidenceHash`).
2. **Zero Simulação Oculta & Zero Fake Provider**: Falhas de infraestrutura, ausência de credenciais ou simulações locais reportam categoricamente `status: "auth_required"`, `claim: "not_executed"` ou `provider: "local_simulation"`.
3. **Isolamento Nx1 + Estado NxN**: Cada agente roda no seu próprio runtime confinado (V8 VM / subprocesso dedicado) com pipes auditáveis e persistência atômica SQLite WAL.


