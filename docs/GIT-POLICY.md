# GOS3 Git Policy — Single Source of Truth

**Status:** REQUIRED
**Scope:** all human and agent sessions working on this repository
**Branch:** `main`

## 1. Core rule

`main` is a shared trunk. No session may assume that `origin/main` is unchanged since its last fetch.

**Before every push, synchronize first.**

Required sequence:

```bash
git fetch origin
git rebase origin/main
git push origin main
```

If the working tree is dirty, preserve it before synchronization:

```bash
git stash push -u -m "GOS3 pre-sync: preserve multi-session work"
git fetch origin
git rebase origin/main
git push origin main
git stash pop
```

Never use `git push --force` on `main`.

## 2. Commit-before-sync rule

A session must not run `git pull --rebase` while it has unstaged/uncommitted work. The work must either be committed as a coherent unit or stashed with `-u` before synchronization.

## 3. Push gate

A push is allowed only when:

1. local changes are preserved;
2. `origin/main` has been fetched immediately before push;
3. local `main` has been rebased onto the fetched `origin/main`;
4. the working tree is in the expected state;
5. tests relevant to the change pass;
6. no secrets or generated junk are intentionally staged.

## 4. Divergence handling

If `git push` reports `non-fast-forward`, **do not force push**.

Run:

```bash
git stash push -u -m "GOS3 pre-sync: recover after push rejection"
git fetch origin
git rebase origin/main
git push origin main
git stash pop
```

If rebase conflicts occur, stop and resolve them explicitly. Do not discard another session's commits.

## 5. Multi-session ownership

All sessions — Claude, Gais/Gemini, GPT, human PO, or other GOS3 agents — follow this exact policy. There is no privileged "master developer" that may skip synchronization.

The role distinction is governance, not Git safety:

- **PO:** authorizes protected/spec/security changes.
- **Proposer/agent:** implements an authorized change.
- **Any session:** must synchronize before publishing.

## 6. Stash discipline

Never blindly run `git stash pop` if the tree has changed since the stash was created. Inspect first:

```bash
git status --short
git stash list
git diff
```

When the stash contains unrelated work from another session, keep it intact and separate it into a later commit.

## 7. Generated/untracked artifacts

Do not stage arbitrary shell output, temporary files, backups, `.orig`, `.rej`, package backups, or command transcript fragments merely to make the tree clean.

Examples from previous incidents include files resembling:

- `*.bak.*`
- `*.orig`
- `*.rej`
- command-output fragments
- temporary test output

Inspect and classify before adding.

## 8. Preferred one-command automation

For routine publishing, use a repository-local gate script when available. It must implement the same invariant:

```text
preserve dirty work
→ fetch origin
→ rebase origin/main
→ validate
→ push
→ restore preserved work
```

Automation must fail closed on conflicts, failed tests, or ambiguous state. It must never force-push `main`.

## 9. Rationale

GitHub rejects non-fast-forward pushes when the remote contains commits that the local branch does not contain, specifically to prevent loss of remote history. Fetching and integrating the remote work before pushing is the required safety boundary.

This policy exists because multiple GOS3 sessions can commit concurrently. The remote repository is the shared coordination point; every publisher must synchronize against it immediately before publication.
