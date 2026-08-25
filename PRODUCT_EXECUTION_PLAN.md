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
- Latest known Vercel deployment `dpl_FRc1crfNGiCpBCBekJ3zk5SNWgLM` for commit `8d3d640` failed in `@spatial/web` TypeScript compilation before Vite bundling.
- Reported blockers: `ArViewport.tsx` TS2322 twice and `RoomHighlightList.tsx` TS18048 once.
- Current manifests declare `@react-three/xr ^6.6.30`, while the committed lockfile still records the older XR v5 range. This makes dependency resolution non-deterministic.
- Vercel Hobby currently reported `api-deployments-free-per-day` (>100); deployments must not be used for iterative debugging until the quota resets.
- Non-blocking build warnings previously observed: FontAwesome deprecation, npm audit findings, and install-script approval warnings.

## Work already in PR #27 — preserve unless verification proves it wrong
- immutable/deep-cloned version snapshots
- explicit version history and A/B comparison selection
- room detection tolerance/topology improvements
- room selection and 3D wall highlighting
- XR locomotion and teleport-pointer setup
- explicit Three.js alias/dedupe
- favicon

## Existing backlog consolidation
Historical issues #6–25 remain evidence/backlog references. New work is governed here to avoid duplicate implementation:
- #6–#11: canonical model, room detection, 3D review, Spatial workflow
- #12: E2E/stale runtime cleanup
- #14/#22: API CORS deployment dependency
- #15/#20: load/error hardening
- #16–#18: empty editor, wall history, revert
- #19/#23: XR lifecycle/controller verification
- #24: version comparison validation
- #25: production 404 identification

Active execution issues:
- #28 product umbrella
- #29 deterministic build gate
- #30 workflow/release execution
- #32 dependency manifest repair
- #33 workflow state contract
- #34 3D interaction model
- #35 persistence/recovery contract
- #36 production UX/accessibility
- #37 Spatial/AR capability gate
- #38 final verification/release gate
- #40 browser verification matrix
- #41 release candidate criteria
- #42 task consolidation
- #43 deployment constraint
- #44–#55 documentation/plan artifacts

## Goal hierarchy and mandatory gates

### G1 — Deterministic engineering foundation
**Outcome:** a clean, repeatable `@spatial/web` build that does not rely on stale cache or accidental dependency resolution.

#### G1.1 — Resolve current TypeScript blockers
Tasks:
- Keep the XR v6 store architecture from PR #27.
- Correct helper component return types where XR components may return nullable React nodes; do not weaken `strict` or use broad `any`.
- Use ref types compatible with the actual XR API.
- Safely render optional `room.floorArea` with a domain-valid fallback.

Verification gate:
- `npx tsc --noEmit -p apps/web/tsconfig.json` returns exit code 0.

#### G1.2 — Align dependency manifests and lockfile
Tasks:
- Keep the intended XR v6 API used by PR #27.
- Regenerate `package-lock.json` from the current manifests using a clean npm install.
- Verify one compatible React/React DOM/Fiber/XR/Three/Zustand graph.
- Pin the Node major used for CI/Vercel once the supported baseline is confirmed.

Verification gate:
- `npm ci` succeeds without changing `package-lock.json`.
- `npm ls @react-three/xr react react-dom three @react-three/fiber zustand` shows one intended compatible graph.

#### G1.3 — Make Vite/Turbo resolution deterministic
Tasks:
- Reassess the hardcoded `../../node_modules/three` alias after lockfile alignment.
- Retain dedupe only where required by evidence.
- Retire historical `optimizeDeps` workarounds only when the clean graph proves they are unnecessary.
- Run forced and cached builds.

Verification gate:
- `npx turbo build --filter=@spatial/web --force` passes.
- Normal cached build passes.

**G1 exit:** all G1 gates green.

### G2 — Product workflow and interaction quality
**Outcome:** a first-time user can complete the six-stage workflow without guessing.

#### G2.1 — Explicit workflow state machine
Stages:
`Upload → Calibrate → Trace Walls → Validate Rooms → Review 3D → Spatial/AR`

Tasks:
- Add explicit calibration state instead of inferring the step from wall count.
- Gate each action behind prerequisites.
- Changing wall geometry invalidates room validation.
- Load/revert reconstruct workflow state deterministically.

Verification gate:
- fresh editor starts at Upload
- after upload, Calibrate is active until calibration is applied
- Trace becomes active only after valid calibration
- wall edits make room validation stale
- Review 3D and Spatial actions are gated

#### G2.2 — Blueprint and scale UX
Tasks:
- Keep blueprint aspect ratio and usable visibility controls.
- Show reference measurement feedback and resulting meters-per-pixel.
- Reject invalid/zero reference length.
- Persist scale/calibration data with the project model.

Verification gate:
- known reference distance produces the expected world-space wall length.

#### G2.3 — 2D-to-3D geometry contract
Tasks:
- One canonical `WallSegment` object flows from 2D to 3D.
- Verify IDs, endpoints, length, thickness, and height remain consistent.
- Verify camera framing on small and large plans.
- Generate floors only from valid closed loops.

Verification gate:
- a closed rectangular test plan produces expected wall count, dimensions, area, visible walls, and visible floor.

#### G2.4 — Predictable 3D interaction
Tasks:
- Remove comment prompting from arbitrary canvas clicks.
- Add explicit Comment mode for placing spatial pins.
- Preserve orbit, pan, zoom, room highlighting, and read-only behavior.
- Ensure overlays do not steal pointer events unintentionally.

Verification gate:
- default canvas interaction never prompts for a comment
- Comment mode is explicit
- read-only viewer cannot mutate or comment

#### G2.5 — Persistence, versions, compare, share, revert
Tasks:
- Save uses canonical `Project.walls` and retains local recovery.
- Load restores the same geometry.
- Version snapshots are immutable.
- Comparison uses saved snapshots, not mutable editor state.
- Revert restores the last saved baseline.
- Share renders the saved model read-only.
- Treat API CORS as deployment/configuration, not a browser workaround.

Verification gate:
- Save → reload → version A/B → compare → mutate current model → verify A/B unchanged → revert → share all pass.

#### G2.6 — Production UX and accessibility
Tasks:
- consistent loading/success/error/disabled states
- keyboard reachability and visible focus
- clear empty states and action hierarchy
- responsive sidebar/canvas behavior
- preserve the dark/glass visual direction only where it improves legibility and completion

Verification gate:
- every primary action is discoverable, keyboard reachable, and has visible feedback.

**G2 exit:** all workflow and interaction gates green.

### G3 — Spatial/AR and release confidence
**Outcome:** Spatial/AR is a safe progressive enhancement and release is evidence-driven.

#### G3.1 — Spatial capability gate
- Detect immersive AR capability before presenting it as available.
- Keep desktop Spatial 3D fully usable without WebXR.
- Show clear unsupported-device guidance.

Gate: unsupported devices always get a usable Spatial fallback.

#### G3.2 — XR lifecycle and stability
- one active XR session
- clean exit/unmount
- preserve the v6 store architecture
- verify controller tracking/locomotion on real WebXR hardware
- investigate resize/context-loss only when reproduced with evidence

Gate: no application-caused duplicate-session or renderer crash on supported hardware.

#### G3.3 — Production browser verification
Run one compact matrix only after G1/G2 are green:
- fresh editor
- upload/calibration/tracing
- room detection/highlight
- 3D navigation
- save/load/revert
- version A/B comparison
- share/read-only
- Spatial fallback
- AR capability/session lifecycle
- error/network/404 behavior

Gate: no critical app console errors and all core paths complete.

#### G3.4 — Release candidate gate
Mandatory:
- clean install and lockfile integrity
- strict TypeScript pass
- forced and cached Turbo build pass
- Vercel deployment reaches READY when quota is available
- browser workflow pass
- persistence/version/share pass
- Spatial fallback pass
- XR pass where hardware allows
- no app-owned 404
- no duplicate Three.js warning
- no known release-blocking issue

## Execution protocol — token/time efficient
1. Work on one goal at a time.
2. Retrieve only the files and PR patches required for that goal.
3. Batch tightly related edits; do not scatter speculative changes.
4. Run the cheapest meaningful verification first: type-check → package build → browser → deployment.
5. Never use Vercel to discover a local compiler error.
6. Do not repeat a passed verification unless a changed file invalidates it.
7. Reuse historical deployment evidence; reserve a new Vercel deployment for a release candidate.
8. After each gate, update this document with status and evidence before advancing.
9. Preserve PR #27 work unless an acceptance test proves it broken.
10. Track security/dependency warnings separately from functional blockers.
11. Do not create another GitHub issue for every subtask; this document is the task source of truth.

## Decision log
- **2026-08-26:** Keep XR v6 rather than downgrade to v5; PR #27 is already designed around the v6 store API.
- **2026-08-26:** Build health is the first gate; UX work starts only after the web type-check/build gate passes.
- **2026-08-26:** Vercel deployments are temporarily treated as a scarce release resource because of the Hobby daily deployment limit.
- **2026-08-26:** Existing PR #27 changes are treated as in-progress product work, not duplicated tasks.

## Status board
| Goal | Status | Verification |
|---|---|---|
| G1.1 TypeScript blockers | **IN PROGRESS** | pending clean re-run |
| G1.2 dependency alignment | **PENDING** | clean npm install required |
| G1.3 build determinism | **PENDING** | forced + cached Turbo build |
| G2 workflow | **BLOCKED BY G1** | not started |
| G3 Spatial/AR | **BLOCKED BY G2** | not started |
| Release | **BLOCKED** | Vercel quota + mandatory gates |

## Current next action
**G1.1 only:** fix and verify the three current Vercel TypeScript blockers. Do not begin G2 implementation until the narrow web type-check gate is green.
