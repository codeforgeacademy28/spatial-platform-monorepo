# Spatial Platform — Durable Project State

## Product
A blueprint-to-spatial editor with canonical 2D wall geometry, room validation, 3D review, persistence/versioning/share, desktop Spatial navigation, and optional WebXR/AR.

## Architecture rules
- `Project.walls` is canonical geometry.
- Rooms are derived/validated from wall topology.
- Desktop Spatial camera/navigation is independent from XR `XROrigin`.
- Browser Spatial works without WebXR hardware.
- WebXR is progressive enhancement and must be explicitly entered.
- XR browser emulation is opt-in test mode only.
- Persistence must distinguish local recovery from durable Supabase storage.
- Build/runtime/dependency state must be deterministic.
- Navigation collision math lives in `@spatial/geometry-engine`, not the React viewport.

## Key technical state
- Node/Vercel baseline: 24.x.
- XR package: `@react-three/xr 6.6.30`.
- React: 18.3.1.
- Three: 0.166.1.
- Three.js should remain a single runtime.
- Do not introduce manual vendor chunking that can create module initialization cycles.
- Installed `@react-three/xr 6.6.30` does not support a `referenceSpace` prop on `<XR>` or an `originReferenceSpace` option on `createXRStore`.
- Installed XR v6 session initialization already requests `local-floor` by default; do not add unsupported newer API options.

## Spatial controls
### Browser
- W / ArrowUp: forward.
- S / ArrowDown: backward.
- A / ArrowLeft: strafe left.
- D / ArrowRight: strafe right.
- Mouse drag: orbit.
- Wheel: zoom.
- Wall collision toggle: ON by default; OFF enables free inspection.
- Collision uses `resolveMovementWithWalls()` in `@spatial/geometry-engine`.
- The resolver sweeps the complete movement vector first; when blocked it falls back to safe axis sliding, preventing diagonal cuts through angled walls.

### XR
- `Start Immersive AR` is explicit and capability-gated.
- `offerSession` is false to prevent automatic session races.
- `enterGrantedSession` is false.
- `?xrTest=1` explicitly enables browser XR emulation for testing.
- XR v6's session-init defaults request `local-floor` for immersive sessions.
- XR locomotion: left stick, 30-degree snap turn, teleport pointer.
- `XROrigin` is used for XR player placement; desktop movement must not modify it.

## Important historical defects already fixed
1. Vercel TypeScript blockers in XR/room components.
2. XR v5/v6 lockfile mismatch.
3. Wrong global Zustand forcing.
4. Room polygon traversal dropping first wall endpoint (4x4 room reported 8 m² instead of 16 m²).
5. 3D wall extrusion offset from canonical centerline.
6. Incorrect 3D camera/model framing.
7. Normal 3D click accidentally triggering comments.
8. API false durable-save success on Supabase failure.
9. Unsafe Vite Zod/Zustand manual chunking causing `Cannot access 'Te' before initialization` and a blank production UI.
10. XR automatic session offer racing with explicit `enterAR()` and causing the `offerSession`/`iwer onDeviceFrame` crash loop.
11. Unsupported `originReferenceSpace` XR store option added during R2.3; removed after Vercel TS2353.
12. Unsupported `referenceSpace` prop attempted on `<XR>`; removed after Vercel TS2322 because installed XR v6 `XRProperties` does not expose it.
13. Browser wall collision moved from React component math into `@spatial/geometry-engine` and upgraded to swept movement.
14. Independent X/Z collision checks could still permit diagonal traversal across angled walls; fixed by full-vector sweep with safe axis-slide fallback and regression test.
15. XR floor contract verified against installed v6 source: `buildXRSessionInit()` requests `local-floor` by default.

## Current verification state
- Active branch: `fix/xr-browser-spatial-navigation`.
- Active PR: #57.
- Latest implementation head tested by Engineering Gate: `3a5af4cbedc7cc8f85327052699cf96ee9efff2d`.
- Engineering Gate #99 on that head passed the established install/runtime/type-check/build/core-snapshot/geometry contract gate.
- Latest durable documentation head before this update: `df873c766359ef24b096a5895e2180c4378a9c4e`.
- READY Vercel deployment for the implementation head: `dpl_BB2kj3rRjWQvwywws1h8g3Q3pNoe`; the Vercel integration fetched its preview root with HTTP 200 and the Spatial Platform HTML shell.
- No interactive browser session was established in the latest agent attempt: `agent-browser` executable was unavailable and `npx --yes agent-browser --version` timed out after 30 seconds; direct container DNS also failed for the Vercel hostname.
- Therefore upload/file-picker, canvas workflow, keyboard/mouse navigation, collision behavior, browser console behavior, and `?xrTest=1` interaction are not revalidated by this attempt.
- Native WebXR is unavailable in the current agent environment, so AR floor, controller framing/poses, XR locomotion, native session lifecycle, and XR resize stability remain external browser/device gates.
- R2.2/R2.3 remain **BUILD GREEN / BROWSER-XR GATE REQUIRED**.
- Do not mark browser or hardware behavior as verified until an externally reachable browser/device exercises the remaining acceptance matrix.

## Release branches
- `main`: PR #27 integrated.
- `fix/xr-browser-spatial-navigation`: active PR #57, XR/browser regression recovery.

## Verification philosophy
Static/build verification is necessary but not sufficient. Browser interaction and XR hardware behavior must be explicitly marked external gates until actually exercised.

## Product-owner operating mode
- Canonical mode keyword: `TIGER-SPATIAL-OWNER`.
- Durable behavior instructions: `.github/SPATIAL_PRODUCT_OWNER_MODE.md`.
- The repo is the durable source of truth when chat history is unavailable.
