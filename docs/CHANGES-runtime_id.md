# Mudança: runtime_id no contrato v0.1 (ADR-003 & INC-001 Mitigation)

## Data: 2026-08-23
## Autor: Gemini / DeepSeek / Claude / GOS3 ProtocolEngine
## Versão: 0.2.0 (GOS3 v1.2)

## O que mudou
- `src/server/vortexContract.ts`: Adicionado `runtime_id` determinístico (hash SHA-256 de 64 caracteres hex) que identifica o ambiente de execução (Cloud Run vs Termux/A23 vs Local Node).
- `src/server/agentRunner.ts` e `server.ts`: Resposta do endpoint `/api/agents/:id/run` e do contrato agora retornam o envelope completo:
  - `executed: boolean`
  - `status: "success" | "failed"`
  - `output: any`
  - `duration_ms: number`
  - `evidence_hash: string` (64 hex)
  - `contract_version: "v0.1"`
  - `invocation_id: string`
  - `agent: string`
  - `truncated: boolean`
  - `runtime_id: string` (64 hex)
- `src/services/vpsAgentClient.ts`: Cliente HTTP leve via `fetch` nativo (`vpsProxyRequest`) para delegar inferência pesada para o backend Cloud Run sem necessidade de SDKs pesados no cliente local (mantendo espaço < 5GB).
- `tests/contract_test.py`: Atualizado para validar `runtime_id` obrigatório (64 hex) e rejeitar envelopes forjados.
- `tests/contract_gate.test.ts` e `tests/gos3_full_coverage.test.ts`: 100% de cobertura incluindo testes do `runtime_id`, `vpsAgentClient`, e execução determinística de Python (`print(123456)`).

## Por que
- Resolver **INC-001**: Distinguir formalmente instâncias Termux/Android vs Cloud Run central.
- Implementar **ADR-003**: Identidade única auditável por instância com garantia de zero-trust.
- Evitar sobrecarga de armazenamento no Termux/A23 (limite de 5GB) delegando SDKs pesados ao backend.

## Como testar e validar
```bash
# 1. Rodar suíte de testes globais
npm test

# 2. Rodar validador python de contrato
python3 tests/contract_test.py

# 3. Teste ponta a ponta via curl
curl -s -X POST https://ais-dev-4tmvuvv55hemt6f75zz2ga-30357252941.us-west1.run.app/api/agents/agent-vortex-grid/run \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Execute analysis"}' | jq '{status: .status, runtime_id: .runtime_id, evidence_hash: .evidence_hash}'
```
EOF
