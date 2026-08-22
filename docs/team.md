> **GOS3** · agente: `SeniorOpsScrum / Claude / Gemini` · papel: `Lead Architect & Team Governance` (ver docs/team.md)
> fase: `Technical Refinement (E4) & Visual Analytics Release` · data: `2026-08-22` · hora: `18:25:00 UTC`
> antes: Mapeamento de 6 agentes oficiais básicos
> depois: Mapeamento completo dos Agentes Oficiais GOS3 e 18 personas do cluster auditadas (INC-002 e Zero Fake Provider)
> base: commit `gos3-core-v1.2`
> assinatura: `SeniorOpsScrum & Gemini · Team Governance · GOS3`

# Team — GOS3 (Gang of Seven + Ecosystem)

## Agentes Oficiais no Board (NxN - Estado Compartilhado & Persistência WAL)

| Agente | Papel Principal | Provedor / Runtime Target | Status GOS3 | Capacidades & Especialização |
|:---|:---|:---|:---:|:---|
| **Claude** | Arquiteto de Software & Formal Verifier | Anthropic Claude 3.7 Sonnet / Opus | **Ativo (100% Conformidade)** | Arquitetura de sistemas, geração de código, verificação estrita de tipos e documentação técnica. |
| **Gemini** | GOS3 Multimodal Engine & Search Grounding | Google Vertex AI / Gemini 3.7 Flash & Pro | **Ativo (100% Conformidade)** | Inferência multimodal, análise de imagens, grounding na web e orquestração de APIs em tempo real. |
| **GPT** | General Reasoner & Debates Orchestrator | OpenAI GPT-4o | **Ativo (100% Conformidade)** | Raciocínio lógico, mediação de debates dialéticos e orquestração de subagentes. |
| **Grok** | Runtime Reference & Market/Telemetry Auditor | xAI Grok 3 | **Ativo (100% Conformidade)** | Validação de sandbox, telemetria em tempo real e monitoramento de oráculos de mercado. |
| **Qwen** | Code Specialist & Energy Dispatch Optimizer | Alibaba Qwen 2.5 Coder 32B | **Ativo (100% Conformidade)** | Otimização de despacho de BESS/Solar, algoritmos numéricos de alta densidade e scripts Python. |
| **DeepSeek** | Formal Reasoning & Cryptographic Auditor | DeepSeek R1 / V3 | **Ativo (100% Conformidade)** | Verificação formal de contratos matemáticos, auditoria de hashes SHA-256 e análise de vulnerabilidades. |

---

## Runtime Reference & Sandbox (Nx1 - Execução Confinada por Invocação)

Todas as 25 ferramentas do catálogo GOS3 são executadas sob isolamento estrito com geração obrigatória de `evidenceHash` SHA-256:

| Componente | Mecanismo de Isolamento | Garantia Anti-Fabricação |
|:---|:---|:---|
| **Node.js Sandbox** | V8 VM Isolate com `vm.Script` e sandbox de escopo limpo | Captura de `stdout`/`stderr` e retorno estrito sem variáveis globais vazadas. |
| **Python Sandbox** | Processo filho dedicado com `killSignal: SIGKILL` e timeout | Execução determinística em subprocesso confinado. |
| **OpenClaw & NanoClaw**| Swarm de subagentes com roteamento de tarefas | Recibos imutáveis com carimbo de tempo e status verificável. |
| **Vector Memory RAG** | Indexação vetorial semântica de 64 dimensões | Persistência local em disco com recuperação atômica. |
| **Heatmap & Telemetria**| Recharts Temporal Analyzer 7x24 | Agregação horária de execuções com rastreabilidade de latência p95. |

---

### Regras de Ouro da Governança NxN:
1. **Nenhum agente retém privilégios de execução ocultos**: Toda ação gera log auditável no feed público.
2. **Interoperabilidade Total**: Agentes comunicam-se via contratos estritos JSON definidos em `docs/GOS3-SPECIFICATION.md`.
3. **Consenso Dialético**: Decisões arquiteturais passam por debate cruzado antes de serem consolidadas no repositório.
4. **Zero Fake Provider**: Se a chave de API proprietária do modelo não estiver presente no ambiente, a execução é categorizada honestamente como `local_simulation` ou `slm_fallback`.


