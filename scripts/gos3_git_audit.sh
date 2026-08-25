#!/usr/bin/env bash
set -euo pipefail

# GOS3 Git audit: machine-check the multi-session publishing invariant.
# Read-only: this script never stash/pop/rebase/pushes and never mutates the repo.

BRANCH="${GOS3_GIT_BRANCH:-main}"
REMOTE="${GOS3_GIT_REMOTE:-origin}"
FAIL=0

ok(){ printf '[GOS3][OK]   %s\n' "$*"; }
warn(){ printf '[GOS3][WARN] %s\n' "$*"; }
bad(){ printf '[GOS3][FAIL] %s\n' "$*"; FAIL=1; }

require_file(){
  if [[ -f "$1" ]]; then ok "file exists: $1"; else bad "missing required file: $1"; fi
}

printf '%s\n' '============================================================'
printf '%s\n' 'GOS3 MULTI-SESSION GIT AUDIT'
printf '%s\n' '============================================================'

[[ -d .git ]] || { bad 'not a Git worktree'; exit 1; }

current="$(git branch --show-current)"
[[ "$current" == "$BRANCH" ]] && ok "branch: $current" || bad "branch is '$current', expected '$BRANCH'"

require_file docs/GIT-POLICY.md
require_file scripts/gos3_git_publish.sh

if grep -Eq 'git[[:space:]]+push[^\n]*--force|git[[:space:]]+push[^\n]*-[^[:space:]]*f' scripts/gos3_git_publish.sh; then
  bad 'publish gate contains force-push'
else
  ok 'publish gate forbids force-push'
fi

for required in 'git fetch' 'git rebase' 'git push' 'git stash push -u'; do
  grep -Fq "$required" scripts/gos3_git_publish.sh \
    && ok "publish gate contains: $required" \
    || bad "publish gate missing: $required"
done

if git diff --quiet && git diff --cached --quiet && [[ -z "$(git ls-files --others --exclude-standard)" ]]; then
  ok 'working tree clean'
else
  warn 'working tree dirty/untracked: publish gate must preserve it before sync'
  git status --short
fi

git fetch "$REMOTE" "$BRANCH" >/dev/null
local_sha="$(git rev-parse HEAD)"
remote_sha="$(git rev-parse "$REMOTE/$BRANCH")"

if [[ "$local_sha" == "$remote_sha" ]]; then
  ok "local and remote synchronized: ${local_sha:0:8}"
else
  ahead="$(git rev-list --count "$REMOTE/$BRANCH"..HEAD)"
  behind="$(git rev-list --count HEAD.."$REMOTE/$BRANCH")"
  warn "diverged: ahead=$ahead behind=$behind"
fi

stash_count="$(git stash list | wc -l | tr -d ' ')"
printf '[GOS3]       stashes: %s\n' "$stash_count"
if (( stash_count > 1 )); then
  warn 'multiple stashes exist; inspect before applying any stash'
  git stash list
fi

if git stash list | grep -q 'GOS3 pre-sync'; then
  ok 'GOS3 pre-sync stash entries detected and preserved'
fi

junk_re='(^|/)([^/]+\.bak\.[^/]+|[^/]+\.orig|[^/]+\.rej)$|(^|/)(output|tmp|coverage)/'
junk="$(git ls-files --others --exclude-standard | grep -E "$junk_re" || true)"
if [[ -n "$junk" ]]; then
  warn 'generated/backup artifacts are untracked; do not stage blindly:'
  printf '%s\n' "$junk"
else
  ok 'no obvious backup/generated junk among untracked files'
fi

secret_re='(^|/)(\.env($|\.)|.*(secret|credential|token|api[_-]?key).*)'
secrets="$(git status --porcelain=v1 | sed -E 's/^.. //' | grep -Ei "$secret_re" || true)"
if [[ -n "$secrets" ]]; then
  bad 'possible secret-bearing paths are modified/untracked:'
  printf '%s\n' "$secrets"
else
  ok 'no obvious secret-bearing paths in status'
fi

printf '%s\n' '------------------------------------------------------------'
if (( FAIL == 0 )); then
  ok 'AUDIT PASS — GOS3 Git invariant is structurally satisfied'
else
  bad 'AUDIT FAIL — do not publish until failures are resolved'
fi
exit "$FAIL"
