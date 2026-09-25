<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

## Where this repo differs from the guidelines

- This repo runs `convex` 1.39.1 (see `bun.lock`), but the guidelines target `^1.44`. Three things they describe do not exist yet:
  - `schema.doc()` and `docValidator`: declare document validators explicitly.
  - The `transactionLimits` third argument to `ctx.runQuery` / `ctx.runMutation` (added in 1.41).
  - `CONVEX_SITE_URL` and `CONVEX_CLOUD_URL` on the typed `env` (codegen adds them in 1.44). There is no `convex.config.ts` here yet, so there is no typed `env` at all: read env vars from `process.env`.
- Backend tests follow the guidelines' `convex-test` + vitest + edge-runtime setup, but the vitest config is the `backend` project in the root `vitest.config.mts`. Run them with `bun run test:unit` here, and don't add a package-level `vitest.config.ts`.
