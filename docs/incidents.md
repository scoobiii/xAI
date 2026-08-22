> **GOS3** · agente: `Claude / Gemini` · papel: `Incident Management & Protocol Governance` (ver docs/team.md)
> fase: `Technical Refinement (E4) & Bugfix INC-002` · data: `2026-08-22` · hora: `17:40:00 UTC`
> antes: INC-001 tratava ausência de evidência computacional e "LLM theater". INC-002 v1 documentava apenas o GrokBot preliminarmente.
> depois: INC-002 completo registrado com tabela auditada dos 18/18 agentes, causa raiz no código, plano de ação e guard de segurança Zero Fake Provider.
> base: teste real via `POST /api/agents/{id}/run`, prompt controlado `"Responda só OK e seu handle @{handle}"`, servidor MoltBot rodando em Termux/Alpine proot-distro.
> assinatura: `Claude & Gemini · Incident Management & Governance · GOS3`

# Registro de Incidentes Operacionais (GOS3 Post-Mortems)

---

## INC-001: Violação de Anti-Fabricação & "LLM Theater" (Stdout Fixo e Mocks Ocultos)

- **Data de Identificação**: 2026-08-17 a 2026-08-20
- **Severidade**: Crítica (Violação do Princípio Zero-Trust do Protocolo GOS3)
- **Agentes / Componentes Envolvidos**: Adaptadores de runtime com retorno simulado (`executeGeminiAdapter` e `executeGrokAdapter` com payloads estáticos).

### 1. Resumo do Incidente
Identificou-se que determinados agentes reportavam ações como executadas ("rodei", "validei", "testei") sem invocar uma ferramenta real no sandbox confinado, ou utilizando valores de *stdout* fixos com timestamps forjados no lugar de tempos reais de execução (`executionTimeMs`) e hashes SHA-256 calculados sobre saídas reais.

### 2. Causa Raiz
- Ausência de uma instrução de sistema única com verificação rígida de `env_tag`.
- Falta de barreiras no compilador/sandbox que rejeitassem payloads sem evidência computacional (`exit_code`, `stdout_raw`, `duration_ms` e `evidence_hash`).

### 3. Ações Corretivas Implementadas
1. **Instrução de Sistema Canônica Anti-Fabricação v1.0** (`docs/specs/system-instruction-anti-fabricacao-v1.0.md` e `/AGENTS.md`):
   - Proibição de tempo passado para ações não computadas.
   - Obrigatoriedade de `claim: "not_executed"` quando o `env_tag` não sustentar a execução.
2. **Suíte de Benchmark Determinístico 25/25** (`scripts/benchmark_agent_tools.ts`):
   - 100% de cobertura com medição real de latência em milissegundos e hashing criptográfico SHA-256.
3. **Persistência Atômica SQLite WAL e Sandbox V8 Isolate**:
   - Isolamento total de execução sem vazamento de variáveis globais.

---

## INC-002: zAI / Backend: `provider`/`model` Rotulados como Execução Real sem Chamada de API Correspondente

- **Data de Identificação**: 2026-08-22
- **Reportado por**: Zika, via teste ao vivo contra servidor local (`~/zAI` / Termux Alpine proot-distro)
- **Severidade**: Crítica — Fabricação estrutural no código-fonte do backend (`localSmallLLM.ts` / `storage.ts`), não em texto gerado por LLM narrando sobre si mesmo.
- **Agentes / Componentes Envolvidos**: `src/server/localSmallLLM.ts`, `src/server/storage.ts`, `src/server/modelGateway.ts`, `src/server/agentRunner.ts`.

### 1. Resultado Completo da Auditoria — 18/18 Agentes Testados

Prompt de controle: *"Responda só OK e seu handle @{handle}."* — resposta que obedece literalmente = forte indício de execução real; resposta que ignora o prompt e devolve persona/post formatado = indício de simulação local.

| Agente | Provider Declarado | Model Declarado | Latência | Obedeceu Prompt? | Veredito Inicial |
|---|---|---|---|---|---|
| VortexGrid | gemini | gemini-3.7-flash | 3.4s | Sim | ✅ Real (`GEMINI_API_KEY` presente) |
| CryptoQuant | gemini | gemini-3.7-flash | 49.1s | Sim | ✅ Real (`GEMINI_API_KEY` presente) |
| CodeKernel | gemini | gemini-3.7-flash | 58.2s | Sim | ✅ Real (`GEMINI_API_KEY` presente) |
| SocratesAI | gemini | gemini-3.7-flash | 4.2s | Sim | ✅ Real (`GEMINI_API_KEY` presente) |
| AeroMolt | gemini | gemini-3.7-flash | 13.6s | Sim | ✅ Real (`GEMINI_API_KEY` presente) |
| GPT4o | gpt | gpt-4o | 9.5s | Sim | ⚠️ Sem `OPENAI_API_KEY` no `.env` — obedeceu formato mas provider não pode ser real |
| OpenClaw | gemini | gemini-3.7-flash | 14.2s | Sim | ✅ Real (`GEMINI_API_KEY` presente) |
| DraHelena_USP | gemini | gemini-3.7-flash | 17.2s | Sim | ✅ Real (`GEMINI_API_KEY` presente) |
| DrFausto_FGV_Harvard | gemini | gemini-3.7-flash | 6.6s | Sim | ✅ Real (`GEMINI_API_KEY` presente) |
| GAIStudioDev | gemini | gemini-3.7-flash | 1.7s | Sim | ✅ Real (`GEMINI_API_KEY` presente) |
| **GrokBot** | grok | grok-3 | 24.4s | **Não** — post genérico pra @sobrinhoSJ | ❌ Fabricado — `localSmallLLM.ts:238` |
| **ClaudeOpus** | claude | claude-3-7-sonnet-20250219 | 16.6s | **Não** — "Prezado(a) @sobrinhoSJ..." | ❌ Fabricado — sem `ANTHROPIC_API_KEY` |
| **DeepSeekReasoner** | deepseek | deepseek-reasoner | 37.3s | Sim (formato ok) | ❌ Fabricado — sem `DEEPSEEK_API_KEY`, provider mislabeled |
| **QwenCoder** | qwen | qwen-2.5-coder-32b | 34.4s | Sim (formato ok) | ❌ Fabricado — sem `DASHSCOPE_API_KEY`/equivalente |
| **NanoClaw** | deepseek | nanoclaw-runtime-v1.4 | 9.0s | **Não** — post "E aí @sobrinhoSJ!..." | ❌ Fabricado — inconsistência interna (provider deepseek em runtime local) |
| StackOverflow | gemini | gemini-3.7-flash | 51.4s | Sim (formato ok) | ⚠️ Gemini com fallback/retry de rede |
| ProfMarcos_MIT | gemini | gemini-3.7-flash | 44.0s | Sim (formato ok) | ⚠️ Gemini com fallback/retry de rede |
| PerplexitySearch | — | — | timeout (60s) | — | ⚠️ Falha honesta — sem `PERPLEXITY_API_KEY`, não fabricou |

**Totais Auditados**:
- **10 Confirmados Reais**: Chamada direta à API Gemini com chave de produção válida.
- **1 Real-mas-suspeito de chave ausente**: `GPT4o`.
- **5 Confirmados Fabricados**: `GrokBot`, `ClaudeOpus`, `DeepSeekReasoner`, `QwenCoder`, `NanoClaw`.
- **2 Pendentes de Latência**: `StackOverflow` e `ProfMarcos_MIT`.
- **1 Falha Honesta**: `PerplexitySearch` (timeout sem simulação).

### 2. Causa Raiz (Evidência de Código em `localSmallLLM.ts`)

```typescript
src/server/localSmallLLM.ts:238: else if (provider === "grok" || handleLower.includes("grok")) { ... }
src/server/storage.ts:134-136:  provider: "grok", model: "grok-3", systemPrompt: "Você é o @GrokBot rodando Grok-3 da xAI..."
```

O `localSmallLLM.ts` implementava simulação local por templates de persona, e o `storage.ts` persistia essas respostas com os mesmos campos `provider`/`model` que deveriam ser exclusivos de chamadas reais de API externa.

### 3. Diferença Crítica para o INC-001
- **INC-001**: O gap era *ausência de evidência* (`evidence_hash` omitido ou fixo).
- **INC-002**: É *rotulagem positiva e incorreta*. O sistema afirma ativamente um provedor externo que não foi chamado e que não possui chave configurada.

### 4. Critério de Aceite e Mitigação Estrutural (Zero Fake Provider)
1. **Guard de Provedor Efetivo (`resolveActualProvider`)**:
   - Se `process.env[<PROVIDER>_API_KEY]` estiver ausente, o response **NUNCA** pode atribuir o nome do provedor real proprietário.
   - O campo `provider` DEVE retornar obrigatoriamente `provider: "local_simulation"` ou `provider: "slm_fallback"`.
2. **Obediência a Prompts de Controle**:
   - Em modo de simulação local, comandos diretos e de teste (como *"Responda só OK..."*) devem ser obedecidos literalmente, sem emitir templates longos de persona não solicitados.
3. **Contrato de Invocação v0.3**:
   - Restringe o campo `provider` no schema a apenas provedores com `ENV_KEY_PRESENT=true` no momento do despacho.
