> **GOS3** · agente: `SeniorOpsScrum / Claude` · papel: `Lead Architect & Documentation Master` (ver docs/team.md)
> fase: `fase 5 — padronização e governança de especificações` · data: `2026-08-20` · hora: `14:11:00 UTC`
> antes: Índice de documentação desatualizado com referências a arquivos ausentes
> depois: Índice geral completo e versionado no padrão GOS3 v1.0 com links diretos
> base: commit `gos3-core-v1.0`
> assinatura: `SeniorOpsScrum · Documentation Master · GOS3`

# Vortex / Molt Hybrid Hub — Documentação & Histórico (GOS3 v1.0)

Este diretório armazena todo o repositório documental, especificações do protocolo GOS3, histórico de conversações, auditorias de telemetria e runbooks operacionais.

---

## 📂 Estrutura Canônica de Documentos

```
docs/
├── README.md                                  # Este índice geral e guia de navegação
├── GOS3-SPECIFICATION.md                      # Especificação Formal do Protocolo GOS3 v1.0
├── CHANGELOG.md                               # Histórico completo de versões e notas de release
├── PLAYBOOK.md                                # Regras, convenções e merge gates do time NxN
├── RUNBOOK.md                                 # Runbook de Inicialização Segura (Termux / Alpine / Docker)
├── BACKLOG.md                                 # Backlog e status dos sprints (Sprints 1 a 4 Concluídos)
├── team.md                                    # Mapa oficial dos 6 Agentes GOS3 e Runtime References
├── SWOT-UX-GUI.md                             # Auditoria SWOT de Engenharia e Nota de Resiliência
├── conversations/                             # Registros completos e transcrições de auditorias
│   ├── 01-auditoria-sandbox-telemetria.md     # Diagnóstico de mocks vs execução real e bug fix
│   ├── 02-grok-gpt4o-runtime-inspection.md    # Auditoria de telemetria de hardware e runtime
│   └── 03-vortex-dump-gos3-sprints.md         # Snapshot e dump do repositório vortex
├── specs/                                     # Especificações técnicas e contratos de invocação
│   ├── invocation-contract-v0.1.md            # Especificação v0.1 implementada
│   └── invocation-contract-v0.2-draft.md      # Proposta v0.2 em refinamento técnico
└── attachments/                               # Registro de anexos, diagramas e screenshots
    ├── Screenshot_20260816_232129_Chrome.md   # Registro e análise do screenshot da UI
    └── use-vortex-cover.md                    # Manifesto e capa USE VORTEX!
```

---

## 🛡️ Princípios Inegociáveis (GOS3 Standard)

1. **Hash + Tempo + Log**: Nenhuma alegação de execução sem recibo de processo real (`exit_code`, `stdout_raw`, SHA-256 `evidenceHash`).
2. **Zero Simulação Oculta**: Falhas de infraestrutura ou ausência de credenciais reportam explicitamente `status: "auth_required"` ou `claim: "not_executed"`.
3. **Isolamento Nx1 + Estado NxN**: Cada agente roda no seu próprio runtime confinado (V8 VM / subprocesso dedicado) com pipes auditáveis e persistência atômica SQLite WAL.

