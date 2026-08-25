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
- Original Vercel blocker: two XR `null`/`Element` TypeScript errors and one optional `floorArea` error.
- Engineering gate passes clean install, critical dependency graph, strict web type-check, and forced web production build on Node 22.
- Canonical dependency graph uses `@react-three/xr 6.6.30`; stale v5 lock state is gone.
- Global Zustand forcing was removed because `@react-three/drei` resolves Zustand 5 while the application uses Zustand 4; forcing one major created an invalid dependency tree.
- Vercel Hobby previously reported `api-deployments-free-per-day` (>100); reserve new Vercel deployment attempts for the release candidate.
- Non-blocking warnings remain: FontAwesome deprecation, `tsconfck` deprecation, `three-mesh-bvh` deprecation, and two npm audit findings.

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

#### G1.1 — Resolve current TypeScript blockers
**Completed:** XR helper return types were widened to nullable React nodes without weakening strictness; optional room area now renders safely.
**Gate:** strict `apps/web` type-check passed.

#### G1.2 — Align dependency manifests and lockfile
**Completed:** XR v6.6.30 is canonical; Node 22 baseline established; clean `npm ci` and critical dependency graph passed; incompatible global Zustand override removed.
**Gate:** clean install + `npm ls @react-three/xr react react-dom three @react-three/fiber zustand` passed.

#### G1.3 — Make Vite/Turbo resolution deterministic
**Completed:** Three.js remains explicitly aliased/deduped; Zustand is not forcibly deduped; forced production web build passed.
**Gate:** forced build passed. Cached build remains a release-candidate confirmation because the source graph changed after the earlier cache.

**G1 exit:** ✅ green.

### G2 — Product workflow and interaction quality
**Outcome:** a first-time user can complete the six-stage workflow without guessing.

#### G2.1 — Explicit workflow state machine
**Status: ✅ COMPLETE (static gate; browser matrix pending)**
Stages: `Upload → Calibrate → Trace Walls → Validate Rooms → Review 3D → Spatial/AR`.

Implemented:
- explicit `scaleCalibrated` state instead of inferring Step 2 from wall count
- persisted `scaleMetersPerPixel` in `Project`
- wall drawing requires blueprint + calibration
- room validation requires calibration
- 3D/Spatial entry requires calibration + wall geometry
- wall changes invalidate room validation through the central wall updater
- shared/load/revert paths restore calibration state

Verification:
- engineering gate after implementation passed lockfile generation, clean install, dependency graph, strict TypeScript, and forced production build
- source inspection confirms prerequisites and transitions are deterministic

Remaining release-level verification: interactive browser walkthrough in the final matrix.

#### G2.2 — Blueprint and scale UX
**Status: ✅ COMPLETE (static gate; browser matrix pending)**
Implemented:
- real two-point reference-line gesture over the uploaded blueprint
- live measured pixel distance displayed on the canvas
- meters-per-pixel calculated as `knownMeters / measuredPixels`
- invalid/too-short/zero calibration blocked
- recalibration supported

Verification:
- engineering gate after implementation passed clean install, dependency graph, strict TypeScript, and forced production build
- source inspection confirms the scale calculation uses actual measured pixels instead of the previous hardcoded 200-pixel assumption

Remaining release-level verification: verify a known dimension produces the expected world-space wall length in the browser.

#### G2.3 — 2D-to-3D geometry contract
**Status: ✅ COMPLETE (static gate; browser matrix pending)**
Implemented:
- focused Node test suite covering wall extrusion identity/dimensions, closed-room membership/area, open-loop rejection, and endpoint tolerance
- canonical wall mesh placement in both normal 3D and Spatial views now uses the actual `WallSegment.start/end` centerline instead of offset extrusion corners
- camera target now uses the true wall-bounds center
- room-loop traversal fixed to retain the first wall endpoint; this corrected a real 4×4 room-area bug from 8 m² to 16 m²

Verification gate:
- latest engineering gate: clean install ✅
- critical dependency graph ✅
- strict web type-check ✅
- forced web production build ✅
- geometry contract tests: 4/4 ✅

Browser-level verification remains in the final matrix.

#### G2.4 — Predictable 3D interaction
**Status: IN PROGRESS**
Goal: normal 3D navigation must never trigger commenting. Spatial comments require explicit user intent.

Tasks:
- add `navigate` vs `comment` interaction mode
- default to navigation
- show Comment mode only in editable 3D view
- only attach canvas click-to-comment handlers while Comment mode is active
- automatically return to navigation after one successful pin placement
- keep read-only share/viewer free from comment controls
- preserve orbit, pan, zoom, and room highlighting in both modes

Verification gate:
- normal click/drag/zoom never opens the comment prompt
- explicit Comment mode places exactly one pin
- comment mode auto-exits after placement
- read-only viewer cannot comment

#### G2.5 — Persistence, versions, compare, share, revert
**Status: PLANNED**
Gate: Save → reload → version A/B → compare → mutate current model → verify snapshots unchanged → revert → share.

#### G2.6 — Production UX, accessibility, and performance
**Status: PLANNED**
Tasks include keyboard/focus states, disabled/loading/error feedback, responsive behavior, pointer-event layering, and production chunk-size optimization.
Gate: every primary action is discoverable, keyboard reachable, visually legible, and core 3D interaction remains responsive.

**G2 exit:** all G2 gates green.

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
- **2026-08-26:** Node 22 is the engineering baseline because the resolved dependency graph requires Node 22+.
- **2026-08-26:** Do not force one Zustand major; Drei and the application have different compatible Zustand requirements. The single-runtime requirement applies to Three.js.
- **2026-08-26:** G1 must be green before new UX work.
- **2026-08-26:** Existing PR #27 changes are treated as in-progress product work, not duplicated tasks.
- **2026-08-26:** G2.1 and G2.2 are accepted on static engineering evidence; browser acceptance remains grouped into the release verification matrix to avoid repeated deployment consumption.
- **2026-08-26:** G2.3 uncovered and fixed a genuine room-area topology bug; focused tests now protect that contract.

## Status board
| Goal | Status | Verification |
|---|---|---|
| G1 Deterministic foundation | ✅ COMPLETE | clean install + graph + strict TS + forced build |
| G2.1 Workflow state | ✅ COMPLETE (static) | post-change engineering gate green |
| G2.2 Calibration UX | ✅ COMPLETE (static) | post-change engineering gate green + source verification |
| G2.3 2D/3D geometry | ✅ COMPLETE (static) | post-change engineering gate green + 4/4 geometry tests |
| G2.4 3D interaction | IN PROGRESS | comment-mode implementation + gate |
| G2.5 Persistence | PLANNED | end-to-end persistence acceptance |
| G2.6 UX/accessibility/performance | PLANNED | browser interaction/accessibility/performance acceptance |
| G3 Spatial/AR | BLOCKED BY G2 | capability/XR/browser gates |
| Release | BLOCKED | final browser + Vercel candidate gate |

## Current next action
**Complete G2.4 only:** make 3D commenting an explicit interaction mode and verify navigation never triggers comment prompts. Then advance to persistence/version integrity.
