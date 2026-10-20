# Spatial Platform — Implementation Status

**Last verified from repository:** 2026-08-26

## Status legend

- ✅ Complete and integrated
- 🟡 Implemented but external/browser/hardware verification remains
- 🔴 Proven blocker
- ⏳ Planned

## Current state

| Area | Status | Notes |
|---|---|---|
| Deterministic Node/dependency foundation | ✅ | Node 24.x; XR v6; Three.js resolution stabilized |
| Workflow state machine | ✅ | Upload → Calibrate → Trace → Validate → Review 3D → Spatial/AR |
| Blueprint calibration | ✅ | Two-point known-reference calibration |
| Canonical wall geometry | ✅ | `Project.walls` is authoritative |
| Room detection | ✅ | Closed-loop topology and tolerance handling implemented |
| 2D wall editing | ✅ | Snap, undo, redo, delete-last, clear, revert |
| 3D review | ✅ | Explicit review stage; model centered/framed |
| Normal 3D interaction | ✅ | Navigation and comment modes separated |
| Save/persistence contract | ✅ | Backend save plus local recovery |
| Version history | ✅ | Immutable/deep-cloned snapshots |
| Version comparison | ✅ | Explicit A/B selection using canonical walls |
| Shared rendering | ✅ | Canonical wall geometry |
| XR capability gate | ✅ | Unsupported browsers do not expose enabled AR action |
| Desktop Spatial navigation | 🟡 | Implemented; browser acceptance required |
| XR locomotion/session lifecycle | 🟡 | Code complete; hardware verification required |
| Three.js single runtime | 🟡 | Alias/dedupe implemented; preview console validation required |
| Production blank-screen fix | ✅ | Unsafe manual vendor chunking removed |
| Vercel production deployment | ✅ | Repository docs record production deployment READY |
| Durable Supabase save/restart/share | 🟡 | Requires real configured tenant/org/owner environment |
| Final browser E2E | 🟡 | Must run in normal user browser |

## Required release workflow

1. Upload a blueprint.
2. Calibrate using a known reference, e.g. 4 m.
3. Trace a closed 4×4 room.
4. Run room validation; expected result is one room / 16 m².
5. Open Review 3D; walls/floor must be visible and centered.
6. Navigate normally without comment prompts.
7. Enter Comment mode explicitly, place one pin, and verify return to navigation.
8. Save the project.
9. Mutate geometry and save another version.
10. Select exact versions A/B and verify their independent geometry.
11. Revert to the last saved baseline.
12. Publish/share and reload after backend restart when durable persistence is configured.
13. Enter desktop Spatial View and test WASD/arrow movement.
14. On WebXR hardware, enter/exit immersive AR, verify controllers, locomotion, snap turn, teleport, and session cleanup.
15. Check narrow viewport and keyboard accessibility.

## Current release blockers/gates

### Gate A — Browser E2E
The repository's product plan says automated interactive browser validation cannot be honestly marked passed in the agent environment because Chromium outbound navigation is infrastructure-blocked. Use a normal browser against the deployed site.

### Gate B — Durable persistence
Verify that the configured backend persists the project, survives process restart, and allows share/read to recover the same canonical walls. Do not invent tenant/org/owner identity to make this pass.

### Gate C — XR hardware
Use a WebXR-capable device/browser to verify immersive session lifecycle and controller locomotion.

### Gate D — Production console
Verify no application-owned runtime exception, duplicate-Three warning, or application-owned 404 remains in the final deployment.

## Recent important commits

- `092b2b6b8b0f99999a265e5b23899d307e6156d9` — integrated spatial editor stabilization/release work.
- `76d5938854e4fbef724f11ccc0749fd8dc7622ce` — documented blank-screen fix and production release state.
- `1c666a9087c485b137ba62e1abbc9f11c85a8a81` — explicit version history/comparison selection.
- `dd43f65f0628164e1f9616f1941949ebe5817b6d` — selectable room validation list.
- `8a7807d617a08d09ee9174b182d4651e73119f2` — store-managed AR sessions/controllers.
- `f69d88a6a52c67035cbcbefb37fbd03fecee15c3` — duplicate XR session/WebGL lifecycle hardening.
- `24222f43d1cbc6ce3c206da8227e75437428d390` — shared projects render canonical wall geometry.
- `4b7dfdd0d739ca2fe90996ab088e22ee39ed0b2e` — wall history controls.

## Do not regress

- Do not restore implicit starter walls/rooms.
- Do not make rooms authoritative over `Project.walls`.
- Do not reintroduce unsafe manual Zod/Zustand vendor chunking.
- Do not downgrade XR v6 to v5 merely to avoid fixing v6 API usage.
- Do not use PointerLockControls.
- Do not claim durable persistence when the backend write failed.
- Do not expand product scope before the current release gates are evidenced.
