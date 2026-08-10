# Engineering Standards & Guidelines

## 1. Architectural Principles

### Clean Architecture & Layer Separation
1. **Dependency Direction**: Dependencies must flow inward towards domain logic.
   `apps/web` / `apps/api` -> `packages/feature-engines` -> `packages/core`
2. **Package Boundaries**:
   - `apps/*` may import from `packages/*`.
   - `packages/*` **must never** import from `apps/*`.
   - `packages/core` must have **zero dependencies** on external frameworks or other monorepo packages.
3. **Decoupled 3D Logic**:
   - All spatial math, polygon triangulation, bounding box calculation, and mesh geometry generation must live in `@spatial/geometry-engine` as pure TypeScript functions.
   - UI components in `apps/web` (`@react-three/fiber`) must only render calculated geometry, never perform heavy geometry transformations inside render loops.

---

## 2. Naming Conventions

| Entity | Convention | Example |
| :--- | :--- | :--- |
| **Monorepo Packages** | `@spatial/kebab-case` | `@spatial/geometry-engine`, `@spatial/core` |
| **Folders & Directories** | `kebab-case` | `src/components/spatial-canvas/` |
| **TypeScript Files** | `kebab-case.ts` | `wall-extruder.ts`, `scene-serializer.ts` |
| **React Components** | `PascalCase.tsx` | `SpatialCanvas.tsx`, `WallPropertiesPanel.tsx` |
| **Interfaces & Types** | `PascalCase` (No `I` prefix) | `Project`, `WallSegment`, `RoomGeometry` |
| **Functions & Methods** | `camelCase` | `extrudeWallFromPoints()`, `calculateClearance()` |
| **Variables & Properties** | `camelCase` | `wallHeight`, `isDragging` |
| **Constants & Enums** | `UPPER_SNAKE_CASE` | `MAX_WALL_HEIGHT_METERS`, `USER_ROLES` |
| **Database Tables** | `snake_case` (Plural) | `projects`, `project_versions`, `spatial_comments` |
| **Database Columns** | `snake_case` | `created_at`, `tenant_id`, `wall_thickness` |
| **Environment Variables** | `UPPER_SNAKE_CASE` | `NEXT_PUBLIC_SUPABASE_URL`, `CLOUDFLARE_R2_KEY` |

---

## 3. TypeScript & Coding Style Standards

### Type Safety
1. **No `any` or `unknown` without guard checks**: Explicitly define types or use `zod` for parsing untrusted data.
2. **Explicit Return Types**: All exported functions in `packages/*` must have explicit return type annotations.
3. **Immutability**: Prefer `readonly` for array and object parameters in domain methods.
4. **No Direct Compiler Suppression**: `@ts-ignore` and `@ts-nocheck` are strictly prohibited.

```typescript
// BAD
export function processWalls(walls: any) {
  return walls.map((w: any) => w.length * 2);
}

// GOOD
import { WallSegment } from '@spatial/core';

export function calculateTotalWallLength(readonly walls: WallSegment[]): number {
  return walls.reduce((total, wall) => total + wall.length, 0);
}