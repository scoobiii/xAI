# GOS3 Agent Tooling & Onboarding Policy — Vortex

**Status:** REQUIRED
**Scope:** every current and future GOS3/Vortex agent/session

## 1. Capability contract

Every agent must be able to use the repository's Git safety protocol, GitHub API/connector, required MCP capabilities, and Google Cloud capability when assigned Cloud work. Credentials are per-agent and must never be copied or committed.

## 2. Mandatory Git concurrency onboarding

Before touching project Git state, a new agent MUST:

1. Read `docs/GIT-POLICY.md`.
2. Run `./scripts/gos3_agent_tooling_check.sh`.
3. Set a unique `GOS3_AGENT_ID`.
4. Use the repository-local sync gate for routine synchronization.

Example:

```bash
export GOS3_AGENT_ID=gpt-<unique-session-id>
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

## 7. Evidence discipline

Every sync/publish operation must emit an operation ID and agent ID plus branch, worktree, head SHA, expected/actual remote SHA, main SHA, and publication state. Evidence must contain no credentials.

## 8. Onboarding gate is mandatory for new agents

The roster is dynamic. A provider/model/person is not exempt because it was previously used. A newly instantiated agent is considered **NOT TOOLING READY** until onboarding passes.

Required proof:

```bash
./scripts/gos3_agent_tooling_check.sh
```

Then:

```bash
export GOS3_AGENT_ID=<unique-id>
npm run gos3:sync -- feat/<task>
```

A host may provide GitHub/MCP credentials or connectors, but the agent must prove the capability through the host-owned tooling checks. Secrets are never requested as evidence.

## 9. Failure policy

If a capability is missing, mark it BLOCKED and report the exact missing capability. Do not fake execution, borrow credentials, bypass the Git gate, or force-push to recover from a race.
