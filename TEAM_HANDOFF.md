# Jordan Local team handoff

Backend/account/Arabic-intent additions: [BACKEND-AI-HANDOFF.md](docs/BACKEND-AI-HANDOFF.md). Final submission integrates `feat/backend-ai-accounts` and the preserved `feat/frontend-redesign`. The integration worktree is `jordan-local-submission`; the frozen contract is unchanged. See root README and DEMO_GUIDE for current judge setup.

Current source of truth: README, docs/MVP-SETUP.md, docs/FINAL-DELIVERY.md and docs/MVP-DEMO.md. Older planning/delivery reports are historical. The final integrated build stays in the existing repo; no new dependency, paid request, database application or deployment was performed.

## Run and verify

Node 24; npm.cmd ci; copy .env.example only if .env.local is absent; npm.cmd run dev. Default seed/rules mode works without credentials. Run npm.cmd run lint, npx.cmd tsc --noEmit, npm.cmd test, npm.cmd run build. Four optional Chrome suites use local port 3100/debugging 9225 and ignored .qa-artifacts screenshots.

## Modules and team ownership

| Owner | Continue here | Invariants |
| --- | --- | --- |
| P1 contracts/shared integration | src/contracts/index.ts, catalog.ts, tourism.ts, accounts.ts, listing-details.ts; layout/global CSS; docs/CI | Keep v1 strict schemas and fixtures unchanged. New accounts/details are additive. |
| P2 AI | src/lib/recommendation/ai.ts, service.ts, preferences.ts, constraints.ts, discovery.ts; /api/recommend; tests/ai | Eligible IDs only; no model prices; deterministic group arithmetic and fallback. Paid gating remains explicit. |
| P3 data/Auth | src/lib/data/*, auth/*, supabase/*; /api/account, activities, favorites, business/profile, businesses, listings, listing-details; migrations 004–005 | Verified server identity plus RLS; never trust client owner IDs or use a service-role runtime key. |
| P4 visitor/account UI | visitor/*, account/*; signup/account/saved/listings/businesses pages; public/images | Arabic RTL, accessibility/states, provenance/price/category disclosure, accurate licensed media. |
| P1/P3 business UI | business/manager.tsx, dashboard.tsx, profile page | Load details before editing; preserve unexposed fields; archive with confirmation; partial-save retry uses existing ID. |

## Recommendation and discovery paths

POST /api/recommend → exact Zod/origin validation → verified user/rate limit when paid AI enabled → fresh loadActivities → optional structured preference extraction → explicit overrides → clarification → hard eligibility → bounded eligible-only AI ranking or rules fallback → exact ID/evidence validation → deterministic reasons/group totals → final freshness recheck → frozen response.

GET /api/tourism → additive full-geography filter schema → loadTourism (curated real rows plus newly published genuine owned v1 offers) → pure hard filter → text/tag ranking and equal-score provider diversity → strict tourism envelope. This endpoint is rules discovery; it is not a live model response. v1 supports nine original cities; do not remap Petra/Aqaba to those cities. Full-geography AI is a reviewed-contract follow-up.

## Prices and listing details

src/contracts/listing-details.ts: JOD/fils, units person/group/ticket/night/unspecified, audience, conditions, source/check time, status and media evidence. data/listing-details.json plus data/marketplace.json are the seed detail datasets, exposed through /api/listing-details and hydrated /api/listings/{id}. Legacy quick-view demo prices derive only from fictional marketplace offers. scripts/details-seed.mjs generates seed_details.sql and excludes every demo estimate. Do not run --create when maintaining hand-edited detail data: that deliberately regenerates the reviewed initial snapshot; plain execution only regenerates SQL.

src/lib/tourism/cost.ts is pure. Unknown/unspecified/invalid counts produce no total, not zero. Nightly costs multiply chosen room count and nights without guessing room capacity. Conditional fees never become a universally valid v1 base price. Strict budget/capacity rules remain unchanged. Details can omit prices rather than importing unvalidated DB JSON or switching data mode silently.

Sourced quotes cover nine government ticket locations, Petra visitor categories, Mujib Siq and EcoPark. Fictional prices now belong exclusively to five fictional businesses, with three offers each in data/marketplace.json. No fictional quotes remain on real businesses. Real providers are unclaimed, source-linked identities, not partners or authenticated owners. Missing photo/safety/season/capacity facts are never invented.

## Accounts and business ownership

Migration 004 adds profiles (display/account type only), secure self-onboarding, public contact projection, favorites, listing_details and limited grants/policies. Supabase auth.users remains the identity/password system. New-user metadata is sanitized by a profile trigger; it grants no business authority. A verified user can create one owned, unverified business through onboard_business; ownership is auth.uid(), never a form parameter. Changed names/contacts reset contact verification. Public destinations cannot be claimed.

/api/account GET/PATCH; /api/business/profile GET/POST; /api/favorites GET/POST and DELETE /{id}; owner-scoped activity PATCH and archive DELETE; owner catalog/details GET/PATCH. Bodies are bounded/same-origin/Zod. Public details/providers never expose private owner IDs or email. Favorites are scoped to the verified user. Source-verified prices/gallery evidence cannot be authored by business clients.

The editor accepts actual HTTPS image URLs with rights confirmation, using browser loading without server-side URL fetching. No fake file upload or Storage bucket exists. Storage upload/media management is a follow-up.

## Explicit no-credential demo

AccountProvider uses server-supplied configuration state. /signup offers a separate traveler/business browser demo only in seed mode; it collects no credentials. It validates versioned localStorage data and displays a persistent disclosure. Business profile/listings, saved places and edits survive reload in that browser. Logout clears them. Discovery overlays these rows locally using the existing pure eligibility/ranking helpers; server API/model records are unaffected. The original /business temporary preview and NEXT_PUBLIC_UI_DEMO legacy adapter remain distinct.

## What was actually verified

Local lint/typecheck/build, real local route tests and mocked owner/Auth/DB tests; isolated desktop/mobile Chrome browsing, original API recommendation states, priced details/gallery/maps/share handler, local publish/reload/discover/save/edit/archive/logout. See FINAL-DELIVERY for final results. No configured Auth signup/email delivery, actual PostgreSQL policies, production persistence or paid model quality was tested. Complete the two-business/visitor/anonymous live checklist in MVP-SETUP before release.

## Git workflow

Use the existing GitHub repo (Malbarbari/jordan-local). Fetch and inspect remote main before each task; do not reset/force-push. Make a separate branch per teammate, use npm ci, preserve frozen schemas/fixture expectations and coordinate changes through PRs. The verified marketplace implementation and CI are recorded in FINAL-DELIVERY; git log -1 origin/main identifies the latest delivery commit. Do not commit .env.local, passwords, screenshots, build output or caches.

## Marketplace extension and team entry points

- `data/marketplace.json` / `src/contracts/marketplace.ts`: 11 sourced unclaimed providers, five fictional providers, eight sourced plus 15 fictional offers, keyed details. Existing real catalog stays intact. Full-geography cities and nightly/conditional prices remain additive.
- `src/lib/data/marketplace.ts`, `activities.ts`, `catalog.ts`, `tourism.ts`, `details.ts`: shared IDs/data feeding discovery, profiles, calculators and eligible v1 recommendations. Do not rewrite P2 ranking or filters to add listings.
- `/api/businesses` groups published offers; `/api/businesses/[id]` projects independent directory data or an actual public owner profile. Authenticated ownership routes never accept these public identities as claims.
- `src/lib/tourism/local-recommendations.ts`: explicit browser-only fixture overlay using existing `eligibility`/`candidate`; does not mutate server response or feed user-provided records to AI.
- Migration 005 expands provider geography only. Run `node scripts/marketplace-seed.mjs`, review real seed after migrations/existing seeds. Optional demo seed is isolated from production. Both use stable IDs and conflict DO NOTHING.
- `tests/api/marketplace.test.ts`: IDs/relationships, price provenance, conditional group totals, strict budget/capacity/archive eligibility, public lookup and deterministic SQL generation.

Real Supabase Auth/RLS and paid Responses checks still require credentials, manual DB setup and approved usage. Existing mocked ownership tests and browser demo do not establish live database policy correctness.
