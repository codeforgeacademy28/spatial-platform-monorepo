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
- Active branch: `main`.
- Active PRs: none. PR #65 (walkthrough/import/collision foundation) and PR #57 (XR lifecycle/browser navigation) are merged.
- PR #65 merge commit: `aebd83e698af024cf98490f8cb386f62399faa1e`.
- PR #57 merge commit: `6c09a07bbb0411dfa11feb2396e814f402b0cf2d`; Vercel status is success for this commit.
- Engineering Gate #99 on that head passed the established install/runtime/type-check/build/core-snapshot/geometry contract gate.
- Latest durable documentation head before this update: `df873c766359ef24b096a5895e2180c4378a9c4e`.
- READY Vercel deployment for the implementation head: `dpl_BB2kj3rRjWQvwywws1h8g3Q3pNoe`; the Vercel integration fetched its preview root with HTTP 200 and the Spatial Platform HTML shell.
- No interactive browser session was established in the latest agent attempt: `agent-browser` executable was unavailable and `npx --yes agent-browser --version` timed out after 30 seconds; direct container DNS also failed for the Vercel hostname.
- Therefore upload/file-picker, canvas workflow, keyboard/mouse navigation, collision behavior, browser console behavior, and `?xrTest=1` interaction are not revalidated by this attempt.
- Native WebXR is unavailable in the current agent environment, so AR floor, controller framing/poses, XR locomotion, native session lifecycle, and XR resize stability remain external browser/device gates.
- R2.2/R2.3 remain **BUILD GREEN / BROWSER-XR GATE REQUIRED**. Merging does not imply the real-browser or physical-device acceptance matrix passed.
- Do not mark browser or hardware behavior as verified until an externally reachable browser/device exercises the remaining acceptance matrix.

## Release branches
- `main`: PR #27 integrated.
- `main`: merged walkthrough foundation, wall sliding, explicit XR session lifecycle, opt-in XR emulation, and browser navigation fixes.

## Verification philosophy
Static/build verification is necessary but not sufficient. Browser interaction and XR hardware behavior must be explicitly marked external gates until actually exercised.

## Product-owner operating mode
- Canonical mode keyword: `TIGER-SPATIAL-OWNER`.
- Durable behavior instructions: `.github/SPATIAL_PRODUCT_OWNER_MODE.md`.
- The repo is the durable source of truth when chat history is unavailable.

---

## Product state update — Blueprint-to-playable-house (2026-10-23)

### Product requirement
The product target is a deterministic, editable, dimensionally coherent building model that can be traced/imported from a calibrated blueprint, rendered as a 3D home, navigated at human scale, edited component-by-component, and reliably saved/reopened/shared. AI recognition is optional and must not be in the critical path.

### Evidence-backed existing foundations
- 2D wall sketching and canonical WallSegment/Room data exist.
- Floor-plan/world transform helpers and an initial desktop first-person controller exist.
- Wall collision has geometry-engine implementation and automated contract tests from prior work.
- Local GLB/glTF import and browser-local IndexedDB persistence exist for the imported source file and transform.
- Project API save/share and local project save paths exist; their support for all future building-scene data is not yet complete.

### Open product gaps
- User reports AR orientation/immersion is incorrect; this remains a reproduction and physical-device verification item, not a proven root cause.
- Browser-local asset storage is not equivalent to durable project/server/version/share persistence.
- Current wall sketching does not constitute a full multi-floor building editor.
- Complete horizontal slabs/ceilings, level-aware building schema, real interactive openings, door state-aware collision, stairs, grounded multi-floor navigation, and independently editable furniture/components remain to be implemented/verified.
- Blueprint image/PDF reconstruction must use explicit scale and human review when geometry is ambiguous; AI recognition is optional.
- Browser walkthrough and supported-device WebXR behavior require separate acceptance evidence.

### Execution control
Phase 12 of TASKS.md is the detailed acceptance backlog. Implement in sequence: orientation/scale diagnosis → full-scene persistence → versioned canonical building schema → floor levels/slabs → openings/doors/windows → stairs and first-person traversal → component catalog/materials → deterministic blueprint ingestion → browser and device validation. Do not check off work from planning, source inspection or build evidence alone.

### Current branch state
The branch feat/blueprint-to-playable-house-roadmap contains the Phase 12 backlog and state updates plus a runtime fix in apps/web/src/App.tsx. Local load/revert now restore sceneAssets, wallOpenings and presentation; save-version snapshots preserve the complete current Project instead of reconstructing a reduced wall/room-only object. GitHub Actions Engineering Gate run #180 passed clean install, critical runtime graph, web type-check, web production build, core snapshot contract tests, geometry contract tests and API upload validation. This establishes BUILD GREEN only; browser behavior and physical AR are not verified. TASK-1202 remains open.


## 2026-10-23 — Persistence and project library update

The previous Save path could report a server save while the API was running in local-only mode, and Load restored only one browser-local project. The code now exposes list/load API endpoints, assigns UUID identities compatible with the Supabase schema, persists browser recovery copies in a multi-project local library, and presents a saved-project dialog that labels source/durability. Supabase remains deployment-config dependent; there is no evidence yet that the live Supabase instance is enabled or reachable. Automated build and browser round-trip verification are pending.


## Canonical building model update — 2026-10-23

The versioned project schema now includes an additive `building` model: ordered levels/elevations, floor slabs, staircases and typed components with position/rotation/scale, dimensions, material, visibility, lock and door state. Legacy projects parse into a default ground-floor model. The editor stores this model in the same project snapshot used by API/local persistence. The desktop 3D and Spatial/AR scene render the current model's slabs, stair-step meshes and basic component proxies; floor selection and component transform controls are present. These are foundational increments only: level-aware traversal, final geometry for each component type, ceilings, true door hinge/collision behavior, undo/redo and full browser/device acceptance remain open.


## Latest implementation additions

The editor now has persisted house yaw calibration applied consistently in the Spatial/AR model transform, inverse coordinate conversion and collision/navigation paths; a known-size rectangular-room transform contract test; component material/scale/duplicate/visibility/lock controls; floor and ceiling material controls; active-floor isolation; full project JSON import-as-copy and export; whole-project undo/redo snapshots; and debounced browser recovery autosave. These features are source-level implementation only until browser/device acceptance is recorded.


## Latest engineering status — 2026-10-23

- Implementation estimate across Phases 12–13: roughly 35–40%; 0/17 tasks are acceptance-complete. All task checkboxes remain open by design.
- Gate #268 results: web type-check/build passed; core tests 4/4 passed; geometry tests 26/26 passed; API tests failed on missing built workspace dependency @spatial/billing/dist/index.js before API contract tests could run.
- CI was updated to use npx turbo run test --filter=@spatial/api --force so API dependencies build before tests. Project API tests now explicitly cover scene assets, wall openings, presentation data, and fail-closed behavior when Supabase configuration is missing.
- Persistence handler now commits to process cache only after a successful Supabase write, and durable share-token reads verify the token against Supabase rather than trusting process memory.
- Await fresh CI. Deployed Supabase save/list/open/restart, browser end-to-end behavior, and physical AR remain external acceptance gates.


## Latest gate — 2026-10-23, Engineering Gate #280

**PASS** for clean install, runtime graph, web type-check/build, core snapshot tests, geometry tests, and API dependency build/API tests. API tests report 7 passed, 0 failed, including complete local API project round-trip (assets, openings, presentation, building) and fail-closed missing-Supabase checks. R2 configuration is now validated only when object storage is actually used. Saved-project library search by name/source is included in this gate. This is automated validation only; live Supabase restart survival, browser manual tests, and physical AR are not yet accepted.


## Latest gate and implementation state — Engineering Gate #305

Gate #305 passed on `37b6eacd01a40ba520aae47de1b350bd09714545`: clean install, runtime graph, web type-check/build, core tests, geometry tests, and API tests. New project-schema checks reject dangling/out-of-bounds wall openings, invalid building-level references, same-level stairs, floor slabs referencing missing rooms, and unsupported future schema versions. Per-room floor finish now persists and synchronizes with its floor slab. The starter component catalog now renders several common home items with parametric geometry and more realistic default dimensions; saved-project search is available.

Implementation estimate remains ~40%, with 0/17 Phase 12/13 tasks acceptance-complete. Deployed Supabase restart-survival, browser manual acceptance, and physical AR remain unverified. Server-configured default owner context is not adequate for public multi-user production until authenticated identity/tenant isolation is implemented.
