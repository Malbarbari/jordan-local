# Integrated MVP delivery

The existing Jordan Local repository now contains the complete application implementation for the requested P0 scope. Default seed/rules mode is a working local demo. Real persistence, direct RLS enforcement and live AI quality still require the human's configured services and live verification.

## Outcome by phase

| Phase | Implemented | Observed verification |
| --- | --- | --- |
| A Audit | Existing branch feat/leader-foundation retained; all prior files/fixtures/dependencies inspected; original staged index preserved | Final cached diff has the same original 10 files and 5830 additions/3876 deletions; no Git mutations |
| B Visitor vertical slice | Arabic RTL landing/explore, controlled preferences, real POST /api/recommend, complete API v1 responses, 21 catalogue listings (16 preserved fictional activities, two sourced public destinations, three additional fictional tourism examples) | Actual route-handler tests and Chrome production/dev smoke; group total, no_match and clarification recovery |
| C Data/business | Supabase SSR clients, verified identity/role, own list/create endpoints, column-protected RLS migration/seed, browser form/refresh, labelled read-only preview | Mocked publishing/authorization/freshness integration tests; real browser invalid/valid demo preview; SQL not applied to a database |
| D Safe AI | Responses structured extraction/ranking, eligible-only candidate IDs, score/evidence/coverage checks, deterministic fallback, paid gates | Mocked valid/invalid/timeout/injection tests; no real API calls or model-quality claims |
| E Polish/QA | Local original SVG artwork, warm sandstone/olive UI, loading/error/empty/success states, field labels/focus, skip link, reduced-motion support | Real Chrome seed flows, 360px/390px overflow checks, desktop/mobile screenshot inspection, zero uncaught browser exceptions |
| F Handoff | Current setup, demo, deployment and release checklist; safe environment defaults; CI modes explicit | Documents prepared; no deployment or external accounts changed |

## Final command results

- npm run lint: PASS, exit 0, no errors/warnings.
- npx.cmd tsc --noEmit: PASS, exit 0.
- npm test: PASS, 57 tests across 6 files. Existing smoke assertions retained, with additional Arabic money input coverage.
- npm run build: PASS. Routes /, /explore, /business and /login; dynamic /api/activities, /api/activities/[id]/catalog, /api/catalog, /api/me and /api/recommend; Supabase session Proxy.
- npm run dev -- --port 3101: PASS after disabling persistent Turbopack dev caching; home/catalogue HTTP 200 and browser smoke passed.
- npm start -- --port 3100: PASS; final production server started.
- node scripts/browser-smoke.mjs: PASS on the final production build. Catalogue, RTL, group totals, clarification choice/recovery, rules labels, no_match, invalid business form with focus, example prefill, valid temporary preview, absence of a fake publishing POST, disabled unconfigured login, 360px/390px viewport overflow checks and zero uncaught exceptions.
- git diff --check: PASS, with Windows line-ending notices only.
- No new dependencies or manifest/lockfile changes in this implementation pass. The earlier foundation's dependency audit is recorded in LEADER-REPORT.md; no fresh audit was claimed here.

Local Node is 22.19.0. Package engines and CI target Node 24; Node 24/remote CI still require release-environment verification. Vitest reports a non-failing future config-loader compatibility warning for the preserved staged vitest.config.ts. Initial sandbox test/dev subprocess starts returned EPERM; authorized reruns passed. Initial build's Cache Components/Node runtime conflict was fixed by removing unnecessary scaffold caching flags. The existing Windows dev cache was preserved; persistent dev caching was disabled to fix its stale-task panic.

## Live, simulated and pending

Live locally: Next pages, actual seed API route handlers, authoritative integer price calculations, filtering, complete response validation and browser interactions.

Simulated: seed offers/prices/availability/provider details, temporary browser-only business previews, mock Supabase publishing tests and mocked model outputs. Legacy NEXT_PUBLIC_UI_DEMO adapter is retained, opt-in and labelled.

Pending real-service checks: application of the reviewed SQL; consented accounts/business provisioning; successful Supabase login/create/refresh; direct API/RLS cross-owner and provenance tests; real new-row candidate inclusion; paid AI approval/account/model validation/evaluation; human review; Node 24; deployment and clean-browser production testing.

No payment, booking, maps, chatbot, public signup, Favorites, business edit/archive or profile preferences were added. Unsupported hard distance produces clarification. Demo preview never enters server recommendations and never claims persistence. Supabase errors never silently turn into seed data.

## Files implemented or updated in this pass

- `.env.example`
- `.github/workflows/ci.yml`
- `.gitignore`
- `AGENTS.md`
- `README.md`
- `data/activities.seed.json`
- `docs/API_CONTRACT.md`
- `docs/MVP-DELIVERY.md`
- `docs/MVP-DEMO.md`
- `docs/MVP-SETUP.md`
- `next.config.ts`
- `public/images/countryside.svg`
- `public/images/desert.svg`
- `public/images/forest.svg`
- `public/images/jordan-landscape.svg`
- `public/images/urban.svg`
- `scripts/browser-smoke.mjs`
- `src/app/api/activities/route.ts`
- `src/app/api/me/route.ts`
- `src/app/api/recommend/route.ts`
- `src/app/business/page.tsx`
- `src/app/explore/page.tsx`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/login/page.tsx`
- `src/app/page.tsx`
- `src/components/business/client.ts`
- `src/components/business/dashboard.tsx`
- `src/components/business/form.ts`
- `src/components/visitor/activity-card.tsx`
- `src/components/visitor/explorer.tsx`
- `src/lib/auth/server.ts`
- `src/lib/data/activities.ts`
- `src/lib/http.ts`
- `src/lib/recommendation/ai.ts`
- `src/lib/recommendation/constraints.ts`
- `src/lib/recommendation/preferences.ts`
- `src/lib/recommendation/service.ts`
- `src/lib/runtime.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/proxy.ts`
- `supabase/migrations/001_init.sql`
- `supabase/seed.sql`
- `tests/ai/recommend.test.ts`
- `tests/api/routes.test.ts`
- `tests/api/supabase-path.test.ts`
- `tests/smoke/contracts.test.ts`

Previously staged contracts/fixtures, dependency manifests, lockfile and Vitest configuration were preserved. Historical LEADER-* reports, prompts and unrelated assets were retained.

Manual checks and deployment steps: [MVP-SETUP](MVP-SETUP.md), [MVP-DEMO](MVP-DEMO.md).
Optional browser smoke uses the already installed Chromium via a dedicated temporary profile, with screenshots in ignored .qa-artifacts/. The script is not a mandatory CI dependency. The owned test servers/headless browser are closed after QA.

Suggested PR title: feat: integrated Jordan Local discovery and business publishing MVP

## Product-vision extension verification (2026-10-09)

Implemented the additive catalogue model documented in [CATALOG-MVP](CATALOG-MVP.md). Frozen v1 contracts/fixtures and original seed remain unchanged. New public destinations have null ownership and unknown price/capacity. New rich tags inform eligible ranking; equal relevance ties favour provider diversity. Known, free, estimated and unknown prices are distinct. Business metadata submission is independently owner-verified with retry after partial success. Card monetary display now converts fils to dinars.

Added/changed in this extension: src/contracts/catalog.ts; src/lib/data/catalog.ts; src/lib/data/activities.ts; src/app/api/catalog/route.ts; src/app/api/activities/[id]/catalog/route.ts; src/app/api/recommend/route.ts; src/lib/recommendation/{constraints,discovery,service,ai}.ts; src/components/visitor/{activity-card,explorer}.tsx; src/components/business/{form.ts,dashboard.tsx}; src/app/{page.tsx,explore/page.tsx}; data/{catalog,tourism}.seed.json; supabase/migrations/002_catalog_metadata.sql; supabase/seed_catalog.sql; scripts/{catalog-seed,browser-smoke}.mjs; tests/api/catalog.test.ts; README.md; docs/{CATALOG-MVP,MVP-SETUP,MVP-DEMO,MVP-DELIVERY}.md.

Chrome production smoke additionally passed public ownership/source links, catalogue kind/tag filters, fictional swimming place, unconfirmed cabin estimate, and exact 32-dinar card display (not 32000 fils). Existing visitor/business/login/mobile checks also passed with zero uncaught exceptions. SQL source prepared but not applied; real metadata persistence/public view/RLS and live AI remain unverified. No new dependencies, secrets, paid usage, deployment or remote Git actions. Original staged index remains 10 files, 5830 insertions/3876 deletions.