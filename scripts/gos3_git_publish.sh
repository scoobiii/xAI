#!/usr/bin/env bash
set -euo pipefail

# GOS3 multi-session publish gate.
# Never force-push main. Preserve dirty work, sync remote, rebase, then publish.

BRANCH="${GOS3_GIT_BRANCH:-main}"
REMOTE="${GOS3_GIT_REMOTE:-origin}"
STASH_NAME="GOS3 pre-sync: automated publish gate"
STASHED=0

restore_stash() {
  if [[ "$STASHED" == "1" ]]; then
    echo "[GOS3] restoring preserved working tree..."
    git stash pop
  fi
}
trap restore_stash EXIT

if [[ "$(git branch --show-current)" != "$BRANCH" ]]; then
  echo "[GOS3] FAIL: current branch is not $BRANCH" >&2
  exit 2
fi

if ! git diff --quiet || ! git diff --cached --quiet || [[ -n "$(git ls-files --others --exclude-standard)" ]]; then
  echo "[GOS3] preserving dirty/untracked work"
  git stash push -u -m "$STASH_NAME"
  STASHED=1
fi

echo "[GOS3] fetching $REMOTE/$BRANCH..."
git fetch "$REMOTE" "$BRANCH"

echo "[GOS3] rebasing $BRANCH onto $REMOTE/$BRANCH..."
git rebase "$REMOTE/$BRANCH"

echo "[GOS3] publishing $BRANCH..."
git push "$REMOTE" "$BRANCH"

echo "[GOS3] publish successful"
