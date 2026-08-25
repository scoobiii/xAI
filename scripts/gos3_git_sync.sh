#!/usr/bin/env bash
set -euo pipefail

# GOS3 Vortex sync gate.
# Automates: preserve -> fetch -> switch -> fetch -> rebase -> verify -> restore.
# Safe by default: NEVER pushes and NEVER force-pushes.
# Usage: bash scripts/gos3_git_sync.sh <branch> [--push]

REMOTE="${GOS3_GIT_REMOTE:-origin}"
BRANCH="${1:-${GOS3_GIT_BRANCH:-}}"
DO_PUSH=0

if [[ "${2:-}" == "--push" ]]; then DO_PUSH=1; fi
if [[ -z "$BRANCH" ]]; then
  echo "[GOS3][FAIL] target branch required (example: feat/gos3-traceability-cli)" >&2
  exit 2
fi
if [[ "$BRANCH" == "main" && "$DO_PUSH" == "1" ]]; then
  echo "[GOS3][FAIL] direct main publication is disabled by this gate; use the approved PR flow" >&2
  exit 2
fi

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[[ -n "$ROOT" ]] || { echo '[GOS3][FAIL] not a git repository' >&2; exit 1; }
cd "$ROOT"

CURRENT="$(git branch --show-current)"
STASHED=0
STASH_NAME="GOS3 pre-sync: ${CURRENT:-detached} -> ${BRANCH}"

fail_restore=0
restore_work() {
  if (( STASHED == 1 )); then
    echo "[GOS3] restoring preserved work..."
    if git stash pop; then
      echo "[GOS3][OK] preserved work restored"
    else
      echo "[GOS3][FAIL] restore conflict; stash retained for manual recovery" >&2
      fail_restore=1
    fi
  fi
}
trap restore_work EXIT

is_dirty() {
  ! git diff --quiet || ! git diff --cached --quiet || [[ -n "$(git ls-files --others --exclude-standard)" ]]
}

if is_dirty; then
  echo "[GOS3] preserving dirty/untracked work"
  git stash push -u -m "$STASH_NAME"
  STASHED=1
  echo "[GOS3][OK] preserved as: $(git stash list -1 --format='%gd %s')"
fi

# Always resolve the remote target before switching. Never guess a local branch state.
echo "[GOS3] fetch remote branch: $REMOTE/$BRANCH"
git fetch "$REMOTE" "$BRANCH"

git show-ref --verify --quiet "refs/remotes/$REMOTE/$BRANCH" || {
  echo "[GOS3][FAIL] remote branch not found: $REMOTE/$BRANCH" >&2
  exit 4
}

if [[ "$CURRENT" != "$BRANCH" ]]; then
  echo "[GOS3] switch: ${CURRENT:-detached} -> $BRANCH"
  if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    git switch "$BRANCH"
  else
    git switch --track -c "$BRANCH" "$REMOTE/$BRANCH"
  fi
else
  echo "[GOS3][OK] already on $BRANCH"
fi

# Refetch immediately before rebase: another GOS3 session may have pushed meanwhile.
echo "[GOS3] refetch remote branch immediately before rebase"
git fetch "$REMOTE" "$BRANCH"

REMOTE_SHA="$(git rev-parse "$REMOTE/$BRANCH")"
HEAD_BEFORE="$(git rev-parse HEAD)"
echo "[GOS3] rebase $BRANCH onto $REMOTE/$BRANCH ($REMOTE_SHA)"
git rebase "$REMOTE/$BRANCH"

HEAD_AFTER="$(git rev-parse HEAD)"
echo "[GOS3][OK] rebase complete: ${HEAD_AFTER:0:12}"

# Fail closed if synchronization produced a conflict state.
if [[ -d .git/rebase-merge || -d .git/rebase-apply ]]; then
  echo "[GOS3][FAIL] rebase still in progress" >&2
  exit 5
fi

# Machine verification: these are deliberately read-only checks.
if [[ -x ./scripts/gos3_git_audit.sh ]]; then
  GOS3_GIT_BRANCH="$BRANCH" GOS3_GIT_REMOTE="$REMOTE" ./scripts/gos3_git_audit.sh
else
  GOS3_GIT_BRANCH="$BRANCH" GOS3_GIT_REMOTE="$REMOTE" bash ./scripts/gos3_git_audit.sh
fi

if [[ -x ./scripts/gos3_traceability_cli.sh ]]; then
  bash ./scripts/gos3_traceability_cli.sh
fi

if [[ -f package.json ]] && grep -q '"test:gos3"' package.json; then
  npm run test:gos3
fi

if [[ -f package.json ]] && grep -q '"gos3:audit"' package.json; then
  npm run gos3:audit
fi

echo "[GOS3] SYNC COMPLETE"
echo "[GOS3] branch=$BRANCH"
echo "[GOS3] before=$HEAD_BEFORE"
echo "[GOS3] after=$HEAD_AFTER"
echo "[GOS3] remote=$REMOTE_SHA"
echo "[GOS3] push=$([[ $DO_PUSH == 1 ]] && echo requested || echo disabled)"

if (( DO_PUSH == 1 )); then
  echo "[GOS3] publishing feature branch (no force): $REMOTE/$BRANCH"
  git push "$REMOTE" "$BRANCH"
  echo "[GOS3][OK] publish complete"
fi

exit 0
