# Release Tasks — Spatial Editor Stability and Workflow

## T-15 — Production API CORS
**Goal:** Save Project and version persistence work from every approved Vercel origin.
**Acceptance:** `OPTIONS /api/projects` from the active Vercel origin returns that exact origin; `POST /api/projects` succeeds; no CORS/ERR_FAILED console error.
**Status:** Code Complete / Deployment Blocked — Render must deploy the API commit.

## T-16 — XR controller lifecycle
**Goal:** Start one XR session and expose reliable controller tracking and movement.
**Acceptance:** One session per entry; controller models/status track physical inputs; leaving Spatial View ends the session; no XR-context crash.
**Implementation:** v6 store-based XR, provider-boundary fix, controller defaults, controller locomotion.
**Status:** Code Complete / Hardware Verification Pending.

## T-17 — Version history and comparison
**Goal:** Save immutable version snapshots, visibly select exactly two, and compare those exact models.
**Acceptance:** Every saved version shows wall/room counts; empty geometry cannot silently enter comparison; selected A/B render their canonical walls.
**Implementation:** Deep-cloned snapshots and explicit Version History panel.
**Status:** Code Complete / Preview Validation Pending.

## T-18 — Identify production 404
**Goal:** Identify the exact current resource returning 404 and fix it if application-owned.
**Acceptance:** No application-owned 404 remains; third-party/WebXR 404s are documented as non-blocking.
**Status:** Planned — current evidence only identifies favicon as a likely harmless request.

## T-19 — Final end-to-end release verification
**Goal:** Validate upload → calibrate → walls → rooms → 3D → save → versions → comparison → spatial → AR.
**Status:** Planned.

## T-20 — Comparison integrity
**Goal:** Ensure each version snapshot is immutable and contains the exact wall set visible when saved.
**Acceptance:** Saving A with N walls shows N in history and comparison; modifying the editor later does not mutate A; selecting B shows B's own walls.
**Status:** Code Complete.

## T-21 — Room detection accuracy and room-to-wall highlighting
**Goal:** Detect closed wall loops once, preserve loop topology, and let users select a room to highlight exactly the walls that belong to it.
**Acceptance:** No duplicate room from one closed loop; open loops are rejected; selecting Room X highlights only its wall IDs in 2D/3D; clearing selection restores normal rendering.
**Implementation:** Room graph traversal now consumes the shared unvisited set and preserves loop order. Added Room Highlight List and 3D highlighting.
**Status:** Code Complete / Preview Validation Pending.

## T-22 — Spatial locomotion and XR usability
**Goal:** Give users a predictable way to move in Spatial View.
**Acceptance:** XR left controller thumbstick moves the XROrigin; snap-turn works; teleport pointer is available; desktop WASD/arrow movement works outside immersive AR; instructions are visible.
**Implementation:** `useXRControllerLocomotion`, teleport pointers, desktop keyboard fallback.
**Status:** Code Complete / Hardware Verification Pending.

## T-23 — Single Three.js runtime
**Goal:** Remove the `Multiple instances of Three.js being imported` warning and reduce XR/WebGL instability from duplicate runtimes.
**Acceptance:** Production console has no duplicate-Three warning; all Three/Fiber/XR packages resolve to the same Three.js instance.
**Implementation:** Vite explicit root `three` alias plus `resolve.dedupe`.
**Status:** Code Complete / Preview Validation Pending.
