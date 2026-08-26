#!/usr/bin/env bash
set -euo pipefail

# GOS3 Vortex Git concurrency gate.
# Default mode NEVER touches the caller's working tree: it uses a dedicated git worktree.
# Protocol: fetch -> isolate -> fetch -> rebase remote -> rebase main -> verify -> CAS fetch -> publish.
# Never force-push. Never push main. Never auto-pop stash. Conflicts fail closed.
# Usage: bash scripts/gos3_git_sync.sh <feature-branch> [--agent ID] [--push]

REMOTE="${GOS3_GIT_REMOTE:-origin}"
BRANCH="${1:-${GOS3_GIT_BRANCH:-}}"
AGENT="${GOS3_AGENT_ID:-${GOS3_AGENT:-}}"
DO_PUSH=0
MAX_ATTEMPTS="${GOS3_SYNC_MAX_ATTEMPTS:-3}"

shift || true
while (($#)); do
  case "$1" in
    --push) DO_PUSH=1 ;;
    --agent) shift; AGENT="${1:-}" ;;
    --agent=*) AGENT="${1#*=}" ;;
    *) echo "[GOS3][FAIL] unknown argument: $1" >&2; exit 2 ;;
  esac
  shift || true
done

[[ -n "$BRANCH" ]] || { echo '[GOS3][FAIL] target feature branch required' >&2; exit 2; }
[[ "$BRANCH" != "main" ]] || { echo '[GOS3][FAIL] main is never a GOS3 agent work branch' >&2; exit 2; }
[[ -n "$AGENT" ]] || { echo '[GOS3][FAIL] GOS3_AGENT_ID required; new agents must onboard first' >&2; exit 2; }
[[ "$AGENT" =~ ^[A-Za-z0-9._-]+$ ]] || { echo '[GOS3][FAIL] invalid agent id' >&2; exit 2; }
[[ "$MAX_ATTEMPTS" =~ ^[1-9][0-9]*$ ]] || { echo '[GOS3][FAIL] GOS3_SYNC_MAX_ATTEMPTS must be a positive integer' >&2; exit 2; }

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[[ -n "$ROOT" ]] || { echo '[GOS3][FAIL] not a git repository' >&2; exit 1; }
cd "$ROOT"

say(){ printf '[GOS3] %s\n' "$*"; }
ok(){ printf '[GOS3][OK] %s\n' "$*"; }
bad(){ printf '[GOS3][FAIL] %s\n' "$*" >&2; }

OP_ID="gos3-$(date -u +%Y%m%dT%H%M%SZ)-${RANDOM}${RANDOM}"
say "operation=$OP_ID agent=$AGENT branch=$BRANCH"
say "caller_worktree=$(git rev-parse --show-toplevel)"

# Never use stash as the concurrency mechanism. A linked worktree isolates the agent.
WT_ROOT="${GOS3_WORKTREE_ROOT:-$ROOT/.gos3-worktrees}"
BRANCH_SLUG="${BRANCH//\//__}"
WORKTREE="$WT_ROOT/$AGENT/$BRANCH_SLUG"
mkdir -p "$(dirname "$WORKTREE")"

# If this branch is already checked out, fail closed instead of using --force.
existing="$(git worktree list --porcelain | awk -v b="refs/heads/$BRANCH" '
  $1=="worktree" {p=$2}
  $1=="branch" && $2==b {print p}
')"
if [[ -n "$existing" && "$existing" != "$WORKTREE" ]]; then
  bad "branch already owned by another worktree: $existing"
  bad "do not use git switch --ignore-other-worktrees or git worktree add --force"
  exit 73
fi

say "fetch remote branch before isolation"
git fetch --prune "$REMOTE" "$BRANCH"
git show-ref --verify --quiet "refs/remotes/$REMOTE/$BRANCH" || { bad "remote branch not found: $REMOTE/$BRANCH"; exit 4; }

if [[ ! -d "$WORKTREE/.git" && ! -f "$WORKTREE/.git" ]]; then
  say "create isolated worktree: $WORKTREE"
  if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    git worktree add "$WORKTREE" "$BRANCH"
  else
    git worktree add --track -b "$BRANCH" "$WORKTREE" "$REMOTE/$BRANCH"
  fi
else
  say "reuse isolated worktree: $WORKTREE"
fi

cd "$WORKTREE"

# No stash/pop. Dirty state inside the agent worktree is a hard stop.
if ! git diff --quiet || ! git diff --cached --quiet || [[ -n "$(git ls-files --others --exclude-standard)" ]]; then
  bad "agent worktree is dirty; commit the work or resolve it explicitly before sync"
  bad "stash-pop automation is intentionally disabled"
  exit 74
fi

for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  say "attempt=$attempt/$MAX_ATTEMPTS"

  # Fresh branch and main state immediately before integration.
  git fetch --prune "$REMOTE" "$BRANCH"
  git fetch --prune "$REMOTE" main
  EXPECTED_REMOTE_SHA="$(git rev-parse "$REMOTE/$BRANCH")"
  MAIN_SHA="$(git rev-parse "$REMOTE/main")"
  say "expected_remote=$EXPECTED_REMOTE_SHA main=$MAIN_SHA"

  # Absorb commits another session may already have published to this branch.
  if ! git rebase "$REMOTE/$BRANCH"; then
    bad "rebase onto remote branch conflicted; STOP. Resolve manually; no stash-pop/force-push."
    exit 75
  fi

  # Bring the feature branch up to date with protected main.
  if ! git rebase "$REMOTE/main"; then
    bad "rebase onto origin/main conflicted; STOP. Resolve manually."
    exit 76
  fi

  if [[ -d .git/rebase-merge || -d .git/rebase-apply ]]; then
    bad "rebase still active; refusing to continue"
    exit 77
  fi

  # Read-only repository gates.
  if [[ -x ./scripts/gos3_git_audit.sh ]]; then
    GOS3_GIT_BRANCH="$BRANCH" GOS3_GIT_REMOTE="$REMOTE" ./scripts/gos3_git_audit.sh
  elif [[ -f ./scripts/gos3_git_audit.sh ]]; then
    GOS3_GIT_BRANCH="$BRANCH" GOS3_GIT_REMOTE="$REMOTE" bash ./scripts/gos3_git_audit.sh
  fi
  [[ -f package.json ]] && grep -q '"test:gos3"' package.json && npm run test:gos3

  # CAS boundary: remote may have changed while we were rebasing/testing.
  git fetch --prune "$REMOTE" "$BRANCH"
  ACTUAL_REMOTE_SHA="$(git rev-parse "$REMOTE/$BRANCH")"
  if [[ "$ACTUAL_REMOTE_SHA" != "$EXPECTED_REMOTE_SHA" ]]; then
    bad "remote branch changed during operation: expected=$EXPECTED_REMOTE_SHA actual=$ACTUAL_REMOTE_SHA"
    if (( attempt < MAX_ATTEMPTS )); then
      say "retrying from the new remote state; previous worktree remains isolated"
      continue
    fi
    bad "CAS retry budget exhausted; publication aborted"
    exit 78
  fi

  HEAD_SHA="$(git rev-parse HEAD)"
  say "evidence operation=$OP_ID agent=$AGENT branch=$BRANCH head=$HEAD_SHA remote=$ACTUAL_REMOTE_SHA main=$MAIN_SHA"
  ok "GOS3 Git concurrency verification passed"

  if (( DO_PUSH == 1 )); then
    say "publishing feature branch without force"
    if ! git push "$REMOTE" "HEAD:refs/heads/$BRANCH"; then
      bad "publish rejected; remote changed or branch protection blocked it"
      exit 79
    fi
    ok "publish complete branch=$BRANCH head=$(git rev-parse HEAD)"
  else
    say "publish disabled (dry synchronization)"
  fi

  printf '%s\n' "[GOS3] SYNC COMPLETE" "[GOS3] operation=$OP_ID" "[GOS3] agent=$AGENT" "[GOS3] worktree=$WORKTREE" "[GOS3] branch=$BRANCH" "[GOS3] head=$HEAD_SHA" "[GOS3] remote=$ACTUAL_REMOTE_SHA" "[GOS3] main=$MAIN_SHA" "[GOS3] push=$([[ $DO_PUSH == 1 ]] && echo published || echo disabled)"
  exit 0
done

bad "unreachable sync state"
exit 80
