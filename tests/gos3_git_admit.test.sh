#!/usr/bin/env bash
set -euo pipefail

fail(){ echo "FAIL: $*" >&2; exit 1; }
ok(){ echo "PASS: $*"; }

[[ -f scripts/gos3_git_admit.sh ]] || fail 'admission script missing'
grep -q 'git worktree add --detach' scripts/gos3_git_admit.sh || fail 'isolated worktree missing'
grep -q 'CAS retry budget exhausted' scripts/gos3_git_admit.sh || fail 'CAS fail-closed missing'
grep -q 'never.*stash/pop\|stash/pop' scripts/gos3_git_admit.sh || fail 'stash prohibition missing'
grep -q 'force-push\|force' scripts/gos3_git_admit.sh || fail 'force-push protection missing'
grep -q 'test:gos3:manifesto' scripts/gos3_git_admit.sh || fail 'manifesto gate missing'
grep -q 'test:gos3:agent-runtime' scripts/gos3_git_admit.sh || fail 'runtime gate missing'
grep -q 'gos3:audit' scripts/gos3_git_admit.sh || fail 'traceability gate missing'

# Admission must fail closed before any remote mutation when identity is absent.
if GOS3_AGENT_ID='' bash scripts/gos3_git_admit.sh feat/nonexistent >/tmp/gos3-admit.out 2>&1; then
  cat /tmp/gos3-admit.out
  fail 'admission accepted without consumer identity'
fi
grep -q 'admitting agent identity required' /tmp/gos3-admit.out || fail 'missing identity BLOCK reason'

# Admission must reject a dirty caller worktree before touching a worktree.
tmp="admission-test-$$"
printf 'dirty\n' > "$tmp"
trap 'rm -f "$tmp"' EXIT
if GOS3_AGENT_ID=test-agent bash scripts/gos3_git_admit.sh feat/nonexistent >/tmp/gos3-admit-dirty.out 2>&1; then
  cat /tmp/gos3-admit-dirty.out
  fail 'admission accepted dirty caller worktree'
fi
rm -f "$tmp"
grep -q 'caller worktree dirty' /tmp/gos3-admit-dirty.out || fail 'missing dirty-worktree BLOCK reason'

ok 'GOS3 fail-closed pull/admission contract'
