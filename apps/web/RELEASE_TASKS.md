# Release Tasks — XR Controllers, Persistence, Comparison and 404

## T-15 — Production API CORS
**Goal:** Save Project and version persistence work from every approved Vercel origin.

**Scope:** API CORS middleware + Render environment/deployment.

**Acceptance:** `OPTIONS /api/projects` from the active Vercel origin returns that exact origin; `POST /api/projects` succeeds; no CORS/ERR_FAILED console error.

**Dependency:** Render must deploy the API commit.

**Status:** In Progress

## T-16 — XR controller lifecycle and controller movement
**Goal:** Start one XR session through the XR store and show controllers that track the physical devices correctly.

**Scope:** `ArViewport.tsx` and XR integration only.

**Acceptance:** Start Immersive AR creates one session; controller models move with physical controllers; controller select/squeeze input is received; clicking Start again does not create a second session; leaving Spatial View ends the session; no Context Lost or `Can't change size while VR device is presenting` errors caused by our component.

**Dependency:** Browser/device must support WebXR. Unsupported devices must retain a normal 3D spatial fallback.

**Status:** In Progress

## T-17 — Comparison loads saved versions reliably
**Goal:** Saved versions appear in the comparison screen and render their canonical wall geometry.

**Scope:** version save/load flow + comparison UI only.

**Acceptance:** Save Version A and Version B; the version list shows both; selecting Compare renders both models; comparison does not depend on rooms; no empty comparison when walls exist; no undefined `.length` errors.

**Dependency:** API persistence must succeed for server-backed versions; local session versions remain available as fallback.

**Status:** Planned

## T-18 — Identify and remove application-owned 404
**Goal:** Eliminate the reported 404 or identify it as an intentional third-party/resource request.

**Scope:** final browser network trace and only the owning resource path.

**Acceptance:** No application-owned 404 in production; if a third-party/WebXR resource returns 404, it is documented and does not break the workflow.

**Status:** Planned

## T-19 — Final end-to-end release verification
**Goal:** Verify the complete user workflow with no blocking console errors.

**Flow:** upload → calibrate → draw walls → undo/delete → detect rooms → review 3D → save → save versions A/B → compare → spatial 3D → immersive AR where supported.

**Acceptance:** Each stage has a visible success state and all known blocking console errors are absent.

**Status:** Planned
