#!/usr/bin/env bash
set -euo pipefail

# GOS3 traceability CLI: read-only evidence collector.
# Never prints credential material and never mutates Git.
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[[ -n "$ROOT" ]] || { echo '[GOS3][FAIL] not a git repository' >&2; exit 1; }
cd "$ROOT"

ok(){ printf '[GOS3][OK]   %s\n' "$*"; }
bad(){ printf '[GOS3][FAIL] %s\n' "$*"; }
section(){ printf '\n=== %s ===\n' "$*"; }

section 'TRACEABILITY'
ok "timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
ok "repository: $(git config --get remote.origin.url 2>/dev/null || echo unknown)"
ok "branch: $(git branch --show-current)"
ok "HEAD: $(git rev-parse HEAD)"
ok "origin/main: $(git rev-parse origin/main 2>/dev/null || echo unavailable)"
ok "subject: $(git log -1 --pretty=%s)"

section 'GIT INVARIANTS'
if git diff --quiet && git diff --cached --quiet; then ok 'tracked worktree clean'; else bad 'tracked worktree dirty'; fi
if [[ -z "$(git status --porcelain --untracked-files=all)" ]]; then ok 'no untracked files'; else bad 'untracked files present'; fi
if git rev-parse --verify origin/main >/dev/null 2>&1 && git merge-base --is-ancestor origin/main HEAD; then
  ok 'HEAD contains origin/main (safe publication ancestry)'
else
  bad 'HEAD does not contain current origin/main; synchronize before push'
fi

section 'POLICY'
for f in docs/GIT-POLICY.md docs/AGENT-TOOLING-POLICY.md scripts/gos3_git_audit.sh scripts/gos3_git_publish.sh scripts/gos3_agent_tooling_check.sh; do
  [[ -f "$f" ]] && ok "present: $f" || bad "missing: $f"
done

section 'CAPABILITIES'
command -v git >/dev/null && ok 'git CLI available' || bad 'git CLI missing'
if command -v gh >/dev/null; then
  ok 'GitHub CLI available'
  gh auth status >/dev/null 2>&1 && ok 'GitHub API authentication available' || bad 'GitHub CLI not authenticated'
else
  bad 'GitHub CLI missing; use approved GitHub connector/MCP and record host-side proof'
fi
if command -v gcloud >/dev/null; then
  ok 'gcloud CLI available'
  account="$(gcloud config get-value account 2>/dev/null || true)"
  project="$(gcloud config get-value project 2>/dev/null || true)"
  [[ -n "$account" && "$account" != '(unset)' ]] && ok "gcloud identity configured: $account" || bad 'gcloud identity missing'
  [[ -n "$project" && "$project" != '(unset)' ]] && ok "gcloud project configured: $project" || bad 'gcloud project missing'
else
  bad 'gcloud CLI missing (required for Cloud-assigned agents)'
fi

section 'MCP'
ok 'GitHub MCP / GOS3 MCP are host-owned capabilities; credentials are not inspected by this CLI'
ok 'Host must prove tools/list + harmless read and attach execution/evidence IDs to the GOS3 record'

section 'EVIDENCE'
# Stable, non-secret evidence suitable for GOS3 logs.
printf '%s\n' "commit=$(git rev-parse HEAD)" \
  "branch=$(git branch --show-current)" \
  "remote=$(git rev-parse origin/main 2>/dev/null || echo unavailable)" \
  "policy_git=$(sha256sum docs/GIT-POLICY.md 2>/dev/null | cut -d' ' -f1 || true)" \
  "policy_tools=$(sha256sum docs/AGENT-TOOLING-POLICY.md 2>/dev/null | cut -d' ' -f1 || true)" \
  "cli_script=$(sha256sum scripts/gos3_traceability_cli.sh 2>/dev/null | cut -d' ' -f1 || true)"

printf '\n[GOS3] TRACEABILITY CHECK COMPLETE\n'
