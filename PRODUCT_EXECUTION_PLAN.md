# Product Execution Plan

## North Star
Ship a reliable, professional blueprint-to-spatial editor: upload a blueprint, calibrate its scale, trace canonical wall geometry, validate rooms, review the generated 3D model, save/version/share safely, and present the result in a stable Spatial/AR experience.

## Operating mode
Canonical project mode: `TIGER-SPATIAL-OWNER`.
Read `.github/SPATIAL_PRODUCT_OWNER_MODE.md` in every new chat/agent session.

## Regression recovery — R2
Purpose: restore the last known-good Spatial experience first, then add new controls one capability at a time.

### R2.1 — Desktop locomotion
**Status: ✅ BUILD GREEN / BROWSER GATE REMAINS**
- Desktop camera owns WASD/arrows; XROrigin is not used for browser movement.
- Keyboard movement is camera-relative and updates the orbit target with the camera.

### R2.2 — Wall collision
**Status: 🟢 BUILD GREEN / BROWSER GATE REMAINS**
- Visible `Wall collision: ON/OFF` control; default ON.
- Canonical wall-segment clearance lives in `@spatial/geometry-engine`.
- Swept substep movement prevents one-frame tunneling across thin walls.
- Full diagonal movement is now collision-tested first; only a safe axis slide is allowed when the combined path is blocked.
- Engineering Gate #99 passed the established geometry contract tests on commit `3a5af4cbedc7cc8f85327052699cf96ee9efff2d`.
- READY Vercel deployment `dpl_BB2kj3rRjWQvwywws1h8g3Q3pNoe` was reachable through the Vercel integration with HTTP 200.
- The latest agent run could not establish interactive browser automation; user-visible movement/collision therefore remains unverified.
- OFF enables free inspection; real browser acceptance remains required.

### R2.3 — Explicit AR + XR test mode / framing / floor alignment
**Status: 🟢 BUILD GREEN / BROWSER-XR GATE REQUIRED**
Goal: keep native AR explicit, keep browser Spatial independent from XR, make browser XR emulation safe to test, and ensure authored floor geometry is horizontal in XR.

Implemented:
- `offerSession: false` — no automatic session request.
- `enterGrantedSession: false` — no automatic re-entry of granted sessions.
- Native AR remains behind capability-gated `Start Immersive AR`.
- `?xrTest=1` / Controller Test Mode explicitly enables XR emulation.
- Test mode never auto-starts a session.
- XR player remains controlled by `XROrigin`.
- Installed XR v6 source verified that immersive session initialization requests `local-floor` by default.
- Unsupported newer `originReferenceSpace` and `<XR referenceSpace>` APIs are not used.
- Engineering Gate #99 passed on the current implementation line.
- Native WebXR is unavailable in the current agent environment, so native AR/floor/controller/locomotion/resize behavior remains an external hardware/browser gate.

### 2026-09-02/03 browser/XR acceptance attempt
- Candidate implementation head: `3a5af4cbedc7cc8f85327052699cf96ee9efff2d`.
- READY deployment: `dpl_BB2kj3rRjWQvwywws1h8g3Q3pNoe`; Vercel integration fetched the preview root with HTTP 200 at approximately **2026-09-02 22:31 IST**.
- `agent-browser` executable was unavailable; `npx --yes agent-browser --version` timed out after 30 seconds. No interactive browser session was established.
- Container DNS could not resolve the Vercel hostname; the Vercel integration could resolve/fetch it. This is recorded as an automation/environment limitation, not an application defect.
- No R2.2/R2.3 interactive acceptance item is promoted to PASS from this attempt.

### R2.4 — Combined regression gate
**Status: 🔴 BLOCKED BY R2.2 + R2.3 BROWSER/XR ACCEPTANCE**
Before merge, all of these must work together:
- Spatial entry;
- WASD;
- arrow keys;
- orbit/zoom;
- wall collision ON/OFF;
- full diagonal movement does not cross walls;
- AR button visible;
- XR test mode explicit;
- native AR capability gate;
- horizontal floor alignment in XR;
- stable controller framing;
- no automatic session race;
- no repeated `iwer onDeviceFrame` loop in normal Spatial.

## P1 — Performance follow-up
**Status: 🟡 PLANNED / AFTER FUNCTIONAL GATES**
Goal: reduce initial JavaScript payload without creating module-initialization cycles.

Tasks:
1. Identify why large furniture/room assets are in the initial bundle.
2. Dynamic-import heavy asset/scene modules where UX permits.
3. Measure initial bundle and first Spatial entry cost before/after.
4. Keep the main application runtime dependency graph intact.
5. Verify no regression of the previous blank-screen `Cannot access 'Te' before initialization` defect.

## Durable chat-resumption architecture
The repo now contains:
- `CONTINUATION.md` — compact resume packet with branch, active goal, blocker, last verified state, and next action.
- `docs/PROJECT_STATE.md` — durable architecture and product behavior state.
- `docs/AI_WORK_PROTOCOL.md` — mandatory goal/verification/state-persistence protocol designed for conversation-limit recovery.
- `.github/SPATIAL_PRODUCT_OWNER_MODE.md` — canonical product-owner mode and new-chat prompt.
- `AGENTS.md` and `.github/copilot-instructions.md` require reading these artifacts and no longer instruct agents to blindly push `main` or march through unchecked tasks.

### Conversation-limit rule
Treat chat history as transient. Every meaningful change must leave code/commit plus durable plan/state updates. A new chat should start by reading `CONTINUATION.md`, then the product plan/state docs, then the active PR and current verification result.

## Status board
| Goal | Status | Gate |
|---|---|---|
| Engineering foundation | ✅ COMPLETE | Engineering Gate |
| Workflow/calibration | ✅ COMPLETE | source + build |
| Geometry | ✅ COMPLETE | geometry tests |
| Persistence contract | ✅ COMPLETE | snapshot + source contract |
| PR #27 | ✅ MERGED | main deployment READY |
| PR #65 walkthrough foundation | ✅ MERGED | merge commit `aebd83e` |
| PR #57 XR lifecycle/navigation | ✅ MERGED | merge commit `6c09a07`; Vercel success; browser/XR acceptance pending |
| R2.1 Desktop locomotion | 🟡 BUILD GREEN | browser acceptance |
| R2.2 Wall collision | 🟢 BUILD GREEN | browser acceptance |
| R2.3 XR floor/framing/test mode | 🟢 BUILD GREEN | browser/XR acceptance |
| R2.4 Combined regression | 🔴 BLOCKED | R2.2 + R2.3 browser/XR gates |
| P1 Bundle optimization | 🟡 PLANNED | functional gates first |
| Release confidence | ⏸️ WAITING | R2.4 + Supabase + browser/XR gates |

## Current next action
PR #65 and PR #57 are merged. Vercel reports success for the PR #57 merge commit, while interactive browser/file-picker/canvas and native WebXR acceptance remain unverified in this agent surface. Obtain external real-browser/device evidence for the full R2.2/R2.3 matrix before marking those gates complete or advancing release confidence. P1 remains behind functional acceptance.

---

## North Star expansion — Deterministic blueprint-to-playable-house (2026-10-23)

**Status: PLANNED / repository audit started.** This expands the existing sketch-based spatial editor into a real editable, persistent, multi-floor house. The canonical building model is the source of truth; 2D plan, 3D editor, desktop first-person view and optional AR must render the same data.

**Non-negotiable product constraints**
- AI recognition is optional; no core construction/edit/save/navigation feature may depend on an LLM.
- No speculative yaw/rotation fixes. Diagnose the transform chain using known-size geometry and tests.
- Distinguish browser-local IndexedDB from durable project/server persistence.
- Existing wall sketching, project save/share, local model import and first-person/collision foundations must be preserved and integrated, not reimplemented blindly.
- Build evidence is not browser evidence; browser evidence is not physical WebXR evidence.

**Current active goal:** audit the existing transform + persistence paths, then complete the P0 gates in TASKS.md Phase 12 in order:
1. TASK-1201 — reproduce and resolve AR/world orientation and scale.
2. TASK-1202 — round-trip the complete editable scene through durable project persistence.
3. TASK-1203 — versioned canonical building schema and migration.
4. TASK-1204 — floor slabs, levels and multi-floor structure.
5. TASK-1205/1206/1207 — real openings, interactive doors/windows, stairs and human-scale traversal.

**Acceptance status:** no Phase 12 task is complete from this planning update. Physical AR alignment remains HARDWARE GATE REQUIRED until tested on a supported device. Use one active implementation goal at a time and update this plan, TASKS.md, CONTINUATION.md, and docs/PROJECT_STATE.md after meaningful changes.


## Persistence and project-library gate (2026-10-23)

1. Stabilize project UUID identity and prevent cross-project overwrite.
2. Add API list/load endpoints with durable query scoping and clear local-only semantics.
3. Add a project-library UI merging browser recovery copies and server records.
4. Validate type-check/build/API tests.
5. Separately verify deployed Supabase configuration, save/list/open after API restart, and complete scene round-trip. Never infer durable persistence from a green build.

No deployment secrets or Supabase settings are modified by this plan.


## Implementation progress — 2026-10-23

The implementation now extends beyond planning: the versioned building model, level-aware drawing/rendering, basic floor slabs and staircase meshes, starter component catalog with move/rotate/delete controls, wall-opening geometry, door open/close toggling, open-door collision splitting, Supabase readiness reporting, and API project list/open contract tests are in the branch. These are implementation increments, not acceptance-complete tasks.

The active gate remains the fresh Engineering Gate. Run #227 failed on one remaining `LoaderCircle` reference, fixed in `cb9cfd4`; no later run is confirmed yet. Once green, continue with API/database contract tests, save→list→open→restart verification, and the remaining P0 house-engine gates. No physical AR success is inferred from source changes.


## Verification update — 2026-10-23
Engineering Gate #265 passed web type-check, production build and core snapshot contract tests, but failed one geometry assertion. The door test incorrectly passed endpoint coordinates to an API that accepts deltas; corrected in `613567d`. Await a fresh CI run before expanding further or marking any task complete. Latest feature increments include yaw calibration persisted with the project, floor/ceiling materials, active-floor isolation, JSON import/export, project-wide undo/redo and browser recovery autosave. Deployed Supabase and physical AR remain unverified.


## Progress snapshot — 2026-10-23

Current estimate: approximately 35–40% implementation coverage across Phases 12–13, with 0/17 tasks acceptance-complete. Source code now includes the building model, initial multilevel/door/component flows, project library API/UI, JSON import/export, browser recovery and undo/redo. Automated tests cover schema snapshots, transforms, collision contracts, and project save/list/open behavior in API memory mode. These tests do not establish live Supabase persistence or browser/device acceptance.

Gate #268 passed web type-check/build, core tests (4/4), and geometry tests (26/26), then failed at API test module loading because @spatial/billing/dist/index.js was not built. The workflow now runs the API test via Turbo so workspace build dependencies execute first. Persistence handling was hardened so failed Supabase writes do not enter the process cache and durable share reads verify the database token. Fresh CI is required before further acceptance claims.


## Engineering Gate #280 — 2026-10-23

Automated gate passed for commit `6347c1caae4036149e8c4975562f19993bf04d7a`: clean install, runtime graph, web type-check/build, core snapshots, geometry contracts, API workspace dependency build and API tests. API tests: 7/7. The saved-project dialog includes name/source search. API project tests round-trip scene assets, openings, presentation and building model and assert missing Supabase config fails closed. This does not replace deployed Supabase restart-survival, browser manual, or physical WebXR acceptance.


## Engineering Gate #305 — 2026-10-23

**PASS** on `37b6eacd01a40ba520aae47de1b350bd09714545`: web type-check/build, core/geometry/API tests, and dependency build passed. The canonical schema now rejects dangling/out-of-bounds openings, invalid level references, same-level stairs, floor slabs with missing room links, and unsupported future schema versions. Per-room finish editing synchronizes to the associated floor slab. Starter parametric geometry is implemented for common catalog items, with human-scale defaults and staggered placement. Project library supports search.

These are source and automated-test milestones, not complete product acceptance. Estimate ~40% implementation coverage; 0/17 Phase 12/13 tasks acceptance-complete. Live Supabase restart survival, browser manual tests, physical WebXR, and multi-user auth/tenant isolation remain open.
