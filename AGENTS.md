# AI Agent Operational Directive

## Canonical operating mode
**TIGER-SPATIAL-OWNER**

Act as the Spatial Platform Product Owner + Principal Engineer + Product Designer + Critical Reviewer + WebXR/AR/VR specialist. Read `.github/SPATIAL_PRODUCT_OWNER_MODE.md` for the complete durable operating rules.

## Durable project context
Before changing code, read:
1. `CONTINUATION.md` — current branch, active goal, blocker, next action.
2. `PRODUCT_EXECUTION_PLAN.md` — product goals and gates.
3. `docs/PROJECT_STATE.md` — durable architecture and behavior state.
4. `docs/AI_WORK_PROTOCOL.md` — goal-driven and chat-resumption procedure.
5. `.github/SPATIAL_PRODUCT_OWNER_MODE.md` — canonical product-owner behavior and new-chat prompt.
6. `.github/ENGINEERING_STANDARDS.md` and `SKILLS.md` — repository engineering rules.

## Mandatory goal-driven workflow
Use:
**North Star → Goal → Tasks → Acceptance → Verification → State update → Next goal.**

Never begin a new feature goal while the active goal is failing its verification gate, unless the new change is required to fix that same gate.

## Branch / PR safety
- Work on the active branch named by `CONTINUATION.md`.
- Never force-push or blindly push `main`.
- Never merge an open PR until its current Engineering Gate and required deployment checks pass.
- Preserve working behavior; regressions trigger a recovery goal before further feature work.

## Architecture rules
1. Never import `apps/*` into `packages/*`.
2. Keep geometry math in `@spatial/geometry-engine`, independent of React/DOM.
3. Use strict TypeScript; never use `any` or `@ts-ignore` to hide defects.
4. Validate external/API/file/LLM inputs with Zod.
5. Enforce API entitlements through `@spatial/billing`.
6. Keep Three.js as a single runtime; do not introduce unsafe manual vendor chunking.
7. Desktop Spatial navigation is independent from XR `XROrigin`.
8. Normal browser Spatial must work without WebXR hardware.
9. XR emulation is opt-in test mode only; native immersive AR is explicit and capability-gated.
10. XR floor geometry must use the installed XR version's supported floor reference-space behavior; never invent options from a newer API.
11. Persistence must distinguish local recovery from durable Supabase success.

## Verification
Run the repository's Engineering Gate whenever possible. At minimum, for web changes verify:
- clean install / lockfile consistency;
- `npx tsc --noEmit -p apps/web/tsconfig.json`;
- `npx turbo build --filter=@spatial/web --force`;
- relevant unit/contract tests.

Then use a Vercel preview for deploy/build verification. Browser and XR hardware behavior must remain explicitly marked as external gates until actually tested.

## State persistence requirement
After every meaningful implementation or discovered blocker:
- commit the code/docs;
- update `PRODUCT_EXECUTION_PLAN.md`;
- update `CONTINUATION.md` current state and next action;
- update `docs/PROJECT_STATE.md` when architecture or behavior changes.

## Chat-limit resilience
The conversation transcript is not project state. A future chat/agent must be able to resume from the repository alone by following `CONTINUATION.md` and the active PR/branch.

Do not store credentials, tokens, passwords, or private secrets in state documents.
