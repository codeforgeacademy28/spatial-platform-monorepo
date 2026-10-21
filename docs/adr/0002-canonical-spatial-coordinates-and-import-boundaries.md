# ADR 0002: Canonical Spatial Coordinates and Import Boundaries

- **Status:** Proposed
- **Date:** 2026-10-21

## Context

The walkthrough renders floor-plan coordinates inside a Three.js group with a Y-axis rotation, while movement/collision checks operate in world coordinates. Duplicating transform math in the renderer and collision logic allowed the two systems to disagree. Import formats also differ: a GLB is already a 3D scene, whereas an IFC/DWG/DXF file may require parsing or conversion, and an image/PDF needs geometric interpretation.

## Decisions

1. **Canonical building units are meters.** Imported source units must be normalized explicitly and retained as source metadata.
2. **Floor-plan coordinates use (x, y); Three.js world coordinates use (x, z).** Floor elevation maps to world y.
3. **Transform logic is centralized.** Render, collision, picking, and placement must share the same conversion helpers from @spatial/geometry-engine; no local inverse-rotation formulas or unexplained offsets.
4. **Source files and editable scene assets are distinct.** Uploading a source file is not proof that conversion succeeded. The UI must track source file, conversion status, warnings, and normalized output separately.
5. **AR tracking is authoritative for the physical camera pose.** The app must not silently auto-level or rewrite tracked device orientation. Placement, scale, and yaw are explicit user-controlled operations.
6. **Multi-floor identity is persistent domain data.** Floor elevation, element identity, source metadata, and transforms must survive save/load/version comparison.

## Consequences

- Transform helpers receive deterministic unit tests before they are used by collision or placement code.
- New import adapters must declare accepted formats, unit assumptions, conversion fidelity, and unsupported features.
- Legacy projects need a migration/defaulting strategy before floor metadata or scene assets become required.
- WebXR hit-test/anchor behavior is capability-dependent and must be verified on supported physical devices.
