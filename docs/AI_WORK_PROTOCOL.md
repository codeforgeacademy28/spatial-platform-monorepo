# AI Work / Chat-Resumption Protocol

## Purpose
Prevent conversation limits from interrupting engineering work. The repository, not the chat transcript, is the durable source of truth.

## Mandatory resumption sequence
A new chat/agent must:
1. Read `CONTINUATION.md`.
2. Read `PRODUCT_EXECUTION_PLAN.md`.
3. Read `docs/PROJECT_STATE.md`.
4. Inspect the active branch and open PR named in `CONTINUATION.md`.
5. Verify the last claimed gate from CI/Vercel before making new changes.
6. Continue from the **Current active gate / Immediate blocker / What to verify next** sections.

## Goal-driven execution
Use this hierarchy:

**North Star → Goal → Tasks → Acceptance → Verification → State update → Next goal.**

Never start a second implementation goal while the current goal is failing its verification gate, unless the second change is a prerequisite fix for that same gate.

## Token-efficient engineering
- Read only the files needed for the active goal.
- Prefer PR diffs and focused file ranges over entire repositories.
- Reuse existing CI/build evidence until changed files invalidate it.
- Never use Vercel to discover errors that local/CI type-check can catch.
- Batch coherent documentation updates.
- Avoid repeated broad repository searches.
- Keep one active implementation goal at a time.

## Required state persistence after meaningful work
Every meaningful implementation or discovered blocker must update:
- code/commit;
- `PRODUCT_EXECUTION_PLAN.md` status and next task;
- `CONTINUATION.md` current commit, gate, blocker, and next action;
- `docs/PROJECT_STATE.md` when architecture/behavior/rules materially change.

## Required verification language
Use explicit states:
- `PLANNED`
- `IMPLEMENTED`
- `BUILD GREEN`
- `BROWSER GATE REQUIRED`
- `HARDWARE GATE REQUIRED`
- `RELEASE READY`
- `BLOCKED`

Never convert `BUILD GREEN` into `RELEASE READY` without the required browser/device checks.

## Regression discipline
When a new change breaks a previously working capability:
1. Stop feature expansion.
2. Identify the last known-good state.
3. Create a recovery goal.
4. Restore the old behavior in isolation.
5. Verify it.
6. Add the new capability as a separate goal.

## Conversation handoff rule
When a chat is nearing its practical limit, the agent must first update the continuation packet and state docs. The next chat can then resume by reading the repository packet even though the transcript itself is unavailable.

## Minimal user handoff
The user should only need to provide the repository/branch reference (or ask to continue the Spatial Platform work). The agent should derive the active task from the repository state rather than asking the user to re-explain the project history.

## Security / truthfulness
Never store secrets, tokens, passwords, or private credentials in the continuation docs. Record identifiers, commits, task status, contracts, and verification evidence only.
