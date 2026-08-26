# GOS3 Agent Tooling & Onboarding Policy — Vortex

**Status:** REQUIRED
**Scope:** every current and future GOS3/Vortex agent/session

## 1. Capability contract

Every agent must be able to use the repository's Git safety protocol, GitHub API/connector, required MCP capabilities, and Google Cloud capability when assigned Cloud work. Credentials are per-agent and must never be copied or committed.

Runtime capability is also mandatory. An agent must prove the sandbox/runtime and approved tool surface in the runtime assigned to its role. For the Vercel provider, the canonical provider proof is:

```bash
npm run gos3:vercel:sandbox -- <unique-agent-id>
```

This proof is fail-closed: missing Sandbox CLI or missing host authentication is a BLOCK, not a simulated success. The provider probe must emit execution/evidence IDs derived from the actual sandbox command result.

## 2. Mandatory Git concurrency onboarding

Before touching project Git state, a new agent MUST bootstrap the local defenses. This is executable policy, not a README suggestion:

```bash
npm run gos3:onboard -- --agent <unique-agent-id>
```

The bootstrap installs the repository-local `.githooks` path, persists the agent identity locally, makes the safety scripts executable, and runs the read-only onboarding contract. It is safe to repeat.

The resulting routine synchronization command is:

```bash
npm run gos3:sync -- feat/<task-branch>
```

The agent must NOT replace this with ad-hoc `checkout/fetch/rebase/push` sequences.

## 3. Worktree isolation

Each agent/session owns a dedicated worktree. Shared branch switching inside one worktree is prohibited for multi-agent operation. The sync gate creates/reuses `.gos3-worktrees/<agent>/<branch>` and fails if the branch is already owned by another worktree.

Never use:

```bash
git worktree add --force ...
git switch --ignore-other-worktrees ...
git push --force ...
```

## 4. Concurrency/CAS requirement

The sync gate captures the remote feature SHA, integrates remote feature and `origin/main`, runs tests, then fetches the feature branch again. Publication is permitted only if the final remote SHA equals the captured SHA. A change by another agent causes a bounded retry; exhaustion fails closed.

## 5. Conflict discipline

Rebase conflicts, dirty worktrees, ambiguous ownership, and rejected publication are STOP conditions. The automation does not blindly `git stash pop`. The agent must preserve its isolated worktree and resolve the conflict explicitly.

## 6. Publication discipline

No agent may publish directly to `main`. Feature branches go through the approved PR flow and required branch protection/CI/review. Normal pushes only; never force-push protected history.

Defense in depth: after onboarding, the repository-local `pre-push` hook rejects direct main pushes, branch deletion, non-fast-forward publication, and pushes originating outside a GOS3 isolated worktree. GitHub branch protection remains authoritative.

## 7. Evidence discipline

Every sync/publish/runtime proof operation must emit an operation/execution ID and agent ID plus branch/worktree/runtime state and evidence IDs. Evidence must contain no credentials.

## 8. Onboarding gate is mandatory for new agents

The roster is dynamic. A provider/model/person is not exempt because it was previously used. A newly instantiated agent is considered **NOT TOOLING READY** until onboarding passes.

Required proof:

```bash
npm run gos3:onboard -- --agent <unique-agent-id>
npm run gos3:agent:proof -- <unique-agent-id>
```

When Vercel Sandbox is the assigned runtime:

```bash
npm run gos3:vercel:sandbox -- <unique-agent-id>
```

Then:

```bash
npm run gos3:sync -- feat/<task>
```

A host may provide GitHub/MCP/Vercel credentials or connectors, but the agent must prove the capability through host-owned tooling checks. Secrets are never requested as evidence.

## 9. Failure policy

If a capability is missing, mark it BLOCKED and report the exact missing capability. Do not fake execution, borrow credentials, bypass the Git gate, or force-push to recover from a race.
