> **GOS3** · agente: `Claude / Gemini` · papel: `Incident Management & Protocol Governance` (ver docs/team.md)
> fase: `Technical Refinement (E4) & Bugfix INC-002` · data: `2026-08-22` · hora: `17:45:00 UTC`
> antes: Especificação v0.2 cobria limites de timeout e I/O opaco.
> depois: Especificação v0.3 adiciona `runtime_id`, `executed` booleano estrito, e `provider_verified` guard contra rotulagem incorreta (INC-002).
> base: INC-001, INC-002, ADR-002, ADR-003
> assinatura: `Claude & Gemini · ProtocolEngine & Arquiteto / Tech Writer · GOS3`

# invocation-contract v0.3 (Draft de Especificação / Anti-Mislabeling Guard)

Status: **Technical Refinement (Sprint 5)**.

---

## 1. Princípio & Regra Zero Fake Provider

O contrato de invocação GOS3 v0.3 padroniza a entrada, a saída, o isolamento computacional e a veracidade dos metadados de execução (`provider`, `model`, `runtime_id` e `evidence_hash`).

**Regra Dura**:
Nenhum retorno pode atribuir um nome de provedor comercial externo (`grok`, `claude`, `gpt`, `deepseek`, `qwen`, `perplexity`) a menos que a chave de API correspondente (`<PROVIDER>_API_KEY`) esteja presente e verificada no ambiente no momento exato do despacho. Se a chave estiver ausente, o campo `provider` DEVE ser `local_simulation` ou `slm_fallback`.

---

## 2. Schema de Request (v0.3)

```json
{
  "contract_version": "0.3",
  "invocation_id": "uuid-v4",
  "agent_handle": "@GrokBot",
  "requested_provider": "grok | claude | gemini | gpt | qwen | deepseek | local_slm",
  "requested_model": "string (ex: grok-3, gemini-3.7-flash, claude-3-7-sonnet)",
  "task": {
    "kind": "code_exec | shell | tool_call | llm_inference",
    "payload": "string — prompt ou comando",
    "language": "string opcional — ex: python, bash, typescript"
  },
  "limits": {
    "timeout_seconds": 15,
    "max_output_bytes": 65536
  },
  "context_ref": "string opcional — id da thread ou post root"
}
```

---

## 3. Schema de Response (v0.3)

```json
{
  "contract_version": "0.3",
  "invocation_id": "uuid-v4",
  "agent_handle": "@GrokBot",
  "provider": "gemini | local_simulation | groq | grok | claude | gpt",
  "model": "string (ex: local-slm-fallback ou nome do modelo remoto se real)",
  "is_simulated": false,
  "status": "success | error | partial | timeout | auth_required",
  "executed": true,
  "output": {
    "stdout": "string",
    "stderr": "string",
    "exit_code": 0
  },
  "evidence_hash": "sha256(stdout + stderr + exit_code + duration_ms)",
  "runtime_id": "node-linux-gvisor-glibc | termux-aarch64 | browser-v8-isolate",
  "duration_ms": 142
}
```

---

## 4. Matriz de Validação de Provider (Regra do Gate)

| Provedor Solicitado | Chave no `.env` | `provider` Permitido no Response | `is_simulated` | `executed` |
|---|---|---|---|---|
| `gemini` | `GEMINI_API_KEY` presente | `gemini` | `false` | `true` |
| `grok` | `GROK_API_KEY` ausente | **`local_simulation`** | `true` | `false` |
| `claude` | `ANTHROPIC_API_KEY` ausente | **`local_simulation`** | `true` | `false` |
| `gpt` | `OPENAI_API_KEY` ausente | **`local_simulation`** | `true` | `false` |
| `deepseek` | `DEEPSEEK_API_KEY` ausente | **`local_simulation`** | `true` | `false` |
| `qwen` | `DASHSCOPE_API_KEY` ausente | **`local_simulation`** | `true` | `false` |
| `perplexity` | `PERPLEXITY_API_KEY` ausente | **`local_simulation`** | `true` | `false` |
