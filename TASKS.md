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