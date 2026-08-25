# Product Execution Plan

## North Star
Ship a reliable, professional blueprint-to-spatial editor: upload a blueprint, calibrate its scale, trace canonical wall geometry, validate rooms, review the generated 3D model, save/version/share safely, and present the result in a stable Spatial/AR experience.

## Product principles
1. **Canonical geometry first** — `Project.walls` is the source of truth; rooms are derived/validated metadata.
2. **Deterministic engineering** — manifests, lockfile, runtime versions, and bundler resolution must agree.
3. **Explicit workflow** — every stage has a visible state, prerequisite, feedback, and exit condition.
4. **Non-destructive editing** — local recovery, immutable versions, revert, and safe comparison are required.
5. **Predictable 3D interaction** — navigation must never accidentally invoke editing/commenting.
6. **Progressive enhancement** — desktop 3D works without WebXR; immersive AR is capability-gated.
7. **Evidence before expansion** — do not start the next goal until the current verification gate passes.

## Current state and evidence
- Branch: `fix/editor-workflow-persistence-and-spatial`
- Open PR: #27 — comparison integrity, room validation/highlighting, XR locomotion, single Three.js runtime, favicon.
- Umbrella product issue: #28.
- Engineering gate passes clean install, critical dependency graph, strict web type-check, forced web production build, core snapshot tests, and geometry contract tests on Node 22.
- Canonical dependency graph uses `@react-three/xr 6.6.30`; stale v5 lock state is gone.
- Vercel Hobby previously reported `api-deployments-free-per-day` (>100); reserve new Vercel deployment attempts for the release candidate.
- Non-blocking warnings remain: package deprecations and two npm audit findings.

## Work already in PR #27 — preserve unless verification proves it wrong
- immutable/deep-cloned version snapshots
- explicit version history and A/B comparison selection
- room detection tolerance/topology improvements
- room selection and 3D wall highlighting
- XR locomotion and teleport-pointer setup
- explicit Three.js alias/dedupe
- favicon

## Existing backlog consolidation
Historical issues #6–25 remain evidence/backlog references. New work is governed here to avoid duplicate implementation.

## Goal hierarchy and mandatory gates

### G1 — Deterministic engineering foundation
**Status: ✅ COMPLETE**

### G2 — Product workflow and interaction quality
**Outcome:** a first-time user can complete the six-stage workflow without guessing.

#### G2.1 — Explicit workflow state machine
**Status: ✅ COMPLETE (static gate; browser matrix pending)**

#### G2.2 — Blueprint and scale UX
**Status: ✅ COMPLETE (static gate; browser matrix pending)**

#### G2.3 — 2D-to-3D geometry contract
**Status: ✅ COMPLETE (static gate; browser matrix pending)**
- 4/4 focused geometry tests pass.
- A real room-area topology bug was fixed.
- Canonical wall centerline and true model camera target are enforced.

#### G2.4 — Predictable 3D interaction
**Status: ✅ COMPLETE (static gate; browser matrix pending)**
- explicit `navigate` / `comment` modes
- normal navigation never prompts for comments
- read-only viewer has no comment mode
- comment mode auto-exits after placement

#### G2.5 — Persistence, versions, compare, share, revert
**Status: ✅ COMPLETE (code/contract gate; external Supabase provisioning is a release gate)**
Implemented:
- immutable reusable `@spatial/core` `cloneProject()` helper
- core snapshot contract test passes
- durable-mode API failures return HTTP 503 instead of falsely reporting success
- durable persistence requires explicit tenant/org/owner context
- server-owned single-workspace context can be supplied through environment variables
- publish/share requires durable persistence
- shared reads can recover from Supabase after API process restart
- web client refuses to treat `local-only` server responses as durable saves
- local browser recovery remains available when server persistence fails

External release gate still required:
- provision valid Supabase organization/user/tenant records
- set `SUPABASE_PERSISTENCE_ENABLED=true`
- configure authenticated/request or server-owned persistence context
- verify real save → restart → share read path against the deployment

#### G2.6 — Production UX, accessibility, and performance
**Status: IN PROGRESS**
Goals:
- remove accidental browser/default control behavior
- make primary actions discoverable and keyboard reachable
- improve focus, disabled, loading, error, and empty states
- keep overlays from stealing 3D pointer events
- improve responsive layout
- reduce oversized production chunks without premature micro-optimization

Initial findings:
- production build reports several large chunks above 500 kB
- some action controls are visually dense and duplicated between header/sidebar
- 2D canvas workflow is clear but still needs browser-level feedback validation

Gate:
- strict build remains green
- keyboard/focus states are implemented in source
- production chunk strategy is intentional and documented
- browser matrix confirms no primary interaction is blocked

**G2 exit:** all workflow, persistence contract, UX, and interaction gates green; external Supabase/browser verification remains part of release confidence.

### G3 — Spatial/AR and release confidence
**Status: BLOCKED BY G2**
- capability gate
- XR lifecycle/stability
- compact browser verification matrix
- release candidate gate

## Execution protocol — token/time efficient
1. Work on one goal at a time.
2. Retrieve only files required for the current task.
3. Batch coherent edits; avoid speculative unrelated changes.
4. Verify cheaply first: type-check → package build → browser → deployment.
5. Never use Vercel to discover a local compiler error.
6. Reuse passed evidence unless changed files invalidate it.
7. Reserve Vercel for the final release candidate because deployment quota is scarce.
8. Update this document after each verification gate before moving on.
9. Preserve PR #27 work unless an acceptance test proves it broken.
10. Do not create more GitHub issues for ordinary subtasks; this document is the execution source of truth.

## Decision log
- **2026-08-26:** Keep XR v6 rather than downgrade to v5; PR #27 is already designed around the v6 store API.
- **2026-08-26:** Node 22 is the engineering baseline.
- **2026-08-26:** Do not force one Zustand major; the single-runtime requirement applies to Three.js.
- **2026-08-26:** Existing PR #27 changes are treated as in-progress product work, not duplicated tasks.
- **2026-08-26:** G2.3 uncovered and fixed a genuine room-area topology bug.
- **2026-08-26:** G2.4 makes commenting explicit rather than hijacking normal 3D navigation.
- **2026-08-26:** Durable persistence is treated as a contract plus an external provisioning gate; no synthetic tenant identity is permitted.

## Status board
| Goal | Status | Verification |
|---|---|---|
| G1 Deterministic foundation | ✅ COMPLETE | clean install + graph + strict TS + forced build |
| G2.1 Workflow state | ✅ COMPLETE (static) | engineering gate |
| G2.2 Calibration UX | ✅ COMPLETE (static) | engineering gate + source verification |
| G2.3 2D/3D geometry | ✅ COMPLETE (static) | engineering gate + 4/4 geometry tests |
| G2.4 3D interaction | ✅ COMPLETE (static) | engineering gate |
| G2.5 Persistence contract | ✅ COMPLETE | engineering gate + core snapshot test |
| G2.5 Durable deployment | 🟡 EXTERNAL GATE | requires Supabase provisioning/auth context |
| G2.6 UX/accessibility/performance | IN PROGRESS | source hardening + browser gate |
| G3 Spatial/AR | BLOCKED BY G2 | capability/XR/browser gates |
| Release | BLOCKED | final browser + Vercel candidate gate |

## Current next action
**Complete G2.6 only:** harden accessibility, responsive behavior, pointer-event layering, action hierarchy, and production chunk strategy. Then run the compact browser matrix once deployment quota is available.
