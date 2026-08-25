# GOS3 Agent Tooling Policy — 18 Friends

**Status:** REQUIRED
**Scope:** every GOS3 agent/session participating in xAI/Vortex work

## Objective

Every GOS3 friend must be operationally capable of:

1. Git locally (`git fetch`, `rebase`, `status`, `diff`, `commit`, `push`, conflict recovery).
2. GitHub API access through an authenticated GitHub identity or approved GitHub connector.
3. GitHub MCP Server / GitHub MCP connector, including tool discovery and safe invocation.
4. The project's MCP Server connector, including discovery, invocation, result/evidence handling, and failure reporting.
5. Google Cloud through the `gcloud` connector/CLI, authenticated as that friend's own Google/Gmail identity when user credentials are appropriate.

This is a **capability contract**, not a shared credential contract.

## Identity and credential rule

Each friend uses their own authorized GitHub identity and their own Google identity. Credentials, OAuth tokens, PATs, ADC files, cookies, service-account keys, and refresh tokens MUST NOT be copied between friends or committed to the repository.

For local Google development, `gcloud auth login` authenticates the gcloud CLI and `gcloud auth application-default login` configures Application Default Credentials. These are distinct credential stores and may use the same Google account. Production workloads should prefer an attached service account / workload identity with least privilege rather than exported user credentials.

## Required Git capability

Before publishing any change, the friend must know and follow `docs/GIT-POLICY.md` and use the repository publish gate when available.

Minimum practical proof:

```bash
git status
git fetch origin
git rebase origin/main
git log --oneline -5
```

A non-fast-forward push is never solved with `git push --force` on `main`.

## Required GitHub API capability

The friend must be able to authenticate and perform a harmless read against the repository using either GitHub CLI/API or the approved GitHub connector.

Examples:

```bash
gh auth status
gh api repos/scoobiii/xAI --jq '.full_name'
```

Never print or paste access tokens into chat, issues, logs, commits, or test fixtures.

## Required GitHub MCP capability

The friend must be able to:

- connect/authenticate the GitHub MCP Server;
- list/discover available tools;
- identify the correct tool before acting;
- perform a harmless repository read;
- distinguish read from write operations;
- request/obtain human approval for consequential writes where the host requires it;
- report tool errors instead of improvising destructive Git operations.

## Required project MCP Server capability

The friend must be able to connect to the GOS3/xAI MCP Server connector and demonstrate:

- server connection;
- tool discovery;
- one read-only invocation;
- one controlled execution path when authorized;
- capture of result/evidence metadata;
- correct handling of timeout/error/denied execution.

## Required Google Cloud capability

When the friend is assigned Google Cloud work, they must authenticate with their own authorized Google/Gmail identity:

```bash
gcloud auth login
gcloud auth list
gcloud config list account project
```

For local client libraries requiring ADC:

```bash
gcloud auth application-default login
gcloud auth application-default print-access-token >/dev/null
```

The Google account must have only the IAM permissions required for the assigned task. A Gmail address is an identity; it does not by itself grant access to a Cloud project.

## Connector capability matrix

| Capability | Required | Proof |
|---|---:|---|
| Git CLI | YES | status/fetch/rebase test |
| GitHub API | YES | authenticated repository read |
| GitHub connector | YES | connector discovery + read |
| GitHub MCP Server | YES | tools/list + harmless read |
| Project MCP Server connector | YES | discovery + read + evidence |
| gcloud CLI/connector | YES when assigned | account/project identity check |
| Gmail/Google identity | YES for Cloud work | own authorized account |
| Shared credentials | NO | must fail audit |
| Force push main | NO | must fail audit |

## Agent onboarding gate

A friend is **TOOLING READY** only after their environment passes the repository-local tooling audit. The audit must be run at onboarding and whenever connector/authentication configuration changes.

The audit checks capability and configuration presence; it does not require or expose secrets.

```bash
./scripts/gos3_agent_tooling_check.sh
```

The GOS3 roster is dynamic. Do not hard-code a provider list into runtime behavior. The number "18" is the current onboarding target, not a permanent protocol constant.

## Failure policy

If a friend lacks one of the required capabilities:

- mark that capability `BLOCKED`;
- do not fake tool execution or claim authentication succeeded;
- do not borrow another friend's credentials;
- do not bypass the Git publish gate;
- report the exact missing connector/tool and remediation needed.

The PO may authorize exceptions for a specific task, but exceptions must be explicit and must not weaken the `main` Git safety invariant.
