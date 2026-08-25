# Web Runtime Hardening

The web application uses TypeScript source files as its runtime source of truth.

- Do not commit generated JavaScript beside `.ts`/`.tsx` source files.
- Vite resolves `.tsx` and `.ts` before `.js`/`.mjs`.
- The spatial viewport uses `OrbitControls`; pointer lock is not part of the editor runtime.
- Tailwind is processed through PostCSS during the web build.
