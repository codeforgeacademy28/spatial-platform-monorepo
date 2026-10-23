# Spatial Platform — Continuation Packet

> **Read this file first when resuming work.** It is the durable, low-token handoff for future chats/agents.

## Mission
Ship a reliable blueprint-to-spatial product where a user can upload a blueprint, calibrate scale, draw canonical walls, validate rooms, review 3D, save/version/share, and use a stable browser-first Spatial view with optional WebXR/AR.

## Source of truth
- Product plan: `PRODUCT_EXECUTION_PLAN.md`
- Current task ledger: `apps/web/RELEASE_TASKS_NEXT.md`
- Resume packet: `CONTINUATION.md`
- Detailed architecture/status: `docs/PROJECT_STATE.md`
- Execution method: `docs/AI_WORK_PROTOCOL.md`
- Product-owner mode: `.github/SPATIAL_PRODUCT_OWNER_MODE.md`
- Active PR: **none**. PR #65 (walkthrough foundation) and PR #57 (XR lifecycle/navigation) are both merged into `main`.
- Target branch: `main`

## Current branch state
Current branch: `main`.
Latest relevant merge commit: `6c09a07bbb0411dfa11feb2396e814f402b0cf2d` (PR #57); PR #65 merge commit: `aebd83e698af024cf98490f8cb386f62399faa1e`.
Both PRs are merged and no PRs are currently open. Vercel reports success for the PR #57 merge commit. This does not replace the remaining interactive browser and physical WebXR acceptance gates.

## Last verified build state
- PR #27 is merged into `main`.
- Engineering Gate run **#99** for commit `3a5af4cbedc7cc8f85327052699cf96ee9efff2d` is **SUCCESS**.
- Gate #99 covers the established lockfile/install/runtime/type-check/build/core-snapshot/geometry contract gate.
- Latest branch Vercel deployment for this code line is `dpl_BB2kj3rRjWQvwywws1h8g3Q3pNoe`, READY, with preview `spatial-platform-monorepo-ndszkl70i-snm5.vercel.app`.
- Vercel integration fetched the preview root at **2026-09-02 22:31 IST** and received HTTP 200 with the Spatial Platform HTML shell. This is reachability evidence only, not browser interaction evidence.
- Real `agent-browser` was not available as an executable in this agent container. An `npx --yes agent-browser --version` attempt timed out after 30 seconds; no browser session was established.
- Direct container DNS/HTTP access to the Vercel hostname also failed (`curl: (6) Could not resolve host`), while the Vercel integration could fetch it. This is an environment/network split, not an application defect.
- Because no real interactive browser session was established, the upload/file-picker bridge, canvas actions, keyboard/mouse navigation, collision behavior, browser console inspection, and `?xrTest=1` interaction could not be re-exercised in this run.
- Native WebXR remains unavailable in this agent environment, so native AR entry, horizontal AR floor, XR controller framing/reset, XR locomotion, snap turn, teleport, session lifecycle, and XR resize/context-loss behavior remain hardware/browser gates.

## Current product fixes
### Browser navigation
- WASD + arrow keys.
- Mouse orbit + wheel zoom.
- Browser camera owns navigation independently from XR `XROrigin`.

### Wall collision
- Visible ON/OFF control; ON by default.
- Collision math is in `@spatial/geometry-engine`.
- Swept substep movement prevents one-frame tunneling through thin walls.
- Full diagonal movement is collision-tested first; if blocked, only a safe axis slide is allowed.
- Geometry contract tests cover direct clearance, movement crossing a wall, and angled-wall diagonal resolution.
- Browser acceptance is still required to prove user-visible behavior.

### XR / AR
- Native `Start Immersive AR` is explicit and capability-gated.
- `offerSession: false`.
- `enterGrantedSession: false`.
- `?xrTest=1` enables browser XR emulation only when explicitly chosen.
- XR v6.6.30 requests `local-floor` by default through session initialization.
- `XROrigin` is dedicated to XR; desktop movement does not modify it.

## User-reported issues currently being verified
1. AR floor previously appeared vertical/edge-on. Source contracts confirm horizontal floor geometry and v6 `local-floor` session initialization; actual XR device/browser acceptance is still required.
2. Wall collision previously allowed walking through walls. Collision is now geometry-owned, swept, and diagonal-path aware; actual browser acceptance is still required.

## Active goal
### R2.2 + R2.3 — Spatial collision + XR acceptance
**Status: BUILD GREEN / BROWSER-XR GATE REQUIRED**

## 2026-09-02 browser/XR gate attempt
- Attempt timestamp: **2026-09-02 22:31 IST**.
- Candidate preview: `dpl_BB2kj3rRjWQvwywws1h8g3Q3pNoe` / `spatial-platform-monorepo-ndszkl70i-snm5.vercel.app`.
- Preview root returned HTTP 200 through the Vercel integration; no interactive browser session was established.
- `agent-browser` CLI was absent; `npx --yes agent-browser --version` timed out after 30 seconds.
- Container DNS could not resolve the preview hostname. The Vercel integration could resolve/fetch it, confirming this is an automation/environment limitation rather than proof of an application failure.
- Result: no R2.2/R2.3 interactive acceptance item is marked PASS from this attempt. Native XR remains a hardware gate.

## Immediate next action
Run the remaining R2.2/R2.3 acceptance matrix in a real browser and supported WebXR device. The current agent surface verified the merge deployment status but could not complete interactive file-picker/canvas interaction or native WebXR hardware acceptance. Keep those acceptance items open; do not claim them complete from build/deployment evidence alone.

## After this gate
- R2.4 combined Spatial regression gate.
- Supabase durable save → API restart → share read.
- Final browser matrix.
- WebXR hardware lifecycle.
- P1 bundle/performance optimization only after functional release gates.

## Do not regress
- Do not re-enable `offerSession: 'immersive-ar'` globally.
- Do not re-enable XR emulation in normal Spatial mode.
- Do not drive desktop movement through `XROrigin`.
- Do not manually split Zod/Zustand into a single vendor chunk.
- Do not hand-edit lockfiles when npm can regenerate them.
- Do not invent XR options from a newer package version than installed 6.6.30.
- Merging code does not mark browser/XR acceptance complete; retain external acceptance gates until actually exercised.
- Do not mark browser/hardware acceptance passed from source/build evidence alone.
- Do not trigger unnecessary Vercel deployments while the free-tier daily deployment limit is exhausted.

## Efficient resumption recipe
**Read `CONTINUATION.md` → `PRODUCT_EXECUTION_PLAN.md` → `docs/PROJECT_STATE.md` → `.github/SPATIAL_PRODUCT_OWNER_MODE.md` → active PR diff → run the current gate → fix only the active goal → verify → update state → advance one goal.**

## Conversation-limit rule
The chat transcript is not the durable project state. Every meaningful implementation or decision must leave code/commit plus durable plan/state updates. When a chat is near its limit, update this packet before doing anything else. A new chat should then resume from the repository packet without requiring the historical transcript.

---

## Active continuation — Blueprint-to-playable-house (2026-10-23)

- **Active branch:** feat/blueprint-to-playable-house-roadmap (created from main; do not push directly to main).
- **Active PR:** draft PR #67, https://github.com/codeforgeacademy28/spatial-platform-monorepo/pull/67. Current latest known commit: cb9cfd49616152c88db4eec7f7fe81b18264fa93.
- **Current objective:** deliver a deterministic, engineering-first house engine. AI recognition is optional and cannot be required for core geometry, editing, saving or navigation.
- **Durable requirements:** TASKS.md Phase 12 is the canonical detailed backlog. PRODUCT_EXECUTION_PLAN.md contains the ordered P0 gates. Do not rely on chat history as the task store.
- **First changed commit:** 0b883450057df11299f091729c81d0296c8d45ad — adds Phase 12 requirements/acceptance to TASKS.md.
- **Second changed commit:** 5c6336c077be134be44ff492524c89d606d8c468 — records the active North Star and implementation order in PRODUCT_EXECUTION_PLAN.md.
- **Current implementation status:** planning/docs updates are committed and one runtime persistence fix is committed. Runtime TypeScript/build and browser regression verification are pending.
- **Known repository foundations:** existing 2D wall sketching, Room/WallSegment/WallOpening types, floor-plan/world transform helpers, initial first-person movement and collision, local GLB/glTF import and browser IndexedDB persistence, and project API save/share. Each must be inspected before extending.
- **Known gaps to address:** reported AR model orientation/immersion is not accepted on hardware; imported asset persistence is browser-local and not fully integrated with project save/version/share; room/floor geometry is not a complete multi-level building model; doors/windows are not yet a complete interactive component/collision system; stair geometry and grounded multi-floor traversal are incomplete.
- **Immediate next action:** inspect the precise model transform and save/load code paths; define a known-dimension rectangular-room regression fixture; identify the reproducible AR orientation cause before changing transforms. Then work one gate at a time and run the narrowest relevant tests.
- **Verification truth:** do not claim browser or physical AR acceptance from source inspection or build results. Record test command, commit, outcome and remaining external gates in the task ledger and state docs.
- **Runtime change:** commit f7a501a1effed320166b12483ba42a2783f8337d updates App.tsx so local load/revert restore sceneAssets, wallOpenings and presentation, and version snapshots preserve the complete current Project rather than rebuilding walls/rooms only. cloneProject now deep-copies mutable scene metadata.
- **Verification status:** Engineering Gate run #180 completed with conclusion SUCCESS: clean install, critical runtime graph, web type-check, web production build, core snapshot contract tests, geometry contract tests and API upload validation all passed. This is BUILD GREEN for the branch. Browser save/load behavior and physical AR remain unverified. TASK-1202 remains open; the fix covers a local load/revert/version snapshot defect, not the complete durable scene persistence requirement.
- **Next required durable update:** run the web type-check/build and add regression coverage for project round-tripping; inspect/diagnose AR transforms without speculative rotation changes. Update task checkboxes only when acceptance criteria pass.


## 2026-10-23 — Saved-project/Supabase follow-up
- Confirmed persistence was not guaranteed: `SUPABASE_PERSISTENCE_ENABLED` defaults to false, and the UI only had a single-project browser Load path; the API exposed save/share but no normal project list/open endpoints.
- Added `GET /api/projects` and `GET /api/projects/:id`, scoped to tenant/organization/owner context in durable mode; added web API client calls and a saved-project dialog that combines local recovery with server results.
- Fixed the editor's fixed `project-1` identity by using a stable UUID per project; database table `projects.id` is UUID typed. Saved versions now also use UUIDs.
- UI labels durable Supabase storage separately from temporary API memory and browser recovery copies. This is intentionally truthful: no Supabase environment was accessed/configured, and deployed write/restart verification is still outstanding.
- **Next gate:** run the PR's clean install/type-check/build/tests, inspect failures, then perform deployed Supabase save/list/open/restart verification only if the deployment environment is available. Do not merge to `main` or claim Supabase is active based on code alone.


## Latest implementation state — 2026-10-23
- **Active branch:** `feat/blueprint-to-playable-house-roadmap`; active PR #67 remains draft and main is untouched.
- **Latest known code commit:** `cb9cfd49616152c88db4eec7f7fe81b18264fa93` (replace remaining unsupported loader icon reference after Engineering Gate #227).
- Added canonical versioned building data (levels, floor slabs, stairs, component transforms/catalog), legacy ProjectSchema defaults/migration, deep snapshot cloning, floor-aware wall drawing, derived room slabs, basic 3D rendering and component editing controls.
- Added wall-opening geometry and interactive door open/close state; open door spans are excluded from collision-only walls, while windows remain blocking at floor level.
- Added API project save/list/open contract test; API test script now runs all API tests. Added runtime Supabase readiness guard and health metadata without exposing secrets.
- **Verification status:** Gate #227 failed only at TypeScript on one remaining `LoaderCircle` usage; all references were changed to `Loader2` in the latest commit. Fresh CI for that commit is pending/not yet confirmed. Build, contract tests and deployed Supabase round-trip must not be claimed passed.
- **Next:** verify fresh CI, repair all failures before expanding further. Then run deployed save/list/open/restart check; continue grounded stair traversal, wall/door collision in every controller mode, material/ceiling behavior, deterministic import, undo/redo and exports. AR yaw remains a measurement/test task, not a guessed rotation.


## Latest gate and continuation
- Latest known code correction: `613567dcee5bf9b7d5031ed81328a132c84874ec` (fix doorway collision test to pass movement delta rather than endpoint).
- Engineering Gate #265: clean install/runtime graph, web type-check, web production build, and core snapshot tests passed; geometry contract tests failed on that incorrect test invocation. API tests were skipped. A fresh gate for the correction is not yet confirmed.
- Recent implementation additions: project-persisted yaw calibration applied consistently to rendering/navigation/collision; known-size rectangular-room transform test; component/floor/ceiling materials and transforms; active-floor isolation; JSON project import/export; whole-project undo/redo; debounced browser recovery autosave.
- Next action is to obtain a fresh Engineering Gate for the corrected test, fix any remaining failures, and only then continue broadening features. Do not mark tasks complete or claim Supabase/device validation without evidence.


## 2026-10-23 — latest status and CI repair
- Estimate only: approximately 35–40% implementation coverage across Phases 12–13; 0/17 tasks acceptance-complete (all remain unchecked until acceptance criteria pass).
- Engineering Gate #268: web type-check/build passed, core 4/4 and geometry 26/26 passed; API tests failed at module load because @spatial/billing/dist/index.js was not built.
- Fixed gate ordering in .github/workflows/engineering-gate.yml by invoking npx turbo run test --filter=@spatial/api --force, which honors workspace ^build dependencies.
- Improved persistence truthfulness: process cache is updated only after successful durable upsert; share-token lookups in durable mode are always checked against Supabase. Added API round-trip assertions for scene assets, openings, presentation, and building structure, plus fail-closed checks when database configuration is missing.
- Latest CI for the fixes is not yet confirmed. Supabase deployment/restart survival, browser flows, and physical WebXR remain unverified. Keep PR #67 draft and do not merge to main.


## Fresh verification — Engineering Gate #280
- Commit tested: `6347c1caae4036149e8c4975562f19993bf04d7a`.
- **PASS:** clean install, critical runtime graph, web type-check, web production build, core snapshot tests, geometry tests, and API dependency build/API tests.
- API contract suite: 7/7 passed. Includes complete project save/list/open round-trip and fail-closed behavior when Supabase configuration is absent. R2 credentials are now required only when storage operations are invoked.
- Added search by project name/storage source to the saved-project library; included in this passing gate.
- Supabase deployment/restart survival, browser interaction, and physical WebXR remain unverified. PR #67 stays draft; no main-branch changes.


## Latest implementation + verification — 2026-10-23
- Engineering Gate #305 passed on `37b6eacd01a40ba520aae47de1b350bd09714545`: clean install, runtime graph, web type-check/build, core, geometry and API tests all passed.
- Schema now validates opening wall references and dimensions, building level references, distinct stair endpoints, floor slab room links, and supported building schema versions; new contract tests cover invalid references.
- Per-room floor material is persisted and synchronized with its linked floor slab. Common catalog items now render as starter parametric meshes with realistic default dimensions; new components are offset to avoid exact overlap. Saved-project library search by name/source is implemented.
- Estimate: ~40% implementation coverage; 0/17 Phase 12/13 tasks fully acceptance-complete. Still unverified: deployed Supabase write/list/open/restart survival, browser manual tests, and physical WebXR orientation/scale.
- Durable ownership currently relies on server-configured tenant/org/owner IDs. Do not enable that shared context for public multi-user production until authenticated identity and tenant isolation are implemented. PR #67 remains draft; main untouched.
