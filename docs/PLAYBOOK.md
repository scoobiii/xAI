> **GOS3** · agente: `SeniorOpsScrum / Claude / Gemini` · papel: `Lead Architect & Protocol Governance` (ver docs/team.md)
> fase: `Technical Refinement (E4) & Visual Analytics Release` · data: `2026-08-22` · hora: `18:30:00 UTC`
> antes: Playbook cobria até a regra 6 (ADR-003)
> depois: Playbook completo GOS3 v1.2 (Cabeçalhos, Anti-Fabricação, Zero Fake Provider INC-002, Merge Gates e ADR-003)
> base: commit `gos3-core-v1.2`
> assinatura: `SeniorOpsScrum & Gemini · Protocol Governance · GOS3`

# PLAYBOOK — Vortex / GOS3 Protocol Standards

Convenções de processo, engenharia e governança para o time NxN (qualquer agente ou humano que opere neste ecossistema).

---

## 1. Governança de Mudanças em Contrato & Segurança

Qualquer alteração em `docs/GOS3-SPECIFICATION.md`, em contratos de invocação ou em mecanismos de isolamento de execução/sandbox **nunca é merge automático**. Decisões que envolvam alteração no shape de dados, na geração de hashes ou no relaxamento de timeouts passam obrigatoriamente por verificação formal e consenso do time.

---

## 2. Cabeçalho GOS3 Obrigatório (GOS3 Header Metadata)

Todo arquivo criado ou editado por qualquer agente no ecossistema GOS3 **deve** conter o cabeçalho no topo:

```markdown
> **GOS3** · agente: `<nome>` · papel: `<papel>` (ver docs/team.md)
> fase: `<fase do backlog>` · data: `<AAAA-MM-DD>` · hora: `<HH:MM:SS TZ>`
> antes: <resumo de 1 linha do estado anterior>
> depois: <o que esta alteração entrega>
> base: commit `<hash>` (se aplicável)
> assinatura: `<nome do agente> · <papel> · GOS3`
```

---

## 3. Protocolo de Prova de Execução & Zero Fake Provider (Zero-Trust Anti-Fabricação)

- **Se executou**: capturar `exit_code`, `stdout_raw`, `executionTimeMs` e gerar `evidenceHash` (SHA-256).
- **Se não executou ou falhou**: retornar explicitamente `executed: false`, `success: false` e detalhes em `logs`.
- **Ausência de credencial de serviço externo**: retornar `status: "auth_required"` ou rotular o provedor honestamente como `provider: "local_simulation"` / `provider: "slm_fallback"`. **Jamais gerar texto estático que finja ser o provedor proprietário sem a chave correspondente presente (INC-002)**.
- **Obediência a Prompts de Controle**: Em modo de simulação, respeitar comandos literais e de teste sem despejar templates genéricos de persona.

---

## 4. Portabilidade de Runtime & Resiliência (Termux / Alpine / Docker)

1. **Separação de Cotas**: O diretório `~/zAI` dentro do Proot Alpine é um chroot isolado. Nunca use `df /` do Termux host como referência para quotas do container; utilize sempre a sonda `runtimeCheck`.
2. **Proteção de Segredos**: Nunca exponha chaves de API (`GEMINI_API_KEY`, tokens GitHub, etc.) em commits, logs públicos, READMEs ou comandos do terminal.
3. **Gerenciamento de Memória**: Ambientes Android/arm64 operam com watchdog de RSS (<450MB) e acionamento proativo de `global.gc()`.

---

## 5. Portão de Testes & Verificação Contínua (Merge Gates)

Antes de considerar qualquer entrega concluída, o agente deve executar os seguintes gates de validação:
1. **Linter / TypeScript**: `npx tsc --noEmit` (100% livre de erros de tipagem).
2. **Suite de Benchmark Determinístico**: `npx tsx scripts/benchmark_agent_tools.ts` (100% das 25 ferramentas com PASS e hashes gerados).
3. **Build de Produção**: `npm run build` compilando frontend estático e servidor Node.js.

---

## 6. Handoff de Conteúdo & Proibição de Dependência de Links Externos (ADR-003)

1. **Injeção Direta**: Conteúdo técnico (código, logs, especificações) deve ser colado diretamente na conversa/contexto.
2. **Dumps Locais**: Para arquivos volumosos, use dumps gerados localmente (`scripts/scrape_repo.py` ou arquivos de texto).
3. **URLs Externas e Bloqueios WAF**: Não presumir que links públicos de terceiros (`claude.ai/share`, etc.) são acessíveis por agentes. Sem tool call real em sandbox liberada, declare obrigatoriamente `claim: "not_executed"`.



