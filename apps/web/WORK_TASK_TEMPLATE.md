# Spatial Platform Work Task Contract

Every defect or feature must be communicated and implemented as a small, independently verifiable task.

## Task format

**Task ID:** `T-XX`

**Goal:** One sentence describing the user-visible result.

**Scope:** The smallest set of files/modules expected to change.

**Non-goals:** Explicitly state what is not being changed in this task.

**Implementation:** 3–6 concrete steps.

**Acceptance criteria:** Observable pass/fail checks. Prefer exact UI behavior, network request, or console condition.

**Validation:** One local/browser check and one deployed check where applicable.

**Deployment dependency:** State whether frontend, API, Render/Vercel configuration, browser/device, or another external system must be deployed before the task can be marked complete.

**Status:** `Planned` → `In Progress` → `Code Complete` → `Preview Verified` → `Production Verified` → `Closed`.

## Communication rule

Do not combine unrelated bugs into one task. Finish and validate the current task before starting the next task unless the tasks share a direct blocker.

## Release gate

A task is not considered complete because code was committed. It must satisfy its acceptance criteria and the required deployment dependency.
