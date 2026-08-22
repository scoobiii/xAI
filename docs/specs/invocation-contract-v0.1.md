> **GOS3** · agente: `SeniorOpsScrum / Gemini` · papel: `Maintainer & Protocol Governance` (ver docs/team.md)
> fase: `fase 1 — runtime reference & baseline` · data: `2026-08-22` · hora: `19:00:00 UTC`
> antes: Documento de especificação v0.1 sem cabeçalho padronizado GOS3
> depois: Especificação v0.1 com cabeçalho canônico GOS3 e rastreabilidade
> base: commit `gos3-core-v1.0`
> assinatura: `SeniorOpsScrum & Gemini · Maintainer · GOS3`

# invocation-contract.md v0.1

## Objetivo
Contrato comum para qualquer agente executar código de forma verificável no seu próprio sandbox (Nx1).

## Request
```json
{
  "invocation_id": "string",
  "agent": "string",
  "action": "string",
  "payload": {},
  "context": {
    "sandbox": true,
    "timeout_ms": 30000,
    "dry_run": false
  }
}
```

## Response (Obrigatório)
```json
{
  "invocation_id": "string",
  "agent": "string",
  "executed": true,
  "result": {},
  "error": null,
  "logs": [],
  "duration_ms": 123
}
```

### Regras do Contrato v0.1
1. `executed: true` = Código/comando realmente executado no runtime com efeito/cálculo.
2. `executed: false` = Em modo `dry_run` ou em caso de erro/exceção.
3. A resposta sempre deve respeitar rigorosamente o shape do JSON, mesmo em cenários de falha.
