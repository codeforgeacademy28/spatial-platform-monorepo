# Spatial Editor Workflow Implementation

The web editor is implemented as a dependency-ordered workflow rather than a collection of unrelated buttons.

## Task 1 — Canonical model state
**Goal:** Make wall segments first-class project data.

**Implementation:** `Project.walls` is canonical; rooms remain derived/validated metadata. Backward-compatible project parsing reconstructs walls from room wall segments when older data is loaded.

**Acceptance:** A partially traced plan can be saved without any room; saved versions contain every wall segment.

## Task 2 — Room detection and validation
**Goal:** Give the user an explicit room-validation action.

**Implementation:** Add `Detect Rooms` action, endpoint snapping/tolerance, visible room count/area/status, and validation feedback.

**Acceptance:** A visually closed wall loop produces a room without requiring exact floating-point endpoint equality.

## Task 3 — Explicit 3D review
**Goal:** Make 3D a deliberate user stage.

**Implementation:** Add workflow state and a `Review 3D Model` action after wall/room validation. Frame the model and show wall/room counts.

**Acceptance:** Users do not need to infer that the always-visible canvas is the 3D stage.

## Task 4 — Server persistence
**Goal:** Make `Save Project` call the backend.

**Implementation:** POST the canonical project to `/api/projects`; retain localStorage as recovery/fallback. Show saving/saved/error state.

**Acceptance:** Clicking Save Project creates a network request and successful response is visible to the user.

## Task 5 — Versioning and comparison
**Goal:** Compare complete model geometry, independent of rooms.

**Implementation:** Persist `Project.walls` in versions and diff canonical walls. Auto-frame comparison cameras.

**Acceptance:** Two versions with traced walls render non-empty comparison even when rooms are absent.

## Task 6 — Spatial/AR
**Goal:** Make spatial presentation the final explicit stage.

**Implementation:** Center/frame the model. Offer a usable 3D spatial fallback and only start immersive XR when supported. Do not use PointerLockControls.

**Acceptance:** The model is visible before entering XR and unsupported devices get a useful spatial viewer.

## Task 7 — End-to-end validation
**Goal:** Prevent regressions.

**Implementation:** Validate upload → calibration → walls → rooms → 3D → save → compare → spatial; ensure generated runtime artifacts cannot reintroduce PointerLockControls.

**Acceptance:** No PointerLockControls errors in the current production bundle and every workflow stage is reachable and observable.

## Current implementation branch
`fix/editor-workflow-persistence-and-spatial`

## Pull request
#13 — Fix spatial editor workflow, persistence, comparison, and AR flow

## Validation notes
- Canonical walls are included in saved projects and versions.
- Room detection is an explicit user action with endpoint snapping.
- 3D review and Spatial View are explicit workflow stages.
- Save Project posts to `/api/projects` and retains a local recovery copy.
- Comparison diffs canonical wall geometry and frames each version.
- Spatial View is centered and does not use PointerLockControls.
- API CORS accepts configured `WEB_ORIGINS` for deployed web clients.
