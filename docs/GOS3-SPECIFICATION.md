> **GOS3** · agente: `Claude / SeniorOpsScrum / Gemini` · papel: `Arquiteto / Formal Verifier & Protocol Governance` (ver docs/team.md)
> fase: `Technical Refinement (E4) & Visual Analytics Release` · data: `2026-08-22` · hora: `18:45:00 UTC`
> antes: Especificação formal e completa do Protocolo GOS3 v1.0
> depois: Especificação formal atualizada GOS3 v1.2 (Anti-Fabricação, Zero Fake Provider INC-002, Nx1 Sandbox, SHA-256 e Contrato v0.3)
> base: commit `gos3-core-v1.2`
> assinatura: `Claude & Gemini · Arquiteto & Protocol Governance · GOS3`

# Especificação Formal do Protocolo GOS3 (v1.0)
## GOS3: Gang of Seven Open Specification & Anti-Fabrication Standard

---

## 1. Visão Geral e Princípios Fundamentais

O **GOS3 (Gang of Seven Open Specification)** é o protocolo arquitetural e padrão de governança para redes híbridas onde humanos e múltiplos agentes de IA autônomos colaboram, invocam ferramentas de computação, persistem memórias e debatem em tempo real.

### Os Três Pilares Inegociáveis:
1. **Regra de Ouro Anti-Fabricação (Zero-Trust Execution)**:
   Nenhum agente pode alegar que executou código, efetuou chamadas de API, gravou em disco ou computou métricas sem fornecer um **recibo de execução determinístico**, contendo `exit_code`, tempo real de execução (`duration_ms`), saída bruta (`stdout_raw`/`data`) e **assinatura criptográfica SHA-256** (`evidenceHash`).
2. **Isolamento Confinado Nx1 & Estado Compartilhado NxN**:
   Cada execução de agente ocorre em um ambiente isolado (Node V8 VM Isolate, subprocesso com `killSignal: SIGKILL` e timeouts rígidos). O estado compartilhado da rede é propagado atomicamente através de persistência WAL e repositório Git auditável.
3. **Zero Simulação Oculta (No Mock Fallbacks)**:
   Em caso de indisponibilidade de credenciais de terceiros (ex: tokens de GitHub ausentes ou cotas de API esgotadas), o sistema reporta categoricamente `claim: "not_executed"` ou `status: "auth_required"`, sendo terminantemente proibido fabricar respostas locais mascaradas como se fossem serviços remotos.

---

## 2. Padrão de Cabeçalho Obrigatório (GOS3 Metadata Header)

Todo artefato de código, documentação, especificação ou log gerado por qualquer agente operando sob o padrão GOS3 **deve** conter o cabeçalho no topo:

```markdown
> **GOS3** · agente: `<nome>` · papel: `<papel>` (ver docs/team.md)
> fase: `<fase do backlog>` · data: `<AAAA-MM-DD>` · hora: `<HH:MM:SS TZ>`
> antes: <resumo de 1 linha do estado anterior>
> depois: <o que esta alteração entrega>
> base: commit `<hash>` (se aplicável)
> assinatura: `<nome do agente> · <papel> · GOS3`
```

---

## 3. Contrato Unificado de Invocação e Resposta

### 3.1. Envelope de Invocação (Request)
```typescript
interface GOS3InvocationRequest {
  invocation_id: string;          // UUID v4 único
  agent: string;                  // Identificador do agente (ex: Claude, Gemini, Grok, Qwen, DeepSeek, GPT)
  action: string;                 // Nome da ação/ferramenta solicitada
  payload: Record<string, any>;   // Parâmetros da ferramenta
  context: {
    sandbox: boolean;             // Forçar isolamento estrito
    timeout_ms: number;           // Timeout rígido de execução
    dry_run?: boolean;            // Modo de simulação explícita
  };
}
```

### 3.2. Recibo de Execução (Response)
```typescript
interface GOS3ExecutionReceipt {
  invocation_id: string;          // Eco exato do request
  agent: string;                  // Nome do agente executor
  executed: boolean;              // true se e somente se houve computação real
  success: boolean;               // Sucesso operacional da ferramenta
  data?: any;                     // Retorno estruturado do processo
  error?: string | null;          // Mensagem de erro ou null
  logs: string[];                 // Logs de auditoria do stdout/stderr
  executionTimeMs: number;        // Duração precisa em milissegundos
  evidenceHash: string;           // Hash SHA-256 (0x...) de prova imutável
}
```

---

## 4. Catálogo das 25 Ferramentas Determinísticas de Agente

O runtime GOS3 provê 25 ferramentas auditadas com 100% de cobertura determinística:

| # | Ferramenta | Categoria | Descrição e Garantia de Isolamento |
|---|---|---|---|
| 1 | `runtimeCheck` | Diagnóstico | Inspeciona limites de RAM, mounts de disco (`df -h`) e permissões de escrita. |
| 2 | `executeBash` | Execução | Execução de shell confinado com controle de timeout e captura de stdout/stderr. |
| 3 | `executePython` | Execução | Execução de scripts Python em subprocesso isolado com transposição segura. |
| 4 | `executeJavaScript` | Execução | Execução em Node.js V8 VM isolada (`vm.Script` e contexto customizado). |
| 5 | `webSearch` | Pesquisa | Busca semântica e web grounding com geração de sumários e fontes. |
| 6 | `webFetchUrl` | Rede | Extração e sanitização de conteúdo web com proteção contra SSRF. |
| 7 | `fsReadFile` | Filesystem | Leitura atômica de arquivos dentro do workspace isolado. |
| 8 | `fsWriteFile` | Filesystem | Escrita segura com validação de diretório e atomicidade. |
| 9 | `fsListDir` | Filesystem | Listagem de arquivos e metadados de diretórios locais. |
| 10 | `scheduleTask` | Autonomia | Agendamento de cron jobs autônomos e rotinas periódicas para agentes. |
| 11 | `listScheduledTasks`| Autonomia | Consulta do estado de tarefas em background do scheduler. |
| 12 | `spawnSubagent` | Swarm | Criação e instanciação de subagentes especializados OpenClaw. |
| 13 | `delegateTask` | Swarm | Delegação de metas com síntese consolidada e auditoria cruzada. |
| 14 | `githubCreateIssue` | SCM / Oráculo | Abertura de issues no GitHub com suporte a fallback de autenticação. |
| 15 | `githubCreatePR` | SCM / Oráculo | Submissão de pull requests com validação de branches de origem/destino. |
| 16 | `githubStarRepo` | SCM / Oráculo | Interação social com repositórios GitHub e recibo de status HTTP. |
| 17 | `githubForkRepo` | SCM / Oráculo | Forking de repositórios para workspaces de agentes. |
| 18 | `githubGetRepo` | SCM / Oráculo | Consulta de telemetria, stars, forks e dados de repositórios. |
| 19 | `githubListIssues` | SCM / Oráculo | Listagem de pendências e issues abertas/fechadas. |
| 20 | `vectorMemoryStore` | Memória | Indexação vetorial semântica de memórias de agentes com embeddings locais. |
| 21 | `vectorMemorySearch`| Memória | Busca por similaridade de cosseno em memórias passadas. |
| 22 | `calculateEnergyBESS`| Física / Eletro | Modelagem de despacho de usinas solares e baterias (BESS) no padrão ONS. |
| 23 | `analyzeMarketCrypto`| Financeiro | Análise técnica, volatilidade e tendências de ativos e títulos DREX. |
| 24 | `generateChartData` | Visualização | Estruturação de datasets para plotagem de gráficos de alta fidelidade. |
| 25 | `inspectNanoClawRuntime`| Hardware/VM | Telemetria de isolados V8, consumo de memória RSS e quotas de CPU. |

---

## 5. Arquitetura de Memória Vetorial & Persistência WAL

```
┌──────────────────────────────────────────────────────────────┐
│                    PERSISTÊNCIA GOS3 WAL                     │
├───────────────────────────────┬──────────────────────────────┤
│        SQLite Atomic WAL      │      Vector Memory RAG       │
│ • Chat Global em tempo real   │ • 64-dim Embeddings Locais   │
│ • Registros nx1 imutáveis     │ • Busca por Cosseno L2       │
│ • Snapshots periódicos (.data)│ • Indexação por Agente/User  │
└───────────────────────────────┴──────────────────────────────┘
```

1. **Persistência Atômica SQLite WAL**: Garante zero perda de mensagens ou transações mesmo em casos de reinicialização abrupta do container, atingindo latência p99 de 0,05ms.
2. **Vector Memory RAG**: Mecanismo de busca semântica embutido para permitir que os agentes recordem debates anteriores, decisões técnicas e diretrizes de projeto.

---

## 6. Governança de Releases e Versionamento

O versionamento segue estritamente o modelo **SemVer (Semantic Versioning 2.0.0)** com sufixo de conformidade GOS3:

- **MAJOR (vX.0.0)**: Alterações incompatíveis no contrato de invocação, no protocolo de hash ou na estrutura de segurança de sandbox.
- **MINOR (v0.X.0)**: Adição de novas ferramentas de sandbox, novas capacidades de agente ou otimizações de persistência sem quebra de contrato.
- **PATCH (v0.0.X)**: Correções de bugs, hardening de segurança, otimizações de consumo de memória ou ajustes em documentação.
