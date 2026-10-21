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
| R2.1 Desktop locomotion | 🟡 BUILD GREEN | browser acceptance |
| R2.2 Wall collision | 🟢 BUILD GREEN | browser acceptance |
| R2.3 XR floor/framing/test mode | 🟢 BUILD GREEN | browser/XR acceptance |
| R2.4 Combined regression | 🔴 BLOCKED | R2.2 + R2.3 browser/XR gates |
| P1 Bundle optimization | 🟡 PLANNED | functional gates first |
| Release confidence | ⏸️ WAITING | R2.4 + Supabase + browser/XR gates |

## Current next action
Engineering Gate #99 and preview reachability are green, but interactive browser/file-picker/canvas and native WebXR acceptance are unavailable in this agent surface. Obtain external real-browser/device evidence for the full R2.2/R2.3 matrix; do not start P1, advance to R2.4, or merge PR #57 until those gates are evidenced.
