# ADR 0001: Monorepo Architecture and Subscription Feature Engine Strategy

* **Status**: Accepted
* **Date**: 2026-08-11

## Context
We need to build a modular spatial platform that scales from a lightweight free tier (2D-to-3D viewer) to high-tier subscription modules (AI modifications, IFC/BIM parsing) without maintaining multiple repositories.

## Decision
We adopt a single Monorepo managed by Turborepo and npm workspaces, split into 3 deployable applications (`apps/*`) and 6 domain packages (`packages/*`).

- **Feature Gating**: Business capabilities are decoupled into independent packages. The application controls feature access by checking subscription entitlements (`packages/billing`) before executing engine logic.
- **Zero-Cost Scaling**: Shared code lives locally, allowing zero-overhead deployments to Vercel and Render free tiers.

## Consequences
- **Positive**: Single codebase, instant type updates across frontend and backend, simple CI/CD setup.
- **Negative**: Requires discipline to prevent circular package dependencies.