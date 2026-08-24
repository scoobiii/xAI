> **GOS3** · agente: `GPT / Claude / Gemini` · papel: `Maintainer / Protocol Governance` (ver docs/team.md)
> fase: `Technical Refinement (E4) & Visual Analytics Release` · data: `2026-08-22` · hora: `18:15:00 UTC`
> antes: Backlog com pendências do Sprint 5 em aberto
> depois: Backlog atualizado com Sprint 5 100% concluído (mitigação INC-002, contrato v0.3 e visualização Recharts)
> base: commit `gos3-core-v1.1`, INC-002, ADR-003
> assinatura: `GOS3 Maintainer & Protocol Governance · GOS3`

# BACKLOG — Vortex / GOS3 (v1.1.0 Oficial)

## Fase Atual
**GOS3 v1.1 Refinement & Analytics** — Governança, Anti-Fabricação Estrutural, Handoff Canônico e Visualização Recharts

---

## Sprint 1 — Runtime Reference (Grok) — [CONCLUÍDO]
- [x] Criar `specs/invocation-contract.md` v0.1
- [x] Entregar adaptador Grok (`src/agents/grok/`)
- [x] Campo `executed: true/false` obrigatório
- [x] Testes de conformidade básicos (19/19 passed em Node v20.20.2)
- [x] Documentar handoff do adaptador
- [x] Marcar Grok oficialmente no board

---

## Sprint 2 — Generalização e Hardening de Subprocessos — [CONCLUÍDO]
- [x] Infra mínima para rodar TypeScript: `package.json` + `tsconfig.json` na raiz
- [x] **#ISSUE-sandbox-subprocesses-fix**: Correção de shadowing em `process` e implementação de `killSignal: "SIGKILL"` explícito
- [x] **#ISSUE-no-mock-fallback**: Ausência de chave reporta `claim: "not_executed"` sem gerar mocks
- [x] **#ISSUE-fechar-brecha-tipo**: Validação estrita de contratos de entrada e saída
- [x] **#ISSUE-verificar-executed**: Teste que prova que `executed: true` corresponde a computação real com hash SHA-256 e side-effect comprovado
- [x] **#ISSUE-extrair-template**: Template base de agentes autônomos
- [x] **#ISSUE-onboarding-doc**: Diretrizes de plug-in de novos modelos

---

## Sprint 3 — Persistência WAL e Cluster Load Balancer — [CONCLUÍDO]
- [x] Inserções atômicas SQLite WAL para `chat_global` e `nx1_records` (`src/server/persistence.ts`)
- [x] Cluster Load Balancer multi-worker na porta 3000 (`server-cluster.ts`)
- [x] Suíte de testes de estresse (5.000 ops com vazão de 29.500 ops/s)
- [x] Dockerfile multi-stage Alpine (<150MB) com non-root user e dumb-init
- [x] Runbook determinístico para Termux/Proot Alpine (`docs/RUNBOOK.md`)

---

## Sprint 4 — Suíte de Benchmark Determinístico GOS3 (100% Cobertura) — [CONCLUÍDO]
- [x] Auditoria e mitigação do defeito INC-001 (eliminação de qualquer retorno simulado)
- [x] Implementação da suíte de teste das **25 ferramentas de agente** (`scripts/benchmark_agent_tools.ts`)
- [x] Validação de 100% das ferramentas com hashes SHA-256 de prova (`evidenceHash`)
- [x] Integração da aba "Agent Tools Benchmark (100% Cobertura)" no `SandboxLabModal.tsx`
- [x] RAG e Memória Vetorial Semântica (`src/server/vectorMemory.ts`) com busca por cosseno L2
- [x] Endpoint unificado `/api/sandbox/execute?toolName=runBenchmark`

---

## Sprint 5 — Mitigação INC-002, ADR-003, Recharts Analytics & Governança v0.3 — [CONCLUÍDO]
- [x] **ADR-003**: Handoff Direto de Conteúdo e Proibição de Dependência de Links Externos (`docs/decisions.md` e `docs/specs/pattern-external-url-access.md`)
- [x] **INC-002 Registrado**: Post-mortem formalizado com evidência de código em `docs/incidents.md`
- [x] **#ISSUE-inc002-zero-fake-provider**: Refatoração estrutural em `src/server/localSmallLLM.ts`, `src/server/modelGateway.ts` e `src/server/agentRunner.ts` para setar `provider: "local_simulation"` ou `provider: "slm_fallback"` quando a chave de API externa não estiver presente
- [x] **#ISSUE-contract-v0.3-provider-guard**: Atualizar especificação do contrato de invocação para proibir rotulagem estática positiva sem chave presente em `process.env` (`docs/specs/invocation-contract-v0.3-draft.md`)
- [x] **#ISSUE-recharts-weekly-heatmap**: Componente de telemetria analítica com matriz 7x24, gráficos de área, barras empilhadas e divisão de tools (`src/components/telemetry/AgentActivityHeatmap.tsx` e `AgentActivityMetricsModal.tsx`)

---

## Sprint 6 — ADR-003 Runtime ID, Zero SDK Footprint & Contrato v0.1 — [CONCLUÍDO]
- [x] **ADR-003**: `runtime_id` de 64 hex obrigatório no envelope de invocação (`src/server/vortexContract.ts`)
- [x] **Zero SDK Footprint**: Implementação do `vpsAgentClient.ts` com `vpsProxyRequest` em fetch nativo para manter Termux sob limite de 5GB
- [x] **Contract v0.1 Envelope**: Atualização do endpoint `/api/agents/:id/run` e do envelope canônico
- [x] **Suíte de Testes 100%**: Inclusão de testes de `runtime_id`, `vpsAgentClient` e determinismo Python (`print(123456)`) em `tests/gos3_full_coverage.test.ts` e `tests/contract_test.py`
- [x] **Documentação & Handoff**: Criação de `docs/CHANGES-runtime_id.md` e `docs/handoff.md`

---

## Próximos Passos & Evolução (GOS3 v1.2+ Roadmap)
- [ ] Orquestração descentralizada P2P entre nós de agentes remotos
- [ ] Emissão e ancoragem periódica de árvores Merkle de execução em rede blockchain pública
- [ ] Monitoramento contínuo de drift semântico nos embeddings de memória vetorial
- [ ] Expansão de ferramentas de análise física para microredes e inversores híbridos grid-forming
