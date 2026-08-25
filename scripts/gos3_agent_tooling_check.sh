#!/usr/bin/env bash
set -euo pipefail

# Read-only onboarding audit. Never prints credentials and never mutates Git.
FAIL=0
ok(){ printf '[GOS3][OK]   %s\n' "$*"; }
warn(){ printf '[GOS3][WARN] %s\n' "$*"; }
bad(){ printf '[GOS3][FAIL] %s\n' "$*"; FAIL=1; }
have(){ command -v "$1" >/dev/null 2>&1; }

printf '%s\n' '============================================================'
printf '%s\n' 'GOS3 AGENT TOOLING + CONCURRENCY ONBOARDING CHECK'
printf '%s\n' '============================================================'

if have git; then ok "git CLI: $(git --version)"; else bad 'git CLI not installed'; fi

if have gh; then
  ok "GitHub CLI: $(gh --version | head -1)"
  gh auth status >/dev/null 2>&1 && ok 'GitHub CLI authenticated' || warn 'GitHub CLI not authenticated; approved host connector may satisfy API capability'
else
  warn 'gh not installed; prove GitHub capability through approved connector/MCP host'
fi

# Agent identity is mandatory for the concurrency protocol.
if [[ -n "${GOS3_AGENT_ID:-}" && "${GOS3_AGENT_ID}" =~ ^[A-Za-z0-9._-]+$ ]]; then
  ok "GOS3 agent identity configured: $GOS3_AGENT_ID"
else
  bad 'GOS3_AGENT_ID missing or invalid; new agents must onboard with a unique identity'
fi

# Worktree support is a hard Git requirement.
if have git && git worktree list >/dev/null 2>&1; then
  ok 'git worktree capability available'
else
  bad 'git worktree capability unavailable'
fi

# Concurrency gate must exist and be exposed through npm when package.json is present.
[[ -f scripts/gos3_git_sync.sh ]] && ok 'concurrency gate present: scripts/gos3_git_sync.sh' || bad 'missing concurrency gate: scripts/gos3_git_sync.sh'
if [[ -f package.json ]]; then
  grep -q '"gos3:sync"' package.json && ok 'npm gos3:sync command exposed' || bad 'npm gos3:sync command missing'
fi

# Existing policy/tooling contract.
for f in docs/GIT-POLICY.md docs/AGENT-TOOLING-POLICY.md scripts/gos3_git_audit.sh scripts/gos3_git_publish.sh; do
  [[ -f "$f" ]] && ok "policy/tool present: $f" || bad "missing policy/tool: $f"
done

if [[ -d .git ]]; then
  ok "Git repository: $(git rev-parse --show-toplevel)"
  ok "Git branch: $(git branch --show-current || true)"
else
  bad 'not inside a Git repository'
fi

# Cloud capability is conditional, as before.
if have gcloud; then
  ok "gcloud CLI: $(gcloud --version 2>/dev/null | head -1)"
else
  warn 'gcloud not installed; required only for agents assigned Cloud work'
fi

printf '%s\n' '------------------------------------------------------------'
if (( FAIL == 0 )); then
  ok 'TOOLING + CONCURRENCY ONBOARDING PASS'
else
  bad 'TOOLING + CONCURRENCY ONBOARDING FAIL'
fi
printf '%s\n' '[GOS3] MCP connector checks are host-owned and must not expose credentials.'
printf '%s\n' '[GOS3] New agents are NOT READY until this gate passes.'
exit "$FAIL"
