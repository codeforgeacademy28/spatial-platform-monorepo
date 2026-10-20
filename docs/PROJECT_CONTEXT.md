# Spatial Platform — Project Context

**Last updated:** 2026-08-26
**Repository:** `codeforgeacademy28/spatial-platform-monorepo`
**Default branch:** `main`
**Working implementation branch used during the recent workflow work:** `fix/editor-workflow-persistence-and-spatial`
**Current documentation branch:** `docs/project-context-handoff`
**Production web:** `https://spatial-platform-monorepo-web.vercel.app/`

## Purpose

This repository is building a reliable blueprint-to-spatial editor. The intended product journey is:

**Upload Blueprint → Calibrate Scale → Trace Walls → Validate Rooms → Review 3D → Save/Version/Share → Spatial/AR**

The canonical product rule is that `Project.walls` is the source of truth. Rooms are derived/validated metadata rather than the authoritative geometry model.

## Source-of-truth hierarchy

1. Current repository source code and committed tests.
2. `PRODUCT_EXECUTION_PLAN.md` for product goals, gates, and current release state.
3. `apps/web/EDITOR_WORKFLOW_TASKS.md` for editor-specific implementation status.
4. `apps/web/RELEASE_TASKS.md` for release backlog/status.
5. `docs/IMPLEMENTATION_STATUS.md` and `docs/DEBUGGING_HISTORY.md` for the condensed historical handoff.
6. Older task documents are historical evidence and may contain superseded status; compare their commit/ref before acting on them.

## Current engineering baseline

- Monorepo uses npm workspaces with `apps/*` and `packages/*`.
- Turborepo orchestrates build/dev/lint tasks.
- Node baseline is `24.x`.
- `@react-three/xr` is on the v6 API line (`^6.6.30`).
- Root dependency overrides pin React 18.3.x, React DOM 18.3.x, Fiber 8.17.x, XR 6.6.x, and Three.js 0.166.x.
- The product deliberately treats desktop 3D as the baseline and immersive AR as progressive enhancement/capability-gated behavior.

## Product invariants

### Geometry
- `Project.walls` is canonical.
- Rooms are derived/validated from wall topology.
- Saved versions must preserve the exact wall set visible at save time.
- Shared/read-only views must render canonical wall geometry, not stale room-only data.

### Workflow
- Each stage has an explicit state, prerequisite, user feedback, and exit condition.
- Blueprint upload by itself must not invent walls or rooms.
- Scale calibration must use an actual known reference length.
- Drawing/editing walls must invalidate stale room validation.
- Review 3D is an explicit stage after valid wall/room work.
- Spatial/AR must be gated by valid geometry and supported capability.

### Persistence
- Save is a real backend persistence operation.
- Local browser storage is a recovery copy, not a substitute for durable persistence.
- Version snapshots are immutable/deep-cloned.
- Publish/share must not claim durability without the required backend persistence contract.
- Revert restores the last saved baseline without silently creating a new write.

### Interaction
- Normal 3D navigation must not unexpectedly enter comment mode.
- Commenting is an explicit mode and exits after successful placement.
- Wall editing supports undo, redo, delete-last, clear, and revert-to-last-saved.
- Spatial navigation has a desktop fallback; XR remains progressive enhancement.

## Major implementation history already integrated

Recent integrated work includes:

- canonical wall geometry and compatibility loading
- room detection/validation and room highlighting
- explicit 3D review stage
- server persistence contract plus local recovery
- immutable version history and explicit A/B comparison
- wall undo/redo/delete/clear/revert controls
- safer shared-project rendering from canonical walls
- XR lifecycle/session handling
- XR v6 store-based integration
- XR capability gating
- desktop Spatial locomotion and teleport-pointer setup
- Three.js alias/dedupe
- production blank-screen fix caused by unsafe Vite manual vendor chunking
- production styling/accessibility/responsive hardening

## Current release state

The current repository documentation records that PR #27 has been integrated into `main`, with production deployment ready from commit `092b2b6b8b0f99999a265e5b23899d307e6156d9`.

The latest source history also contains a documentation commit `76d5938854e4fbef724f11ccc0749fd8dc7622ce` recording the blank-screen fix/release state.

The main remaining work is release verification rather than speculative feature expansion:

- complete real browser workflow validation
- verify durable save/restart/share against the configured backend
- validate XR hardware/browser lifecycle
- close any proven application-owned 404 or runtime issue

## Known important incident

The latest production blank screen was traced to unsafe Vite `manualChunks` grouping of Zod/Zustand into a `state-vendor` chunk, producing a production module initialization cycle (`Cannot access 'Te' before initialization`). Removing the unsafe manual vendor chunking restored the production bundle.

Browser-extension `background.js` tab/window errors were separately identified as extension noise, not application failures.

## Non-blocking warnings

Package deprecations and npm audit findings are tracked separately from the core release gate. Do not mix these into the first fix when a reproducible application/build blocker exists.

## How to continue in a new chat

Start by reading:

1. `docs/PROJECT_CONTEXT.md`
2. `docs/IMPLEMENTATION_STATUS.md`
3. `docs/DEBUGGING_HISTORY.md`
4. `docs/ARCHITECTURE.md`
5. `PRODUCT_EXECUTION_PLAN.md`
6. `apps/web/EDITOR_WORKFLOW_TASKS.md`
7. `apps/web/RELEASE_TASKS.md`

Then inspect the current branch/commit and source files relevant to the user's reported issue. Do not repeat completed investigation unless new evidence invalidates it.

When a verification gate changes, update the handoff documents in the same change/PR so the repository remains self-describing.
