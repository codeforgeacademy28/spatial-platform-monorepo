# Next Release Task Ledger

## R2.2 — Wall collision integrity
**Goal:** Make browser wall collision physically trustworthy and testable.
**Tasks:**
- Keep collision math in `@spatial/geometry-engine`.
- Use canonical `WallSegment` geometry and model transform.
- Sweep movement through substeps to prevent tunneling.
- Preserve independent X/Z movement for wall sliding.
- Keep visible ON/OFF inspection control.
- Add automated direct-clearance and crossing-a-wall tests.
**Acceptance:** Collision ON stops the player before wall clearance; diagonal movement slides instead of freezing; OFF allows inspection; contract tests prove a full-frame wall crossing is blocked.
**Status:** BUILD GREEN / Browser acceptance pending.
**Verification:** Engineering Gate #99 passed on implementation head `3a5af4cbedc7cc8f85327052699cf96ee9efff2d`. READY Vercel deployment `dpl_BB2kj3rRjWQvwywws1h8g3Q3pNoe` returned HTTP 200 through the Vercel integration. Latest agent attempt could not establish interactive browser automation (`agent-browser` unavailable; `npx --yes agent-browser --version` timed out; container DNS failed), so movement/collision remains unverified.

## R2.3 — XR floor + player/controller stability
**Goal:** Make Spatial AR physically coherent and keep XR isolated from desktop navigation.
**Tasks:**
- Keep `offerSession: false` and explicit AR entry.
- Keep `enterGrantedSession: false`.
- Keep XR emulation opt-in through `?xrTest=1`.
- Use installed `@react-three/xr 6.6.30` APIs only; do not copy newer `referenceSpace` props into v6.6.30.
- Rely on v6.6.30 session initialization's built-in `local-floor` requirement.
- Verify XROrigin/controller framing and reset in test mode.
**Acceptance:** Real AR floor is horizontal without rotating the device/screen to compensate; controller poses are stable; test mode never auto-starts XR; native AR entry works on supported hardware.
**Status:** BUILD GREEN / Browser-XR acceptance pending.
**Verification:** Engineering Gate #99 passed. Native WebXR is unavailable in the current agent environment; hardware/browser evidence remains required. Latest browser attempt established no interactive session, so no XR behavior is marked PASS.

## 2026-09-02/03 external browser/XR gate attempt
- Candidate: PR #57 implementation head `3a5af4cbedc7cc8f85327052699cf96ee9efff2d`.
- READY preview deployment: `dpl_BB2kj3rRjWQvwywws1h8g3Q3pNoe`.
- Vercel integration fetched the preview root with HTTP 200 at approximately **2026-09-02 22:31 IST**.
- No real interactive browser session was established in this agent environment. Automation failure is not treated as an application failure.
- Native WebXR remains a hardware/browser gate.

## R2.4 — Combined Spatial regression gate
**Goal:** Prove the complete Spatial experience still works after XR/collision changes.
**Acceptance:**
- Spatial entry
- WASD
- Arrow keys
- Mouse orbit
- Wheel zoom
- Collision ON/OFF
- Closed-room 3D geometry
- Start Immersive AR
- XR test mode
- No `offerSession` race
- No normal Spatial `iwer onDeviceFrame` loop
**Status:** BLOCKED until R2.2 + R2.3 acceptance passes.

## P1 — Bundle/performance optimization
**Goal:** Reduce large initial JavaScript payloads safely.
**Acceptance:** Smaller first-load payload and faster Spatial entry without reintroducing the previous vendor-chunk initialization crash.
**Status:** Planned after functional regression gates.

## Existing release tasks

## T-20 — Comparison integrity
**Goal:** Immutable version snapshots contain the exact wall set visible when saved.
**Acceptance:** Saved A/B show their own wall counts and exact geometry in comparison.
**Status:** Code Complete / Preview Validation Pending.

## T-21 — Room accuracy + wall highlighting
**Goal:** Detect each closed loop once and highlight exactly the selected room's walls.
**Acceptance:** No duplicate rooms; open loops rejected; room selection highlights matching wall IDs.
**Status:** Code Complete / Preview Validation Pending.

## T-22 — Spatial locomotion
**Goal:** Give predictable movement in immersive and desktop Spatial View.
**Acceptance:** XR thumbstick locomotion, snap turn, teleport pointer, desktop WASD/arrows.
**Status:** Code Complete / Hardware Verification Pending.

## T-23 — Single Three.js runtime
**Goal:** Eliminate duplicate Three.js runtime warning.
**Acceptance:** No duplicate-Three warning in production console.
**Status:** Code Complete / Preview Validation Pending.

## T-24 — XR resize stability
**Goal:** Eliminate repeated `Can't change size while VR device is presenting` and renderer context loss during XR.
**Acceptance:** Enter/exit XR without repeated resize/context errors.
**Status:** Planned / Part of final XR hardware gate.
