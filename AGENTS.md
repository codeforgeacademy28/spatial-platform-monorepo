# AI Agent Operational Directive

## 1. Primary Directives & Standards Compliance
1. **Mandatory Standards Reference**: Before generating, modifying, or refactoring code, read and follow `/.github/ENGINEERING_STANDARDS.md`.
2. **Autonomous Execution Loop**: After writing code, run the verification commands specified in `/SKILLS.md` (`npx tsc --noEmit` and `npm run build`) to ensure zero errors.

## 2. Architecture & Package Boundaries
1. **Strict Type Safety**: Never output `any` or `@ts-ignore`. Always construct types, interfaces, and Zod schemas in `@spatial/core` first.
2. **Modular Isolation**:
   - Store shared entities and types in `@spatial/core`.
   - Store 3D math and extrusion logic in `@spatial/geometry-engine`.
   - Store feature engines in their respective `@spatial/*` packages.
   - **Never** import code from `apps/*` into `packages/*`.
3. **No Placeholders**: Write complete, production-ready TypeScript code. Do not emit empty functions, missing logic blocks, or `// TODO` comments.

## 3. Security & Validation
1. **Zod Validation**: Treat all API payloads, uploaded floor plans/CAD files, and LLM outputs as untrusted inputs. Validate them through Zod schemas.
2. **Entitlement Guard Checks**: Every route exposed in `apps/api` must check subscription entitlements via `@spatial/billing` before processing.

## 4. Standard Feature Implementation Workflow
1. **Contracts**: Define shared types and Zod schemas in `@spatial/core`.
2. **Engine**: Implement domain logic in the designated `@spatial/*` package.
3. **API**: Expose backend routes in `apps/api` wrapped with entitlement guard checks.
4. **UI**: Consume the API or package in `apps/web` using typed hooks or components.
5. **Verify**: Run the verification loop from `/SKILLS.md` before returning output.