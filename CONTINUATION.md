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
- **Verification status:** source edit is committed but has not been type-checked, built, or exercised in a browser in this connector session. TASK-1202 remains open; the fix covers a local load/revert/version snapshot defect, not the complete durable scene persistence requirement.
- **Next required durable update:** run the web type-check/build and add regression coverage for project round-tripping; inspect/diagnose AR transforms without speculative rotation changes. Update task checkboxes only when acceptance criteria pass.
