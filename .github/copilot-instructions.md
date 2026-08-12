# AI Copilot Instructions: Spatial Decision Platform

## 1. Master Guidance Links
- Automatically inspect and follow `/.github/ENGINEERING_STANDARDS.md` for all code modifications.
- Automatically execute verification rules from `/SKILLS.md` after writing code.
- Follow operational execution rules from `/AGENTS.md`.
- Read, execute, and update task statuses from `/TASKS.md`.

## 2. Project Vision & Mission
- **Mission**: Build an AI-powered pre-construction spatial decision platform that lets architects and clients experience, modify, validate, and approve designs in a browser before spending money on construction.
- **Goal**: Eliminate costly real-world rework by detecting room proportion, clearance, and furniture issues early.

## 3. Infrastructure & Budget Rules
- **Target Budget**: ₹0 infrastructure cost using free cloud tiers.
- **Deployments**:
  - Web App (`apps/web`): Vercel (Free Tier)
  - API Gateway (`apps/api`): Render / Railway (Free Tier)
  - Database: Supabase PostgreSQL (Free Tier)
  - Asset Storage: Cloudflare R2 (10GB Free Tier)

## 4. Technology Stack & Key Libraries
- **Language**: 100% TypeScript (Strict Mode across entire stack)
- **Monorepo**: Turborepo + npm workspaces
- **Frontend**: React 18, Vite, React Three Fiber (`@react-three/fiber`), Three.js (`three`), `@react-three/drei`, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Open-Source Packages**:
  - **Validation & Schemas**: `zod` (Mandatory for API payloads, file uploads, and LLM output parsing)
  - **3D Geometry & Math**: `earcut` (2D polygon triangulation), `@turf/turf` (spatial math & clearance)
  - **BIM Ingestion**: `web-ifc` (WASM-based IFC parsing)
  - **AI Tooling**: `ai` (Vercel AI SDK)
- **Internal Workspace Packages**:
  - `@spatial/core`: Shared entities, types, serializer, and permissions
  - `@spatial/billing`: Feature gating and subscription tier checks
  - `@spatial/geometry-engine`: Wall extrusion, corner joins, room detection, 3D math, bounding box clearance
  - `@spatial/collaboration`: 3D comment pins, version diffing, approval tracking
  - `@spatial/ai-engine`: Structured LLM tool-calling and spatial Q&A
  - `@spatial/bim-engine`: IFC parsing (`web-ifc`)

## 5. Coding, Architecture & Safety Rules
1. **Package Boundaries**: Never import code from `apps/*` into `packages/*`.
2. **Decoupled 3D Logic**: Keep geometry math in `@spatial/geometry-engine` completely decoupled from React or DOM rendering logic.
3. **Entitlement Enforcement**: Every API endpoint must enforce feature entitlement checks via `@spatial/billing`.
4. **Zod Validation**: Treat all external inputs, API payloads, uploaded files, and LLM outputs as untrusted. Validate via Zod schemas before touching application logic.
5. **No Placeholders**: Provide clean, fully typed TypeScript implementations without `any` types, missing logic blocks, or `// TODO` placeholders.

## 6. Mandatory Post-Execution Lifecycle Protocol (DEFAULT FOR ALL PROMPTS)
At the end of processing ANY task or feature prompt, you MUST automatically execute this exact sequence in order without waiting for human prompts:

1. **Verify Build**: Run terminal commands `npx tsc --noEmit` and `npm run build`.
2. **Auto-Fix Errors**: If type errors or build failures occur, inspect terminal logs, fix the code, and re-run verification until successful.
3. **Commit with task description**: The commit message MUST include the real task ID and a specific description of the work. Example: `git commit -m "feat(api): complete TASK-204 - read-only client reviewer view"`.
4. **Auto-Git Push**: Once the build passes cleanly, execute terminal commands:
   - `git add .`
   - `git commit -m "feat(<scope>): complete <TASK-ID> - <task description>"`
   - `git push origin main`
5. **Update Task Checklist**: Edit `/TASKS.md` and change the completed item from `- [ ] TASK-XXX` to `- [x] TASK-XXX`.
6. **Continuous Loop Execution**: Read the next uncompleted task `- [ ] TASK-XXX` in `/TASKS.md` and immediately begin executing it without pausing, asking, or stopping.

## STRICT AUTONOMOUS RUN RULE
- DO NOT print summary text or ask "Ready to continue?" after completing a task.
- Do not stop after one task. After a successful build, immediately run `git add .`, `git commit`, and `git push`, then continue to the next unchecked task.
- The commit message MUST include the actual task ID and a real task description from `/TASKS.md`.
- Immediately open `/TASKS.md`, read the next `- [ ] TASK-XXX`, and execute it.
- ONLY output text if a terminal command fails or all tasks in `/TASKS.md` are marked `[x]`.

## STRICT AGENT MODE INSTRUCTION:
- Do NOT generate a preliminary To-Do list or plan summary as a final response turn.
- If a task needs to be implemented, start invoking file-editing and terminal tools IMMEDIATELY in sentence 1.
- Continue through code implementation, build verification (`npx tsc --noEmit`), and git push BEFORE outputting any conversational text.

## STRICT TOKEN EFFICIENCY RULES:
1. Do not generate conversational greetings, status updates, or post-implementation explanations.
2. Do not output a preliminary text plan unless explicitly requested.
3. Perform code edits and terminal verifications silently using tools.
4. Output only the final command or verification status when complete.