# Spatial Platform — Debugging History

This is a condensed record of high-value investigations. It is intentionally focused on causes, fixes, and evidence rather than chat-by-chat narration.

## 1. Save Project failed in production

**Symptom:** Production browser could not save a project even though the frontend request implementation was present.

**Evidence:** Supplied HAR showed the preflight to `https://spatial-api-w1k4.onrender.com/api/projects` returned `Access-Control-Allow-Origin: http://localhost:5173` while the request origin was a production Vercel URL.

**Root cause:** API CORS configuration did not allow the deployed Vercel origin.

**Fix:** API accepts configured `WEB_ORIGINS`, localhost, production Vercel origin, and a project-specific Vercel preview pattern.

**Remaining verification:** Render must deploy the API change and the final deployed OPTIONS/POST flow must be tested.

## 2. Blank production screen

**Symptom:** Production deployment could render a blank screen while source/build work appeared correct.

**Root cause:** Unsafe Vite `manualChunks` grouping Zod/Zustand into a `state-vendor` chunk created a production module evaluation cycle, reported as `Cannot access 'Te' before initialization`.

**Fix:** Removed unsafe manual vendor chunking. Production bundle then served correctly.

**Separate noise:** `background.js` tab/window errors were attributed to browser extensions rather than application code.

## 3. XR v5/v6 mismatch

**Symptom:** XR integration was using APIs inconsistent with the installed dependency line.

**Fix:** Standardized on `@react-three/xr` v6 store-based APIs, updated workspace dependency alignment, and migrated session/controller handling.

**Decision:** Keep XR v6. Do not downgrade to v5 simply to avoid the migration.

## 4. Duplicate XR sessions / WebGL lifecycle

**Symptom:** Repeated Start AR interactions could produce `An active XRSession already exists` and WebGL lifecycle instability.

**Fix:** Renderer reference and active-session checks, session-end handling, renderer binding, and cleanup on unmount. Store-managed XR session lifecycle is now used.

**Remaining:** Hardware/browser verification.

## 5. Shared/loaded geometry missing or stale

**Symptom:** Loaded/shared projects could render empty or stale room-derived geometry.

**Root cause:** Different paths were not consistently using canonical wall geometry.

**Fix:** Normalize loaded project payloads and render `Project.walls` as the canonical geometry source. Older data can reconstruct walls from room wall segments for compatibility.

## 6. Fresh editor contained unwanted geometry

**Symptom:** New editor could implicitly contain starter geometry.

**Fix:** Removed automatic starter-wall initialization.

**Acceptance:** Fresh editor must have 0 walls and 0 rooms until the user creates them.

## 7. Wall editing was not safely reversible

**Symptom:** Tracing required manual redrawing after mistakes.

**Fix:** Added snap, Undo, Redo, Delete Last, Clear, and Revert Changes. Geometry edits invalidate room validation to prevent stale room metadata.

## 8. Room area topology bug

**Symptom:** A real 4×4 room could report 8 m² instead of 16 m².

**Root cause:** Room graph traversal/topology handling was incorrect.

**Fix:** Corrected traversal to consume the shared unvisited set and preserve loop order. Focused geometry tests cover the correction.

## 9. 3D interaction unexpectedly entered comment behavior

**Symptom:** Normal 3D navigation could interfere with commenting behavior.

**Fix:** Introduced explicit `navigate` / `comment` modes. Normal navigation never prompts; comment mode exits after successful placement.

## 10. Version comparison integrity

**Risk:** Mutable editor state could alter previously saved versions or comparison could use the current editor geometry rather than the selected snapshot.

**Fix:** Deep-cloned immutable snapshots and explicit Version History A/B selection. Comparison renders canonical walls from the selected snapshots.

## 11. Three.js duplicate runtime warning

**Symptom/risk:** Multiple Three.js instances could be imported, contributing to XR/WebGL instability.

**Fix:** Vite explicit root `three` alias and `resolve.dedupe`.

**Remaining:** Confirm production/preview console has no duplicate-Three warning.

## 12. Current browser verification limitation

The repository's product plan records that the agent environment has Chromium but outbound site navigation is blocked with `ERR_BLOCKED_BY_ADMINISTRATOR`. Therefore automated interactive browser acceptance cannot be honestly claimed from that environment.

**Action:** Run the final matrix in a normal user browser against the deployed site.

## Investigation rule for future chats

When a new issue is reported, first compare it with this history and the current source/commit. Do not re-implement an already solved issue unless new evidence demonstrates a regression.
