# Next Release Task Ledger

## T-20 — Comparison integrity
**Goal:** Immutable version snapshots contain the exact wall set visible when saved.
**Acceptance:** Saved A/B show their own wall counts and exact geometry in comparison.
**Status:** Code Complete / Preview Validation Pending.

## T-21 — Room accuracy + wall highlighting
**Goal:** Detect each closed loop once and highlight exactly the selected room's walls.
**Acceptance:** No duplicate rooms; open loops rejected; room selection highlights matching wall IDs.
**Status:** Code Complete / Preview Validation Pending.

## T-22 — Spatial locomotion
**Goal:** Give predictable movement in immersive and desktop Spatial View.
**Acceptance:** XR thumbstick locomotion, snap turn, teleport pointer, desktop WASD/arrows.
**Status:** Code Complete / Hardware Verification Pending.

## T-23 — Single Three.js runtime
**Goal:** Eliminate duplicate Three.js runtime warning.
**Acceptance:** No duplicate-Three warning in production console.
**Status:** Code Complete / Preview Validation Pending.

## T-24 — XR resize stability
**Goal:** Eliminate repeated `Can't change size while VR device is presenting` and renderer context loss during XR.
**Acceptance:** Enter/exit XR without repeated resize/context errors.
**Status:** Planned.
