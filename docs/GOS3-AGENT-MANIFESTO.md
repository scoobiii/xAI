# GOS3 Agent Manifesto — Universal Agent Operating & Safety Protocol

**Status:** REQUIRED / FAIL-CLOSED  
**Scope:** every new and existing agent operating through Vortex/GOS3/xAI  
**Version:** 1.0

## 1. Core rule

An agent is **not operationally ready because it claims to have tools**. It becomes `TOOLING_READY` only after it proves, in the runtime where it will work, that it can:

1. enter the approved sandbox runtime;
2. execute a harmless deterministic program inside the sandbox;
3. invoke an approved tool through the runtime/tool surface;
4. receive and retain an execution/evidence receipt;
5. report failures honestly and stop when a required capability is unavailable;
6. operate Git through the GOS3 concurrency protocol without force-push or direct `main` publication.

A model/provider identity alone is never evidence of capability.

## 2. Required capability proof

Every agent onboarding MUST produce a capability receipt containing:

| Capability | Required | Minimum proof |
|---|---:|---|
| Sandbox JavaScript runtime | YES | execute harmless JS and receive success + evidence hash |
| Sandbox Python/simulation runtime | YES | execute harmless Python/sim program and receive success + evidence hash |
| Runtime tool invocation | YES | invoke an approved deterministic tool and receive evidence |
| Tool discovery / MCP | YES when assigned | tools/list + harmless read, owned by host connector |
| Git | YES | status + fetch + second fetch + rebase protocol |
| GitHub connector/API | YES for GitHub work | authenticated harmless repository read |
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
- an `executed=true` flag without execution evidence.

The proof must originate from the actual runtime/tool invocation and include an evidence hash or equivalent immutable receipt.

## 5. Vortex runtime contract

Vortex is the execution/runtime layer for GOS3 agents. The xAI repository must keep this manifesto and its onboarding gate synchronized with the runtime implementation.

The canonical local proof command is:

```bash
npm run gos3:agent:proof -- <agent-id>
```

The proof must execute the real repository sandbox implementation, not a fake provider. It exercises at least:

- `AgentSandbox.executeJavaScript()`;
- `AgentSandbox.executePythonSim()`;
- `AgentSandbox.calculateEnergyBESS()` as a deterministic approved tool.

## 6. Connector ownership

GitHub, GitHub MCP, project MCP, Google Cloud, X/network and other external connectors are **host-owned capabilities**. The local probe must never print, copy or infer credentials.

A connector is proven only by the host connector performing a harmless read and attaching execution/evidence metadata.

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

GitHub supports required pull requests and status checks, and strict checks can require a branch to be up to date before merge. These server-side controls complement, but do not replace, this runtime protocol.

## 8. Evidence envelope

A successful onboarding receipt SHOULD contain:

```json
{
  "protocol": "GOS3",
  "manifest_version": "1.0",
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

Do not put secrets, access tokens, cookies, PATs, API keys or credential material into the receipt.

## 9. New-agent rule

This manifesto applies automatically to new agents. Adding a provider to the roster does not grant capability. The provider must pass the same behavioral onboarding gate.

**No proof → no capability → no consequential action.**
