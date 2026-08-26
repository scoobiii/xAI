#!/usr/bin/env bash
set -euo pipefail

# GOS3 fail-closed admission gate for consuming another agent's work.
# Read-only against the caller worktree: all inspection/testing happens in a detached worktree.
# It never merges, pushes, force-pushes, switches the caller branch, or touches stash.

REMOTE="${GOS3_GIT_REMOTE:-origin}"
SOURCE="${1:-}"
TARGET="${GOS3_ADMIT_TARGET:-main}"
AGENT="${GOS3_AGENT_ID:-${GOS3_AGENT:-}}"
MAX_ATTEMPTS="${GOS3_ADMIT_MAX_ATTEMPTS:-2}"
KEEP_WT="${GOS3_ADMIT_KEEP_WORKTREE:-0}"

shift || true
while (($#)); do
  case "$1" in
    --target) shift; TARGET="${1:-}" ;;
    --target=*) TARGET="${1#*=}" ;;
    --agent) shift; AGENT="${1:-}" ;;
    --agent=*) AGENT="${1#*=}" ;;
    --keep-worktree) KEEP_WT=1 ;;
    *) echo "[GOS3][FAIL] unknown argument: $1" >&2; exit 2 ;;
  esac
  shift || true
done

[[ -n "$SOURCE" ]] || { echo '[GOS3][FAIL] source branch required' >&2; exit 2; }
[[ "$SOURCE" != "$TARGET" ]] || { echo '[GOS3][FAIL] source and target must differ' >&2; exit 2; }
[[ "$SOURCE" != "main" ]] || { echo '[GOS3][FAIL] main cannot be admitted as agent work' >&2; exit 2; }
[[ -n "$AGENT" && "$AGENT" =~ ^[A-Za-z0-9._-]+$ ]] || { echo '[GOS3][FAIL] admitting agent identity required; onboard first' >&2; exit 73; }
[[ "$MAX_ATTEMPTS" =~ ^[1-9][0-9]*$ ]] || { echo '[GOS3][FAIL] invalid retry budget' >&2; exit 2; }

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[[ -n "$ROOT" ]] || { echo '[GOS3][FAIL] not a git repository' >&2; exit 1; }
cd "$ROOT"

# Never hide caller changes. Admission is not allowed to stash/pop or mutate them.
if ! git diff --quiet || ! git diff --cached --quiet || [[ -n "$(git ls-files --others --exclude-standard)" ]]; then
  echo '[GOS3][FAIL] caller worktree dirty; admission refuses to stash/pop or mutate it' >&2
  exit 74
fi

say(){ printf '[GOS3] %s\n' "$*"; }
ok(){ printf '[GOS3][OK] %s\n' "$*"; }
bad(){ printf '[GOS3][FAIL] %s\n' "$*" >&2; }

OP_ID="gos3-admit-$(date -u +%Y%m%dT%H%M%SZ)-${RANDOM}${RANDOM}"
ADMIT_ROOT="${GOS3_ADMIT_ROOT:-${TMPDIR:-/tmp}/gos3-admission}"
mkdir -p "$ADMIT_ROOT"
WT="$ADMIT_ROOT/$OP_ID"
cleanup(){
  if [[ "$KEEP_WT" != 1 && -d "$WT" ]]; then
    git worktree remove --force "$WT" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

say "operation=$OP_ID consumer=$AGENT source=$SOURCE target=$TARGET"
git fetch --prune "$REMOTE" "$SOURCE" "$TARGET"

git show-ref --verify --quiet "refs/remotes/$REMOTE/$SOURCE" || { bad "source branch not found: $SOURCE"; exit 4; }
git show-ref --verify --quiet "refs/remotes/$REMOTE/$TARGET" || { bad "target branch not found: $TARGET"; exit 4; }

for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  say "admission attempt=$attempt/$MAX_ATTEMPTS"
  git fetch --prune "$REMOTE" "$SOURCE" "$TARGET"
  SOURCE_SHA="$(git rev-parse "$REMOTE/$SOURCE")"
  TARGET_SHA="$(git rev-parse "$REMOTE/$TARGET")"
  say "source=$SOURCE_SHA target=$TARGET_SHA"

  rm -rf "$WT"
  git worktree add --detach "$WT" "$SOURCE_SHA" >/dev/null
  cd "$WT"

  if ! git merge-base --is-ancestor "$TARGET_SHA" "$SOURCE_SHA"; then
    bad "source does not contain target ancestry; rebase/sync before admission"
    exit 75
  fi

  for f in docs/GOS3-AGENT-MANIFESTO.md docs/GIT-POLICY.md docs/AGENT-TOOLING-POLICY.md \
           scripts/gos3_git_sync.sh scripts/gos3_agent_proof.sh scripts/gos3_agent_tooling_check.sh; do
    [[ -f "$f" ]] || { bad "required GOS3 artifact missing: $f"; exit 76; }
  done

  mapfile -t changed < <(git diff --name-only "$TARGET_SHA...$SOURCE_SHA")
  say "changed_files=${#changed[@]}"
  [[ ${#changed[@]} -gt 0 ]] || { bad 'no changes to admit'; exit 77; }

  DIFF_TEXT="$(git diff --unified=0 "$TARGET_SHA...$SOURCE_SHA")"
  for pattern in \
    '(^\+.*ghp_[A-Za-z0-9_]+)' \
    '(^\+.*github_pat_[A-Za-z0-9_]+)' \
    '(^\+.*AIza[0-9A-Za-z_-]{20,})' \
    '(^\+.*-----BEGIN .*PRIVATE KEY-----)' \
    '(^\+.*sk-[A-Za-z0-9_-]{20,})'; do
    if printf '%s\n' "$DIFF_TEXT" | grep -Eiq "$pattern"; then
      bad 'candidate diff contains a probable credential/secret pattern'
      exit 78
    fi
  done

  npm run test:gos3
  npm run test:gos3:concurrency
  npm run test:gos3:manifesto
  npm run test:gos3:agent-runtime
  npm run gos3:audit

  git fetch --prune "$REMOTE" "$SOURCE"
  ACTUAL_SOURCE_SHA="$(git rev-parse "$REMOTE/$SOURCE")"
  if [[ "$ACTUAL_SOURCE_SHA" != "$SOURCE_SHA" ]]; then
    bad "source moved during admission: expected=$SOURCE_SHA actual=$ACTUAL_SOURCE_SHA"
    if (( attempt < MAX_ATTEMPTS )); then
      cd "$ROOT"
      git worktree remove --force "$WT" >/dev/null 2>&1 || true
      continue
    fi
    bad 'CAS retry budget exhausted; admission denied'
    exit 79
  fi

  HEAD_SHA="$(git rev-parse HEAD)"
  say "evidence operation=$OP_ID consumer=$AGENT source=$SOURCE source_sha=$SOURCE_SHA target=$TARGET target_sha=$TARGET_SHA inspected_head=$HEAD_SHA"
  ok 'GOS3 admission PASSED; candidate is safe to consume subject to normal PR/branch protection'
  printf '%s\n' '[GOS3] ADMISSION COMPLETE' "[GOS3] operation=$OP_ID" "[GOS3] consumer=$AGENT" "[GOS3] source=$SOURCE" "[GOS3] source_sha=$SOURCE_SHA" "[GOS3] target=$TARGET" "[GOS3] target_sha=$TARGET_SHA" "[GOS3] action=pull-admit-only"
  exit 0
done

bad 'unreachable admission state'
exit 80
