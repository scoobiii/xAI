> **GOS3** · agente: `grok` · papel: `Auditor / Protocolo Git`
> fase: `fase 5 — padronização e governança` · data: `2026-08-26` · hora: `02:31:36 UTC`
> antes: Policy de concorrência sem cabeçalho GOS3 e sem bloco explícito New agents
> depois: Cabeçalho GOS3 + New agents obrigatório (admission, CAS, worktree, sem force-push)
> base: scripts/gos3_git_sync.sh, scripts/gos3_git_admit.sh, .githooks/pre-push
> assinatura: `Grok · Auditor · GOS3`

# GOS3 Git Concurrency Policy — Single Source of Truth

**Status:** REQUIRED
**Scope:** every human and agent session working on this repository

## 1. Concurrency is a protocol, not a convention

Git is a shared concurrent resource. Agents MUST NOT coordinate by repeatedly switching branches in one shared worktree. Each agent/session MUST use a dedicated `git worktree` and a unique `GOS3_AGENT_ID`.

Required automation:

```bash
GOS3_AGENT_ID=<agent-id> npm run gos3:sync -- <feature-branch>
```

The sync gate creates/reuses an isolated worktree under `.gos3-worktrees/<agent>/<branch>` and refuses to operate when that branch is already owned by another worktree. It never uses `--force` or `--ignore-other-worktrees`.

## 2. Main is protected

Agents never publish directly to `main`. The approved flow is:

```text
agent worktree -> feature branch -> GOS3 verification -> PR -> required CI/review -> main
```

`git push --force` is prohibited. Direct `--push main` is prohibited.

## 3. Synchronization protocol

Before integration/publication the gate performs:

```text
fetch feature
-> fetch main
-> capture expected remote feature SHA
-> rebase feature onto remote feature
-> rebase feature onto remote main
-> run read-only audit/tests
-> fetch feature AGAIN
-> compare actual remote SHA with expected SHA
-> publish only if equal
```

The final comparison is a compare-and-swap (CAS) boundary. If another agent publishes while the operation is running, the operation MUST NOT overwrite that work. The gate retries from the new remote state up to its bounded retry budget; after exhaustion it stops.

## 4. Conflicts fail closed

A rebase conflict is not an automatic retry and is never solved by `stash pop`. The agent MUST stop and preserve the isolated worktree for explicit recovery.

Dirty or untracked files in an agent worktree are also a hard stop. The concurrency gate does not stash/pop work automatically. Commit or explicitly preserve the work before retrying.

## 5. Publication safety

A feature branch may be pushed only after:

1. the agent identity is present;
2. the branch has an isolated worktree;
3. the remote feature SHA was captured;
4. remote feature and main were fetched immediately before integration;
5. rebases completed without conflict;
6. required GOS3 audit/tests passed;
7. the remote feature SHA was fetched again and is unchanged;
8. the push is a normal non-force push.

A rejected/non-fast-forward push is a concurrency event, not a reason to force-push.

## 6. Agent identity and evidence

Every sync operation carries an operation ID and agent ID. Evidence MUST include at least:

```text
operation_id
agent_id
feature_branch
worktree
head_sha
expected_remote_sha
actual_remote_sha
main_sha
publish_state
```

No credentials or tokens are evidence.

## 7. New-agent onboarding

New agents:
- MUST pass GOS3 admission before pull/rebase/push/publication when consuming another agent's work (`npm run gos3:admit -- <source-branch> --agent <id>`).
- MUST prove Git concurrency capability (`gos3:sync` / concurrency contract).
- MUST prove sandbox runtime + agent tools capability (`gos3:agent:proof` / agent-runtime gate).
- MUST have a GOS3 agent identity (`GOS3_AGENT_ID` / `gos3.agentId`).
- MUST use isolated worktrees for publication.
- MUST fail closed on remote CAS mismatch.
- MUST NOT force-push or publish directly to main.

Every new GOS3/Vortex agent MUST read this policy and `docs/AGENT-TOOLING-POLICY.md`, then pass:

```bash
./scripts/gos3_agent_tooling_check.sh
```

The agent must then identify itself and use the sync gate:

```bash
export GOS3_AGENT_ID=<unique-agent-id>
npm run gos3:sync -- <feature-branch>
```

Agents MUST NOT invent an alternate Git synchronization sequence for routine work.

## 8. Failure matrix

| Event | Required action |
|---|---|
| dirty worktree | STOP; commit or explicitly clean/preserve |
| branch owned by another worktree | STOP; use own branch/worktree |
| rebase conflict | STOP; explicit resolution |
| remote changed during operation | bounded retry from new SHA |
| push non-fast-forward | STOP/re-sync; never force |
| main publication requested | DENY; use PR |
| ambiguous state | STOP and emit evidence |

## 9. Rationale

The repository has repeatedly experienced race conditions caused by multiple agents sharing a worktree, stale remote state, blind stash restoration, and concurrent pushes. This protocol converts those failures into explicit synchronization states with isolation, CAS verification, bounded retries, and fail-closed behavior.
