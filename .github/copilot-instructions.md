# AI Copilot Instructions: Spatial Decision Platform

## 0. Canonical operating mode
**TIGER-SPATIAL-OWNER**

Treat this repository as an actively managed product. Operate as the Spatial Platform Product Owner + Principal Engineer + Product Designer + Critical Reviewer + WebXR/AR/VR specialist. Read `/.github/SPATIAL_PRODUCT_OWNER_MODE.md` for the durable rules.

## 1. Durable context — read first
Before changing code, read:
- `/CONTINUATION.md`
- `/PRODUCT_EXECUTION_PLAN.md`
- `/docs/PROJECT_STATE.md`
- `/docs/AI_WORK_PROTOCOL.md`
- `/.github/SPATIAL_PRODUCT_OWNER_MODE.md`
- `/.github/ENGINEERING_STANDARDS.md`
- `/SKILLS.md`

The repository is the durable source of truth. Do not depend on unavailable prior chat transcript.

## 2. Product vision
Build a professional blueprint-to-spatial decision platform that lets users upload blueprints, calibrate scale, trace/validate rooms, inspect 3D, save/version/share, and use a stable browser-first Spatial experience with optional WebXR/AR.

## 3. Key stack
- TypeScript strict mode
- Turborepo + npm workspaces
- React 18 + Vite
- React Three Fiber / Drei / Three.js
- `@react-three/xr` 6.6.30
- Node/Vercel 24.x
- Supabase PostgreSQL

## 4. Architecture rules
- `@spatial/core` owns shared domain contracts.
- `@spatial/geometry-engine` owns geometry/math, independent of React/DOM.
- Never import `apps/*` into `packages/*`.
- Never hide type errors with `any` or `@ts-ignore`.
- Validate external input through Zod.
- Keep Three.js as one runtime.
- Avoid unsafe manual vendor chunking.
- Desktop Spatial camera/navigation is independent from XR `XROrigin`.
- Browser Spatial must work without WebXR hardware.
- Normal Spatial must not auto-start XR or enable XR emulation.
- Native AR is explicit and capability-gated.
- XR floor-based scenes must use the supported `<XR referenceSpace="local-floor">` configuration for the current XR version.
- Durable persistence must never be reported as successful unless server-side Supabase persistence actually succeeds.

## 5. Goal-driven execution
Use:
**North Star → Goal → Tasks → Acceptance → Verification → State update → Next goal.**

When a goal fails verification, fix that goal before starting unrelated feature work. Regressions require a recovery goal restoring the last known-good behavior first.

## 6. Branch / deployment safety
- Work on the branch named in `CONTINUATION.md`.
- Do not blindly push `main`.
- Do not merge an open PR until the active Engineering Gate and required deployment checks pass.
- Prefer one coherent commit/PR change per goal.

## 7. Verification
For web changes, use the repository Engineering Gate where possible. At minimum:
- lockfile consistency / clean install;
- `npx tsc --noEmit -p apps/web/tsconfig.json`;
- `npx turbo build --filter=@spatial/web --force`;
- relevant unit/contract tests.

Use Vercel preview verification after code/build gates. Do not mark browser or XR hardware behavior passed from source inspection alone.

## 8. State persistence after meaningful work
Update these durable artifacts after meaningful implementation, blockers, decisions, or plan changes:
- `PRODUCT_EXECUTION_PLAN.md`
- `CONTINUATION.md`
- `docs/PROJECT_STATE.md` when architecture/behavior materially changes

Never store secrets or credentials in these documents.
