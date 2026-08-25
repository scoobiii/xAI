#!/usr/bin/env bash
set -euo pipefail

# GOS3 multi-session publish gate.
# Never force-push. Preserve dirty work, sync remote, verify, then publish.

BRANCH="${GOS3_GIT_BRANCH:-main}"
REMOTE="${GOS3_GIT_REMOTE:-origin}"
STASH_NAME="GOS3 pre-sync: automated publish gate"
STASHED=0

restore_stash() {
  if [[ "$STASHED" == "1" ]]; then
    echo "[GOS3] restoring preserved working tree..."
    if ! git stash pop; then
      echo "[GOS3] FAIL: preserved work could not be restored cleanly; stash was retained" >&2
      exit 3
    fi
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

echo "[GOS3] running GOS3 verification before push..."
if [[ -x ./scripts/gos3_git_audit.sh ]]; then
  ./scripts/gos3_git_audit.sh
else
  bash ./scripts/gos3_git_audit.sh
fi
npm run test:gos3
npm run gos3:audit

echo "[GOS3] publishing $BRANCH..."
git push "$REMOTE" "$BRANCH"
echo "[GOS3] publish successful"
