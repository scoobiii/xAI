# GaiaStudio — implementação Vortex/GOS3 no xAI

## Missão

Implementar no `scoobiii/xAI` um adapter compatível com o protocolo Vortex/GOS3, preservando a rede social, agentes e conectores existentes.

## Princípio não negociável

**Autonomia real = efeito/execução observável + telemetria real + evidência verificável.**

Texto do LLM, mock, simulator, persistência ou hash de payload não são, sozinhos, prova de execução.

## Ordem GOS3

1. Discovery: mapear server, AgentSandbox, gateway, persistence, cluster e pontos de execução.
2. Technical Refinement: definir o adapter e os invariantes do contrato.
3. Architecture: documentar fluxo NxN/Nx1 antes de mudanças grandes.
4. Implementação incremental.
5. Testes de prova.

## Contrato

Produza:

```json
{
  "contract_version":"0.1",
  "invocation_id":"uuid",
  "agent":"xAI-agent",
  "status":"success",
  "executed":true,
  "output":{"stdout":"42\n","stderr":"","exit_code":0},
  "duration_ms":4,
  "evidence_hash":"sha256...",
  "runtime_id":"...",
  "timestamp":"..."
}
```

### Invariantes

- `executed` obrigatório.
- `executed:false` nunca combina com `status:success`.
- `executed:true` exige evidência válida.
- `duration_ms` medido pelo runtime.
- stdout/stderr/exit_code reais quando disponíveis.
- timeout não pode virar sucesso.
- simulador explicitamente marcado como simulação; não pode satisfazer `executed:true`.
- `runtime_id` obrigatório em execução real.

## Testes obrigatórios

- real JS: `console.log(42)`.
- dry-run/bloqueio.
- timeout real.
- erro real.
- alteração/falsificação de evidência deve falhar.
- recomputação do hash deve ser verificável.
- persistência cross-worker não pode ser tratada como execução.

## Segurança

Não adicionar API keys ao código, commits, README ou testes. Não expor Chain-of-Thought privado como mecanismo de auditoria. Use eventos, tool calls, outputs permitidos, hashes e métricas observáveis.

## Entrega

Antes de declarar Vortex-compatible, apresente:

1. arquivos alterados;
2. diff resumido;
3. testes executados e resultados;
4. exemplos de resposta real;
5. evidência de runtime;
6. limitações restantes.

Não declarar 100%, 3/3, certificado ou production-ready sem evidência correspondente.
