# Deployment Analysis & Next Implementation Tasks

Branch: `fix/editor-workflow-persistence-and-spatial`

## Current release blocker

The latest Vercel deployment for commit `8d3d640` does **not** fail during dependency installation. It fails during `@spatial/web` TypeScript compilation, before `vite build` starts.

### Exact blockers

1. `apps/web/src/components/ArViewport.tsx(50,3)` — `TS2322: Type 'null' is not assignable to type 'Element'.`
2. `apps/web/src/components/ArViewport.tsx(76,3)` — `TS2322: Type 'null' is not assignable to type 'Element'.`
3. `apps/web/src/components/RoomHighlightList.tsx(32,61)` — `TS18048: 'room.floorArea' is possibly 'undefined'.`

### Important dependency finding

The repository is not currently dependency-deterministic:

- `package.json` declares `@react-three/xr` `^6.6.30`.
- `apps/web/package.json` declares `@react-three/xr` `^6.6.30`.
- `package-lock.json` still records `@react-three/xr` `^5.7.1`.
- Vercel reports that `npm install` changed 27 packages.
- The build is currently running on Vercel Node 24 while the root engine declaration is only `>=18`.

This must be resolved before further XR implementation changes.

### Non-blocking warnings

These are not the immediate build failure and must not be mixed into the first fix:

- FontAwesome deprecation warning.
- 1 moderate and 1 high npm audit vulnerability.
- npm install-script approval warnings for esbuild.

They should be tracked separately after the production build is green.

---

## TASK-15 — Fix current Vercel TypeScript blockers

**Goal:** Restore a clean production type-check without weakening TypeScript strictness.

**Files:**
- `apps/web/src/components/ArViewport.tsx`
- `apps/web/src/components/RoomHighlightList.tsx`

**Steps:**
1. Resolve the two `ArViewport.tsx` null-versus-Element errors against the actual installed `@react-three/xr` API.
2. Do not disable `strict`, introduce broad `any` casts, or suppress compiler errors.
3. Guard optional `room.floorArea` with a valid domain fallback.
4. Run `npx tsc --noEmit -p apps/web/tsconfig.json` until zero errors remain.

**Acceptance:** Web type-check exits 0 with zero errors using the dependency versions committed to the repository.

**Status:** 🔴 Current release blocker.

---

## TASK-16 — Align XR dependency manifests and lockfile

**Goal:** Make local, Vercel, and clean-checkout dependency resolution identical.

**Files:**
- `package.json`
- `apps/web/package.json`
- `package-lock.json`
- `apps/web/vite.config.ts`

**Steps:**
1. Select one supported `@react-three/xr` version based on the APIs used by `ArViewport.tsx`.
2. Align root dependency, web dependency, overrides, and lockfile.
3. Verify React, React DOM, Three.js, Fiber, XR, and Zustand resolve to one compatible runtime set.
4. Pin the supported Node major version for CI/Vercel instead of leaving only `>=18`.
5. Reinstall from a clean checkout.

**Acceptance:** `npm ci` completes without modifying `package-lock.json`; `npm ls @react-three/xr react react-dom three @react-three/fiber zustand` shows the intended compatible versions.

**Status:** 🔴 Required before further XR work.

---

## TASK-17 — Make the Vite/Turborepo build reproducible

**Goal:** Prove the same source builds consistently with and without Turbo cache.

**Files:**
- `apps/web/vite.config.ts`
- `turbo.json`
- `package.json`
- `apps/web/package.json`

**Steps:**
1. Keep only the Vite plugins required by the source tree.
2. Keep React/Three/Fiber/XR/Zustand deduplication only where required by the final dependency graph.
3. Reassess the current `three` alias through `../../node_modules/three`.
4. Reassess `optimizeDeps`, including the `@iwer/devui` workaround.
5. Run `npx turbo build --filter=@spatial/web --force`.
6. Run the normal cached build afterward.

**Acceptance:** Forced and cached builds both exit 0.

**Status:** 🟠 Planned.

---

## TASK-18 — Restore the canonical editor workflow

**Goal:** Make the intended user journey explicit:

**Upload Blueprint → Calibrate Scale → Draw Walls → Detect/Validate Rooms → Review 3D → Spatial/AR**

**Files:**
- `apps/web/src/App.tsx`
- `apps/web/src/components/FloorPlanOverlay.tsx`
- `apps/web/src/components/SpatialCanvas.tsx`
- `apps/web/src/components/ui/SpatialHeader.tsx`
- `apps/web/src/components/ui/CanvasOverlay.tsx`

**Steps:**
1. Uploading JPG/PNG must visibly place the blueprint behind the 2D tracing layer.
2. Scale calibration must explain the known reference length and meters-per-pixel conversion.
3. Drawing walls must immediately update canonical `Project.walls` and the 3D viewport.
4. Room detection must be an explicit action with success/failure feedback.
5. Room selection must identify the selected room and matching walls.
6. Review 3D must open the actual generated 3D model.
7. Spatial/AR must require valid geometry and provide a clear desktop fallback when immersive AR is unsupported.
8. Preserve save/load/revert/version/share behavior.

**Acceptance:** A first-time user can complete all six stages without guessing what “draw walls in 2D” means.

**Status:** 🟠 Start only after the build is green.

---

## TASK-19 — Prove 2D-to-3D geometry equivalence

**Goal:** Guarantee that the geometry drawn over the blueprint is the geometry rendered in 3D.

**Files:**
- `apps/web/src/components/FloorPlanOverlay.tsx`
- `apps/web/src/components/SpatialCanvas.tsx`
- `packages/geometry-engine/*`
- `packages/core/*`

**Validation:**
1. Upload a representative blueprint.
2. Calibrate using a known dimension.
3. Draw a closed rectangle and verify endpoint snapping.
4. Verify wall IDs, world coordinates, length, thickness, and height.
5. Verify the 3D camera frames the generated model.
6. Verify the detected room floor is visible.
7. Verify undo/redo/delete/clear invalidate stale room state.

**Acceptance:** A closed rectangle produces visible walls and a visible floor in 3D using the same canonical wall data created by 2D tracing.

**Status:** 🟠 Planned.

---

## TASK-20 — Verify production styling

**Goal:** Prove the intended dark/glass styling is emitted and visible in the deployed bundle.

**Files:**
- `apps/web/src/styles.css`
- `apps/web/tailwind.config.js`
- `apps/web/postcss.config.js`
- `apps/web/src/main.tsx`
- `apps/web/src/components/ui/*`

**Steps:**
1. Confirm `styles.css` is imported by the real entry point.
2. Confirm Tailwind content globs include all TS/TSX components.
3. Confirm PostCSS runs Tailwind during production builds.
4. Inspect generated CSS for representative workflow/sidebar/header classes.
5. Verify glass panels, typography, buttons, hover states, and overlays are visible.
6. Verify overlays do not unintentionally block canvas pointer events.

**Acceptance:** Production UI is visibly styled and the 3D canvas remains interactive.

**Status:** 🟠 Planned.

---

## TASK-21 — Verify persistence and API contracts

**Goal:** Ensure Save, Load, Revert, Version, Compare, and Share operate on the same canonical `Project` state.

**Files:**
- `apps/web/src/App.tsx`
- `apps/web/src/services/api-client.ts`
- `apps/api/src/routes/projects.ts`
- `apps/api/src/controllers/project-controller.ts`
- `packages/core/src/*`

**Acceptance:**
- Saved walls and rooms reload correctly.
- Version snapshots are immutable.
- Comparison uses saved snapshots.
- Share opens the saved 3D model read-only.
- Revert restores the last saved baseline.
- API failures do not destroy the local recovery copy.

**Status:** 🟠 Planned.

---

## TASK-22 — Production browser E2E verification

**Goal:** Validate the actual deployed application after the build is green.

**Steps:**
1. Deploy the exact branch tip to Vercel.
2. Inspect browser console errors.
3. Test Upload → Scale → Trace → Rooms → 3D → Spatial/AR.
4. Test Save, Load, Revert, Save Version, Compare, and Share.
5. Test cursor/pointer behavior, orbit, zoom, pan, sidebar controls, and scrolling.
6. Test desktop and narrow viewport behavior.
7. Test immersive AR only on a WebXR-capable device and validate desktop fallback separately.

**Acceptance:** Production loads without critical console errors, every core action has visible feedback, and generated 3D geometry is visible and interactive.

**Status:** 🟠 Final validation phase.

---

## TASK-23 — Final release gate

**Goal:** Do not declare the spatial editor fixed until build, workflow, persistence, styling, and runtime validation all pass together.

**Acceptance:**
- `npm ci` passes without lockfile changes.
- `npx tsc --noEmit -p apps/web/tsconfig.json` passes.
- `npx turbo build --filter=@spatial/web --force` passes.
- Vercel deployment reaches `READY`.
- Blueprint upload and 2D tracing work.
- 3D walls and room floors are visible and correctly framed.
- Room selection/highlighting works.
- Save/load/revert/version/compare/share work.
- Spatial View works with desktop fallback.
- AR entry is guarded by browser/device capability.
- No critical console errors or duplicate Three.js runtime warnings.
- Intended styling is visible in production.

**Status:** 🔴 Release gate — not started.

---

## Evidence captured before implementation

- Vercel deployment `dpl_FRc1crfNGiCpBCBekJ3zk5SNWgLM` for commit `8d3d640` fails during TypeScript compilation.
- Dependency installation succeeds; the FontAwesome deprecation and npm audit warnings are not the immediate build blocker.
- `package.json` and `apps/web/package.json` declare XR `^6.6.30`, while `package-lock.json` records XR `^5.7.1`.
- `ArViewport.tsx` uses XR hooks/components whose types must match the selected XR major version.
- `RoomHighlightList.tsx` calls `room.floorArea.toFixed(2)` although `floorArea` is optional.
- `App.tsx` already contains the intended six-stage workflow and uses `SpatialCanvas` as the main 3D viewport.
- `styles.css` is imported by `main.tsx`, so styling must be validated from the generated production CSS rather than assumed broken from source alone.
- The earlier production Save problem was API CORS and remains a separate deployment/API verification concern.

## Implementation order

1. **TASK-15:** Fix the exact Vercel TypeScript errors.
2. **TASK-16:** Align XR/dependency manifests and lockfile.
3. **TASK-17:** Prove clean and cached production builds.
4. **TASK-18:** Correct and validate the actual user workflow.
5. **TASK-19:** Prove 2D/3D geometry equivalence.
6. **TASK-20:** Verify styling in the production bundle.
7. **TASK-21:** Verify persistence and API contracts.
8. **TASK-22:** Run deployed browser E2E validation.
9. **TASK-23:** Apply the final release gate.