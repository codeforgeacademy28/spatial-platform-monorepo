# Master Autonomous Execution Backlog

---

## Phase 2: Collaboration, Multi-Tenancy & Versioning

### - [x] **TASK-201**: `apps/api` Express Server & Base Architecture Setup
- **Objective**: Build the backend REST API gateway in `apps/api` integrated with TypeScript, Express, CORS, and workspace packages.
- **Files to Touch**:
  - `apps/api/package.json`
  - `apps/api/tsconfig.json`
  - `apps/api/src/index.ts`
  - `apps/api/src/app.ts`
  - `apps/api/src/routes/health.ts`
- **Sub-Steps**:
  1. Setup Express app in `apps/api` with JSON middleware, CORS (configured for `http://localhost:5173`), and error-handling middleware.
  2. Link `@spatial/core` and `@spatial/billing` inside `apps/api/package.json`.
  3. Create health check endpoint `GET /health` returning server status and uptime.
  4. Wire root build script so `npm run build` compiles `apps/api` alongside `apps/web`.
- **Acceptance Criteria**: `npm run build` succeeds and starting the server allows `GET http://localhost:4000/health` to return status 200 OK.

---

### - [x] **TASK-202**: Supabase Schema & Database Migrations Setup
- **Objective**: Define relational database models and Supabase client configuration for multi-tenant isolation.
- **Files to Touch**:
  - `packages/core/src/database.ts`
  - `apps/api/src/config/supabase.ts`
  - `docs/migrations/001_initial_schema.sql`
- **Sub-Steps**:
  1. Create SQL migration for tables: `organizations`, `users`, `projects`, `project_versions`, `spatial_comments`, and `share_tokens`.
  2. Add Supabase Row-Level Security (RLS) policies enforcing `tenant_id` isolation.
  3. Create Supabase TypeScript client wrapper in `apps/api/src/config/supabase.ts` using `@supabase/supabase-js`.
  4. Export database entity types in `@spatial/core`.
- **Acceptance Criteria**: All tables and database TypeScript interfaces match `@spatial/core` entities cleanly.

---

### - [x] **TASK-203**: Project Publishing & Share Token API
- **Objective**: Create REST endpoints allowing architects to persist project layouts to the database and generate public read-only share URLs.
- **Files to Touch**:
  - `apps/api/src/routes/projects.ts`
  - `apps/api/src/controllers/project-controller.ts`
  - `packages/core/src/index.ts`
- **Sub-Steps**:
  1. Implement `POST /api/projects`: Accepts `ProjectSchema` Zod payload and saves/updates it in Supabase.
  2. Implement `POST /api/projects/:id/publish`: Generates a secure, 16-character UUID share token and stores it in `share_tokens`.
  3. Implement `GET /api/projects/share/:token`: Public unauthenticated endpoint returning published project JSON.
- **Acceptance Criteria**: Valid payloads pass Zod validation and store in Supabase; invalid payloads return HTTP 400 with Zod error details.

---

### - [x] **TASK-204**: Read-Only Client Reviewer View (`apps/web`)
- **Objective**: Build a public client viewer route in `apps/web` that loads published designs via share tokens without editing capabilities.
- **Files to Touch**:
  - `apps/web/src/components/ClientViewer.tsx`
  - `apps/web/src/App.tsx`
  - `apps/web/src/services/api-client.ts`
- **Sub-Steps**:
  1. Create API HTTP client helper in `apps/web/src/services/api-client.ts`.
  2. Add URL route handling in `apps/web/src/App.tsx` detecting `?share=:token` query params.
  3. Render `ClientViewer.tsx`: Displays `SpatialCanvas.tsx` with orbit camera controls, but completely hides tracing tools, scale setup, and editing sidebars.
- **Acceptance Criteria**: Navigating to `?share=valid_token` fetches the remote project JSON and renders the 3D room walkthrough in read-only mode.

---

### - [x] **TASK-205**: Spatial Pinpoint Commenting System
- **Objective**: Allow users to click anywhere on a 3D wall or floor mesh to drop interactive 3D comment pins anchored to spatial coordinates.
- **Files to Touch**:
  - `packages/collaboration/package.json`
  - `packages/collaboration/src/comment-manager.ts`
  - `apps/web/src/components/SpatialCommentPin.tsx`
  * `apps/web/src/components/SpatialCanvas.tsx`
- **Sub-Steps**:
  1. Create `@spatial/collaboration` workspace package.
  2. Implement Three.js Raycaster click handler in `SpatialCanvas.tsx` calculating 3D hit point coordinates $(x, y, z)$ and surface normal vector.
  3. Render floating HTML/3D comment marker components at hit coordinates displaying author name and comment text.
  4. Connect comments state to `POST /api/projects/:id/comments` API endpoint.
- **Acceptance Criteria**: Clicking a 3D wall surface drops a persistent comment pin at that exact point in 3D space.

---

### - [x] **TASK-206**: Design Versioning & Side-by-Side Comparison Engine
- **Objective**: Enable architects to save design iterations (Version 1, Version 2) and compare structural changes.
- **Files to Touch**:
  - `packages/collaboration/src/version-diff.ts`
  - `apps/web/src/components/VersionComparer.tsx`
- **Sub-Steps**:
  1. Build geometry diffing algorithm in `@spatial/collaboration` comparing two `Project` objects (detects added, removed, or moved wall segments).
  2. Build side-by-side split viewport component in `apps/web` rendering Version A and Version B simultaneously.
  3. Highlight modified walls with color overlays (Green = Added, Red = Removed, Yellow = Shifted).
- **Acceptance Criteria**: Selecting Version 1 and Version 2 renders a dual canvas view with visual highlighting on modified wall geometries.

---

## Phase 3: AI Spatial Engine & Entitlement Gating

### - [x] **TASK-301**: `@spatial/ai-engine` Foundation & Zod Command Tool Schemas
- **Objective**: Create the AI engine package with structured Zod tool-calling definitions for spatial operations.
- **Files to Touch**:
  - `packages/ai-engine/package.json`
  - `packages/ai-engine/src/schemas/command-schemas.ts`
  - `packages/ai-engine/src/index.ts`
- **Sub-Steps**:
  1. Create `@spatial/ai-engine` workspace package.
  2. Define Zod schemas for structured LLM outputs:
     - `MoveWallSchema`: `{ wallId: string, deltaX: number, deltaY: number }`
     - `ResizeRoomSchema`: `{ roomId: string, percentage: number }`
     - `ChangeMaterialSchema`: `{ targetId: string, colorHex: string }`
     - `SpatialQuerySchema`: `{ queryType: 'clearance' | 'area', objectId: string }`
- **Acceptance Criteria**: All schemas compile strictly and export TypeScript types for tool calling.

---

### - [x] **TASK-302**: AI LLM Provider Abstraction Layer
- **Objective**: Build a provider-agnostic LLM caller using Vercel AI SDK supporting OpenAI and Groq APIs.
- **Files to Touch**:
  - `packages/ai-engine/src/providers/llm-provider.ts`
  - `packages/ai-engine/src/prompt-templates.ts`
- **Sub-Steps**:
  1. Install `ai` (Vercel AI SDK) and `@ai-sdk/openai` in `packages/ai-engine`.
  2. Create prompt engineer template converting natural language spatial instructions (e.g., "Make the bedroom 20% larger") into structured system prompts.
  3. Implement `generateSpatialAction()` function that forces structured JSON tool outputs matching `packages/ai-engine` Zod schemas.
- **Acceptance Criteria**: Passing a natural language string returns a Zod-validated action JSON object.

---

### - [x] **TASK-303**: Backend AI Router with Billing Entitlement Guard
- **Objective**: Expose the AI command service via API protected by subscription entitlement checks.
- **Files to Touch**:
  - `packages/billing/src/entitlements.ts`
  - `apps/api/src/routes/ai.ts`
  - `apps/api/src/middleware/entitlement-guard.ts`
- **Sub-Steps**:
  1. Define subscription tiers in `@spatial/billing`: `Starter` (Free), `Pro`, `Studio` (AI enabled).
  2. Create Express middleware `requireEntitlement('FEATURE_AI_ASSISTANT')` verifying user tier.
  3. Implement `POST /api/ai/command` endpoint: Validates entitlement, calls `@spatial/ai-engine`, and returns spatial action payload.
- **Acceptance Criteria**: Users without `Studio` tier receive HTTP 403 Forbidden with an upgrade prompt; `Studio` users receive structured AI actions.

---

### - [x] **TASK-304**: AI Assistant UI Panel & Scene Action Dispatcher (`apps/web`)
- **Objective**: Integrate an AI chat drawer in the 3D editor that dispatches returned LLM actions to the 3D canvas in real time.
- **Files to Touch**:
  - `apps/web/src/components/AiAssistantPanel.tsx`
  - `apps/web/src/hooks/useSpatialActionDispatcher.ts`
- **Sub-Steps**:
  1. Build chat UI side drawer with prompt input box and message history.
  2. Create action dispatcher hook that takes AI JSON actions (`MOVE_WALL`, `CHANGE_MATERIAL`) and updates `@spatial/core` project state.
  3. Wire dispatcher to `SpatialCanvas.tsx` so AI-triggered updates automatically re-extrude 3D meshes without page reloads.
- **Acceptance Criteria**: Typing "Change walls to navy blue" or "Move wall 1 meter right" executes the modification live in the 3D viewport.

---

### - [x] **TASK-305**: Spatial Clearance Q&A Engine
- **Objective**: Implement bounding-box clearance calculation tools to answer spatial validation questions.
- **Files to Touch**:
  - `packages/geometry-engine/src/clearance-calculator.ts`
  - `packages/ai-engine/src/spatial-qa.ts`
- **Sub-Steps**:
  1. Build bounding-box clearance algorithm in `@spatial/geometry-engine` measuring minimum distance between object bounding boxes and adjacent walls.
  2. Create spatial Q&A engine handling queries (e.g., "Is there 3 feet clearance around the dining table?").
  3. Return clear text answers with pass/fail spatial clearance metrics.
- **Acceptance Criteria**: Prompts asking about room clearance return precise distance measurements in meters/feet.

---

## Phase 4: BIM Ingestion & Production Hardening

### - [x] **TASK-401**: `@spatial/bim-engine` Setup & `web-ifc` Integration
- **Objective**: Build the BIM engine workspace package using WebAssembly-compiled `web-ifc` for CAD/IFC file parsing.
- **Files to Touch**:
  - `packages/bim-engine/package.json`
  - `packages/bim-engine/src/ifc-loader.ts`
  - `packages/bim-engine/src/index.ts`
- **Sub-Steps**:
  1. Create `@spatial/bim-engine` package with `web-ifc` dependency.
  2. Implement WASM IFC parser reading `.ifc` file buffers and extracting building elements (IfcWall, IfcDoor, IfcWindow).
  3. Convert extracted IFC geometry meshes into Three.js-compatible `BufferGeometry` data.
- **Acceptance Criteria**: Parsing an `.ifc` file buffer outputs valid 3D geometry meshes and metadata trees.

---

### - [x] **TASK-402**: Cloudflare R2 Asset Upload & Security Gateway
- **Objective**: Implement secure file upload processing for 3D GLTF models, CAD files, and blueprint images.
- **Files to Touch**:
  - `apps/api/src/routes/uploads.ts`
  - `apps/api/src/services/storage-service.ts`
- **Sub-Steps**:
  1. Set up Cloudflare R2 SDK client using S3-compatible APIs.
  2. Implement file upload endpoint `POST /api/uploads`: Enforces file size limits (max 25MB), checks MIME types, and verifies magic bytes.
  3. Return signed Cloudflare R2 download URLs for serving assets directly to `apps/web`.
- **Acceptance Criteria**: Uploading valid images/models stores files in R2 and returns signed URLs; malicious or oversized files are rejected.

---

### - [x] **TASK-403**: WebXR Mobile 1:1 Scale AR Viewport Prototype
- **Objective**: Build a WebXR camera view allowing users to preview room designs in 1:1 scale on WebXR-supported mobile browsers.
- **Files to Touch**:
  - `apps/web/src/components/ArViewport.tsx`
  - `apps/web/src/App.tsx`
- **Sub-Steps**:
  1. Integrate `@react-three/xr` into `apps/web`.
  2. Build AR toggle button entering `ARButton` mode on supported mobile devices (Android Chrome / WebXR iOS).
  3. Anchor 3D floor plan geometry to real-world ground plane raycast hits.
- **Acceptance Criteria**: Opening the app on a mobile device allows entering WebXR mode and placing the 3D room floor plan on physical ground.

---

## Phase 5: Production Hardening, Security & Observability

### - [x] **TASK-501**: Comprehensive Security Audit & Rate Limiting
- **Objective**: Protect backend routes against abuse, prompt injection, and unauthorized data access.
- **Files to Touch**:
  - `apps/api/src/middleware/rate-limiter.ts`
  - `apps/api/src/middleware/sanitizer.ts`
- **Sub-Steps**:
  1. Add rate limiting middleware (`express-rate-limit`) restricting API requests to 100 requests per 15 minutes per IP.
  2. Add input sanitization preventing path traversal and XSS attacks.
  3. Ensure all AI prompts strip executable code tags before sending to LLM providers.
- **Acceptance Criteria**: Exceeding rate limits returns HTTP 429 Too Many Requests; malicious prompt injections are safely sanitized.

---

### - [x] **TASK-502**: Monorepo E2E Integration Verification
- **Objective**: Run full monorepo type-checking, linting, and build verification across all applications and engine packages.
- **Files to Touch**:
  - `package.json`
  - `turbo.json`
- **Sub-Steps**:
  1. Run `npx tsc --noEmit` across entire monorepo workspace.
  2. Execute `npm run build` via Turborepo ensuring parallel builds succeed for `apps/web`, `apps/api`, and all `@spatial/*` packages.
  3. Verify zero compiler warnings or broken package exports.
- **Acceptance Criteria**: Monorepo completes zero-error build with all packages properly linked.


## Phase 6: Monorepo Stabilization & Apple-Grade UI System

### - [x] **TASK-601**: TypeScript Strictness & Workspace Resolution Fixes
- **Objective**: Eliminate all `tsc` compilation errors (`noImplicitAny` and workspace module resolution) to guarantee clean, zero-warning builds locally and on Vercel/AKS.
- **Files to Touch**:
  - `apps/web/src/hooks/useSpatialActionDispatcher.ts`
  - `apps/web/src/services/api-client.ts`
  - `apps/web/src/share.tsx`
  - `apps/web/tsconfig.json`
  - `packages/core/src/index.ts`
- **Sub-Steps**:
  1. In `apps/web/src/hooks/useSpatialActionDispatcher.ts`, locate callback parameters at lines 152, 164, and 168. Add explicit type signatures to `(segment: any, index: number)` (or the exact domain interface `LineSegment` from `@spatial/core`) to resolve `TS7006`.
  2. Ensure `packages/core/src/index.ts` exports all types and utilities imported by `apps/web/src/services/api-client.ts` and `apps/web/src/share.tsx`.
  3. In `apps/web/tsconfig.json`, verify workspace path aliases point directly to package entry points under `compilerOptions.paths`:
     ```json
     "paths": {
       "@spatial/core": ["../../packages/core/src/index.ts"],
       "@spatial/core/*": ["../../packages/core/src/*"],
       "@spatial/collaboration": ["../../packages/collaboration/src/index.ts"],
       "@spatial/geometry-engine": ["../../packages/geometry-engine/src/index.ts"]
     }
     ```
  4. Run `npx tsc --noEmit -p apps/web/tsconfig.json` to verify zero type check errors.
- **Acceptance Criteria**: Running `npx tsc --noEmit -p apps/web/tsconfig.json` finishes with exit code 0 and 0 errors.

---

### - [x] **TASK-602**: WebXR Controller Modernization (`@react-three/xr` v5+)
- **Objective**: Refactor deprecated WebXR controller components to modern v5+ standard components to fix runtime browser syntax errors and ensure headset/hand-tracking compatibility.
- **Files to Touch**:
  - `apps/web/src/components/ArViewport.tsx`
  - `apps/web/package.json`
- **Sub-Steps**:
  1. In `apps/web/src/components/ArViewport.tsx`, remove the deprecated named import `DefaultXRController` from `@react-three/xr`.
  2. Import `{ XR, Controllers, Hands }` from `@react-three/xr`.
  3. Inside the `@react-three/fiber` `<Canvas>` component, nest `<Controllers/>` and `<Hands/>` directly as children of `<XR>`.
  4. Ensure XR session listeners and render state pass into modern `<XR>` context hooks without breaking canvas rendering or orbit controls.
- **Acceptance Criteria**: Web dev server boots without `SyntaxError: does not provide an export named 'DefaultXRController'` and entering AR activates controllers/hands cleanly.

---

### - [x] **TASK-603**: Apple-Grade UI System with Lucide Icons & Tailwind Primitives
- **Objective**: Replace raw unstyled browser controls with an Apple-grade translucent glassmorphism interface (macOS / visionOS aesthetic) using Tailwind CSS and `lucide-react` icons.
- **Files to Touch**:
  - `apps/web/package.json`
  - `apps/web/src/index.css`
  - `apps/web/src/components/ui/SpatialHeader.tsx`
  - `apps/web/src/components/ui/CanvasOverlay.tsx`
  - `apps/web/src/App.tsx`
- **Sub-Steps**:
  1. Add `lucide-react` to `apps/web/package.json` dependencies for SF-style iconography (`Folder`, `Save`, `Share2`, `History`, `UploadCloud`, `Glasses`, `Layers`).
  2. In `apps/web/src/index.css`, verify `@tailwind base; @tailwind components; @tailwind utilities;` and set system font stack (`-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", sans-serif`).
  3. Create `apps/web/src/components/ui/SpatialHeader.tsx`:
     - Construct a floating top bar: `fixed top-4 left-4 right-4 z-50 flex items-center justify-between px-4 py-2.5 rounded-2xl bg-neutral-900/70 backdrop-blur-2xl border border-white/10 shadow-2xl text-xs text-neutral-200`.
     - Group controls into:
       - **Project Identity**: Glassmorphic input with inline label (`Folder` icon, subtle hover/focus rings).
       - **Persistence & Share**: Button group (`Save`, `Load`, `Share`, `Save Version`, `Version Badge`) with icon + text and active scale transitions.
       - **Spatial & Blueprint**: `Upload Blueprint` file picker button, `Scale (m)` numeric stepper input, and prominent primary `Enter AR` action (`bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/30`).
     - Wire all existing state props (`projectName`, `onSave`, `onLoad`, `onShare`, `onSaveVersion`, `onUploadBlueprint`, `refLength`, `onEnterAR`) 1:1 with zero breaking signature changes.
  4. Create `apps/web/src/components/ui/CanvasOverlay.tsx`:
     - Construct a floating bottom-left HUD pill showing real-time scale metrics with a visual meter line (`fixed bottom-6 left-6 z-40 bg-neutral-900/70 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-xl text-neutral-300 font-mono text-xs`).
  5. In `apps/web/src/App.tsx`, mount `<SpatialHeader/>` and `<CanvasOverlay/>` over the full-screen 3D viewport canvas.
- **Acceptance Criteria**: The UI renders a dark-mode frosted glass toolbar with Lucide icons over the 3D Canvas; buttons trigger their corresponding handlers without capturing or blocking underlying 3D orbit controls.

---

### - [x] **TASK-604**: Cross-Platform Monorepo Pipeline (Local, Vercel & AKS)
- **Objective**: Ensure the entire monorepo builds uniformly across Local Windows/macOS, Vercel edge/static hosting, and Docker/AKS container runners.
- **Files to Touch**:
  - `package.json` (Root)
  - `apps/web/package.json`
  - `apps/web/vite.config.ts`
  - `turbo.json`
- **Sub-Steps**:
  1. In root `package.json`, verify overrides lock exact unified versions for critical 3D packages:
     ```json
     "overrides": {
       "three": "^0.166.1",
       "react": "^18.3.1",
       "react-dom": "^18.3.1",
       "@react-three/fiber": "^8.17.10",
       "@react-three/xr": "^5.7.1",
       "zustand": "^4.5.5"
     }
     ```
  2. In `apps/web/package.json`, ensure `"vite"` is pinned to `"5.4.11"` in `devDependencies` to prevent experimental bundler breaking changes.
  3. In `apps/web/vite.config.ts`, verify:
     - `plugins` includes `react()` and `tsconfigPaths()`.
     - `resolve.dedupe` contains `['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/xr', 'zustand']`.
     - `optimizeDeps.needsInterop` contains `['@iwer/devui']`.
     - Zero hardcoded relative path aliases exist (`fileURLToPath('../../node_modules/...')`).
  4. Test monorepo build pipeline by running `npx turbo build` from the repository root.
- **Acceptance Criteria**: `npx turbo build` builds `@spatial/core`, `@spatial/geometry-engine`, `@spatial/collaboration`, `@spatial/api`, and `@spatial/web` with exit code 0 and outputs production bundles to `dist/`.

---

## Phase 7–11: First-Person Walkthrough, Universal Import & AR Placement

The detailed task plan, priorities, file targets, test requirements, and acceptance criteria are maintained in [docs/spatial-walkthrough-roadmap.md](docs/spatial-walkthrough-roadmap.md).

### Immediate P0 tasks
- [x] **TASK-701**: Canonical world coordinate contract and transform tests (Engineering Gate run 159 passed).
- [ ] **TASK-702**: Deterministic wall collision, swept movement, wall sliding, and openings. Swept-circle collision and a bounded tangent-projection resolver are implemented; desktop first-person movement uses the resolver, with regression tests added. Keep open until the new CI gate passes and corner/door-window opening behavior is completed.
- [ ] **TASK-703**: Game-style first-person desktop controls. Initial mouse-look/WASD/sprint/jump foundation is implemented; full acceptance still requires pause/reset/crouch/step rules and runtime verification.
- [ ] **TASK-801**: Honest upload validation for real supported formats. Initial signature/extension checks and tests are implemented; format conversion remains separate.
- [ ] **TASK-802**: GLB/GLTF import into an editable scene. Local GLB/self-contained glTF loading, floor alignment, translate/rotate/scale gizmos, browser IndexedDB save/reload, and explicit removal are implemented; Engineering Gate run 169 passed for the implementation commit. Project/server/share/version synchronization, progress/preview, external-resource packaging, and end-to-end browser testing remain.
- [ ] **TASK-901**: AR surface placement preview and explicit confirmation.
- [ ] **TASK-902**: Real-world scale and floor alignment.
- [ ] **TASK-1003**: Persist scene assets and source references with backward-compatible schema migration.
- [ ] **TASK-1101**: Automated coordinate, collision, import, and migration regression tests. Coordinate/upload tests passed previously; collision tests now include wall sliding and are awaiting the current CI gate; import/migration coverage remains.
- [ ] **TASK-1102**: Browser and physical-device AR validation checklist. Checklist is written; device verification is not yet performed.

**Completion rule:** a task stays unchecked until its acceptance criteria and applicable tests pass. See the roadmap for P1/P2 tasks and full substeps.

---

## Phase 12 — Blueprint-to-Playable-House Product North Star

**Product intent (2026-10-23):** Evolve the current sketch-based wall layout into a deterministic, engineering-first building editor and human-scale playable house. The user must be able to construct/reconstruct a home from a calibrated blueprint, enter and navigate it, edit its components, and reliably save/reopen/share the complete project. AI recognition is optional and must never be a dependency for core construction, editing, persistence, or interaction.

**Current-state honesty:** The repository has a 2D wall-sketch workflow, room/wall geometry, a browser Spatial view, initial desktop first-person controls and wall collision, local GLB/glTF import with browser-local IndexedDB storage, and server project save/share foundations. These do not yet establish a complete building model, durable persistence for all 3D scene edits, correct real-device AR placement, multi-floor construction/traversal, or a full interactive home. Do not describe upload validation as conversion, browser-local storage as cloud persistence, or build success as AR acceptance.

### North-star acceptance contract

- The canonical, versioned building model—not renderer meshes—is the source of truth.
- Every generated view is derived from the same model: 2D plan, 3D editor, first-person walkthrough, and optional AR.
- Core operations are deterministic, explainable, validated and testable without AI or a network LLM.
- Units and coordinate conventions are explicit. Floor surfaces are horizontal; vertical height uses the world-up axis; floor-plan axes map consistently to the horizontal world plane.
- Ambiguous raster plans require calibration and user review; never invent exact dimensions from an unscaled image.
- Save/load/version/share round-trips supported model data, scene assets, materials and transforms. Failed saves must never show success.
- All tasks remain unchecked until their acceptance criteria pass. Browser and physical-device acceptance are recorded separately from automated tests.

### P0 — Correctness and durable foundations

#### - [ ] TASK-1201: Reproduce and resolve AR/world orientation and scale
- **Files:** `apps/web/src/components/ArViewport.tsx`, `packages/geometry-engine/src/spatial-transforms.ts`, related tests and `docs/testing/spatial-walkthrough-checklist.md`.
- **Objective:** Find the actual cause of the reported vertical/sideways house in AR; do not add another guessed yaw/rotation offset.
- **Steps:** Inspect plan-to-world transforms, wall extrusion axes, root model transform, camera/reference-space behavior, model origin and unit conversion. Add a known rectangular-room fixture with labeled axes and known dimensions. Keep device-tracked head pose separate from app-owned model placement.
- **Acceptance:** Desktop and XR use the same canonical geometry; floor plane is horizontal, walls extrude upward, measured dimensions match the fixture, placement yaw is deliberate, and no per-blueprint hard-coded corrective rotation is required.
- **Verification:** Transform unit tests + browser view + physical supported-device AR test. Hardware test remains explicitly BLOCKED until performed.

#### - [ ] TASK-1202: Durable project persistence for the whole editable scene
- **Files:** `packages/core/src/index.ts`, `apps/web/src/App.tsx`, `apps/web/src/services/api-client.ts`, project API/storage/versioning, migration tests.
- **Objective:** Save the actual building model, not only the current wall list or a browser-local imported model.
- **Steps:** Audit the existing save/load paths and preserve their durability-status contract. Persist floors, rooms, walls/openings, components, object transforms, materials, source-file references, units and schema version. Integrate asset metadata with project save/load, server persistence, share and project versions. Keep IndexedDB as an explicit local recovery/cache layer, not a claim of server sync.
- **Acceptance:** Create/edit/save/refresh/reopen/share/version-restore round-trips all supported data; server failure is visible and cannot be reported as durable success; legacy projects still load through tested migrations; private source assets remain access-controlled.

#### - [ ] TASK-1203: Versioned canonical building/scene schema
- **Files:** `packages/core/src/index.ts`, geometry-engine types, API validation, migration fixtures.
- **Objective:** Define stable IDs and explicit data contracts for building, levels, rooms, wall junctions, openings, slabs, stairs, reusable components, scene objects, materials and transforms.
- **Steps:** Add a schema version and backwards-compatible defaults. Define metric units and coordinate contract centrally. Store editable parameters/source relationships; derive renderer meshes and collision geometry rather than persisting those as the only representation.
- **Acceptance:** Zod/runtime validation rejects invalid dimensions and dangling references; migrations preserve existing projects; a serialized project can reconstruct equivalent geometry deterministically.

#### - [ ] TASK-1204: Real floor slabs, ceilings and multi-level building structure
- **Files:** core schema, geometry-engine, `ArViewport.tsx`/scene renderer, editor floor controls and tests.
- **Objective:** Move beyond walls-only single-floor output.
- **Steps:** Represent level elevation and floor-to-floor height; create horizontal room floor/slab geometry from validated room boundaries; support optional ceilings/roof visibility; isolate/show a selected level without mutating canonical geometry; align vertical openings to their owning level.
- **Acceptance:** A closed-room fixture has a walkable horizontal floor; a two-level fixture has correct elevations and connected level data; changing a level height updates dependent geometry consistently; open/invalid room loops are reported instead of generating arbitrary slabs.

#### - [ ] TASK-1205: Wall openings and interactive door/window components
- **Files:** existing `WallOpening` schema, wall geometry generation, scene component library and tests.
- **Objective:** Turn door/window metadata into genuine wall openings and usable components.
- **Steps:** Cut openings into wall geometry with validated width/height/offset/bottom; create independently selectable frames, door leaves and window parts; add hinge/pivot-based door animation and open/close interaction. Define collision behavior for open and closed states.
- **Acceptance:** No hidden solid wall blocks a declared opening; dimensions and placement validate against wall bounds; a door opens around its hinge and navigation/collision matches its state; edits survive save/load.

#### - [ ] TASK-1206: Parametric stairs and multi-floor navigation
- **Files:** building schema, geometry-engine, first-person controller, collision engine and tests.
- **Objective:** Connect floors physically rather than using teleport-only floor switching.
- **Steps:** Model stair run, rise, tread, width, landing and orientation; validate floor-to-floor elevation and headroom inputs; generate visible steps/rails; add grounded step traversal or controlled stair movement with collision.
- **Acceptance:** Player can walk from one level to the next without falling through slabs, floating, teleporting or being blocked by stair collision; invalid stair dimensions produce actionable validation errors.

#### - [ ] TASK-1207: Human-scale first-person walkthrough and collision correctness
- **Files:** `ArViewport.tsx`, `packages/geometry-engine/src/wall-collision.ts`, navigation tests.
- **Objective:** Make the browser walkthrough feel like a person inside the house, not a free camera floating through wall meshes.
- **Steps:** Keep the camera at configurable human eye height; implement grounded movement, gravity, collision against walls/floors/closed doors/furniture, wall sliding, step/stair rules, pause/exit/reset and safe spawn points. Reuse canonical model transforms for movement and rendering.
- **Acceptance:** No wall tunneling, falling through floors, spawning inside geometry or moving through closed doors; open doorways and stairs are traversable; diagonal movement is normalized; controls are usable on supported desktop and mobile layouts. Browser interaction remains a separate gate from unit/build tests.

### P1 — Full editable home construction

#### - [ ] TASK-1208: Reusable architectural and furniture component catalog
- **Components:** doors, windows, frames, columns, beams, walls, partitions, floors, ceilings, roofs, stairs, railings, balconies, furniture, kitchen cabinets/counters, appliances, bathroom fixtures, wardrobes, lights, switches, sockets, curtains, blinds, rugs, artwork, plants, garden objects, fences, gates, driveway and pool.
- **Objective:** Each item is an independently selectable, placeable, editable object with stable ID, dimensions, transform, material and optional interaction behavior.
- **Steps:** Create an asset/component registry with metadata and categories; start with procedural primitives and properly licensed GLB/glTF assets. Add select/move/rotate/duplicate/delete, snapping, alignment, scale constraints and collision preview.
- **Acceptance:** Objects can be placed and manipulated in consistent scene units; wall-anchored components retain valid relationships when walls change; component data round-trips through save/load/versioning.

#### - [ ] TASK-1209: Wall paint, surface materials and lighting
- **Objective:** Let users customize each wall/room and floor without rebuilding the whole project manually.
- **Steps:** Support per-surface paint, material presets and texture references; floor finishes; ceiling and roof finishes; daylight/environment lighting and interior fixtures; mobile quality settings.
- **Acceptance:** Material changes affect only intended surfaces, are undoable and persist; renderer changes do not mutate the canonical geometry; scene remains navigable and readable.

#### - [ ] TASK-1210: Deterministic blueprint import and manual review (AI optional)
- **Inputs:** existing sketch workflow, calibrated raster image, PDF, and CAD/vector formats only through verified format adapters.
- **Objective:** Turn a drawing into reviewed editable geometry without requiring AI recognition.
- **Steps:** Provide scale calibration from a known dimension; allow tracing/correction of wall centerlines, thicknesses, room boundaries, doors/windows and floor labels; parse structured CAD inputs when a reliable parser exists; show source overlay and validation errors before commit. Keep AI recognition as an optional adapter, never the only path.
- **Acceptance:** Same reviewed input yields equivalent geometry; unscaled raster inputs cannot claim dimensional accuracy; uncertain/missing measurements are requested or visibly flagged; source files and conversion metadata remain linked to the project.

#### - [ ] TASK-1211: Editing history, autosave and recovery
- **Objective:** Protect users from losing detailed house work.
- **Steps:** Command-based undo/redo for geometry and object edits; dirty state, save status, conflict/error reporting, safe autosave, recovery from interrupted sessions and version snapshots.
- **Acceptance:** Core edit operations undo/redo correctly; refresh/reopen restores the last confirmed saved project; failed saves remain visible; autosave never overwrites a newer server version silently.

#### - [ ] TASK-1212: AR placement, scale calibration and anchor lifecycle
- **Objective:** Place the same building model in the physical world at intentional 1:1 scale.
- **Steps:** Add hit-test placement preview, confirm/cancel, yaw/translation adjustment, known-size calibration, anchor/tracking status and reset/reposition. Keep AR optional and capability-gated.
- **Acceptance:** Preview is not treated as confirmed placement; known-size asset matches physical dimensions within a documented tolerance on supported devices; tracking loss and session end are handled; real-device evidence is recorded.

#### - [ ] TASK-1213: Engineering-grade geometry, persistence and interaction regression suite
- **Objective:** Prevent recurrence of orientation, save loss and broken-building defects.
- **Steps:** Add deterministic fixtures for rectangular rooms, non-axis-aligned walls, openings, multiple levels, stairs, furniture, transforms and legacy project migration. Add property-based invariants for finite dimensions, connected references, valid openings, consistent units and stable serialization. Add browser smoke scenarios for walkthrough/save/reload.
- **Acceptance:** Automated tests fail on coordinate regressions, invalid building geometry or persistence loss; browser/device checks are separately reported; no task is marked done from generated code or a successful compile alone.

#### - [ ] TASK-1214: Architectural inspection and export
- **Objective:** Support both a playable experience and an accurate editor.
- **Steps:** Add 2D plan / 3D orbit / dollhouse cutaway / floor isolation / first-person / AR views; measurement and properties panel; export supported model formats with a clear format-support matrix.
- **Acceptance:** Views derive from the same project model and cannot silently mutate it; unsupported exports fail with an explicit explanation.

### Execution order (do not parallelize past a failing gate)

1. Read current state and reproduce the AR orientation and save/load failures; capture exact evidence.
2. Fix coordinate/scale contract and tests before adding guessed rotations or visual polish.
3. Make project persistence round-trip the canonical model and assets.
4. Add versioned building levels and horizontal floor/slab geometry.
5. Implement true openings, interactive doors/windows, then stairs and grounded multi-floor navigation.
6. Add furniture/component editing and materials.
7. Add calibrated blueprint ingestion, with deterministic tracing/parsing as the baseline and AI as optional.
8. Complete browser acceptance and physical AR device checks.
9. Update this ledger, `PRODUCT_EXECUTION_PLAN.md`, `CONTINUATION.md`, and `docs/PROJECT_STATE.md` after meaningful progress.

**Definition of engineering success:** A user can sketch or import a calibrated plan, inspect and correct it, generate a dimensionally consistent multi-floor home, enter it at human scale, open doors, traverse stairs, move furniture, change finishes, save/reopen/share the entire scene, and see the same canonical house in browser and optional AR—without any AI service being required.

### Phase 12 progress log

- **2026-10-23 — Planning committed:** added TASK-1201 through TASK-1214 with explicit scope, dependencies, acceptance criteria and a sequential delivery order. No task checkbox was marked complete by planning alone.
- **2026-10-23 — Persistence defect identified:** local Load Project restored walls/rooms/scale but did not restore saved sceneAssets, wallOpenings or presentation; Revert to last saved project had the same omission. Save Version rebuilt a reduced project from walls/rooms and silently replaced scene assets/openings/presentation with defaults. This could make the editor appear to have saved a project while some authored data was missing after reload/revert/version restore.
- **2026-10-23 — Initial fix committed on feat/blueprint-to-playable-house-roadmap:** App.tsx now deep-copies scene asset anchors/light settings, wall openings and presentation in cloneProject; local load and revert restore those fields; version snapshots clone the full current project instead of rebuilding a reduced wall/room-only project.
- **Verification status:** GitHub Actions Engineering Gate run #180 completed all listed steps successfully: clean install, critical runtime graph, web type-check, web production build, core snapshot contract tests, geometry contract tests, and API upload validation tests. This is BUILD GREEN for the current branch, not browser behavior verification. Browser regression and end-to-end project round-trip checks remain outstanding. TASK-1202 remains unchecked because durable server persistence for the complete future building scene, asset synchronization, migrations, and end-to-end save/load/share/version round-trip are not yet complete.
- **AR root cause:** not yet established. Do not change yaw/rotation until a known-size fixture and transform chain are checked and the reported behavior can be reproduced.


## Phase 13: Supabase-backed saved-project library (2026-10-23)

### - [ ] TASK-1301: Stable database-compatible project identity
- **Problem:** the editor previously constructed every current project with the default ID `project-1`, so distinct designs could overwrite one another; Supabase schema declares `projects.id` as UUID, so non-UUID IDs fail durable writes.
- **Implementation:** assign a stable UUID to each editor project, preserve it across renders and load/revert, and use UUIDs for saved version snapshots. Migrate legacy browser-only project IDs to a UUID when opened/saved.
- **Acceptance:** saving two different designs creates two distinct rows; repeated saves update only the selected project; legacy local projects remain openable.

### - [ ] TASK-1302: Saved-project list and open workflow
- **Implementation:** add `GET /api/projects` and `GET /api/projects/:id`; in durable mode query Supabase scoped to the server's tenant/organization/owner context; in local-only mode clearly label API memory as temporary. Add a project-library dialog that merges browser recovery copies with server results and opens the selected full project.
- **Acceptance:** user can see available projects, distinguish Supabase from browser/API-memory copies, open a selected project and restore walls, rooms, assets, openings, scale and presentation. Missing projects and database read failures are explicit, not silent.

### - [ ] TASK-1303: Verify deployed Supabase persistence end-to-end
- **Required configuration:** set `SUPABASE_PERSISTENCE_ENABLED=true`, valid server-only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, and valid provisioned `PERSISTENCE_DEFAULT_TENANT_ID`, `PERSISTENCE_DEFAULT_ORGANIZATION_ID`, and `PERSISTENCE_DEFAULT_OWNER_ID` until authenticated identity context is implemented. Configure `VITE_API_BASE_URL` to point to the deployed API. Never expose the service-role key in the web app.
- **Acceptance:** save reports durable only after a successful Supabase upsert; saved list survives API restart and browser refresh; opening a selected saved project round-trips the complete project JSON. Record deployed verification evidence before marking complete.

### Phase 13 progress log
- **2026-10-23 — Code changes committed on `feat/blueprint-to-playable-house-roadmap`:** added project-list and project-load API endpoints, web API client methods, a saved-project dialog, browser-side project library/recovery copies, stable UUID project identity, and clearer save status messages. The dialog merges browser-local entries with API results and labels API-memory results as temporary rather than claiming they are Supabase rows.
- **Not yet verified:** no deployed Supabase credentials or project database were accessed from this work session. Do not claim database writes, API restart survival, or browser end-to-end behavior until those are tested. Build/test gate is pending.


### Phase 12/13 implementation progress — 2026-10-23 (not yet verified)
- Added `packages/core/src/building-model.ts`: versioned building structure with levels, floor slabs, staircases, a typed A–Z component catalog, transforms, visibility/lock state and door state. `ProjectSchema` migrates legacy projects to a default ground floor and accepts the additive model.
- Extended snapshot cloning so floor outlines, stairs, component transforms and dimensions are deep-copied. Added core contract tests for legacy migration, multi-floor schema validation, cloning and JSON round-trip.
- Added floor selection/add-floor controls, floor-aware 2D wall drawing, room-derived floor slabs, and basic 3D rendering for slabs, stair steps and catalog components in both the desktop 3D and Spatial/AR scene.
- Wall opening rendering now splits wall meshes around door/window openings. Door panels can be toggled open/closed, and open door spans are removed from collision-only wall segments; window openings remain impassable at floor level. Added geometry contract tests for this behavior.
- Added API project save/list/open contract test and changed API test script to run all `tests/*.test.ts`. Added a Supabase configuration-readiness guard and non-secret persistence configuration details on `/health`.
- **CI history:** Engineering Gate #195 failed on project ID inference and a missing loader icon; #227 then failed only because one JSX use still referenced `LoaderCircle`. All remaining `LoaderCircle` references were replaced with the installed package's `Loader2` in commit `cb9cfd49616152c88db4eec7f7fe81b18264fa93`. A fresh gate for that commit is not yet visible; do not call this validated until the gate completes.
- **Still open:** live Supabase save/list/open after API restart; all UI/browser flows; AR orientation diagnosis with known-size fixture; physical WebXR acceptance; true door/window collision in all controller modes; grounded stair traversal between floors; full component-specific geometry/material editing; deterministic blueprint import adapters; undo/redo/autosave/recovery; export. Existing task checkboxes remain unchecked until their acceptance evidence exists.
