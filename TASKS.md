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


/*prompt for phase 7:@workspace Execute Phase 4 (Computer Vision & Automated Floor Plan Extrusion) from `tasks.md`:

1. Implement `packages/geometry-engine/src/vectorizer/edge-detector.ts` and `contour-simplifier.ts` to vectorize 2D floor plan images into clean orthogonal wall segments.
2. Build `packages/geometry-engine/src/mesh/wall-extruder.ts` to procedurally extrude 2D wall arrays into 3D meshes (2.8m height, 0.15m thickness) with corner miter geometry.
3. Add `<ExtrudedWalls />` inside `ArViewport.tsx` to render the 3D walls in the Three.js canvas.
4. Add the "Auto-Generate 3D" button with `Sparkles` icon into `SpatialHeader.tsx` and wire it to the vectorizer pipeline.
5. Verify build with `npx turbo build` and test with `npx turbo test`. Mark completed tasks with [x] in `tasks.md`.*/

## Phase 7: Computer Vision & Automated Floor Plan Extrusion

### - [ ] **TASK-701**: Client-Side OpenCV / Canvas Edge Detection Engine
- **Objective**: Implement client-side image processing using an offscreen canvas (or OpenCV.js WASM) to detect black-and-white wall contours and vectorize 2D raster blueprints into line segment arrays.
- **Files to Touch**:
  - `packages/geometry-engine/package.json`
  - `packages/geometry-engine/src/vectorizer/edge-detector.ts` *(New File)*
  - `packages/geometry-engine/src/vectorizer/contour-simplifier.ts` *(New File)*
  - `packages/geometry-engine/src/index.ts`
- **Sub-Steps**:
  1. Create `edge-detector.ts` to process loaded blueprint images via grayscale conversion, Otsu thresholding, and morphological opening to isolate wall contours.
  2. Implement Ramer-Douglas-Peucker (RDP) algorithm in `contour-simplifier.ts` with orthogonal snapping (forcing segments to 0°, 45°, 90°, 180°) to clean up noisy vector lines.
  3. Export a core utility function:
     ```typescript
     export function vectorizeBlueprint(
       imageElement: HTMLImageElement,
       scaleRatio: number,
       wallThicknessMeters = 0.15
     ): { walls: WallSegment[]; detectedRooms: RoomPolygon[] };
     ```
  4. Unit test vector extraction with synthetic black/white floor plan test images in `packages/geometry-engine/src/__tests__/vectorizer.test.ts`.
- **Acceptance Criteria**: `npm test --workspace=@spatial/geometry-engine` passes; vectorizer extracts clean orthogonal wall coordinate arrays with tolerance under 5%.

---

### - [ ] **TASK-702**: 3D Parametric Wall Extrusion & Mesh Generation
- **Objective**: Automatically extrude 2D vectorized wall segments into procedural 3D Three.js solid meshes with customizable wall height and material styling.
- **Files to Touch**:
  - `packages/geometry-engine/src/mesh/wall-extruder.ts` *(New File)*
  - `packages/geometry-engine/src/index.ts`
  - `apps/web/src/components/scene/ExtrudedWalls.tsx` *(New File)*
  - `apps/web/src/components/ArViewport.tsx`
- **Sub-Steps**:
  1. In `wall-extruder.ts`, create a procedural 3D extrusion builder using `THREE.ExtrudeGeometry` or `THREE.BoxGeometry` aligned along wall vectors from $(x_1, y_1)$ to $(x_2, y_2)$ with default height $h = 2.8\text{ m}$ (standard room height).
  2. Implement corner-miter joining so intersecting walls form continuous architectural corners without overlapping Z-fighting faces.
  3. Create `ExtrudedWalls.tsx` in `apps/web` to render the procedural meshes with double-sided PBR architectural materials and shadow casting (`castShadow`, `receiveShadow`).
  4. Mount `<ExtrudedWalls />` inside the `<Canvas>` scene in `ArViewport.tsx`.
- **Acceptance Criteria**: Changing from 2D view to 3D/AR mode displays extruded 3D solid walls directly above the blueprint contour lines.

---

### - [ ] **TASK-703**: UI Vectorization Controls & Auto-Generate Trigger
- **Objective**: Add an Apple-styled "Auto-Generate 3D" action button and wall parameter controls (Height & Thickness) to the HUD header.
- **Files to Touch**:
  - `apps/web/src/components/ui/SpatialHeader.tsx`
  - `apps/web/src/hooks/useSpatialActionDispatcher.ts`
  - `apps/web/src/store/spatial-store.ts`
- **Sub-Steps**:
  1. Add `isVectorizing`, `wallHeight`, and `wallThickness` fields to the global Zustand store in `spatial-store.ts`.
  2. In `SpatialHeader.tsx`, add an "Auto-Generate 3D" button (with a `Sparkles` icon from `lucide-react`) next to "Upload Blueprint".
  3. Wire the button `onClick` handler to:
     - Read the active calibrated blueprint texture.
     - Call `vectorizeBlueprint()`.
     - Dispatch the extracted 3D wall segments into the project store.
  4. Add a loading skeleton/spinner state during computation to maintain responsive UI feedback.
- **Acceptance Criteria**: Clicking "Auto-Generate 3D" after uploading a blueprint runs vectorization and instantiates 3D architectural walls on the canvas in less than 2 seconds.