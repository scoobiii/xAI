#!/usr/bin/env bash
set -euo pipefail

# Read-only onboarding audit. Never prints credentials and never mutates Git.
FAIL=0
ok(){ printf '[GOS3][OK]   %s\n' "$*"; }
warn(){ printf '[GOS3][WARN] %s\n' "$*"; }
bad(){ printf '[GOS3][FAIL] %s\n' "$*"; FAIL=1; }
have(){ command -v "$1" >/dev/null 2>&1; }

printf '%s\n' '============================================================'
printf '%s\n' 'GOS3 AGENT TOOLING CHECK'
printf '%s\n' '============================================================'

# Git is mandatory.
if have git; then
  ok "git CLI: $(git --version)"
else
  bad 'git CLI not installed'
fi

# GitHub CLI is a convenient local API proof; connector/MCP can be checked separately by host UI.
if have gh; then
  ok "GitHub CLI: $(gh --version | head -1)"
  if gh auth status >/dev/null 2>&1; then
    ok 'GitHub CLI authenticated'
  else
    warn 'GitHub CLI not authenticated (connector/MCP authentication may still satisfy the capability)'
  fi
else
  warn 'gh not installed; GitHub API capability must be proven through an approved connector/MCP host'
fi

# gcloud is required for agents assigned Cloud work.
if have gcloud; then
  ok "gcloud CLI: $(gcloud --version 2>/dev/null | head -1)"
  account="$(gcloud config get-value account 2>/dev/null || true)"
  project="$(gcloud config get-value project 2>/dev/null || true)"
  [[ -n "$account" && "$account" != '(unset)' ]] && ok "gcloud account configured: $account" || warn 'gcloud account not configured'
  [[ -n "$project" && "$project" != '(unset)' ]] && ok "gcloud project configured: $project" || warn 'gcloud project not configured'
else
  warn 'gcloud not installed; required only for Cloud-assigned agents'
fi

# Repository-local policy files.
for f in docs/GIT-POLICY.md docs/AGENT-TOOLING-POLICY.md scripts/gos3_git_audit.sh scripts/gos3_git_publish.sh; do
  [[ -f "$f" ]] && ok "policy/tool present: $f" || bad "missing policy/tool: $f"
done

# Git state proof without changing it.
if [[ -d .git ]]; then
  ok "Git worktree: $(git branch --show-current)"
  git diff --quiet && git diff --cached --quiet || warn 'local tracked changes present; do not pull/rebase until preserved or committed'
else
  bad 'not inside a Git repository'
fi

printf '%s\n' '------------------------------------------------------------'
if (( FAIL == 0 )); then
  ok 'TOOLING CHECK PASS (local capabilities/policies)'
else
  bad 'TOOLING CHECK FAIL'
fi

printf '%s\n' '[GOS3] MCP connector checks must be performed by the host that owns the MCP connections.'
printf '%s\n' '[GOS3] Google/GitHub credentials are per-agent; this script never reads or exports tokens.'
exit "$FAIL"
