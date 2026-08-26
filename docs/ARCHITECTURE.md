# Spatial Platform — Architecture Handoff

## Architectural intent

The application is a blueprint-to-spatial workflow where 2D wall geometry is authoritative and all downstream representations derive from it.

## Domain model

```text
Blueprint
   ↓
Calibration
   ↓
Project.walls  ← canonical geometry / source of truth
   ↓
Room detection + validation
   ↓
3D model
   ↓
Spatial / XR presentation
```

Rooms are derived/validated metadata. They must not become the sole representation of geometry.

## Workflow state

```text
Upload
  ↓
Calibrate
  ↓
Trace Walls
  ↓
Validate Rooms
  ↓
Review 3D
  ↓
Spatial / AR
```

Each state should expose its prerequisite and provide visible feedback when an action is blocked or fails.

## Editing model

- Wall edits operate on canonical wall segments.
- Snap/tolerance assists tracing.
- Undo/redo/delete/clear operate on wall geometry.
- Geometry mutation invalidates room validation.
- Revert restores the last saved project baseline.
- localStorage is a recovery copy only.

## 3D model

The 3D representation is generated from canonical wall geometry. The model is centered/framed for review. Desktop navigation must work without WebXR.

Normal navigation and commenting are separate explicit interaction modes.

## Persistence and versions

```text
Editor state
    ↓
clone/deep snapshot
    ↓
POST /api/projects
    ↓
Durable backend
    ↓
Load/share/version comparison
```

Version snapshots must be immutable. Comparison explicitly selects two snapshots and renders the wall geometry contained by those snapshots.

Publishing/sharing must not report success when durable persistence is unavailable.

## API/CORS

The web client is deployed on Vercel while the API is hosted separately. Production CORS must allow the configured Vercel origins. Preview support should be constrained to the intended project pattern rather than opening arbitrary origins.

## XR architecture

The application uses `@react-three/xr` v6 store-based APIs.

Principles:
- Query `immersive-ar` support before enabling AR.
- Prevent duplicate active XR sessions.
- Bind the session to the renderer.
- Clean up/end sessions on unmount.
- Track controller state through the XR store.
- Provide desktop fallback when WebXR is unavailable.

## Build/runtime architecture

The repository uses Vite/Turborepo and must keep dependency resolution deterministic.

Important production lesson: do not manually create vendor chunks that combine state libraries such as Zod/Zustand unless the dependency graph has been proven safe. The previous production blank screen was caused by an evaluation cycle introduced by such chunking.

Three.js should resolve to one runtime instance using explicit Vite alias/dedupe configuration.

## Testing strategy

Minimum engineering gate:

1. clean install
2. dependency graph validation
3. strict web type-check
4. production build
5. core snapshot tests
6. geometry tests
7. browser workflow validation
8. deployment/runtime verification
9. WebXR hardware verification where applicable

## Release principle

Do not expand product scope while a current release gate is unverified. Fix proven regressions first, then run the smallest evidence-producing verification that can close the gate.
