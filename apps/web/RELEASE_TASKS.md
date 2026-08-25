# Release Tasks — XR Controllers, Persistence, Comparison and 404

## T-15 — Production API CORS
**Goal:** Save Project and version persistence work from every approved Vercel origin.

**Scope:** API CORS middleware + Render environment/deployment.

**Acceptance:** `OPTIONS /api/projects` from the active Vercel origin returns that exact origin; `POST /api/projects` succeeds; no CORS/ERR_FAILED console error.

**Implementation status:** API code is complete. The active Render deployment still needs to deploy the API commit.

**Dependency:** Render deployment.

**Status:** Code Complete / Deployment Blocked

## T-16 — XR controller lifecycle and controller movement
**Goal:** Start one XR session through the XR store and show controllers that track the physical devices correctly.

**Scope:** `ArViewport.tsx` and XR integration only.

**Acceptance:** Start Immersive AR creates one session; controller models move with physical controllers; left/right tracking status is observable; clicking Start again does not create a second session; leaving Spatial View ends the session; no Context Lost or `Can't change size while VR device is presenting` errors caused by manual session management.

**Implementation status:** Migrated the web app to `@react-three/xr` v6 store-based session management, removed manual `renderer.xr.setSession()`, removed legacy `<Controllers>/<Hands>` wiring, and enabled default tracked controllers through the XR store.

**Dependency:** Browser/device must support WebXR. Unsupported devices retain the normal 3D spatial fallback.

**Status:** Code Complete / Hardware Verification Pending

## T-17 — Comparison loads and displays saved versions
**Goal:** Saved versions appear as explicit selectable entries and comparison renders the selected pair.

**Scope:** version save/load flow + comparison UI only.

**Acceptance:** Save Version A and Version B; both appear in a visible version history; the user can select two versions and click Compare; both models render; comparison does not depend on rooms; no empty comparison when walls exist; no undefined `.length` errors.

**Current finding:** Versions currently exist only in React session state and there is no API endpoint for listing version history. The compare action always uses the latest two versions. This needs a dedicated UI/data task.

**Status:** Planned

## T-18 — Identify and remove application-owned 404
**Goal:** Eliminate the reported 404 or identify it as an intentional third-party/WebXR resource request.

**Scope:** Final browser network trace and only the owning resource path.

**Acceptance:** No application-owned 404 in production; any intentional third-party/WebXR 404 is documented and does not break the workflow.

**Status:** Planned

## T-19 — Final end-to-end release verification
**Goal:** Verify the complete user workflow with no blocking console errors.

**Flow:** upload → calibrate → draw walls → undo/delete → detect rooms → review 3D → save → save versions A/B → compare → spatial 3D → immersive AR where supported.

**Acceptance:** Every stage has a visible success state and all known blocking console errors are absent.

**Status:** Planned
