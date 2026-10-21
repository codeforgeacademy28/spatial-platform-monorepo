# Spatial Platform: Walkthrough, Import & AR Roadmap

## Current branch implementation status

This is a live engineering roadmap. A checkbox is only marked complete when its acceptance criteria and relevant automated tests pass; physical-device checks remain explicitly manual.

- **Implemented and previously CI-verified:** canonical floor-plan/world transform helpers and quarter-turn/centered-layout regression tests (Engineering Gate run 159).
- **CI-verified in Engineering Gate run 163:** extracted swept-circle wall collision queries with tests for fast wall crossing, parallel movement, recovery away from a wall, movement deeper into overlap, and non-finite inputs. The viewport calls the shared geometry-engine collision helper.
- **Implemented foundation:** desktop first-person mode with pointer-lock mouse look, normalized WASD movement, sprint, jump/gravity, and axis-separated collision. This is not yet a full game physics controller; corner sliding, step/crouch rules, and opening-aware collision remain open.
- **CI-verified in Engineering Gate run 159:** upload extension/content validation and API tests for common image, PDF, GLB/GLTF, IFC, DXF, OBJ, STL, and DWG source files. Upload acceptance is not conversion into an editable scene.
- **Implemented; current Engineering Gate run 169 pending:** local GLB and self-contained glTF import in Spatial View, bounds centered horizontally with the base on the floor, translate/rotate/scale gizmos, and browser-local IndexedDB persistence of the original file and transform. The saved model is restored after reload and can be explicitly removed. This storage is browser/device-local, not synchronized with project/server/share/version data. External-resource glTF, IFC/CAD conversion, and arbitrary-format conversion are not implemented.
- **Documentation in place:** prioritized task plan, proposed coordinate/import ADR, and manual smoke checklist.

**Still not complete:** project-level/server-synchronized 3D asset records and version/share integration, import preview/progress, external-resource glTF packaging, IFC/CAD conversion, 2D plan tracing into reviewed geometry, reusable editable building components, multi-floor/stair traversal, door/window-aware collision geometry, confirmed AR hit-test placement/anchors/scale, and physical-device AR validation. Do not represent source-file upload as model conversion.

---

## Product outcome

Turn Spatial Platform into a persistent building-design sandbox with a game-quality first-person walkthrough and dependable full-scale AR preview. Keep the existing React, Three.js, React Three Fiber, WebXR, BIM engine, and monorepo architecture unless an ADR documents why a change is needed.

## Definition of done for every task

- [ ] Acceptance criteria are testable and documented.
- [ ] Unit/integration tests cover core geometry, transforms, and failure paths where practical.
- [ ] `npm run build` passes from the repository root.
- [ ] No success UI is shown when an import, save, placement, or AR session has failed.
- [ ] Unsupported formats and device capabilities are explained clearly.
- [ ] Existing projects and saved versions remain compatible or have an explicit migration.
- [ ] Update this roadmap and the relevant ADR when architecture or data contracts change.

## Phase 7 — Coordinate system, collision and player controller

### TASK-701 — Canonical world coordinate contract
- **Priority:** P0
- **Files:** `apps/web/src/components/ArViewport.tsx`, `packages/core/src/index.ts`, new geometry-engine transform helpers, geometry tests.
- **Work:** Define units (meters), floor-plan axes, world axes, origin, yaw convention, floor elevation, and asset-local transforms. Replace magic `+90°` and offset corrections with named conversion functions. Convert floor-plan coordinates exactly once.
- **Acceptance:** Known test points map correctly at 0/90/180/270 degrees; model bounds center and collision geometry agree; imported models with different origins can be normalized without moving their intended placement.
- [ ] Implement
- [ ] Test

### TASK-702 — Deterministic wall collision and wall sliding
- **Priority:** P0
- **Files:** `apps/web/src/components/ArViewport.tsx`, geometry-engine collision module, tests.
- **Work:** Move player-circle-vs-wall checks into a pure tested module; use swept movement to prevent tunneling; resolve movement along the wall tangent; handle corners, short walls, wall thickness, door openings, and recovery when starting in contact with a wall.
- **Acceptance:** Player cannot cross solid walls at normal or sprint speed; can slide along walls; can move away after spawn/teleport near a wall; doors remain traversable only through defined openings.
- [ ] Implement
- [ ] Test

### TASK-703 — First-person desktop controls
- **Priority:** P0
- **Files:** new `FirstPersonController.tsx`, `ArViewport.tsx`, UI controls and tests.
- **Work:** Add pointer-lock mouse look, WASD movement relative to camera yaw, sprint, crouch, gravity, jump, step-height rules, keyboard help, pause/release pointer lock, and a reset/spawn action. Keep orbit/editor mode separate.
- **Acceptance:** Movement speed is frame-rate independent; diagonal movement is normalized; the camera stays at eye height on level floors; pointer lock is released on Escape and when leaving walkthrough mode.
- [ ] Implement
- [ ] Test

### TASK-704 — Floors, stairs and traversable openings
- **Priority:** P1
- **Files:** `packages/core/src/index.ts`, geometry-engine, wall/room rendering, project persistence.
- **Work:** Add floor/level metadata and stair geometry; render actual door/window openings rather than solid wall boxes; generate walkable floor colliders per level.
- **Acceptance:** Multi-floor project can be navigated by stairs; openings align to their host wall; floor elevation and room membership survive save/load/versioning.
- [ ] Implement
- [ ] Test

### TASK-705 — WebXR locomotion and collision parity
- **Priority:** P1
- **Files:** `apps/web/src/components/ArViewport.tsx`, controller-locomotion service.
- **Work:** Apply the same canonical collision queries to headset/controller locomotion and teleport destinations; avoid resetting tracked camera pose to force-level a real headset; keep physical head tracking separate from artificial player movement.
- **Acceptance:** XR movement cannot pass through walls; teleport landing is validated; head pose is not overwritten by software leveling; leaving/re-entering a session resets only app-owned state.
- [ ] Implement
- [ ] Test on supported hardware

## Phase 8 — Import pipeline and editable building scene

### TASK-801 — File format registry and honest upload validation
- **Priority:** P0
- **Files:** `apps/api/src/routes/uploads.ts`, upload service, docs and tests.
- **Work:** Validate extension, declared MIME type, file signature/content, size, and asset type together. Support clearly documented initial formats; do not claim a format is converted merely because it was uploaded. Store original filename safely as metadata and generate storage keys server-side.
- **Acceptance:** Valid GLB/GLTF and supported image files pass; malformed files and mismatched extensions fail with useful errors; oversized files fail before storage; tests cover magic bytes and MIME spoofing.
- [ ] Implement
- [ ] Test

### TASK-802 — GLB/GLTF scene import
- **Priority:** P0
- **Files:** web asset loader, asset registry, editor and tests.
- **Work:** Load GLB/GLTF with textures/materials, normalize bounds and units, retain source metadata, and expose position/rotation/scale controls. Show progress, errors, and an import preview.
- **Acceptance:** User can import, position, rotate, resize, save, reload, and remove a 3D asset without uploading a blueprint.
- [ ] Implement
- [ ] Test

### TASK-803 — IFC/BIM ingestion into a reusable scene
- **Priority:** P1
- **Files:** `packages/bim-engine/src/ifc-loader.ts`, asset conversion service, core schema and UI.
- **Work:** Preserve IFC element IDs/types, geometry transforms, levels, material data where available, and source metadata. Dispose parser resources after conversion. Avoid flattening away object identity.
- **Acceptance:** IFC model can be imported as a multi-level scene; element selection identifies its source element; conversion errors are surfaced and do not leave leaked resources.
- [ ] Implement
- [ ] Test representative IFC fixtures

### TASK-804 — CAD/DXF/DWG and interchange support matrix
- **Priority:** P1
- **Files:** BIM/import packages, API validation, documentation.
- **Work:** Add a format-adapter interface. Implement only formats supported by a reliable parser/converter; treat DWG as a conversion workflow unless a licensed/compatible parser is adopted. Keep the original file linked to converted output.
- **Acceptance:** Every format in the UI has a documented path (direct import, conversion required, or unsupported); no unsupported file is silently treated as a valid model.
- [ ] Implement
- [ ] Test

### TASK-805 — 2D image/PDF/sketch-to-building workflow
- **Priority:** P1
- **Files:** import wizard, geometry-engine, AI-engine integration, project schema.
- **Work:** Detect/trace candidate walls and room boundaries, ask for scale and floor count when unknown, infer openings only with confidence indicators, and provide a review/correction step before committing geometry.
- **Acceptance:** User can start from common image/PDF inputs; uncertain geometry is visibly flagged; no claim of accurate dimensions without scale calibration; original source remains available.
- [ ] Implement
- [ ] Test representative plans

### TASK-806 — Reusable building component library
- **Priority:** P1
- **Files:** core scene schema, editor, asset catalog.
- **Work:** Add reusable doors, windows, stairs, columns, roofs, furniture, fixtures, lights and service elements. Support snapping, duplication, transform handles, selection, delete/undo, and asset categories.
- **Acceptance:** Components can be placed and edited in scene units, persisted in project versions, and selected independently of wall geometry.
- [ ] Implement
- [ ] Test

## Phase 9 — AR placement and alignment

### TASK-901 — Surface placement preview and confirmation
- **Priority:** P0
- **Files:** `ArViewport.tsx`, AR placement service, device capability UI.
- **Work:** Use hit-test/surface tracking when available; show a ghost preview; let the user confirm placement and yaw; expose scale/anchor status and reset/reposition controls.
- **Acceptance:** Model is not presented as anchored before confirmation; unsupported devices get a useful fallback; user can reposition deliberately.
- [ ] Implement
- [ ] Test on supported hardware

### TASK-902 — Scale and floor alignment
- **Priority:** P0
- **Files:** AR transform utilities, import pipeline, UI.
- **Work:** Normalize model units, show a known-size reference, align the model base to the detected surface, and keep orientation correction separate from tracked headset orientation.
- **Acceptance:** A known-size test asset renders at expected real-world scale; no hard-coded floor-plan yaw is required to align arbitrary imports.
- [ ] Implement
- [ ] Test on supported hardware

### TASK-903 — AR anchor lifecycle and multi-floor viewing
- **Priority:** P1
- **Files:** AR placement service, project schema.
- **Work:** Persist app-level placement metadata where browser/device capabilities permit; handle tracking loss, session end, re-entry, and floor selection. Document browser anchor persistence limits.
- **Acceptance:** Tracking loss produces a visible status; the user can recover/re-place the model; multi-floor visibility controls do not alter the saved source geometry.
- [ ] Implement
- [ ] Test on supported hardware

## Phase 10 — Visual quality, editing and project persistence

### TASK-1001 — Architectural rendering preset
- **Priority:** P1
- **Files:** scene renderer, material presets, lighting controls.
- **Work:** Add physically plausible materials, tone mapping, contact shadows, environment lighting, wall/floor finish presets, and quality settings for mobile versus desktop.
- **Acceptance:** Lighting/material settings are configurable; mobile performance mode avoids expensive effects; geometry remains readable in cutaway mode.
- [ ] Implement
- [ ] Test representative devices

### TASK-1002 — Cutaway, floor isolation and inspection modes
- **Priority:** P1
- **Files:** viewer controls, scene graph.
- **Work:** Add per-floor visibility, roof/ceiling toggle, cutaway/explode view, measurement labels and selected-element properties.
- **Acceptance:** Inspection modes do not mutate canonical project geometry and are reversible.
- [ ] Implement
- [ ] Test

### TASK-1003 — Persistent asset references and project migration
- **Priority:** P0
- **Files:** `packages/core/src/index.ts`, API routes, persistence and versioning.
- **Work:** Persist scene assets, source file references, import metadata, floor levels, units and transforms. Add schema versioning and safe migration defaults for existing projects.
- **Acceptance:** Save/load/share/version comparison round-trips all supported scene data; legacy projects still load; private source assets are not exposed by public URLs without authorization.
- [ ] Implement
- [ ] Test

### TASK-1004 — Undo/redo and autosave safeguards
- **Priority:** P2
- **Files:** editor state, project persistence.
- **Work:** Add command-based undo/redo for scene edits, unsaved-change warning, autosave status, and recovery after reload.
- **Acceptance:** Core placement/transformation/deletion actions are undoable; failed saves never display a success state.
- [ ] Implement
- [ ] Test

## Phase 11 — Quality gates and release

### TASK-1101 — Automated geometry and controller regression suite
- **Priority:** P0
- **Files:** test configuration, transform/collision/import modules.
- **Work:** Add deterministic tests for coordinate transforms, wall crossings, sliding, doors, stairs, unit conversion, invalid uploads, and project migrations.
- **Acceptance:** Tests run in CI; regressions in orientation/collision fail the build.
- [ ] Implement
- [ ] Test

### TASK-1102 — Browser and AR smoke-test checklist
- **Priority:** P0
- **Files:** `docs/testing/spatial-walkthrough-checklist.md`, CI where feasible.
- **Work:** Document desktop Chrome/Edge walkthrough checks, mobile browser support, HTTPS requirements, WebXR support detection, and physical-device validation.
- **Acceptance:** Release notes distinguish automated checks from manual device checks; no physical AR support is claimed without a device test.
- [ ] Implement
- [ ] Test

### TASK-1103 — Performance and upload security hardening
- **Priority:** P1
- **Files:** upload pipeline, scene renderer, API and security docs.
- **Work:** Add upload quotas, safe filenames, parser limits/timeouts, resource disposal, large-scene performance budgets, and graceful failure handling.
- **Acceptance:** Oversized/malformed files cannot exhaust server memory; expensive parsing is bounded; scenes report performance limitations rather than freezing silently.
- [ ] Implement
- [ ] Test

## Delivery sequence

1. Fix and test coordinate transforms before adding visual polish.
2. Establish tested collision and first-person movement.
3. Add floor/opening geometry and persistent scene assets.
4. Make supported file imports genuinely editable.
5. Implement AR placement/scale/anchor behavior and verify on real devices.
6. Add rendering polish, advanced editing, and performance work.

Do not mark tasks complete because code was generated. Mark them complete only after acceptance checks pass.