# AI Copilot Instructions: Spatial Decision Platform

## 1. Project Vision & Mission
- **Mission**: Build an AI-powered pre-construction spatial decision platform that lets architects and clients experience, modify, validate, and approve designs in a browser before spending money on construction.
- **Goal**: Eliminate costly real-world rework by detecting room proportion, clearance, and furniture issues early.

## 2. Infrastructure & Budget Rules
- **Target Budget**: ₹0 infrastructure cost using free cloud tiers.
- **Deployments**:
  - Web App (`apps/web`): Vercel (Free Tier)
  - API Gateway (`apps/api`): Render / Railway (Free Tier)
  - Database: Supabase PostgreSQL (Free Tier)
  - Asset Storage: Cloudflare R2 (10GB Free Tier)

## 3. Technology Stack & Key Libraries
- **Language**: 100% TypeScript (Strict Mode across stack)
- **Monorepo**: Turborepo + npm workspaces
- **Frontend**: React 18, Vite, React Three Fiber (`@react-three/fiber`), Three.js (`three`), `@react-three/drei`, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Open-Source Packages**:
  - **Validation & Schemas**: `zod` (Mandatory for API payloads, file uploads, and LLM output parsing)
  - **3D Geometry & Math**: `earcut` (2D polygon triangulation), `@turf/turf` (spatial math & clearance)
  - **BIM Ingestion**: `web-ifc` (WASM-based IFC parsing)
  - **AI Tooling**: `ai` (Vercel AI SDK)
- **Internal Workspace Packages**:
  - `@spatial/core`: Shared entities, types, and permissions
  - `@spatial/billing`: Feature gating and subscription tier checks
  - `@spatial/geometry-engine`: Wall extrusion, 3D math, bounding box clearance
  - `@spatial/collaboration`: 3D comments, versions, approval tracking
  - `@spatial/ai-engine`: Structured LLM tool-calling and spatial Q&A
  - `@spatial/bim-engine`: IFC parsing (`web-ifc`)

## 4. Coding & Safety Rules
1. Never import code from `apps/*` into `packages/*`.
2. Keep math in `@spatial/geometry-engine` completely decoupled from React or DOM rendering logic.
3. Every API endpoint must enforce feature entitlement checks via `@spatial/billing`.
4. AI outputs must be validated using `zod` schemas before touching application logic.
5. Provide clean, fully typed TypeScript implementations without `any` types or missing logic placeholders.