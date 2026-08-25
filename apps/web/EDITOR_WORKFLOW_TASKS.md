# Spatial Editor Workflow Implementation

The web editor is implemented as a dependency-ordered workflow rather than a collection of unrelated buttons.

## Completed Tasks 1–7

### Task 1 — Canonical model state ✅
**Goal:** Make wall segments first-class project data.

**Implementation:** `Project.walls` is canonical; rooms remain derived/validated metadata. Backward-compatible parsing reconstructs walls from room wall segments when older data is loaded.

**Acceptance:** A partially traced plan can be saved without any room; saved versions contain every wall segment.

### Task 2 — Room detection and validation ✅
**Goal:** Give the user an explicit room-validation action.

**Implementation:** `Detect Rooms` action, endpoint snapping/tolerance, visible room count/area/status, and validation feedback.

### Task 3 — Explicit 3D review ✅
**Goal:** Make 3D a deliberate user stage.

**Implementation:** Workflow state and `Review 3D Model` action after wall/room validation.

### Task 4 — Server persistence ✅ (deployment dependency remains)
**Goal:** Make `Save Project` call the backend.

**Implementation:** POST canonical project to `/api/projects`; localStorage remains a recovery copy. Saving/saved/error state is visible.

### Task 5 — Versioning and comparison ✅
**Goal:** Compare complete model geometry, independent of rooms.

**Implementation:** Versions persist `Project.walls`; comparison diffs canonical wall geometry and frames each version.

### Task 6 — Spatial/AR ✅ (hardware/browser validation remains)
**Goal:** Make spatial presentation the final explicit stage.

**Implementation:** Center/frame model, provide 3D fallback, prevent duplicate XR session requests, clean up XR on unmount, and never use PointerLockControls.

### Task 7 — End-to-end validation 🔄
**Goal:** Prevent regressions across upload → calibration → walls → rooms → 3D → save → compare → spatial.

**Remaining:** Complete interactive browser validation against the final deployed branch tip and confirm the Render API has deployed the CORS change.

---

# Stability & Recovery Workstream — Tasks 8–14

## Task 8 — Production API CORS ✅ code / ⏳ Render deployment
**Goal:** Make Save Project and API calls work from deployed Vercel clients.

**Evidence from supplied HAR:** the preflight to `https://spatial-api-w1k4.onrender.com/api/projects` returned `Access-Control-Allow-Origin: http://localhost:5173` while the requesting production origin was `https://spatial-platform-monorepo-2cs030qmy-snm5.vercel.app`. The browser consequently blocked the POST.

**Implementation:** API now accepts configured `WEB_ORIGINS`, localhost, the production Vercel URL, and a project-specific Vercel preview pattern.

**Acceptance:** Render must redeploy this API change; then OPTIONS must echo the deployed origin and POST `/api/projects` must succeed.

## Task 9 — Resilient project/shared loading ✅
**Goal:** Prevent blank screens and empty shared viewers.

**Implementation:** Client/shared viewer reads canonical `Project.walls`; load paths normalize through `ProjectSchema`; orphan rooms without wall segments are not displayed as valid rooms; load failures remain in the editor with an error message.

**Acceptance:** A saved project with walls renders those walls after load/share.

## Task 10 — Empty initial editor ✅
**Goal:** Do not create sample geometry implicitly.

**Implementation:** Removed automatic starter-wall initialization. Blueprint upload itself creates no walls or rooms.

**Acceptance:** Fresh editor = 0 walls, 0 rooms.

## Task 11 — Wall editing history ✅
**Goal:** Make tracing reversible.

**Implementation:** Added `Undo`, `Redo`, `Delete Last`, and `Clear` wall controls. Geometry edits invalidate room validation so stale rooms cannot survive changed wall geometry.

**Acceptance:** User can draw, delete, undo, redo, and clear without redrawing the blueprint.

## Task 12 — Revert to Last Saved Plan ✅
**Goal:** Restore the last successful server/local baseline after unsaved changes.

**Implementation:** Track `lastSavedProject` and provide `Revert Changes` with confirmation.

**Acceptance:** Revert restores project name, walls, rooms, and validation state without making a new API write.

## Task 13 — Safe XR lifecycle ✅ code / hardware validation pending
**Goal:** Prevent duplicate immersive sessions and WebGL context churn.

**Implementation:** Keep renderer reference; detect existing XR session before requesting another; attach session-end handling; bind the session to the renderer; end active sessions on unmount.

**Acceptance:** No `An active XRSession already exists` error from repeated Start AR clicks; spatial 3D fallback remains available.

## Task 14 — Blank-screen/error hardening 🔄
**Goal:** Never replace the editor with a blank screen after an API/load/XR failure.

**Implementation:** Load/save errors are surfaced in the workflow panel; project payloads are normalized before array access; shared-view rendering uses canonical walls.

**Remaining:** Identify the reported 404 resource from final browser verification and add/repair it only if it is an application-owned resource.

---

## Current implementation branch
`fix/editor-workflow-persistence-and-spatial`

## Pull request
#13 — Fix spatial editor workflow, persistence, comparison, and AR flow

## Current validation status
- HAR confirms the original Save failure is CORS, not a frontend fetch implementation error.
- Canonical walls are used by save, load, share, versioning, comparison, 3D, and spatial rendering.
- Fresh editor no longer seeds a room/walls automatically.
- Wall drawing now supports snap, undo, redo, delete-last, clear, and revert-to-last-saved.
- Duplicate XR session requests are guarded and renderer XR sessions are ended on unmount.
- The API code now supports production/preview Vercel origins, but the Render service must deploy that commit before production Save works.
- Final browser E2E validation remains the release gate.
