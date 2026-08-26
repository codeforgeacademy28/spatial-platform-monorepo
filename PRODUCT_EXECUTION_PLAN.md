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
- `main` now contains PR #27 after verified integration.
- Production deployment is READY from commit `092b2b6b8b0f99999a265e5b23899d307e6156d9`.
- Engineering Gate passes clean install, dependency graph, strict web type-check, forced production build, core snapshot tests, and geometry tests.
- Repository and Vercel project are aligned on **Node 24.x**.
- Canonical dependency graph uses `@react-three/xr 6.6.30`; stale v5 lock state is gone.
- The latest blank-screen issue was traced to unsafe Vite `manualChunks` grouping of Zod/Zustand into `state-vendor`, producing a production module initialization cycle: `Cannot access 'Te' before initialization`.
- The unsafe manual vendor chunking was removed; the verified preview built successfully and production `main` now serves the corrected bundle.
- User-reported `background.js` / tab/window errors are browser-extension noise, not application failures; they are separate from the real `state-vendor` application error.
- Non-blocking warnings remain: package deprecations and two npm audit findings.

## Work already integrated from PR #27
- immutable/deep-cloned version snapshots
- explicit version history and A/B comparison selection
- room detection tolerance/topology improvements
- room selection and 3D wall highlighting
- XR locomotion and teleport-pointer setup
- explicit Three.js alias/dedupe
- favicon
- deterministic build/runtime foundation
- persistence truthfulness and durability contract
- workflow state machine and scale calibration
- accessibility/responsive hardening
- XR capability gating
- production blank-screen fix

## Existing backlog consolidation
Historical issues #6–25 remain evidence/backlog references. New work is governed here to avoid duplicate implementation.

## Goal hierarchy and mandatory gates

### G1 — Deterministic engineering foundation
**Status: ✅ COMPLETE**

- XR v6 compatibility blockers fixed.
- Dependency and Three.js resolution stabilized.
- Engineering Gate covers lockfile, clean install, runtime graph, strict type-check, forced web build, core snapshot tests, and geometry tests.
- Node baseline matches the deployed Vercel project: 24.x.

### G2 — Product workflow and interaction quality
**Status: ✅ COMPLETE (code/static gates)**

#### G2.1 — Explicit workflow state machine
**Status: ✅ COMPLETE (static; browser acceptance remains release gate)**
`Upload → Calibrate → Trace Walls → Validate Rooms → Review 3D → Spatial/AR` is explicit and prerequisite-driven.

#### G2.2 — Blueprint and scale UX
**Status: ✅ COMPLETE (static; browser acceptance remains release gate)**
Real two-point calibration replaces the old fixed-pixel assumption.

#### G2.3 — 2D-to-3D geometry contract
**Status: ✅ COMPLETE**
4/4 focused geometry tests pass; a real 4×4 room-area topology defect was fixed from 8 m² to 16 m²; canonical wall centerline and model-center framing are enforced.

#### G2.4 — Predictable 3D interaction
**Status: ✅ COMPLETE**
Explicit `navigate` / `comment` modes; normal navigation never prompts; read-only views cannot comment; comment mode exits after successful placement.

#### G2.5 — Persistence, versions, compare, share, revert
**Status: ✅ COMPLETE (code/contract gate)**
- immutable `cloneProject()` helper and snapshot test
- durable failures return HTTP 503
- explicit tenant/org/owner persistence contract
- publish requires durable persistence
- shared reads can recover from Supabase after process restart
- local browser recovery remains available when server persistence fails

**External release gate:** provision real Supabase tenant/org/owner context and verify save → restart → share read against the deployed environment.

#### G2.6 — Production UX, accessibility and performance
**Status: ✅ COMPLETE (static)**
Implemented:
- visible keyboard focus treatment
- disabled-state affordances
- reduced-motion handling
- narrow-screen responsive layout
- safe dependency resolution instead of unsafe manual vendor chunking
- successful production deployment after the blank-screen correction

## G3 — Spatial/AR and release confidence
**Status: 🟡 IN PROGRESS**

### G3.1 — XR capability gate
**Status: ✅ COMPLETE (static)**
- immersive AR support is queried through `navigator.xr.isSessionSupported('immersive-ar')`
- unsupported browsers no longer present an enabled AR action
- support state is visible in the XR status panel
- session-start errors are surfaced in the UI
- desktop Spatial mode continues to work without WebXR

### G3.2 — Browser-first Spatial navigation
**Status: ✅ IMPLEMENTED / BROWSER ACCEPTANCE REQUIRED**
Desktop Spatial View includes keyboard movement without WebXR:
- `W/A/S/D`
- arrow keys
- camera/orbit controls

This is the normal fallback experience; WebXR is progressive enhancement rather than a prerequisite for using Spatial View.

### G3.3 — XR lifecycle and hardware acceptance
**Status: 🟡 HARDWARE GATE**
Verify on a WebXR-capable device/browser:
- enter/exit immersive AR
- controller tracking status changes
- left-stick locomotion
- snap turning
- teleport pointer
- renderer/context recovery after tab backgrounding or session end
- no crash when immersive AR is unavailable

### G3.4 — End-to-end browser verification matrix
**Status: 🟡 READY**
1. Upload blueprint.
2. Calibrate using known 4 m reference.
3. Trace a closed 4×4 room.
4. Confirm room validation reports one room / 16 m².
5. Open Review 3D and verify walls/floor are visible and centered.
6. Confirm ordinary 3D navigation never prompts for comments.
7. Enter explicit Comment mode and place one pin; verify automatic return to navigation.
8. Save, mutate, reload, compare versions A/B, and revert.
9. Publish and load the share URL after API restart when Supabase is configured.
10. Enter Spatial View on desktop and exercise WASD/arrow movement.
11. On WebXR hardware, run the XR lifecycle checklist above.
12. Check narrow viewport layout and keyboard navigation.

**Environment limitation:** this agent environment has Chromium but its sandbox blocks outbound site navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`, so automated interactive browser verification cannot be honestly marked passed here. No browser extension can remove that infrastructure-level restriction. A normal user browser is the intended final interactive verification environment.

### G3.5 — Production release confidence
**Status: 🟡 IN PROGRESS**
- PR #27 is merged into `main`.
- Production Vercel deployment for merge commit `092b2b6` is READY.
- Production root URL returns HTTP 200.
- Vercel production runtime error query shows no error/fatal logs in the post-release window.
- Remaining gates are real browser interaction, Supabase durable persistence verification, and WebXR hardware lifecycle verification.

## Execution protocol — token/time efficient
1. Work on one goal at a time.
2. Retrieve only files required for the current task.
3. Batch coherent edits; avoid speculative unrelated changes.
4. Verify cheaply first: type-check → package build → browser → deployment.
5. Never use Vercel to discover a local compiler error.
6. Reuse passed evidence unless changed files invalidate it.
7. Reserve production changes for the verified release candidate.
8. Update this document after each verification gate before moving on.
9. Preserve merged product behavior unless an acceptance test proves it broken.
10. Do not create more GitHub issues for ordinary subtasks; this document is the execution source of truth.

## Decision log
- **2026-08-26:** Keep XR v6 rather than downgrade to v5; PR #27 is designed around the v6 store API.
- **2026-08-26:** Do not force one Zustand major; the single-runtime requirement applies to Three.js.
- **2026-08-26:** G2.3 uncovered and fixed a genuine room-area topology bug.
- **2026-08-26:** G2.4 makes commenting explicit rather than hijacking normal 3D navigation.
- **2026-08-26:** Durable persistence is a contract plus an external provisioning gate; no synthetic tenant identity is permitted.
- **2026-08-26:** Align CI/repository Node baseline with the actual Vercel project setting at Node 24.x to eliminate runtime drift.
- **2026-08-26:** Immersive AR is capability-gated before exposing the action; hardware lifecycle remains an explicit acceptance gate.
- **2026-08-26:** Do not manually split Zod/Zustand into a vendor chunk unless the dependency graph proves the split cannot create evaluation cycles; the production blank screen demonstrated the risk.
- **2026-08-26:** Treat browser-extension `background.js` tab/window errors as external noise unless they reproduce with extensions disabled.
- **2026-08-26:** PR #27 was integrated into `main` only after reconciling the five-commit divergence from `main` and restoring a mergeable branch state.

## Status board
| Goal | Status | Verification |
|---|---|---|
| G1 Deterministic foundation | ✅ COMPLETE | engineering gate |
| G2.1 Workflow state | ✅ COMPLETE (static) | engineering gate + source verification |
| G2.2 Calibration UX | ✅ COMPLETE (static) | engineering gate + source verification |
| G2.3 2D/3D geometry | ✅ COMPLETE | engineering gate + 4/4 geometry tests |
| G2.4 3D interaction | ✅ COMPLETE | engineering gate |
| G2.5 Persistence contract | ✅ COMPLETE | engineering gate + core snapshot test |
| G2.5 Durable deployment | 🟡 EXTERNAL GATE | Supabase provisioning/auth context |
| G2.6 UX/accessibility/performance | ✅ COMPLETE | successful Vercel production deployment |
| G3.1 XR capability gate | ✅ COMPLETE | capability check + successful build |
| G3.2 Browser Spatial navigation | ✅ IMPLEMENTED | keyboard movement source verification |
| G3.3 XR lifecycle | 🟡 HARDWARE GATE | WebXR device/browser required |
| G3.4 Browser matrix | 🟡 READY | run from a normal browser |
| G3.5 Production confidence | 🟡 IN PROGRESS | main deployment READY + runtime logs clean |

## Current next action
**Run the G3.4 browser matrix in a normal desktop browser, verify Supabase durable save/restart/share, and then run the G3.3 XR checklist on a capable device. No new code expansion is justified until those release gates produce evidence.**
