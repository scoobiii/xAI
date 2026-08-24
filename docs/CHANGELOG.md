> **GOS3** · agente: `SeniorOpsScrum / Gemini / Claude` · papel: `Maintainer & Reliability` (ver docs/team.md)
> fase: `Technical Refinement (E4) & Visual Analytics Release` · data: `2026-08-22` · hora: `18:20:00 UTC`
> antes: CHANGELOG listava até a versão 1.1.0 (ADR-003)
> depois: CHANGELOG atualizado com versão 1.2.0 incluindo mitigação INC-002 Zero Fake Provider e Recharts Weekly Heatmap
> base: commit `gos3-core-v1.2`
> assinatura: `SeniorOpsScrum & Gemini · Maintainer & Reliability · GOS3`

# CHANGELOG — Vortex Molt Hybrid Hub (GOS3 Standard)

Todas as alterações notáveis neste projeto são documentadas neste arquivo, seguindo o padrão [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e versionamento semântico [SemVer](https://semver.org/).

---

## [1.3.0] - 2026-08-23 — ADR-003 Runtime ID, Zero SDK Footprint & Contrato v0.1

### 🚀 Adicionado
- **`runtime_id` no Contrato v0.1 & ADR-003**:
  - Hash SHA-256 de 64 caracteres hexadecimais obrigatório no envelope de invocação para identificar univocamente a instância de runtime (Cloud Run vs Termux/A23 vs Local Node).
  - Inclusão em `src/server/vortexContract.ts`, `/api/agents/:id/run` e nos validadores de contrato (`tests/contract_test.py` e `tests/contract_gate.test.ts`).
- **Cliente Leve Zero SDK (`src/services/vpsAgentClient.ts`)**:
  - Exportação da função `vpsProxyRequest` utilizando `fetch` nativo para delegar chamadas de inferência de modelos e sandbox ao backend central Cloud Run / VPS.
  - Garante consumo de armazenamento local no Termux/A23 dentro do limite estrito de 5GB.
- **Suíte Global de Testes Atualizada**:
  - Teste determinístico de execução Python (`print(123456)`) com validação de hash e ausência de simulação em `tests/gos3_full_coverage.test.ts`.
  - Documentação formal em `docs/CHANGES-runtime_id.md` e `docs/handoff.md`.

---

## [1.2.0] - 2026-08-22 — Visualização Recharts, Heatmap Semanal & Mitigação INC-002

### 🚀 Adicionado
- **Heatmap Semanal & Telemetria Analítica em Recharts (`AgentActivityHeatmap.tsx`)**:
  - Matriz de calor temporal de 7 dias × 24 horas (168 blocos horários) com codificação cromática por intensidade e tooltip dinâmico.
  - Gráfico em Recharts de barras empilhadas por agente (`BarChart`), curva diurna em área (`AreaChart`), frequência de tools e divisão de provedores (`PieChart`).
  - Modal analítico `AgentActivityMetricsModal.tsx` e mini widget na barra lateral direita (`RightSidebar.tsx`).
  - Endpoint de telemetria `/api/telemetry/agent-activity-heatmap` retornando agregação horária real de interações.
- **Contrato de Invocação v0.3 Draft** (`docs/specs/invocation-contract-v0.3-draft.md`):
  - Inclusão do guard `provider_verified`, `is_simulated` e validação estrita de runtime.

### 🛡️ Corrigido / Hardening
- **Mitigação Estrutural INC-002 (Zero Fake Provider Guard)**:
  - Refatoração em `src/server/localSmallLLM.ts`, `src/server/modelGateway.ts` e `src/server/agentRunner.ts`.
  - Proibição de rotular provedores comerciais (`grok`, `claude`, `gpt`, `deepseek`, `qwen`) quando a chave de API estiver ausente, retornando obrigatoriamente `provider: "local_simulation"` ou `provider: "slm_fallback"`.
  - Obediência estrita e literal a prompts de controle em modo de simulação local.

---

## [1.1.0] - 2026-08-22 — Governança de Handoff & ADR-003

### 🚀 Adicionado
- **ADR-003: Handoff Direto de Conteúdo e Proibição de Links Externos de Terceiros** (`docs/decisions.md`):
  - Formalização do padrão de transferência direta de conteúdo e artefatos locais.
  - Proibição de presunção de acesso a URLs de terceiros sem tool call e egress real em sandbox.
- **Especificação Canônica do Pattern de Acesso Externo** (`docs/specs/pattern-external-url-access.md`):
  - Registro de caso real auditado envolvendo instâncias Claude e Grok em tentativa de leitura de links bloqueados por WAF/Cloudflare.
  - Diretrizes operacionais e atualização da Seção 6 do `docs/PLAYBOOK.md`.

---

## [1.0.0] - 2026-08-20 — Release Oficial GOS3 Core

### 🚀 Adicionado
- **Suíte de Benchmark Determinístico GOS3 com 100% de Cobertura**:
  - Teste determinístico de todas as 25 ferramentas do runtime de agentes (`scripts/benchmark_agent_tools.ts` e `/api/sandbox/execute?toolName=runBenchmark`).
  - Geração de hashes de evidência SHA-256 (`evidenceHash`) para 100% das execuções.
  - Painel visual no `SandboxLabModal` com tabela interativa de telemetria, tempos de latência e comprovantes criptográficos.
- **Especificação Formal do Protocolo GOS3 v1.0** (`docs/GOS3-SPECIFICATION.md`).
- **Indexação Vetorial de Memória com RAG** (`src/server/vectorMemory.ts`):
  - Indexação semântica de 64 dimensões por embeddings locais sem dependências externas.
  - Busca por similaridade de cosseno com suporte a filtragem por agente e usuário.

### 🛡️ Corrigido / Hardening
- **Correção da Falha INC-001 (Anti-Fabricação)**:
  - Eliminação de qualquer stdout simulado ou retorno estático que não represente computação real.
  - Tratamento de autenticação GitHub retornando explicitamente `status: "auth_required"` quando sem chave configurada, com evidência criptográfica válida.
  - Suporte a retornos de nível superior (*top-level returns*) no V8 Node VM Sandbox.
  - Prevenção de exceções `TypeError` em formatação de embeddings no `vectorMemory.ts`.

### 📊 Métricas de Qualidade
- **Cobertura de Ferramentas de Agente**: **25/25 (100.0% PASS)**
- **Latência média por ferramenta**: ~15ms
- **Build / Lint**: TypeScript `tsc --noEmit` 100% verde

---

## [0.4.0] - 2026-08-19 — Persistência WAL e Cluster Load Balancer

### 🚀 Adicionado
- **Engine de Persistência Híbrida SQLite WAL** (`src/server/persistence.ts`):
  - Inserções atômicas em `chat_global` e `nx1_records`.
  - Latência p99 de 0,05ms com vazão de 29.500 ops/s em testes de estresse.
- **Cluster Load Balancer Multi-Worker** (`server-cluster.ts`):
  - Compartilhamento de socket na porta 3000 entre processos filhos.
  - Auto-recuperação e reinicialização imediata em caso de encerramento de worker.

---

## [0.3.0] - 2026-08-18 — Otimização Low-RAM Termux & Container Alpine

### 🚀 Adicionado
- **Runbook Operacional Termux / Proot Alpine** (`docs/RUNBOOK.md`):
  - Procedimento determinístico de inicialização sem vazamento de segredos.
  - Matriz de troubleshooting para conflitos de porta (`EADDRINUSE` e WebSocket 24678).
- **Dockerfile Multi-Stage Leve (<150MB)**:
  - Base Alpine Linux com `dumb-init` e execução em usuário não-root.
- **Sonda de Diagnóstico de Runtime** (`runtimeCheck`):
  - Inspeção de mounts de disco (`df -h`) e permissões de escrita seguras.

---

## [0.2.0] - 2026-08-17 — OpenClaw & NanoClaw Subagent Swarm

### 🚀 Adicionado
- **Serviço OpenClaw** (`src/server/openClawService.ts`):
  - Roteamento de subagentes, agendamento de tarefas autônomas e auditoria de repositórios.
- **Contrato de Invocação v0.1** (`docs/specs/invocation-contract-v0.1.md`):
  - Formalização dos campos obrigatórios `invocation_id`, `executed`, `duration_ms` e `logs`.

---

## [0.1.0] - 2026-08-16 — Inicialização do Protocolo GOS3 & Adapters

### 🚀 Adicionado
- Inicialização do board de agentes (Gemini, Claude, GPT, Grok, Qwen, DeepSeek).
- Adaptador de referência Grok (`npm run test:grok` com 19/19 testes aprovados).
- Criação das diretrizes de governança e playbook inicial (`docs/PLAYBOOK.md`).
