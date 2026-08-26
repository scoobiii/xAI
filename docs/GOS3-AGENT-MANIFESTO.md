> **GOS3** · agente: `gpt` · papel: `Auditor / Connector Safety`
> fase: `hardening — anti-fabrication connector gate` · data: `2026-08-25`
> antes: manifesto definia connector ownership, mas não um gate explícito contra catálogo declarativo
> depois: connector claims bloqueados até prova host-owned comportamental
> base: tests/gos3_connector_claims.test.sh
> assinatura: `GPT · Auditor · GOS3`

# GOS3 Agent Manifesto — Universal Agent Operating & Safety Protocol

**Status:** REQUIRED / FAIL-CLOSED  
**Scope:** every new and existing agent operating through Vortex/GOS3/xAI  
**Version:** 1.2

## 1. Core rule

An agent is **not operationally ready because it claims to have tools**. It becomes `TOOLING_READY` only after it proves, in the runtime where it will work, that it can:

1. enter the approved sandbox runtime;
2. execute a harmless deterministic program inside the sandbox;
3. invoke an approved tool through the runtime/tool surface;
4. receive and retain an execution/evidence receipt;
5. report failures honestly and stop when a required capability is unavailable;
6. operate Git through the GOS3 concurrency protocol without force-push or direct `main` publication;
7. prove every assigned external connector behaviorally in the host that actually owns that connector.

A model/provider identity alone is never evidence of capability.

## 2. Required capability proof

Every agent onboarding MUST produce a capability receipt containing:

| Capability | Required | Minimum proof |
|---|---:|---|
| Sandbox JavaScript runtime | YES | execute harmless JS and receive success + evidence hash |
| Sandbox Python/simulation runtime | YES | execute harmless Python/sim program and receive success + evidence hash |
| Runtime tool invocation | YES | invoke an approved deterministic tool and receive evidence |
| Vercel Sandbox provider | when assigned | real `sandbox run` execution + execution/evidence IDs |
| Tool discovery / MCP | YES when assigned | tools/list + harmless read, owned by host connector |
| Git | YES | status + fetch + second fetch + rebase protocol |
| GitHub connector/API | YES for GitHub work | authenticated harmless repository read + host evidence |
| Network/X connector | YES when assigned | host-owned connector proof; never fake it locally |
| Own identity/provenance | YES | agent ID + execution ID + evidence ID |

## 3. Fail-closed onboarding

The following states are authoritative:

- `TOOLING_READY`: all capabilities required for the assigned role have real evidence.
- `BLOCKED`: at least one required capability has no proof, failed, or expired proof.
- `EXCEPTION`: a human/PO explicitly authorizes a bounded exception; the exception must be recorded and cannot weaken `main` safety.

`BLOCKED` agents MUST NOT receive consequential write capabilities.

## 4. Proof is behavioral, not declarative

The onboarding gate MUST NOT accept:

- a README claiming that a sandbox exists;
- a provider/model name as proof of a tool;
- a local environment variable as proof of connector access;
- a mocked tool result as proof of execution;
- an `executed=true` flag without execution evidence;
- a static connector catalog entry such as `isConnected: true` as proof of a live connection;
- a hardcoded account identity or timestamp as proof of current authentication.

The proof must originate from the actual runtime/tool invocation and include an evidence hash or equivalent immutable receipt.

## 5. Vortex runtime contract

Vortex is the execution/runtime layer for GOS3 agents. The xAI repository must keep this manifesto and its onboarding gate synchronized with the runtime implementation.

Canonical local proof commands:

```bash
npm run gos3:agent:proof -- <agent-id>
npm run gos3:vercel:sandbox -- <agent-id>   # when Vercel Sandbox is the assigned provider
npm run gos3:connector-claims
```

The repository proof exercises the real Vortex sandbox implementation, not a fake provider. It covers at least:

- `AgentSandbox.executeJavaScript()`;
- `AgentSandbox.executePythonSim()`;
- `AgentSandbox.calculateEnergyBESS()` as a deterministic approved tool.

The Vercel provider proof is separate: it must execute an actual harmless command through the Vercel Sandbox CLI and fail closed when the provider or authentication is unavailable. A local simulation cannot be promoted to `VERCEL_SANDBOX_READY`.

## 6. Connector ownership

GitHub, GitHub MCP, project MCP, Google Cloud, Vercel Sandbox, X/network and other external connectors are **host-owned capabilities**. The local probe must never print, copy or infer credentials.

A connector is proven only by the host connector performing a harmless read/execution and attaching execution/evidence metadata.

The xAI UI catalog is descriptive metadata. Until a host receipt exists, the correct state is `CATALOG_ONLY`, `AUTH_REQUIRED`, `NOT_EXECUTED`, or `BLOCKED`; it must never be presented as an operational capability merely because a catalog object says `isConnected: true`.

## 7. Multi-agent Git safety

Every agent MUST follow the repository concurrency protocol before modifying shared Git state:

```bash
git switch <agent-branch>
git fetch origin
git status --short
# if dirty: preserve/commit deliberately; NEVER rebase dirty state
# when clean, fetch immediately again before rebase
git fetch origin
git rebase origin/<target-branch>
```

Hard rules:

- never work directly on `main`;
- never force-push `main`;
- never use force-push as conflict recovery;
- never discard another agent's work with blind `stash pop`, reset, checkout or clean;
- stop on conflicts and preserve evidence/state;
- use isolated branches/worktrees where supported;
- use compare-and-swap / expected-head checks for shared remote updates;
- re-check the remote immediately before publication;
- publish only through the repository's GOS3 gate.

## 8. Evidence envelope

A successful onboarding receipt SHOULD contain:

```json
{
  "protocol": "GOS3",
  "manifest_version": "1.2",
  "agent_id": "<agent-id>",
  "runtime": "Vortex",
  "status": "TOOLING_READY",
  "capabilities": [
    "sandbox.javascript",
    "sandbox.python",
    "tool.execution"
  ],
  "execution_ids": ["..."],
  "evidence_ids": ["..."],
  "timestamp": "..."
}
```

For Vercel Sandbox, the receipt MUST identify the provider as `vercel-sandbox` and contain execution/evidence IDs derived from the real command result.

Do not put secrets, access tokens, cookies, PATs, API keys or credential material into the receipt.

## 9. New-agent rule

This manifesto applies automatically to new agents. Adding a provider to the roster does not grant capability. The provider must pass the same behavioral onboarding gate. A runtime assigned to an agent is part of its capability contract, not a claim inherited from another agent.

**No proof → no capability → no consequential action.**
