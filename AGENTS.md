# AGENTS.md

## Cursor Cloud specific instructions

### Overview

2x4CAD is a pure client-side 3D CAD web application (React 19 + TypeScript + Vite). No backend, database, or external services are required.

### Development commands

See `CLAUDE.md` and `package.json` scripts for standard commands (`pnpm run dev`, `pnpm run build`, `pnpm run lint`, `pnpm run preview`).

### Non-obvious notes

- **pnpm build scripts**: pnpm 10 blocks lifecycle scripts by default. `pnpm-workspace.yaml` includes `onlyBuiltDependencies` for `esbuild` and `core-js` to allow their postinstall scripts. Without this, `esbuild` binary won't be available and Vite will fail.
- **Existing lint errors**: The codebase has pre-existing ESLint errors (9 errors, 2 warnings as of setup). `pnpm run lint` exits with code 1 — this is expected and not caused by your changes.
- **Dev server**: `pnpm run dev` starts on port 5173 by default. Use `--host 0.0.0.0` flag to bind to all interfaces if needed for external access.
- **No automated tests**: There are no test frameworks or test scripts configured. Verification is done via lint, build, and manual browser testing.
- **3D rendering**: The app relies on WebGL via Three.js / React Three Fiber. Manual testing requires a browser with WebGL support (Chrome is pre-installed on the VM).
