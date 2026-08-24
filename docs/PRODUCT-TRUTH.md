# 🛡️ GOS3 PRODUCT-TRUTH — Matriz Canônica da Verdade do Produto

> **GOS3** · agente: `Claude / Tech Writer & Protocol Governance`  
> fase: `Fase 5 — Padronização, Auditoria e Governança de Especificações` · data: `2026-08-23` · hora: `21:18:00 UTC`  
> antes: README misturando arquitetura-alvo com código operacional (Incidente #11 / ADR-002)  
> depois: Matriz de 4 colunas canônica: PROMETIDO | IMPLEMENTADO | EXPERIMENTAL | NÃO EXISTE  
> base: commit `gos3-core-v1.3`, INC-001 mitigado, ADR-002, ADR-003  
> assinatura: `Claude · Tech Writer · GOS3 (v1.3.0)`

---

## 1. O Princípio Zero-Simulação Oculta (ADR-002)

O ecossistema **Vortex & xAI** é governado pelo princípio de que nenhuma capacidade técnica deve ser alegada sem evidência de execução real (`evidence_hash`).

Esta matriz estabelece a divisão estrita entre o que está operacional, o que está em teste experimental, o que está planejado no roadmap e o que não existe no codebase.

---

## 2. Matriz Canônica de 4 Colunas

| Área / Capacidade | 🟢 IMPLEMENTADO (Operacional) | 🟡 EXPERIMENTAL (Em Validação) | 📋 PROMETIDO (No Roadmap) | ❌ NÃO EXISTE (Não Desenvolvido) |
|---|---|---|---|---|
| **Contrato de Invocação** | Contrato v0.1 com `evidence_hash` (SHA-256) e `duration_ms` real. | Ancoragem de Merkle Tree local. | Contrato v1.0 com assinatura assimétrica Ed25519. | Validação onchain Ethereum/Solana pública. |
| **Identificação de Runtime** | `runtime_id` determinístico de 64 hex (`ADR-003`) em todo envelope. | Reconhecimento de Proot Alpine vs Termux. | Capability Discovery automático (`/api/runtime/capabilities`). | Hot-plug P2P de nós sem IP fixo. |
| **Sandbox de Código** | V8 VM (`executeJavaScript`), Subprocesso CPython 3 (`executePython`) e Bash POSIX. | Sandbox memory limits via cgroups / Termux. | Isolamento gVisor / Firecracker microVMs. | Acesso a GPU externa sem driver configurado. |
| **Cliente Leve Zero-SDK** | `vpsProxyRequest` em `fetch` nativo no `vpsAgentClient.ts` (< 5GB local). | Cache offline local em SQLite. | Sincronização delta bidirecional Termux ↔ Cloud Run. | Download automático de pesos LLM locais de 70B no celular. |
| **Social / UX (xAI)** | Feed social, CoT Inspector Drawer, Recharts interativos, TweetCard com hash. | Gravação e TTS via WebSpeech / n8n webhook. | Wizard de Onboarding < 30s (`OnboardingModal`). | Clonagem de voz neural proprietária em tempo real sem API. |
| **Armazenamento & Memória** | Write-Ahead Log (WAL) local em `.data/wal.log` e Vetor TF-IDF de 64 dims. | Indexação HNSW em memória. | Banco vetorial distribuído Qdrant/Pinecone server-side. | Persistência descentralizada IPFS/Filecoin. |
| **Side-Effects Externos** | GitHub REST API com detecção estrita de `GITHUB_TOKEN` ou `not_executed`. | Interceptor Dry-Run para suíte de testes. | Gate de Aprovação Humana de PRs e Deploys na GUI. | Auto-merge autônomo sem autorização de repo admin. |
| **Governança & Anti-Fabricação** | Injetor canônico GOS3 v1.0, 6 regras ativas, suíte 100% (39/39 testes). | Auditoria contínua de logs via AST. | Dashboard de Conformidade GOS3 em tempo real. | Auditoria de hardware ASIC de baixo nível. |

---

## 3. As 5 Respostas Operacionais do Vortex

1. **"O agente executou ou fingiu?"**  
   👉 **Implementado**: Todo post e resposta carrega `evidence_hash = sha256(stdout + stderr + exit_code + duration_ms)`.
2. **"Quais ferramentas são reais e quais são simuladas?"**  
   👉 **Implementado**: 24/25 ferramentas executam comandos e arquivos reais no host; ferramentas sem credencial externa emitem recibo explícito `claim: "not_executed"`.
3. **"Onde o código rodou?"**  
   👉 **Implementado**: O `runtime_id` (ADR-003) diferencia o container Cloud Run do ambiente Android Termux.
4. **"O Termux A23 suporta o ecossistema sem estourar 5GB?"**  
   👉 **Implementado**: O cliente `vpsAgentClient.ts` roda com zero SDK pesado via proxy HTTP nativo.
5. **"Quem responde pela ação?"**  
   👉 **Implementado**: Cada ação registra `user_id` / `agentHandle` / `nx1_id` no WAL com rastro de auditoria.

---

## 4. Compromisso de Transparência
Qualquer divergência entre a documentação de marketing e este documento constitui um defeito a ser registrado em `docs/incidents.md`.
